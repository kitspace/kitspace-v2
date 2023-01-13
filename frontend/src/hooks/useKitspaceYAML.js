import useSWR from 'swr'
import getConfig from 'next/config'

import { fetcher } from './s3HeadFetcher'

const assetUrl = getConfig().publicRuntimeConfig.KITSPACE_ASSET_URL

/**
 * A hook to get the kitspace-yaml.json
 * @param projectFullname{string}
 * @param shouldFetch{boolean}
 * @param swrOpts{swrOptions}
 * @returns {{isLoading: boolean, isError: boolean, kitspaceYAML: object, mutate: function}}
 */
const useKitspaceYAML = (projectFullname, shouldFetch, swrOpts = {}) => {
  const endpoint = `${assetUrl}/files/${projectFullname}/HEAD/kitspace-yaml.json`

  const { data, error, mutate } = useSWR(
    shouldFetch ? endpoint : null,
    fetcher,
    swrOpts,
  )

  return {
    kitspaceYAML: data || {},
    isLoading: !(error || data),
    isError: error,
    mutate,
  }
}

export default useKitspaceYAML
