import React, { useEffect, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { object, func, bool } from 'prop-types'
import { isEmpty } from 'lodash'

import { useDropzone } from 'react-dropzone'
import { fromEvent } from 'file-selector'
import { Button } from 'semantic-ui-react'

import { MBytesToBytes } from '@utils/index'

const maxFileSize = process.env.MAX_FILE_SIZE

// The notification won't be needed util a file is rejected, so defer importing it until needed,
// this make next dynamically import the `Toaster` component only from this module.
const Toaster = dynamic(() => import('react-hot-toast').then(mod => mod.Toaster))

const DropZone = ({ onDrop, style, allowFolders = true, allowFiles = true }) => {
  const _onDrop = useCallback(onDrop)

  /*
   * If folder upload isn't allowed:
   * - Accept only a single file, `0` is the default value and it means unlimited number of files,
   * see https://react-dropzone.js.org/#section-accepting-specific-number-of-files.
   *
   * - Make the content of file selection button indicate that it only accept a single file.
   */
  const maxFiles = !allowFolders ? 1 : 0
  const filesButtonContent = !allowFolders ? 'Select a file' : 'Select files'

  const dropZoneText = () => {
    if (!allowFiles) {
      return 'a folder'
    }
    if (!allowFolders) {
      return 'a file'
    }
    return 'files or a folder'
  }

  const DropZoneConfig = {
    onDropAccepted: _onDrop,
    noClick: true,
    getFilesFromEvent: fromEvent,
    maxSize: MBytesToBytes(maxFileSize),
    minSize: 1,
    maxFiles,
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

      const tooManyFiles = fileRejections.filter(
        rej => rej.errors[0].code === 'too-many-files',
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

        if (tooManyFiles.length !== 0) {
          toast.default.error(`Only ${DropZoneConfig.maxFiles} file allowed!`)
        }
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
        Drop {dropZoneText()}
        {' here, or'}
      </p>
      <div
        style={{
          display: 'grid',
          margin: 'auto',
          gap: '1rem',
          gridTemplateColumns: !(allowFolders && allowFiles) ? '1fr' : '1fr 1fr',
        }}
      >
        {allowFiles && (
          <Button
            basic
            as="button"
            content={filesButtonContent}
            onClick={open}
            icon="file"
          />
        )}
        {allowFolders && (
          <>
            <Button
              basic
              as="label"
              htmlFor="folder-picker"
              type="button"
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
          </>
        )}
      </div>
    </div>
  )
}

DropZone.propTypes = {
  onDrop: func.isRequired,
  style: object.isRequired,
  allowFolders: bool,
  allowFiles: bool,
}

DropZone.defaultProps = {
  allowFolders: true,
  allowFiles: true,
}

export default DropZone
