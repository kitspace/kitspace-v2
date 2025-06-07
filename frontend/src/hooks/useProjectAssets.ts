import useSWR from 'swr'

import { s3HeadFetcher } from './s3HeadFetcher'

const useProjectAssets = assetsPath => {
  const top = `${assetsPath}/images/top.svg`

  const bottom = `${assetsPath}/images/bottom.svg`

  const { data: topIsDone, error: topErr } = useSWR(top, s3HeadFetcher)
  const { data: bottomIsDone, error: bottomErr } = useSWR(bottom, s3HeadFetcher)

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
