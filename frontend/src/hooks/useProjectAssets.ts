import useSWR from 'swr'

import { fetcher } from './s3HeadFetcher'

const useProjectAssets = assetsPath => {
  const top = `${assetsPath}/images/top.svg`

  const bottom = `${assetsPath}/images/bottom.svg`

  const { data: topIsDone, error: topErr } = useSWR(top, fetcher)
  const { data: bottomIsDone, error: bottomErr } = useSWR(bottom, fetcher)

  const isError = topErr || bottomErr

  const isLoading = !isError && !topIsDone && !bottomIsDone

  return {
    top,
    bottom,
    isLoading,
    isError,
  }
}

export default useProjectAssets
