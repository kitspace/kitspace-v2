import useSWR from 'swr'

import { getIsProcessingDone } from '@utils/projectPage'

/**
 *
 * @param {string} rootAssetPath url for project assets
 * @param {boolean} shouldFetch
 * @param {object} swrOpts
 * @returns {{done: boolean, isLoading: boolean, isError: boolean, mutate: Function}} project assets processing status.
 */
const useProcessingStatus = (rootAssetPath, shouldFetch, swrOpts = {}) => {
  const { data, error, mutate } = useSWR(
    shouldFetch ? rootAssetPath : null,
    getIsProcessingDone,
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
