import React, { useCallback, useContext } from 'react'
import { useRouter } from 'next/router'

import { UploadContext } from '@/contexts/UploadContext'
import { useDropzone } from 'react-dropzone'
import { Button } from 'semantic-ui-react'
import { AuthContext } from '@/contexts/AuthContext'
import slugify from 'slugify'

const DropZone = () => {
  const { loadFiles } = useContext(UploadContext)
  const { pathname, push } = useRouter()
  const { user } = useContext(AuthContext)

  const isNewProjectPage = RegExp('^/projects/new').test(pathname)

  const onDrop = useCallback(async acceptedFiles => {
    loadFiles(acceptedFiles)

    const acceptedFilesNames = acceptedFiles.map(f => f.name)
    // TODO: make this look for all PCB software generated files not just KiCad projects
    const kicadProject = acceptedFilesNames.find(f => f.endsWith('.pro'))
    const projectWithExt = kicadProject || acceptedFilesNames[0]
    const tempProjectName = slugify(projectWithExt.split('.')[0])

    if (isNewProjectPage) {
      await push(`/projects/update/${user.login}/${tempProjectName}`)
    }
  }, [])

  const { getRootProps, getInputProps, open } = useDropzone({
    onDrop,
    noClick: true,
  })

  return (
    <div {...getRootProps({ className: 'dropzone' })} style={{ margin: '2rem 0' }}>
      <input {...getInputProps()} />
      <p>Drop files here, or click to select files</p>
      <Button color="green" content="Open file dialog" onClick={open} />
    </div>
  )
}

export default DropZone
