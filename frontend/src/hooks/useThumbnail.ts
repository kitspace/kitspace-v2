import useSWR from 'swr'
import getConfig from 'next/config'

import { s3HeadFetcher } from './s3HeadFetcher'

const assetUrl = getConfig().publicRuntimeConfig.KITSPACE_PROCESSOR_ASSET_URL

const useThumbnail = (
  repoFullName: string,
  projectName: string,
  gitHash: string,
) => {
  const top = `${repoFullName}/${gitHash}/${projectName}/images/top.png`
  const topLarge = `${repoFullName}/${gitHash}/${projectName}/images/top-large.png`
  const srcTop = `${assetUrl}/${top}`
  const srcTopLarge = `${assetUrl}/${topLarge}`
  const { data, error } = useSWR(srcTop, s3HeadFetcher)
  return {
    top: srcTop,
    topLarge: srcTopLarge,
    isLoading: !error && !data,
    isError: error,
  }
}

export default useThumbnail
