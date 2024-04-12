#!/usr/bin/env -S deno run --allow-env --allow-net --allow-run
/* eslint-disable no-console */

import { cryptoRandomString } from 'https://deno.land/x/crypto_random_string@1.0.0/mod.ts'
import { exec, OutputMode } from 'https://deno.land/x/exec@0.0.5/mod.ts'
import { parse } from 'https://deno.land/std@0.119.0/flags/mod.ts'
import * as path from 'https://deno.land/std@0.167.0/path/mod.ts'
import ProgressBar from 'https://deno.land/x/progress@v1.3.4/mod.ts'
import shuffle from 'https://deno.land/x/shuffle@v1.0.1/mod.ts'

const flags = parse(Deno.args, {
  string: ['giteaUrl', 'adminToken', 'githubToken'],
  boolean: ['help', 'tokenOnly', 'shuffle'],
  default: { numberOfRepos: 150, giteaUrl: 'http://localhost:3333', shuffle: true },
})

const HELP_TEXT = `Usage: importBoardsTxt [options]
    options:
      --giteaUrl: Gitea URL (default: http://localhost:3333)
      --adminToken: Gitea admin API token (default: generated automatically)
      --githubToken: GitHub API token (classic) (Embedded into the script in staging servers.)
      --numberOfRepos: Number of repositories to import (default: 1000)
      --tokenOnly: Only generate the admin token and exit.
      --shuffle: Shuffle the boards.txt file before importing (default: true)
      --help: Show this help
  `

if (flags.help) {
  console.log(HELP_TEXT)
  Deno.exit(0)
}

if (!flags.githubToken && !flags.tokenOnly) {
  console.error('Error: No github token provided.')
  Deno.exit(1)
}

if (!flags.adminToken) {
  flags.adminToken = await generateGiteaAdminToken()

  if (flags.tokenOnly) {
    console.log(flags.adminToken)
    Deno.exit(0)
  }
}

const KITSPACE_GITEA_URL = flags.giteaUrl

const headers = {
  'Content-Type': 'application/json',
  Authorization: `token ${flags.adminToken}`,
}

async function main() {
  let boards = await getBoardsTxt()
  if (flags.shuffle) {
    boards = shuffle(boards)
  }
  boards = boards.slice(0, flags.numberOfRepos)
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

async function importRepo(
  url: string,
  GithubReposDescriptions: GithubReposDescriptionsMap,
) {
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

async function mirrorRepo(
  remoteRepo: string,
  user: GiteaUser,
  repoName: string,
  GithubReposDescriptions: GithubReposDescriptionsMap,
) {
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
    description:
      service === 'github'
        ? GithubReposDescriptions.get(`${user.username}/${repoName}`)
        : null,
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify(giteaOptions),
  })

  if (!response.ok) {
    let message = 'Unknown error'
    try {
      message = (await response.json()).message
    } catch (e) { }
    throw new Error(
      `Failed to mirror ${remoteRepo} to ${user.username}/${repoName}: ${response.status}: ${message}`,
    )
  }
}

/**
 * Use the github graphql API to get the description of all the repos.
 * We can't use the REST API because it doesn't allow us to get the description of multiple repos in one request.
 * And if we requested the description of each repo separately, we would hit the rate limit.
 * @param reposUrls
 */
async function getAllGithubReposDescriptions(
  reposUrls: string[],
): Promise<Map<string, string>> {
  const githubRepos = reposUrls.filter(
    url => getGitServiceFromUrl(url) === 'github',
  )
  const reposOwnerAndName = githubRepos.map(
    repoName => repoName.split('/', 5).slice(-2) as [string, string],
  )

  const query = `
  query {
    ${reposOwnerAndName.map(
    ([owner, name], index) => `
    r${index}: repository(owner: "${owner}", name: "${name}") {
      fullName: nameWithOwner
      description
    }`,
  )}
  }
  `
  const { data: reposInfo }: GitHubRepoInfoGQLResponse = await fetch(
    'https://api.github.com/graphql',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `bearer ${flags.githubToken}`,
      },
      body: JSON.stringify({ query }),
    },
  ).then(res => res.json())

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
    case 'gitea.com':
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

async function generateGiteaAdminToken() {
  const adminUsername =
    'importer' + cryptoRandomString({ length: 8, type: 'numeric' })
  const adminPassword: string = cryptoRandomString({ length: 32, type: 'base64' })

  const getGiteaContainerCommand = await exec(
    `bash -c "docker ps | grep gitea | awk '{print $1}'"`,
    { output: OutputMode.Capture },
  )

  const giteaAdminCommand = await exec(
    `bash -c "docker exec --user git ${getGiteaContainerCommand.output} /bin/sh -c 'gitea admin user create --username ${adminUsername} --password ${adminPassword} --email ${adminUsername}@example.com --admin --must-change-password=false'"`,
    { output: OutputMode.Capture },
  )

  if (!giteaAdminCommand.status.success) {
    throw new Error('Failed to create gitea admin user')
  }

  const giteaAdminTokenCommand = await exec(
    `bash -c "docker exec --user git ${getGiteaContainerCommand.output} /bin/sh -c 'gitea admin user generate-access-token --username ${adminUsername} --raw --scopes write:admin,write:repository,read:admin,read:user'"`,
    { output: OutputMode.Capture },
  )

  if (!giteaAdminTokenCommand.status.success) {
    throw new Error('Failed to create gitea admin token')
  }

  return giteaAdminTokenCommand.output.split('\n').at(-1)
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
