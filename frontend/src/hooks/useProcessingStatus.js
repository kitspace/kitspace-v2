import useSWR from 'swr'

import { processedAssets } from '@utils/projectPage'

/**
 *
 * @param {string} assetsPath url for project assets
 * @param {boolean} shouldFetch
 * @param {object} swrOpts
 * @returns {{done: boolean, isLoading: boolean, isError: boolean, mutate: Function}} project assets processing status.
 */
const useProcessingStatus = (assetsPath, shouldFetch, swrOpts = {}) => {
  const { data, error, mutate } = useSWR(
    shouldFetch ? assetsPath : null,
    processedAssets,
    swrOpts,
  )

  return {
    done: data,
    isLoading: !(error || data),
    isError: error,
    mutate,
  }
}

export default useProcessingStatus
