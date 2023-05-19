import useSWR from 'swr'
import getConfig from 'next/config'

import { fetcher } from './s3HeadFetcher'

const assetUrl = getConfig().publicRuntimeConfig.KITSPACE_ASSET_URL

const useThumbnail = (repoFullName, projectName) => {
  const img = `${repoFullName}/HEAD/${projectName}/images/top-large.png`
  const src = `${assetUrl}/${img}`
  const { data, error } = useSWR(src, fetcher)
  return {
    src,
    isLoading: !error && !data,
    isError: error,
  }
}

export default useThumbnail
