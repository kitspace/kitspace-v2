import useSWR from 'swr'
import getConfig from 'next/config'

const assetUrl = getConfig().publicRuntimeConfig.KITSPACE_ASSET_URL

const fetcher = (...args) =>
  fetch(...args, { method: 'HEAD', mode: 'cors' }).then(r => r.ok)

const useThumbnail = (fullName, multiProjectName) => {
  const img = `${fullName}/HEAD/${
    multiProjectName != null ? `${multiProjectName}/` : ''
  }images/top.png`
  const src = `${assetUrl}/files/${img}`
  const { data, error } = useSWR(src, fetcher)
  return {
    src,
    isLoading: !error && !data,
    isError: error,
  }
}

export default useThumbnail
