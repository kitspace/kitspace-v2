import React, { createContext, useContext, useState, useEffect } from 'react'
import { useRouter } from 'next/router'

import _ from 'lodash'

import {
  getRepoFiles,
  projectNameFromPath,
  uploadFile as uploadFileToGitea,
} from '@utils/giteaApi'
import { AuthContext } from '@/contexts/AuthContext'

export const UploadContext = createContext({
  allFiles: [],
  loadedFiles: [],
  loadFiles: () => {},
  uploadFile: async (repo, path, content, csrf) => true,
})

export default function UploadContextProvider(props) {
  const { asPath } = useRouter()
  const { csrf } = useContext(AuthContext)
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
      const repo = projectNameFromPath(asPath)
      const files = await getRepoFiles(repo, csrf)
      const filesDetails = files?.map(({ name, size }) => ({ name, size })) || []
      setRepoFiles(filesDetails)
    }
    if (isUpdateRoute && !fetchedRemote) {
      getRemoteFiles().then()
      setFetchedRemote(true)
    }
  }, [asPath, allFiles])

  useEffect(() => {
    setLoadedFiles(JSON.parse(sessionStorage.getItem('loadedFiles')))
  }, [asPath])

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

  const loadFiles = files => {
    if (files != null) {
      // Store a list of loaded files in sessionStorage
      const filesDetails = files.map(({ name, size }) => ({ name, size }))
      setLoadedFiles(filesDetails)
      sessionStorage.setItem('loadedFiles', JSON.stringify(filesDetails))

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

  const uploadFile = uploadFileToGitea

  return (
    <UploadContext.Provider
      value={{ loadedFiles, loadFiles, uploadFile, allFiles }}
    >
      {props.children}
    </UploadContext.Provider>
  )
}
