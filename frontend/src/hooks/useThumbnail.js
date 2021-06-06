import useSWR from 'swr'

const processorUrl = process.env.KITSPACE_PROCESSOR_URL

const fetcher = (...args) => fetch(...args).then(r => r.json())

const useThumbnail = fullName => {
  const img = `/${fullName}/HEAD/images/top.png`
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
