import React, { useEffect, useCallback, useMemo } from 'react'
import { object, func, bool } from 'prop-types'
import dynamic from 'next/dynamic'
import getConfig from 'next/config'

// `FileWithPath is used in the `fileCustomValidator` function typing.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { useDropzone, ErrorCode, FileWithPath } from 'react-dropzone'
import { fromEvent } from 'file-selector'
import { Button } from 'semantic-ui-react'

import { MBytesToBytes } from '@utils/index'

const { MAX_FILE_SIZE } = getConfig().publicRuntimeConfig

/*
 * The notification won't be needed util a file is rejected, so defer importing it until needed,
 * this make next dynamically import the `Toaster` component only from this module.
 */
const Toaster = dynamic(() => import('react-hot-toast').then(mod => mod.Toaster))

// Outside of the component to prevent unnecessary rerendering.
const baseStyle = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  padding: '20px',
  borderWidth: 2,
  borderRadius: 2,
  borderColor: '#eeeeee',
  borderStyle: 'dashed',
  backgroundColor: '#fafafa',
  color: '#bdbdbd',
  outline: 'none',
  transition: 'border .24s ease-in-out',
}

// Outside of the component to prevent unnecessary rerendering.
const activeStyle = {
  borderColor: '#0c9bef',
}

/**
 * Custom validator to reject the `.git` folder.
 * @param {FileWithPath} file
 * @returns {FileError|null}
 */
const fileCustomValidator = file => {
  const isFileUnderGitDir =
    file?.path.includes('/.git/') || file?.webkitRelativePath.includes('/.git/')

  if (isFileUnderGitDir) {
    return {
      // The validator must return an error to mark a file as rejected,
      // even if the error won't be shown to the user.
      code: ErrorCode.FileInvalidType,
      message: "Uploading git folder isn't supported",
    }
  }
  return null
}

const DropZone = ({ onDrop, overrideStyle, allowFolders, allowFiles }) => {
  const _onDrop = useCallback(onDrop, [onDrop])

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
    maxSize: MBytesToBytes(MAX_FILE_SIZE),
    minSize: 1,
    maxFiles,
    validator: fileCustomValidator,
  }

  // This is the only way to support Drag'nDrop, file selector and Folder selector at the same time
  // This hook is responsible for Drag'nDrop and file selector
  const {
    getRootProps,
    getInputProps,
    open,
    fileRejections: FilePickerRejections,
    isDragActive,
  } = useDropzone(DropZoneConfig)
  // This hook is responsible for folder selector
  const {
    getInputProps: FolderPickerInputProps,
    fileRejections: FolderPickerRejections,
  } = useDropzone(DropZoneConfig)

  const style = useMemo(
    () => ({
      ...baseStyle,
      ...overrideStyle,
      ...(isDragActive ? activeStyle : {}),
    }),
    [overrideStyle, isDragActive],
  )

  useEffect(() => {
    if (FilePickerRejections.length === 0 && FolderPickerRejections.length === 0) {
      // If there's no rejections do nothing 🤷‍♂️
      return
    }
    // Otherwise displays toasts with errors.

    const fileRejections = [...FilePickerRejections, ...FolderPickerRejections]

    const largeFiles = fileRejections.filter(
      // if file size > `MAX_FILE_SIZE`
      rej => rej.errors[0].code === ErrorCode.FileTooLarge,
    )

    const emptyFiles = fileRejections.filter(
      // if file size < 1, i.e., empty
      rej => rej.errors[0].code === ErrorCode.FileTooSmall,
    )

    const tooManyFiles = fileRejections.filter(
      rej => rej.errors[0].code === ErrorCode.TooManyFiles,
    )

    // The notification won't be needed unless of case of trying to upload files
    // greater than the `MAX_FILE_SIZE` or empty, so defer importing it until needed
    import('react-hot-toast').then(toast => {
      emptyFiles.forEach(rej => {
        toast.default.error(`"${rej.file.name}" is empty!`)
      })

      largeFiles.forEach(rej => {
        toast.default.error(
          `"${rej.file.name}" is too large! The maximum file size is ${MAX_FILE_SIZE}`,
        )
      })

      if (tooManyFiles.length !== 0) {
        toast.default.error(`Only ${DropZoneConfig.maxFiles} file allowed!`)
      }
    })
  }, [FilePickerRejections, FolderPickerRejections, DropZoneConfig.maxFiles])

  return (
    <div data-cy="dropzone" {...getRootProps({ style })}>
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
            icon="file"
            onClick={open}
          />
        )}
        {allowFolders && (
          <>
            <Button
              basic
              as="label"
              content="Select a folder"
              htmlFor="folder-picker"
              icon="folder"
              type="button"
            />
            <input
              {...FolderPickerInputProps()}
              multiple
              directory=""
              id="folder-picker"
              mozdirectory=""
              msdirectory=""
              odirectory=""
              style={{ display: 'none' }}
              type="file"
              webkitdirectory=""
            />
          </>
        )}
      </div>
    </div>
  )
}

DropZone.propTypes = {
  onDrop: func.isRequired,
  overrideStyle: object,
  allowFolders: bool,
  allowFiles: bool,
}

DropZone.defaultProps = {
  overrideStyle: {},
  allowFolders: true,
  allowFiles: true,
}

export default DropZone
