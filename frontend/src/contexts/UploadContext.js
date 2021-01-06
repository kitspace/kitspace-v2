import React, { createContext, useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import useSWR, { mutate } from 'swr'

import _ from 'lodash'

import { getDefaultBranchFiles } from '@utils/giteaApi'
import { commitFiles } from '@utils/giteaInternalApi'
import { projectNameFromPath } from '@utils/index'
import { AuthContext } from '@contexts/AuthContext'

export const UploadContext = createContext({
  allFiles: [],
  loadedFiles: [],
  loadFiles: () => {},
  uploadLoadedFiles: () => {},
  setPersistenceScope: () => {},
  invalidateCache: () => {},
})

export default function UploadContextProvider(props) {
  const { asPath } = useRouter()
  const { csrf } = useContext(AuthContext)
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
      const filesDetails = files.map(({ name, size, type }) => ({
        name,
        size,
        type,
      }))
      setLoadedFiles(filesDetails)
      sessionStorage.setItem(`loadedFiles:${project}`, JSON.stringify(filesDetails))

      // Store a files' content in sessionStorage
      files.map(file => {
        const reader = new FileReader()
        reader.onload = async () => {
          const path = file.name
          const content = reader.result
          try {
            sessionStorage.setItem(`loadedFile:${project}:${path}`, content)
          } catch (e) {
            console.error('Failed to persist files between pages redirection', e)
          }
        }
        reader.readAsDataURL(file)
      })
    }
  }

  const uploadLoadedFiles = async repo => {
    const res = await commitFiles({ repo, csrf, files: loadedFiles })
    console.log(res)
  }

  const invalidateCache = async () => {
    await mutate(`update/${projectName}`)
  }

  return (
    <UploadContext.Provider
      value={{
        loadedFiles,
        loadFiles,
        uploadLoadedFiles,
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

  const { data, error } = useSWR(shouldFetch ? `update/${repo}`: null, fetcher)

  return {
    files: data,
    isLoading: !(data || error),
    isError: error,
  }
}
