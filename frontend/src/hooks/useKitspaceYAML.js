import useSWR from 'swr'

const fetcher = (...args) => fetch(...args).then(r => r.json())

const processorUrl = process.env.NEXT_PUBLIC_KITSPACE_PROCESSOR_URL

/**
 * A hook to get the kitspace-yaml.json
 * @param projectFullname{string}
 * @param shouldFetch{boolean}
 * @param swrOpts{swrOptions}
 * @returns {{isLoading: boolean, isError: boolean, kitspaceYAML: object, mutate: function}}
 */
const useKitspaceYAML = (projectFullname, shouldFetch, swrOpts = {}) => {
  const endpoint = `${processorUrl}/files/${projectFullname}/HEAD/kitspace-yaml.json`

  const { data, error, mutate } = useSWR(
    shouldFetch ? endpoint : null,
    fetcher,
    swrOpts,
  )

  return {
    kitspaceYAML: data || {},
    isLoading: !(error || data),
    isError: error,
    mutate,
  }
}

export default useKitspaceYAML
