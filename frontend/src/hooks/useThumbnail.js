import useSWR from 'swr'
import getConfig from 'next/config'

const assetUrl = getConfig().publicRuntimeConfig.KITSPACE_ASSET_URL

const fetcher = (...args) => fetch(...args, { method: 'HEAD' }).then(r => r.ok)

const useThumbnail = (repoFullName, projectName) => {
  const img = `${repoFullName}/HEAD/${projectName}/images/top-large.png`
  const src = `${assetUrl}/files/${img}`
  const { data, error } = useSWR(src, fetcher)
  return {
    src,
    isLoading: !error && !data,
    isError: error,
  }
}

export default useThumbnail
