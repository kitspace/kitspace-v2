import getConfig from 'next/config'

const giteaURL = getConfig().publicRuntimeConfig.KITSPACE_GITEA_URL

export const logout = async csrf => {
  const endpoint = `${giteaURL}/user/logout`
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      'X-Csrf-Token': csrf,
    },
    credentials: 'include',
  })
  return res.ok
}

export const getSession = async () => {
  const endpoint = `${giteaURL}/user/kitspace/session`
  const res = await fetch(endpoint, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
    credentials: 'include',
  })
  return res.json()
}
