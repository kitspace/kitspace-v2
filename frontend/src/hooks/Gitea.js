import { getFlatProjects } from '@utils/projectPage'
import useSWR from 'swr'
import getConfig from 'next/config'

/**
 * @link {https://swr.vercel.app/docs/options}
 * @typedef {Object} swrOptions: Configuration options for swr
 * @property {boolean} [suspense] = false: enable React Suspense mode
 * @property {function} [fetcher] = window.fetch(url).then(res => res.json()): the fetcher function
 * @property {any} [initialData]: initial data to be returned
 * @property {boolean} [revalidateOnMount]: enable or disable automatic revalidation when component is mounted
 * @property {boolean} [revalidateOnFocus] = true: auto revalidate when window gets focused
 * @property {boolean} [revalidateOnReconnect] = true: automatically revalidate when the browser regains a network connection
 * @property {number} [refreshInterval] = 0: polling interval
 * @property {boolean} [refreshWhenHidden] = false: polling when the window is invisible (if refreshInterval is enabled)
 * @property {boolean} [refreshWhenOffline] = false: polling when the browser is offline
 * @property {boolean} [shouldRetryOnError] = true: retry when fetcher has an error
 * @property {number} [dedupingInterval] = 2000: dedupe requests with the same key in this time span
 * @property {number} [focusThrottleInterval] = 5000: only revalidate once during a time span
 * @property {number} [loadingTimeout] = 3000: timeout to trigger the onLoadingSlow event
 * @property {number} [errorRetryInterval] = 5000: error retry interval
 * @property {number} [errorRetryCount]: max error retry count
 * @property {function(key, config)} [onLoadingSlow(key, config)]: callback function when a request takes too long to load
 * @property {function(data, key, config)} [onSuccess(data, key, config)]: callback function when a request finishes successfully
 * @property {function(err, key, config)} [onError(err, key, config)]: callback function when a request returns an error
 * @property {function(err, key, config, revalidate, revalidateOps)} [onErrorRetry(err, key, config, revalidate, revalidateOps)]: handler for error retry
 * @property {function(a, b)} [compare(a, b)]: comparison function used to detect when returned data has changed, to avoid spurious rerenders. By default, [dequal](https://github.com/lukeed/dequal) is used.
 * */
const giteaApiUrl = `${getConfig().publicRuntimeConfig.KITSPACE_GITEA_URL}/api/v1`

/**
 *
 * @param url
 * @returns {Promise<Promise<any>>}
 */
const fetcher = url =>
  fetch(url, {
    method: 'GET',
    mode: 'cors',
    headers: { Accept: 'application/json' },
  }).then(r => r.json())

/**
 * A hook to get repo details
 * @param fullname{string}
 * @param swrOpts{swrOptions}
 * @returns {{repo: Object, isLoading: boolean, isError: boolean, mutate: function}}
 */
export const useRepo = (fullname, swrOpts = {}) => {
  const endpoint = `${giteaApiUrl}/repos/${fullname}`
  const { data, error, mutate } = useSWR(endpoint, fetcher, swrOpts)

  const notFound = data?.message === 'Not Found'

  return {
    repo: data,
    isLoading: !(data || error),
    isError: error || notFound,
    mutate,
  }
}

/**
 * A hook to search all repos
 * @param sort{string}
 * @param order{string}
 * @param swrOpts{swrOptions}
 * @param q{string=}: search query, leave undefined to return all repos
 * @returns {{repos: [Object], isLoading: boolean, isError: boolean, mutate: function}}
 */
export const useSearchRepos = (
  q,
  swrOpts = {},
  sort = 'updated',
  order = 'desc',
) => {
  const endpoint = `${giteaApiUrl}/repos/search?sort=${sort}&order=${order}${
    q ? `&q=${q}` : ''
  }`
  const { data, error, mutate } = useSWR(
    endpoint,
    url => fetcher(url).then(({ data }) => getFlatProjects(data ?? [])),
    swrOpts,
  )

  return {
    repos: data,
    isLoading: !(data || error),
    isError: error,
    mutate,
  }
}

/**
 * A hook to get all repos on gitea
 * @param swrOpts{swrOptions}
 * @returns {{repos: [Object], IsLoading: boolean, IsError: boolean, mutate: function}}
 */
export const useAllRepos = (swrOpts = {}) => useSearchRepos(null, swrOpts)

/**
 * A hook to get repos owned by as user
 * @param username{string}
 * @param swrOpts{swrOptions}
 * @returns {{isLoading: boolean, isError: boolean, repos: [Object], mutate: function}}
 */
export const useUserProjects = (username, swrOpts = {}) => {
  const endpoint = `${giteaApiUrl}/users/${username}/repos`
  const { data, error, mutate } = useSWR(
    endpoint,
    url => fetcher(url).then(getFlatProjects),
    swrOpts,
  )

  return {
    repos: data || [],
    isLoading: !(data || error),
    isError: error,
    mutate,
  }
}

/**
 * A hook to get the files in the default branch of a repo
 * @param repo{string}
 * @param swrOpts{swrOptions}
 * @returns {{isLoading: boolean, isError: boolean, files: Object[], mutate: function}}
 */
export const useDefaultBranchFiles = (repo, swrOpts = {}) => {
  const endpoint = `${giteaApiUrl}/repos/${repo}/contents`
  const { data, error, mutate } = useSWR(endpoint, fetcher, swrOpts)

  return {
    files: data || [],
    isLoading: !(data || error),
    isError: error,
    mutate,
  }
}

/**
 * A hook to get the files in any branch of a repo
 * @param repo{string}
 * @param branch{string}
 * @param swrOpts{swrOptions}
 * @returns {{isLoading: boolean, isError: boolean, files: [], mutate?: function}}
 */
export const useRepoFiles = (repo, branch = 'master', swrOpts = {}) => {
  const endpoint = `${giteaApiUrl}/repos/${repo}/contents?ref=${branch}`

  const { data, error, mutate } = useSWR(endpoint, fetcher, swrOpts)

  // For some reason if the repo is empty the gitea api returns the repo details instead of an empty array!
  // Check if it returned repo details and replace it with an empty array.

  if (data?.hasOwnProperty('owner')) {
    return {
      files: [],
      isLoading: !(data || error),
      isError: error,
    }
  }
  return {
    files: data,
    isLoading: !(data || error),
    isError: error,
    mutate,
  }
}

/**
 * A hook to get the migration status of a repo
 * @param repoId{string}
 * @param shouldFetch{boolean}
 * @param swrOpts{swrOptions}

 * @returns {{isLoading: boolean, isError: boolean, status: statuses, mutate?: function}}
 */
export const useMigrationStatus = (repoId, shouldFetch, swrOpts = {}) => {
  const endpoint = `${giteaApiUrl}/repos/migrate/status?repo_id=${repoId}`
  /**
   * Gitea repo migration statuses
   * @enum {string}
   */
  const statuses = {
    0: 'Queue',
    1: 'Running',
    2: 'Stopped',
    3: 'Failed',
    4: 'Finished',
  }

  const { data, error, mutate } = useSWR(
    shouldFetch ? endpoint : null,
    fetcher,
    swrOpts,
  )

  return {
    status: statuses[data?.status],
    isLoading: !(data || error),
    isError: error,
    mutate,
  }
}
