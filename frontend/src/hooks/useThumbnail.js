import useSWR from 'swr'
import getConfig from 'next/config'

const processorUrl = getConfig().publicRuntimeConfig.KITSPACE_PROCESSOR_URL

const fetcher = (...args) => fetch(...args).then(r => r.json())

const useThumbnail = (fullName, multiProjectName) => {
  const img = `/${fullName}/HEAD/${multiProjectName}/images/top.png`
  const statusUrl = `${processorUrl}/status/${img}`
  const { data, error } = useSWR(statusUrl, fetcher)
  const isError = error || data?.status === 'failed'
  return {
    src: `${processorUrl}/files/${img}`,
    isLoading: !isError && data?.status !== 'done',
    isError,
  }
}

export default useThumbnail
