import path from 'path'
import slugify from 'slugify'

const giteaApiUrl = `${process.env.KITSPACE_GITEA_URL}/api/v1`

/**
 * Create a new Gitea repo
 * @param name
 * @param description
 * @param csrf
 * @returns {Promise<*|string>}
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
    license: 'MIT',
    readme: 'Default',
    auto_init: true,
    private: false,
    default_branch: 'master',
  }
  const res = await fetch(endpoint, {
    method: 'POST',
    credentials: 'include',
    mode: 'cors',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(giteaOptions),
  })

  const body = await res.json()
  console.log(body)

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
    credentials: 'include',
    mode: 'cors',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updateFields),
  })

  return res.ok
}

/**
 * Mirror an existing remote git repo to a Gitea repo
 * @param remoteRepo: url of the remote repo
 * @param uid
 * @param csrf
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
    mirror: false,
    wiki: false,
    private: false,
    pull_requests: false,
    releases: true,
  }

  const res = await fetch(endpoint, {
    method: 'POST',
    mode: 'cors',
    credentials: 'include',
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
    },
    body: JSON.stringify(giteaOptions),
  })

  return res.ok
}

/**
 * Get list of files in a gitea repo
 * @param repo
 * @param csrf
 * @returns {Promise<Array|null>}
 */
export const getRepoFiles = async (repo, csrf) => {
  const endpoint = `${giteaApiUrl}/repos/${repo}/contents?ref=master&_csrf=${csrf}`
  const res = await fetch(endpoint, {
    method: 'GET',
    mode: 'cors',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
  })

  return res.ok ? await res.json() : null
}

/**
 * Get repo details
 * @param fullname
 * @returns {Promise<Object|null>}
 */
export const getRepo = async fullname => {
  const giteaApiUrl = `${process.env.KITSPACE_GITEA_URL}/api/v1`
  const repoUrl = `${giteaApiUrl}/repos/${fullname}`

  const res = await fetch(repoUrl, {
    method: 'GET',
    credentials: 'include',
    mode: 'cors',
    headers: { 'Content-Type': 'application/json' },
  })
  return res.ok ? await res.json() : null
}

/**
 * uploads a file to an existing gitea repo
 * @param repo: full repo name, i.e., {user}/{repoName}
 * @param path
 * @param content: must be Base64 encoded
 * @param csrf
 * @returns {Promise<boolean>}
 */
export const uploadFile = async (repo, path, content, csrf) => {
  const giteaApiUrl = `${process.env.KITSPACE_GITEA_URL}/api/v1`
  const user = window.session.user
  const endpoint = `${giteaApiUrl}/repos/${repo}/contents/${path}?_csrf=${csrf}`

  const reqBody = {
    author: {
      email: user.email,
      name: user.login,
    },
    branch: 'master',
    committer: {
      email: 'admins@kitspace.org',
      name: 'Kitspace',
    },
    // content must be Base64 encoded
    content: btoa(content),
    message: `Automated commit on behalf of ${user.login} (${user.email})`,
  }

  const res = await fetch(endpoint, {
    method: 'POST',
    credentials: 'include',
    mode: 'cors',
    headers: { 'Content-Type': 'application/json' },
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
