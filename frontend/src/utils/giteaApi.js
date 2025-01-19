import getConfig from 'next/config'

const giteaApiUrl = `${getConfig().publicRuntimeConfig.KITSPACE_GITEA_URL}/api/v1`
const credentials = 'include'
const mode = 'cors'
const headers = { 'Content-Type': 'application/json' }
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
 * Check if a user exist
 * @param username{string}
 * @returns {Promise<Object|null>}
 */
export const getUser = async username => {
  const endpoint = `${giteaApiUrl}/users/${username}`

  const res = await fetch(endpoint, {
    method: 'GET',
    mode,
    headers,
  })

  return res.ok ? res.json() : null
}
