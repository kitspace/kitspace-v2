import useSWR from 'swr'

/**
 * @typedef {Object} swrOptions: Configuration options for swr
 * @link {https://swr.vercel.app/docs/options}
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
 **/
const giteaApiUrl = `${process.env.KITSPACE_GITEA_URL}/api/v1`
const mode = 'cors'
const headers = { 'Content-Type': 'application/json' }

/**
 *
 * @param url
 * @param initOps{Object} other options to pass to `fetch`
 * @returns {Promise<Promise<any>>}
 */
const fetcher = (url, initOps = {}) =>
  fetch(url, {
    method: 'GET',
    mode,
    headers,
    ...initOps,
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

  return {
    repo: data,
    isLoading: !(data || error),
    isError: error,
    mutate,
  }
}

/**
 * A hook to get all repos on gitea
 * @returns {{repos: [Object], IsLoading: boolean, IsError: boolean, mutate: function}}
 */
export const useAllRepos = (swrOpts = {}) =>
  useSearchRepos('updated', 'desc', swrOpts)

/**
 * A hook to search all repos
 * @param sort{string}
 * @param order{string}
 * @param swrOpts{Object}
 * @param q{string=}: search query, leave undefined to return all repos
 * @returns {{repos: [Object], IsLoading: boolean, IsError: boolean, mutate: function}}
 */
export const useSearchRepos = (
  sort = 'updated',
  order = 'desc',
  swrOpts = {},
  q,
) => {
  const endpoint = `${giteaApiUrl}/repos/search`

  const { data, error, mutate } = useSWR(
    [endpoint, { sort, order, q }],
    fetcher,
    swrOpts,
  )
  return {
    // the response from gitea has a field `data` which contains the search result
    repos: data.data || [],
    isLoading: !(data || error),
    isError: error,
    mutate,
  }
}

/**
 * A hook to get repos owned by as user
 * @param username{string}
 * @param swrOpts{swrOptions}
 * @returns {{isLoading: boolean, isError: boolean, repos: [Object], mutate: function}}
 */
export const useUserRepos = (username, swrOpts = {}) => {
  const endpoint = `${giteaApiUrl}/users/${username}/repos`

  const { data, error, mutate } = useSWR(endpoint, fetcher, swrOpts)

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
 * @returns {{isLoading: boolean, isError: boolean, files: {[Object]}, mutate: function}}
 */
export const useDefaultBranchFiles = (repo, swrOpts) => {
  const { repo: repoDetails } = useRepo(repo, swrOpts)

  // Dependent data if: swr won't fetch if `repoDetails.default_branch` returns a falsy value.
  // See https://swr.vercel.app/docs/conditional-fetching
  const { data, error, mutate } = useSWR(
    () => `${giteaApiUrl}/repos/${repo}/contents?ref=` + repoDetails.default_branch,
    fetcher,
    swrOpts,
  )

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
  } else {
    return {
      files: data,
      isLoading: !(data || error),
      isError: error,
      mutate,
    }
  }
}
