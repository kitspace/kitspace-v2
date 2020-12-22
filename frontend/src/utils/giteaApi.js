import path from 'path'
import slugify from 'slugify'

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
    description: description,
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

  return res.ok ? body['full_name'] : ''
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
 * Mirror an existing remote git repo to a Gitea repo
 * @param remoteRepo {string} url of the remote repo
 * @param uid {string}
 * @param csrf {string}
 * @returns {Promise<boolean>}
 */
export const migrateRepo = async (remoteRepo, uid, csrf) => {
  const clone_addr = remoteRepo
  const repo_name = urlToName(clone_addr)
  const endpoint = `${giteaApiUrl}/repos/migrate?_csrf=${csrf}`
  const giteaOptions = {
    clone_addr,
    uid,
    repo_name,
    mirror: true,
    wiki: false,
    private: false,
    pull_requests: true,
    releases: true,
  }

  const res = await fetch(endpoint, {
    method: 'POST',
    mode,
    credentials: 'include',
    headers,
    body: JSON.stringify(giteaOptions),
  })

  return res.ok
}
/**
 * delete the corresponding gitea repo for a project.
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
 * @param csrf {string}
 * @param branch {string=}
 * @returns {Promise<Array|null>}
 */
export const getRepoFiles = async (repo, csrf, branch) => {
  if (!branch) {
    branch = 'master'
  }

  const endpoint = `${giteaApiUrl}/repos/${repo}/contents?ref=${branch}&_csrf=${csrf}`
  const res = await fetch(endpoint, {
    method: 'GET',
    mode,
    credentials,
    headers,
  })

  const body = await res.json()

  if (body.hasOwnProperty('owner')) {
    return []
  } else {
    return res.ok ? body : []
  }
}

/**
 * get the files in repo's default branch
 * @param repo {string}
 * @param csrf {string}
 * @returns {Promise<Array|null>}
 */
export const getDefaultBranchFiles = async (repo, csrf) => {
  const repoDetails = await getRepo(repo)
  const defaultBranch = repoDetails.default_branch

  return getRepoFiles(repo, csrf, defaultBranch)
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
  return res.ok ? await res.json() : null
}

/**
 * Get the repos own by the current authenticated user
 * @param csrf{string}
 * @returns {Promise<any|*[]>}
 */
export const getUserRepos = async csrf => {
  const endpoint = `${giteaApiUrl}/user/repos?_csrf=${csrf}`

  const res = await fetch(endpoint, {
    method: 'GET',
    credentials,
    mode,
    headers,
  })

  return res.ok ? await res.json() : []
}

/**
 * uploads a file to an existing gitea repo
 * @param repo {string} full repo name, i.e., {user}/{repoName}
 * @param path
 * @param content: must be Base64 encoded
 * @param csrf
 * @returns {Promise<boolean>}
 */
export const uploadFile = async (repo, path, content, csrf) => {
  const user = window.session.user
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
    branch: 'master',
    // content must be Base64 encoded
    content: btoa(content),
    message: `Automated commit on behalf of ${user.login} (${user.email})`,
  }

  const res = await fetch(endpoint, {
    method: 'POST',
    credentials,
    mode,
    headers,
    body: JSON.stringify(reqBody),
  })

  const body = await res.json()
  console.log(body)

  return res.ok
}

export const urlToName = url => {
  url = new URL(url)
  return path.basename(url.pathname, path.extname(url.pathname))
}
export const projectNameFromPath = path => {
  return path.split('/').slice(3).join('/')
}
export const getSession = req => {
  if (req != null) {
    return req.session
  }
  if (process.browser) {
    return window.session
  }
}
