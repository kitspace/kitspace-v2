import useSWR from 'swr'

import { getStatusPathFrom } from '@utils/projectPage'

const fetcher = (...args) => fetch(...args).then(r => r.json())

const useProjectAssets = assetsPath => {
  const top = `${assetsPath}/images/top.svg`
  const topStatusUrl = getStatusPathFrom(top)

  const bottom = `${assetsPath}/images/bottom.svg`
  const bottomStatusUrl = getStatusPathFrom(bottom)

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
    isLoading:
      !isError && topStatus?.status !== 'done' && bottomStatus?.status !== 'done',
    isError,
  }
}

export default useProjectAssets
