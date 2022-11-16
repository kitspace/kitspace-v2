import useSWR from 'swr'

const fetcher = (...args) => fetch(...args, { method: 'HEAD' }).then(r => r.ok)

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
