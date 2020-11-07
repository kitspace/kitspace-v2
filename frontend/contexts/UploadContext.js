import React, { createContext, useState } from 'react'

export const UploadContext = createContext({ loadedFiles: [], loadFiles: () => {} })

export default function UploadContextProvider(props) {
  const [loadedFiles, setLoadedFiles] = useState([])

  const loadFiles = files => {
    console.log({ loadedFiles, files })
    setLoadedFiles(files)
  }

  return (
    <UploadContext.Provider value={{ loadedFiles, loadFiles }}>
      {props.children}
    </UploadContext.Provider>
  )
}
