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
