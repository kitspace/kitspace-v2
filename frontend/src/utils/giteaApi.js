import slugify from 'slugify'
import platformPath from 'path'

const giteaApiUrl = `${process.env.KITSPACE_GITEA_URL}/api/v1`
const credentials = 'include'
const mode = 'cors'
const headers = { 'Content-Type': 'application/json' }

/**
 * Create a new Gitea repo
 * @param name {string}
 * @param description {string}
 * @param csrf {string}
 * @returns {Promise<string>}
 */
export const createRepo = async (name, description, csrf) => {
  const endpoint = `${giteaApiUrl}/user/repos?_csrf=${csrf}`
  const giteaOptions = {
    _csrf: csrf,
    name: slugify(name),
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
    headers,
    body: JSON.stringify(giteaOptions),
  })

  const body = await res.json()

  return res.ok ? body.full_name : ''
}

/**
 * Update a repo with new fields
 * @param repo {string}
 * @param updateFields{Object}
 * @param csrf{string}
 * @returns {Promise<boolean>}
 */
export const updateRepo = async (repo, updateFields, csrf) => {
  const endpoint = `${giteaApiUrl}/repos/${repo}?_csrf=${csrf}`

  const res = await fetch(endpoint, {
    method: 'PATCH',
    credentials,
    mode,
    headers,
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
 * Mirror an existing remote git repo to a Gitea repo
 * @param remoteRepo {string} url of the remote repo
 * @param uid {string}
 * @param csrf {string}
 * @returns {Promise<Response>}
 */
export const mirrorRepo = async (remoteRepo, uid, csrf) => {
  const repoName = urlToName(remoteRepo)
  const endpoint = `${giteaApiUrl}/repos/migrate?_csrf=${csrf}`
  const giteaOptions = {
    remoteRepo,
    uid,
    repo_name: repoName,
    mirror: true,
    wiki: false,
    private: false,
    pull_requests: true,
    releases: true,
  }

  return fetch(endpoint, {
    method: 'POST',
    mode,
    credentials: 'include',
    headers,
    body: JSON.stringify(giteaOptions),
  })
}

/**
 * Delete the corresponding gitea repo for a project.
 * @param repo {string}
 * @param csrf {string}
 * @returns {Promise<boolean>}
 */
export const deleteRepo = async (repo, csrf) => {
  const endpoint = `${giteaApiUrl}/repos/${repo}?_csrf=${csrf}`
  const res = await fetch(endpoint, {
    method: 'DELETE',
    mode,
    credentials,
    headers,
  })

  return res.ok
}

/**
 * Get list of files in a gitea repo.
 * @param repo {string}
 * @param branch {string=}
 * @returns {Promise<Array|null>}
 */
export const getRepoFiles = async (repo, branch = 'master') => {
  const endpoint = `${giteaApiUrl}/repos/${repo}/contents?ref=${branch}`
  const res = await fetch(endpoint, {
    method: 'GET',
    mode,
    credentials,
    headers,
  })

  if (res.ok) {
    const body = await res.json()

    // For some reason if the repo is empty the gitea api returns the repo details instead of an empty array!
    // Check if it returned repo details and replace it with an empty array.
    // eslint-disable-next-line no-prototype-builtins
    if (body.hasOwnProperty('owner')) {
      return []
    }
    return body
  }
  return []
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
 * get the files in repo's default branch
 * @param repo {string}
 * @returns {Promise<Array|null>}
 */
export const getDefaultBranchFiles = async repo => {
  const repoDetails = await getRepo(repo)
  const { default_branch: defaultBranch } = repoDetails

  return getRepoFiles(repo, defaultBranch)
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
 * @returns {Promise<boolean>}
 */
const isCollaborator = async (repo, username) => {
  const endpoint = `${giteaApiUrl}/repos/${repo}/collaborators/${username}`

  const res = await fetch(endpoint, {
    method: 'GET',
    mode,
    headers,
  })

  return res.ok
}

/**
 * Check if a user can commit to a Gitea repo.
 * @param {string} repo
 * @param {string} username
 * @returns
 */
export const canCommit = async (repo, username) => {
  const repoOwner = repo.split('/')[0]
  return repoOwner === username || isCollaborator(repo, username)
}

export const searchRepos = async (q, sort = 'updated', order = 'desc') => {
  const endpoint = `${giteaApiUrl}/repos/search?sort=${sort}&order=${order}${
    q ? `&q=${q}` : ''
  }`

  const res = await fetch(endpoint, {
    method: 'GET',
    credentials,
    mode,
    headers,
  })

  if (res.ok) {
    const body = await res.json()
    return body.data
  }
  return []
}

/**
 * Get all repos
 * @returns {Promise<[Object]>}
 */
export const getAllRepos = () => searchRepos()

/**
 * Search all repos
 * @param q{string=}: search query, leave undefined to return all repos
 * @param sort{string}
 * @param order{string}
 * @returns {Promise<[Object]>}
 */

/**
 *
 * @param {string} repo repo fullname
 * @param {string} path file path
 * @returns {Promise<string>} file's raw content or empty string if the file doesn't exist.
 */
export const getFileRawContent = async (repo, path) => {
  const endpoint = `${giteaApiUrl}/repos/${repo}/raw/${path}`

  const res = await fetch(endpoint, {
    method: 'GET',
    credentials,
    mode,
    headers,
  })

  return res.ok ? res.blob().then(b => b.text()) : ''
}

/**
 * Get the repos owned by a user.
 * @param username{string}
 * @returns {Promise<[Object]>}
 */
export const getUserRepos = async username => {
  const endpoint = `${giteaApiUrl}/users/${username}/repos`

  const res = await fetch(endpoint, {
    method: 'GET',
    credentials,
    mode,
    headers,
  })

  return res.ok ? res.json() : []
}

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
 * @param csrf{string}
 * @returns {Promise<boolean>}
 */
export const updateFile = async (repo, path, content, user, csrf) => {
  const endpoint = `${giteaApiUrl}/repos/${repo}/contents/${path}?_csrf=${csrf}`

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
    headers,
    body: JSON.stringify(reqBody),
  })

  return res.ok
}

export const renderMarkdown = async markdown => {
  const endpoint = `${giteaApiUrl}/markdown/raw`

  const res = await fetch(endpoint, {
    method: 'Post',
    mode,
    headers,
    body: markdown,
  })

  return res.ok ? res.blob().then(b => b.text()) : ''
}

/**
 * Upload file to gitea
 * @param repo {string} full repo name, i.e., {user}/{repoName}
 * @param path{string}
 * @param content{string}: must be Base64 encoded
 * @param user{object}
 * @param csrf{string}
 * @returns {Promise<boolean>}
 */
export const uploadFile = async (repo, path, content, user, csrf) => {
  const endpoint = `${giteaApiUrl}/repos/${repo}/contents/${path}?_csrf=${csrf}`

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
    headers,
    body: JSON.stringify(reqBody),
  })

  return res.ok
}
