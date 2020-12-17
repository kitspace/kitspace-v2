import React, { createContext, useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/router'

import _ from 'lodash'

import { getDefaultBranchFiles, projectNameFromPath } from '@utils/giteaApi'
import { commitFiles } from '@utils/giteaInternalApi'
import { AuthContext } from '@contexts/AuthContext'

export const UploadContext = createContext({
  allFiles: [],
  loadedFiles: [],
  loadFiles: () => {},
  uploadLoadedFiles: () => {},
  setPersistenceScope: () => {},
})

export default function UploadContextProvider(props) {
  const { asPath } = useRouter()
  const { csrf } = useContext(AuthContext)
  const [persistenceScope, setPersistenceScope] = useState('')
  const [loadedFiles, setLoadedFiles] = useState([])
  const [repoFiles, setRepoFiles] = useState([])
  const [allFiles, setAllFiles] = useState([])
  const [isUpdateRoute, setIsUpdateRoute] = useState(false)
  const [fetchedRemote, setFetchedRemote] = useState(false)

  useEffect(() => {
    setIsUpdateRoute(RegExp('^/projects/update').test(asPath))
  }, [asPath, allFiles])

  // Fetch remote repo files
  useEffect(() => {
    const getRemoteFiles = async () => {
      const projectName = projectNameFromPath(asPath)

      const files = await getDefaultBranchFiles(projectName, csrf)

      const filesDetails = files?.map(({ name, size }) => ({ name, size })) || []
      setRepoFiles(filesDetails)
    }

    if (isUpdateRoute && !fetchedRemote) {
      getRemoteFiles().then()
      setFetchedRemote(true)
    }
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
    const uniq = _.uniqBy([...allFiles, ...repoFiles], 'name')
    setAllFiles(uniq)
  }, [repoFiles])

  const loadFiles = (files, project) => {
    if (files != null) {
      // Store a list of loaded files in sessionStorage
      const filesDetails = files.map(({ name, size }) => ({ name, size }))
      setLoadedFiles(filesDetails)
      sessionStorage.setItem(`loadedFiles:${project}`, JSON.stringify(filesDetails))

      // Store a files' content in sessionStorage
      files.map(file => {
        const reader = new FileReader()
        reader.onload = async () => {
          const path = file.name
          const content = reader.result
          try {
            sessionStorage.setItem(`loadedFile_${path}`, content)
          } catch (e) {
            console.error('Failed to persist files between pages redirection', e)
          }
        }
        reader.readAsBinaryString(file)
      })
    }
  }

  const uploadLoadedFiles = async repo => {
    const res = await commitFiles({ repo, csrf, files: loadedFiles })
    console.log(res)
  }

  return (
    <UploadContext.Provider
      value={{
        loadedFiles,
        loadFiles,
        uploadLoadedFiles,
        allFiles,
        setPersistenceScope,
      }}
    >
      {props.children}
    </UploadContext.Provider>
  )
}
