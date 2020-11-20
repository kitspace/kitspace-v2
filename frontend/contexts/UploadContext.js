import React, { createContext, useState, useEffect } from 'react'

export const UploadContext = createContext({
  loadedFiles: [],
  loadFiles: () => {},
  uploadFile: async () => {},
})

export default function UploadContextProvider(props) {
  const [loadedFiles, setLoadedFiles] = useState([])

  useEffect(() => {
    const storedFiles = JSON.parse(sessionStorage.getItem('loadedFiles'))
    console.log({ storedFiles })
  }, [])

  const loadFiles = files => {
    if (files != null) {
      // Store a list of loaded files in sessionStorage
      const filesNames = files.map(file => file.name)
      sessionStorage.setItem('loadedFiles', JSON.stringify(filesNames))

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

  /**
   * uploads a file to an existing gitea repo
   * @param repo: full repo name, i.e., {user}/{repoName}
   * @param path
   * @param content: must be Base64 encoded
   * @param csrf
   * @returns {Promise<boolean>}
   */
  const uploadFile = async (repo, path, content, csrf) => {
    const giteaApiUrl = `${process.env.KITSPACE_GITEA_URL}/api/v1`
    const user = window.session.user
    const endpoint = `${giteaApiUrl}/repos/${repo}/contents/${path}?_csrf=${csrf}`

    const reqBody = {
      author: {
        email: user.email,
        name: user.login,
      },
      branch: 'master',
      committer: {
        email: 'admins@kitspace.org',
        name: 'Kitspace',
      },
      // content must be Base64 encoded
      content: btoa(content),
      message: `Automated commit on behalf of ${user.login} (${user.email})`,
    }

    const res = await fetch(endpoint, {
      method: 'POST',
      credentials: 'include',
      mode: 'cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reqBody),
    })

    const body = await res.json()
    console.log(body)

    return res.ok
  }

  return (
    <UploadContext.Provider value={{ loadedFiles, loadFiles, uploadFile }}>
      {props.children}
    </UploadContext.Provider>
  )
}
