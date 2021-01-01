import React from 'react'

import { useDropzone } from 'react-dropzone'
import { fromEvent } from 'file-selector'
import { Button } from 'semantic-ui-react'

const DropZone = ({ onDrop, style }) => {
  /**
   * A unified way to get files from files/folder drop amd files/folder picker
   * @param event
   * @returns {Promise<(FileWithPath | DataTransferItem)[]>}
   */
  const getFilesFromEvent = event => fromEvent(event)

  const { getRootProps, getInputProps, open } = useDropzone({
    onDrop,
    noClick: true,
    getFilesFromEvent,
  })

  return (
    <div
      {...getRootProps({ className: 'dropzone' })}
      style={style || { margin: '2rem 0' }}
    >
      <input {...getInputProps()} />
      <p>
        <b>Drop</b> files or a folder here, or{' '}
      </p>
      <div style={{ display: 'block', margin: 'auto' }}>
        <Button color="green" content="Select files" onClick={open} icon="file" />
        <div style={{ display: 'inline-block', padding: '1rem', margin: 'auto' }} />
        <Button
          as="label"
          htmlFor="folder-picker"
          type="button"
          color="green"
          content="Select a folder"
          icon="folder"
        />
        <input
          type="file"
          id="folder-picker"
          style={{ display: 'none' }}
          directory=""
          webkitdirectory=""
          mozdirectory=""
          msdirectory=""
          odirectory=""
          multiple
          onChange={e => getFilesFromEvent(e).then(onDrop)}
        />
      </div>
    </div>
  )
}

export default DropZone
