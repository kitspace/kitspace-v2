import React, { useState, useContext } from 'react'
import { bool, func, number } from 'prop-types'
import { Loader, Progress } from 'semantic-ui-react'

import { useRouter } from 'next/router'

import { AuthContext } from '@contexts/AuthContext'
import { commitInitialFiles } from '@utils/giteaInternalApi'
import { createRepo } from '@utils/giteaApi'
import { slugifiedNameFromFiles } from '@utils/index'
import DropZone from '@components/DropZone'
import { UploadOp, NoOp } from '../Ops'
import { UploadConflictModal } from '../ConflictModals'
import styles from './index.module.scss'

const Upload = ({ setUserOp }) => {
  const { push } = useRouter()
  const { user, csrf, apiToken } = useContext(AuthContext)

  const [conflictModalOpen, setConflictModalOpen] = useState(false)
  const [droppedFiles, setDroppedFiles] = useState([])
  const [projectName, setProjectName] = useState('')
  const [originalProjectName, setOriginalProjectName] = useState('')
  const [isNewProject, setIsNewProject] = useState(true)
  const [progress, setProgress] = useState(0)

  const onDrop = async droppedFiles => {
    setUserOp(UploadOp)

    const tempProjectName = slugifiedNameFromFiles(droppedFiles)
    const repo = await createRepo(tempProjectName, '', apiToken)

    setProjectName(tempProjectName)
    setOriginalProjectName(tempProjectName)
    setDroppedFiles(droppedFiles)

    if (repo === '') {
      // In the case of failing to create the repo, i.e., it already exits.
      setConflictModalOpen(true)
      console.error('Project already exists!')
    } else {
      // Commit files to gitea server on drop
      const didUploadSuccessfully = await commitInitialFiles({
        files: droppedFiles,
        repo: `${user.username}/${tempProjectName}`,
        csrf,
        onProgress: setProgress,
      })

      if (didUploadSuccessfully) {
        await push(`/${user.username}/${tempProjectName}`)
      } else {
        console.error('Failed to upload files')
      }
    }
  }

  const onDifferentName = async projectName => {
    setProjectName(projectName)
    await createRepo(projectName, '', apiToken)

    // Close the conflict modal to show uploading progress.
    setConflictModalOpen(false)

    await commitInitialFiles({
      files: droppedFiles,
      repo: `${user.username}/${projectName}`,
      csrf,
      onProgress: setProgress,
    })
    await push(`/${user.username}/${projectName}`)
  }

  const onUpdateToExisting = async () => {
    setIsNewProject(false)
    // Close the conflict modal to show uploading progress.
    setConflictModalOpen(false)

    await commitInitialFiles({
      files: droppedFiles,
      repo: `${user.username}/${projectName}`,
      csrf,
      onProgress: setProgress,
    })
    await push(`/${user.username}/${projectName}`)
  }

  return (
    <>
      <Uploader
        isNewProject={isNewProject}
        progressValue={progress}
        totalNumberOfFiles={droppedFiles.length}
        onDrop={onDrop}
      />
      <UploadConflictModal
        conflictModalOpen={conflictModalOpen}
        originalProjectName={originalProjectName}
        onClose={() => {
          setUserOp(NoOp)
          // Close the modal
          setConflictModalOpen(false)
          // reset the state as if the user didn't drop anything
          setDroppedFiles([])
        }}
        onDifferentName={onDifferentName}
        onOverwrite={onUpdateToExisting}
      />
    </>
  )
}

const Uploader = ({ isNewProject, onDrop, totalNumberOfFiles, progressValue }) => {
  const didDropFiles = totalNumberOfFiles !== 0
  const didStartUploading = didDropFiles && progressValue > 0
  const didFinishUploading = didDropFiles && progressValue === totalNumberOfFiles

  if (didStartUploading) {
    return (
      <Progress
        active={!didFinishUploading}
        className={styles.progressBar}
        color={didFinishUploading ? 'green' : 'blue'}
        label={
          totalNumberOfFiles === progressValue
            ? 'Initializing the project...'
            : 'Uploading files...'
        }
        progress="ratio"
        total={totalNumberOfFiles}
        value={progressValue}
      />
    )
  } else if (didDropFiles && isNewProject) {
    return (
      <Loader active data-cy="creating-project-loader">
        Creating Project...
      </Loader>
    )
  }

  return (
    <DropZone overrideStyle={{ maxWidth: '70%', margin: 'auto' }} onDrop={onDrop} />
  )
}

Upload.propTypes = {
  setUserOp: func.isRequired,
}

Uploader.propTypes = {
  isNewProject: bool.isRequired,
  onDrop: func.isRequired,
  totalNumberOfFiles: number.isRequired,
  progressValue: number.isRequired,
}

export default Upload
