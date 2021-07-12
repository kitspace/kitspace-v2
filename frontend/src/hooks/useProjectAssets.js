import useSWR from 'swr'

const fetcher = (...args) => fetch(...args).then(r => r.json())

const useProjectAssets = assetsPath => {
  const top = `${assetsPath}/images/top.svg`
  const topStatusUrl = top.replace(/\/files/, '/status')

  const bottom = `${assetsPath}/images/bottom.svg`
  const bottomStatusUrl = bottom.replace(/\/files/, '/status')

  const { data: topStatus, error: topErr } = useSWR(topStatusUrl, fetcher)
  const { data: bottomStatus, error: bottomErr } = useSWR(bottomStatusUrl, fetcher)

  const isError =
    topErr ||
    bottomErr ||
    topStatus?.status === 'failed' ||
    bottomStatus?.status === 'failed'

  return {
    top,
    bottom,
    // top: `${processorUrl}/files/${top}`,
    // bottom: `${processorUrl}/files/${bottom}`,
    isLoading:
      !isError && topStatus?.status !== 'done' && bottomStatus?.status !== 'done',
    isError,
  }
}

export default useProjectAssets
