import platformPath from 'path'
import getConfig from 'next/config'
import { formatAsGiteaRepoName } from './index'

const giteaApiUrl = `${getConfig().publicRuntimeConfig.KITSPACE_GITEA_URL}/api/v1`
const credentials = 'include'
const mode = 'cors'
const headers = { 'Content-Type': 'application/json' }

/**
 * Create a new Gitea repo
 * @param name {string}
 * @param description {string}
 * @param apiToken {string}
 * @returns {Promise<string>}
 */
export const createRepo = async (name, description, apiToken) => {
  const endpoint = `${giteaApiUrl}/user/repos`
  const giteaOptions = {
    name: formatAsGiteaRepoName(name),
    description,
    repo_template: '',
    issue_labels: '',
    gitignores: '',
    readme: 'Default',
    auto_init: true,
    private: false,
    default_branch: 'master',
  }
  const res = await fetch(endpoint, {
    method: 'POST',
    credentials,
    mode,
    headers: {
      ...headers,
      Authorization: `token ${apiToken}`,
    },
    body: JSON.stringify(giteaOptions),
  })

  const body = await res.json()

  return res.ok ? body.full_name : ''
}

/**
 * Update a repo with new fields
 * @param repo {string}
 * @param updateFields{Object}
 * @param apiToken {string}
 * @returns {Promise<boolean>}
 */
export const updateRepo = async (repo, updateFields, apiToken) => {
  const endpoint = `${giteaApiUrl}/repos/${repo}`

  const res = await fetch(endpoint, {
    method: 'PATCH',
    credentials,
    mode,
    headers: {
      ...headers,
      Authorization: `token ${apiToken}`,
    },
    body: JSON.stringify(updateFields),
  })

  return res.ok
}

/**
 * Get the repo name from its url
 * @param url
 * @returns {string}
 * @example
 * // returns 'ulx3s'
 * urlToName('https://github.com/emard/ulx3s/')
 */
const urlToName = url => {
  const urlObj = new URL(url)
  return platformPath.basename(
    urlObj.pathname,
    platformPath.extname(urlObj.pathname),
  )
}

/**
 * Get the git service from the url.
 * The supported services in the api are `github`, `gitea`, `gitlab`, and `git`. See https://try.gitea.io/api/swagger#/repository/repoMigrate
 * @param {string} url
 * @returns {'github' | 'gitlab' | 'gitea' | 'git'} the service type.
 */
export const getGitServiceFromUrl = url => {
  const hostName = new URL(url).hostname

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

/**
 * Mirror an existing remote git repo to a Gitea repo
 * @param remoteRepo {string} url of the remote repo
 * @param uid {string}
 * @param apiToken {string}
 * @param repoName {string=}
 * @returns {Promise<Response>}
 */
export const mirrorRepo = async (remoteRepo, uid, apiToken, repoName) => {
  repoName = repoName || urlToName(remoteRepo)
  const service = getGitServiceFromUrl(remoteRepo)
  const endpoint = `${giteaApiUrl}/repos/migrate`
  const giteaOptions = {
    clone_addr: remoteRepo,
    uid,
    repo_name: repoName,
    mirror: true,
    wiki: false,
    private: false,
    pull_requests: false,
    releases: true,
    issues: false,
    service,
  }

  return fetch(endpoint, {
    method: 'POST',
    mode,
    credentials: 'include',
    headers: {
      ...headers,
      Authorization: `token ${apiToken}`,
    },
    body: JSON.stringify(giteaOptions),
  })
}

/**
 * Delete the corresponding gitea repo for a project.
 * @param repo {string}
 * @param apiToken {string}
 * @returns {Promise<boolean>}
 */
export const deleteRepo = async (repo, apiToken) => {
  const endpoint = `${giteaApiUrl}/repos/${repo}`
  const res = await fetch(endpoint, {
    method: 'DELETE',
    mode,
    credentials,
    headers: {
      ...headers,
      Authorization: `token ${apiToken}`,
    },
  })

  return res.ok
}

/**
 * Get repo details
 * @param fullname
 * @returns {Promise<Object|null>}
 */
export const getRepo = async fullname => {
  const endpoint = `${giteaApiUrl}/repos/${fullname}`

  const res = await fetch(endpoint, {
    method: 'GET',
    credentials,
    mode,
    headers,
  })
  return res.ok ? res.json() : null
}

/**
 * Check if a repo exists
 * @param fullname{string}
 * @returns {Promise<boolean>}
 */
export const repoExists = async fullname => {
  const repo = await getRepo(fullname)

  return repo != null
}
/**
 *
 * @param {string} username
 * @param {string} repoName
 * @param {boolean} isValidProjectName
 * @returns
 */
export const isUsableProjectName = async (
  username,
  repoName,
  isValidProjectName,
) => {
  // Check if the new name will also cause a conflict.
  const repoFullName = `${username}/${formatAsGiteaRepoName(repoName)}`
  return isValidProjectName && !(await repoExists(repoFullName))
}

/**
 * Check if a user exist
 * @param username{string}
 * @returns {Promise<boolean>}
 */
export const userExists = async username => {
  const endpoint = `${giteaApiUrl}/users/${username}`

  const res = await fetch(endpoint, {
    method: 'GET',
    mode,
    headers,
  })

  return res.ok
}

/**
 * Check if a user is a collaborator in a Gitea repo.
 * @param {string} repo
 * @param {string} username
 * @param apiToken {string}
 * @returns {Promise<boolean>}
 */
const isCollaborator = async (repo, username, apiToken) => {
  if (username == null) {
    return false
  }

  const endpoint = `${giteaApiUrl}/repos/${repo}/collaborators`

  const res = await fetch(endpoint, {
    method: 'GET',
    mode,
    credentials,
    headers: {
      ...headers,
      Authorization: `auth ${apiToken}`,
    },
  })

  if (res.ok) {
    const collaborators = await res.json()
    return collaborators.find(x => x.login === username) != null
  }

  return false
}

/**
 * Check if a user can commit to a Gitea repo.
 * @param {string} repo
 * @param {string} username
 * @param apiToken {string}
 * @returns
 */
export const canCommit = async (repo, username, apiToken) => {
  const repoOwner = repo.split('/')[0]
  return repoOwner === username || isCollaborator(repo, username, apiToken)
}

/**
 * Search all repos
 * @param q{string=}: search query, leave undefined to return all repos
 * @param sort{string}
 * @param order{string}
 * @returns {Promise<[Object]>}
 */

/**
 * get a file in gitea repo
 * @param {string} repo
 * @param {string} path
 * @returns
 */
export const getFile = async (repo, path) => {
  const endpoint = `${giteaApiUrl}/repos/${repo}/contents/${path}`

  const res = await fetch(endpoint, { method: 'GET', credentials, mode, headers })

  return res.ok ? res.json() : {}
}

/**
 * update existing file in gitea
 * @param repo {string} full repo name, i.e., {user}/{repoName}
 * @param path{string}
 * @param content{string}: must be Base64 encoded
 * @param user{object}
 * @param apiToken{string}
 * @returns {Promise<boolean>}
 */
export const updateFile = async (repo, path, content, user, apiToken) => {
  const endpoint = `${giteaApiUrl}/repos/${repo}/contents/${path}`

  const { sha } = await getFile(repo, path)
  const reqBody = {
    author: {
      email: user.email,
      name: user.login,
    },
    committer: {
      email: user.email,
      name: user.email,
    },
    // content must be Base64 encoded
    content: btoa(content),
    sha,
  }

  const res = await fetch(endpoint, {
    method: 'PUT',
    credentials,
    mode,
    headers: { ...headers, Authorization: `token ${apiToken}` },
    body: JSON.stringify(reqBody),
  })

  return res.ok
}

/**
 * Upload file to gitea
 * @param repo {string} full repo name, i.e., {user}/{repoName}
 * @param path{string}
 * @param content{string}: must be Base64 encoded
 * @param user{object}
 * @param apiToken{string}
 * @returns {Promise<boolean>}
 */
export const uploadFile = async (repo, path, content, user, apiToken) => {
  const endpoint = `${giteaApiUrl}/repos/${repo}/contents/${path}`

  const reqBody = {
    author: {
      email: user.email,
      name: user.login,
    },
    committer: {
      email: user.email,
      name: user.email,
    },
    // content must be Base64 encoded
    content: btoa(content),
  }

  const res = await fetch(endpoint, {
    method: 'POST',
    credentials,
    mode,
    headers: { ...headers, Authorization: `token ${apiToken}` },
    body: JSON.stringify(reqBody),
  })

  return res.ok
}
