import React, { createContext, useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import useSWR, { mutate } from 'swr'

import _ from 'lodash'

import { getDefaultBranchFiles } from '@utils/giteaApi'
import { projectNameFromPath } from '@utils/index'

export const UploadContext = createContext({
  allFiles: [],
  loadedFiles: [],
  loadFiles: () => {},
  setPersistenceScope: () => {},
  invalidateCache: () => {},
})

export default function UploadContextProvider(props) {
  const { asPath } = useRouter()
  const [persistenceScope, setPersistenceScope] = useState('')
  const [loadedFiles, setLoadedFiles] = useState([])
  const [allFiles, setAllFiles] = useState([])
  const [isUpdateRoute, setIsUpdateRoute] = useState(false)

  const projectName = projectNameFromPath(asPath)
  const { files: repoFiles } = useFetchRemoteRepoFiles(projectName, isUpdateRoute)

  useEffect(() => {
    setIsUpdateRoute(RegExp('^/projects/update').test(asPath))
  }, [asPath, allFiles])

  useEffect(() => {
    setLoadedFiles(
      JSON.parse(sessionStorage.getItem(`loadedFiles:${persistenceScope}`)),
    )
  }, [asPath, persistenceScope])

  useEffect(() => {
    if (loadedFiles) {
      const uniq = _.uniqBy([...allFiles, ...loadedFiles], 'name')
      setAllFiles(uniq)
    }
  }, [loadedFiles])

  useEffect(() => {
    if (repoFiles) {
      const uniq = _.uniqBy([...allFiles, ...repoFiles], 'name')
      setAllFiles(uniq)
    }
  }, [repoFiles])

  const loadFiles = (files, project) => {
    if (files != null) {
      // Store a list of loaded files in sessionStorage
      // It only stores the details of the files not the content
      setLoadedFiles(files)
      sessionStorage.setItem(`loadedFiles:${project}`, JSON.stringify(files))
    }
  }

  const invalidateCache = async () => {
    await mutate(`update/${projectName}`)
  }

  return (
    <UploadContext.Provider
      value={{
        loadedFiles,
        loadFiles,
        allFiles,
        setPersistenceScope,
        invalidateCache,
      }}
    >
      {props.children}
    </UploadContext.Provider>
  )
}

/**
 * Fetch the files in the gitea repo associated with project being updated
 * @param repo{string}
 * @param shouldFetch{boolean}
 * @returns {{isLoading: boolean, isError: boolean, files: any | Array | null}}
 */
const useFetchRemoteRepoFiles = (repo, shouldFetch) => {
  const fetcher = () => getDefaultBranchFiles(repo)

  const { data, error } = useSWR(shouldFetch ? `update/${repo}` : null, fetcher)

  return {
    files: data,
    isLoading: !(data || error),
    isError: error,
  }
}
