import React, { useEffect, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { object, func } from 'prop-types'
import { isEmpty } from 'lodash'

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
  const _onDrop = useCallback(onDrop, [onDrop])

  const DropZoneConfig = {
    onDropAccepted: _onDrop,
    noClick: true,
    getFilesFromEvent: fromEvent,
    maxSize: MBytesToBytes(maxFileSize),
    minSize: 1,
  }

  // This is the only way to support Drag'nDrop, file selector and Folder selector at the same time
  // This hook is responsible for Drag'nDrop and file selector
  const {
    getRootProps,
    getInputProps,
    open,
    fileRejections: FilePickerRejections,
  } = useDropzone(DropZoneConfig)
  // This hook is responsible for folder selector
  const {
    getInputProps: FolderPickerInputProps,
    fileRejections: FolderPickerRejections,
  } = useDropzone(DropZoneConfig)

  useEffect(() => {
    const fileRejections = [...FilePickerRejections, ...FolderPickerRejections]

    // Display notification for rejecting large and empty files.
    if (!isEmpty(fileRejections)) {
      const largeFiles = fileRejections.filter(
        // `file-too-large` is the error code returned by DropZone if file size > `MAX_FILE_SIZE`
        rej => rej.errors[0].code === 'file-too-large',
      )

      // `file-too-small` is the error code returned by DropZone if file size < 1, i.e., empty
      const emptyFiles = fileRejections.filter(
        rej => rej.errors[0].code === 'file-too-small',
      )
      // The notification won't be needed unless of case of trying to upload files
      // greater than the `MAX_FILE_SIZE` or empty, so defer importing it until needed
      import('react-hot-toast').then(toast => {
        emptyFiles.forEach(rej => {
          toast.default.error(`"${rej.file.name}" is empty!`)
        })

        largeFiles.forEach(rej => {
          toast.default.error(
            `"${rej.file.name}" is too large! The maximum file size is ${maxFileSize}`,
          )
        })
      })
    }
  }, [FilePickerRejections, FolderPickerRejections])

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
          {...FolderPickerInputProps()}
          type="file"
          id="folder-picker"
          style={{ display: 'none' }}
          directory=""
          webkitdirectory=""
          mozdirectory=""
          msdirectory=""
          odirectory=""
          multiple
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
