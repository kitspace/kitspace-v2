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
