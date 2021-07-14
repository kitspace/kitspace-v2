import { processedAssets } from '@utils/projectPage'
import useSWR from 'swr'

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
