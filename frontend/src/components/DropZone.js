import React from 'react'

import { useDropzone } from 'react-dropzone'
import { fromEvent } from 'file-selector'
import { Button } from 'semantic-ui-react'

const DropZone = ({ onDrop, style }) => {
  const { getRootProps, getInputProps, open } = useDropzone({
    onDrop,
    noClick: true,
    getFilesFromEvent: e => fromEvent(e),
  })

  return (
    <div
      {...getRootProps({ className: 'dropzone' })}
      style={style || { margin: '2rem 0' }}
    >
      <input {...getInputProps()} />
      <p>Drop files here, or click to select files</p>
      <Button color="green" content="Open file dialog" onClick={open} />
    </div>
  )
}

export default DropZone
