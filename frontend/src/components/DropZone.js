import React, { useEffect } from 'react'
import dynamic from 'next/dynamic'
import { object, func } from 'prop-types'
import _ from 'lodash'

import { useDropzone } from 'react-dropzone'
import { fromEvent } from 'file-selector'
import { Button } from 'semantic-ui-react'

import { MBytesToBytes } from '@utils/index'

const maxFileSize = process.env.MAX_FILE_SIZE

// The notification won't be needed unless of case of trying to upload files
// greater than the `MAX_FILE_SIZE`, so defer importing it until needed,
// this make next dynamically import the `Toaster` component only from this module.
const Toaster = dynamic(() => import('react-hot-toast').then(mod => mod.Toaster))

const DropZone = ({ onDrop, style }) => {
  /**
   * A unified way to get files from files/folder drop amd files/folder picker
   * @param event
   * @returns {Promise<(FileWithPath | DataTransferItem)[]>}
   */
  const getFilesFromEvent = event => fromEvent(event)

  const { getRootProps, getInputProps, open, fileRejections } = useDropzone({
    onDropAccepted: onDrop,
    noClick: true,
    getFilesFromEvent,
    maxSize: MBytesToBytes(maxFileSize),
  })

  useEffect(() => {
    // Display notification for failing to upload large files.
    if (!_.isEmpty(fileRejections)) {
      const largeFiles = fileRejections.map(f => f.file.name)
      // The notification won't be needed unless of case of trying to upload files
      // greater than the `MAX_FILE_SIZE`, so defer importing it until needed
      import('react-hot-toast').then(toast => {
        largeFiles.forEach(name => {
          toast.default.error(
            `"${name}" is too large! The maximum file size is ${maxFileSize}`,
          )
        })
      })
    }
  }, [fileRejections])

  return (
    <div
      {...getRootProps({ className: 'dropzone' })}
      style={style || { margin: '2rem 0' }}
    >
      <Toaster />
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

DropZone.propTypes = {
  onDrop: func,
  style: object,
}

export default DropZone
