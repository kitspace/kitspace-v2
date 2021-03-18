import useSWR from 'swr'

const processorUrl = process.env.KITSPACE_PROCESSOR_URL

const fetcher = (...args) => fetch(...args).then(r => r.json())

const useProjectAssets = projectFullname => {
  const top = `/${projectFullname}/HEAD/images/top.svg`
  const topStatusUrl = `${processorUrl}/status/${top}`

  const bottom = `/${projectFullname}/HEAD/images/bottom.svg`
  const bottomStatusUrl = `${processorUrl}/status/${bottom}`

  const { data: topStatus, error: topErr } = useSWR(topStatusUrl, fetcher)
  const { data: bottomStatus, error: bottomErr } = useSWR(bottomStatusUrl, fetcher)

  const isError =
    topErr ||
    bottomErr ||
    topStatus?.status === 'failed' ||
    bottomStatus?.status === 'failed'

  return {
    top: `${processorUrl}/files/${top}`,
    bottom: `${processorUrl}/files/${bottom}`,
    isLoading:
      !isError && topStatus?.status !== 'done' && bottomStatus?.status !== 'done',
    isError,
  }
}

export default useProjectAssets
