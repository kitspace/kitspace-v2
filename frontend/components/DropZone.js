import React, { useCallback, useContext } from 'react'

import { UploadContext } from '@/contexts/UploadContext'
import { useDropzone } from 'react-dropzone'
import { Button } from 'semantic-ui-react'

const DropZone = ({onDrop}) => {

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
