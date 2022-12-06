#!/usr/bin/env -S deno run --allow-env --allow-net
/* eslint-disable no-console */

import { cryptoRandomString } from 'https://deno.land/x/crypto_random_string@1.0.0/mod.ts'
import { parse } from 'https://deno.land/std@0.119.0/flags/mod.ts'
import * as path from 'https://deno.land/std@0.167.0/path/mod.ts'
import ProgressBar from 'https://deno.land/x/progress@v1.3.4/mod.ts'

const flags = parse(Deno.args, {
  string: ['giteaUrl', 'adminToken', 'githubToken'],
  boolean: ['help'],
  default: { numberOfRepos: 150, giteaUrl: 'http://localhost:3333' },
})

if (flags.help || !flags.adminToken || !flags.githubToken) {
  console.log(`Usage: importBoardsTxt [options]
    options:
      --giteaUrl: Gitea URL (default: http://localhost:3333)
      --adminToken: Gitea admin API token
      --githubToken: GitHub API token (classic)
      --numberOfRepos: Number of repositories to import (default: 1000)
      --help: Show this help
  `)
  Deno.exit(0)
}

const KITSPACE_GITEA_URL = flags.giteaUrl

const headers = {
  'Content-Type': 'application/json',
  Authorization: `token ${flags.adminToken}`,
}

async function main() {
  const registryBoards = await getRegistryBoards()
  const boards = (await getBoardsTxt())
    .filter(url => !registryBoards.includes(url))
    .slice(0, flags.numberOfRepos)
  const GithubReposDescriptions = await getAllGithubReposDescriptions(boards)

  const progress = new ProgressBar({
    title: 'Importing repos',
    total: boards.length,
  })
  for (const [index, repoUrl] of boards.entries()) {
    await importRepo(repoUrl, GithubReposDescriptions)
    progress.render(index + 1)
  }
}
await main()

/***************************************************************/
async function getBoardsTxt() {
  const url =
    'https://raw.githubusercontent.com/kitspace/kitspace/master/boards.txt'
  const response = await fetch(url)
  const text = await response.text()
  return text.split('\n').filter(Boolean)
}

async function getRegistryBoards() {
  const url =
    'https://raw.githubusercontent.com/kitspace/kitspace/master/registry.json'
  const response = await fetch(url)
  const boards = (await response.json()) as RegistryBoard[]
  return boards.map(board => board.repo)
}

async function importRepo(url: string, GithubReposDescriptions: GithubReposDescriptionsMap) {
  const userInfo = getUserInfoFromUrl(url)
  const user = await createGiteaUser(userInfo)
  const repoName = urlToName(url)
  await mirrorRepo(url, user, repoName, GithubReposDescriptions)
  // Avoid importing so many repos at the same time. This slows down the import process. for all repos.
  await waitForRepoToBeReady(user.username, repoName)
}

function getUserInfoFromUrl(url: string): UserInfo {
  const username = url.split('/', 5).slice(-2)[0]
  return {
    username,
    email: `${username}@example.com`,
    password: cryptoRandomString({ length: 32, type: 'base64' }),
  }
}

async function createGiteaUser(userInfo: UserInfo): Promise<GiteaUser> {
  const giteaUser = await getGiteaUser(userInfo.username)
  if (giteaUser) {
    return giteaUser
  }
  const url = `${KITSPACE_GITEA_URL}/api/v1/admin/users`
  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(userInfo),
  })

  return response.json()
}

async function mirrorRepo(remoteRepo: string, user: GiteaUser, repoName: string, GithubReposDescriptions: GithubReposDescriptionsMap) {
  if (await repoExists(user.username, repoName)) {
    // Skipped mirroring; repo already exists!
    return
  }

  const service = getGitServiceFromUrl(remoteRepo)
  const endpoint = `${KITSPACE_GITEA_URL}/api/v1/repos/migrate`

  if (!user.id) {
    throw new Error('User id is missing')
  }

  const giteaOptions = {
    clone_addr: remoteRepo,
    uid: user.id,
    repo_name: repoName,
    mirror: true,
    wiki: false,
    private: false,
    pull_requests: false,
    releases: true,
    issues: false,
    // This is the workaround for avoiding the Github rate limit.
    service: service === 'github' ? null : service,
    description: service === 'github' ? GithubReposDescriptions.get(`${user.username}/${repoName}`) : null,
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify(giteaOptions),
  })

  if (!response.ok) {
    throw new Error(
      `Failed to mirror ${remoteRepo} to ${user.username}/${repoName}`,
    )
  }
}

/**
 * Use the github graphql API to get the description of all the repos.
 * We can't use the REST API because it doesn't allow us to get the description of multiple repos in one request.
 * And if we requested the description of each repo separately, we would hit the rate limit.
 * @param reposUrls 
 */
async function getAllGithubReposDescriptions(reposUrls: string[]): Promise<Map<string, string>> {
  const githubRepos = reposUrls.filter(url => getGitServiceFromUrl(url) === 'github')
  const reposOwnerAndName = githubRepos.map(repoName => repoName.split('/', 5).slice(-2) as [string, string])

  const query = `
  query {
    ${reposOwnerAndName.map(([owner, name], index) => `
    r${index}: repository(owner: "${owner}", name: "${name}") {
      fullName: nameWithOwner
      description
    }`)}
  }
  `
  const { data: reposInfo }: GitHubRepoInfoGQLResponse = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `bearer ${flags.githubToken}`,
    },
    body: JSON.stringify({ query }),
  }).then(res => res.json())


  const repoDescriptionsMap = new Map<string, string>()
  for (const entry of Object.values(reposInfo)) {
    repoDescriptionsMap.set(entry.fullName, entry.description)
  }

  return repoDescriptionsMap
}

async function waitForRepoToBeReady(
  username: string,
  repoName: string,
): Promise<void> {
  const url = `${KITSPACE_GITEA_URL}/api/v1/repos/${username}/${repoName}`
  const response = await fetch(url, { headers })
  const repo = await response.json()

  if (repo.empty) {
    await waitMs(1000)
    return waitForRepoToBeReady(username, repoName)
  }
}

function urlToName(url: string | URL): string {
  try {
    url = new URL(url)
  } catch {
    return ''
  }
  return path.basename(url.pathname, path.extname(url.pathname))
}

function getGitServiceFromUrl(url: string): string {
  let hostName
  try {
    hostName = new URL(url).hostname
  } catch (e) {
    console.log({ url })
    console.log(e.stack)
    throw e
  }

  switch (hostName) {
    case 'github.com':
      return 'github'
    case 'gitlab.com':
      return 'gitlab'
    case 'try.gitea.io':
      return 'gitea'
    default:
      return 'git'
  }
}

async function repoExists(username: string, repoName: string) {
  const url = `${KITSPACE_GITEA_URL}/api/v1/repos/${username}/${repoName}`
  const response = await fetch(url, { headers })
  return response.ok
}

async function getGiteaUser(username: string) {
  const url = `${KITSPACE_GITEA_URL}/api/v1/users/${username}`

  const response = await fetch(url)
  if (!response.ok) {
    return null
  }

  return response.json()
}

function waitMs(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}


type GithubReposDescriptionsMap = Map<string, string>
interface GitHubRepoInfoGQLResponse {
  data: {
    fullName: string
    description: string
  }[]
}

interface GiteaUser {
  id: number
  username: string
  email: string
}

interface UserInfo {
  username: string
  email: string
  password: string
}

interface RegistryBoard {
  repo: string
  hash: string
}
