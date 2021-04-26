// TODO: this page became monolithic, it needs global refactoring.
import React, { useEffect, useState, useContext } from 'react'
import { useRouter } from 'next/router'
import _ from 'lodash'
import {
  Button,
  Form,
  Header,
  Input,
  Loader,
  Message,
  Segment,
  TextArea,
} from 'semantic-ui-react'

import { Page } from '@components/Page'
import useForm from '@hooks/useForm'
import { ProjectUpdateFormModel } from '@models/ProjectUpdateForm'
import { pollMigrationStatus, useDefaultBranchFiles, useRepo } from '@hooks/Gitea'
import {
  commitFilesWithUUIDs,
  uploadFilesToGiteaServer,
} from '@utils/giteaInternalApi'
import {
  getDefaultBranchFiles,
  getRepo,
  repoExists,
  updateRepo,
} from '@utils/giteaApi'
import { findReadme, renderReadme } from '@utils/index'
import { getBoardInfo, getBoardZipInfo } from '@utils/projectPage'
import { AuthContext } from '@contexts/AuthContext'
import ErrorPage from '@pages/_error'
import BoardShowcase from '@components/Board/BoardShowcase'
import BoardExtraMenus from '@components/Board/BoardExtrasMenu'
import OrderPCBs from '@components/Board/OrderPCBs'
import BuyParts from '@components/Board/BuyParts/index'
import InfoBar from '@components/Board/InfoBar'
import Readme from '@components/Board/Readme'
import UploadModal from '@components/UploadModal'

export const getServerSideProps = async ({ params, query, req }) => {
  const processorUrl = process.env.KITSPACE_PROCESSOR_URL
  const repoFullname = `${params.username}/${params.projectName}`
  const assetsPath = `${processorUrl}/files/${repoFullname}/HEAD`

  // Only the repo owner can upload files.
  const hasUploadPermission = params.username === req?.session?.user?.username

  if (await repoExists(repoFullname)) {
    const repo = await getRepo(repoFullname)
    const repoFiles = await getDefaultBranchFiles(repoFullname)

    // TODO: ALL assets aren't available for the repos the are being processed,
    // or the repos that don't have assets from first place.
    // This should be handled properly currently, it breaks the page.
    const [zipInfoExists, zipInfo] = await getBoardZipInfo(assetsPath)
    const [boardInfoExists, boardInfo] = await getBoardInfo(assetsPath)

    const { zipPath, width, height, layers } = zipInfo
    const zipUrl = `${assetsPath}/${zipPath}`

    const readmeFile = findReadme(repoFiles)
    const renderedReadme = await renderReadme(repoFullname, readmeFile)

    console.log(readmeFile)
    return {
      props: {
        repo,
        hasUploadPermission,
        repoFiles,
        // TODO:  figure out what `info.has_interactive_bom` stands for.
        hasInteractiveBom: true,
        zipUrl,
        boardInfo,
        boardSpecs: { width, height, layers },
        renderedReadme,
        isSynced: repo?.mirror,
        // Whether the project were empty or not at the time of requesting the this page from the server.
        isEmpty: repo?.empty,
        user: params.username,
        projectName: params.projectName,
        isNew: query.create === 'true',
        boardAssetsExist: zipInfoExists && boardInfoExists,
        readmeExists: readmeFile !== '',
      },
    }
  } else {
    return { notFound: true }
  }
}

const UpdateProject = ({
  repo,
  repoFiles,
  hasUploadPermission,
  hasInteractiveBom,
  zipUrl,
  boardInfo,
  boardSpecs,
  renderedReadme,
  isSynced,
  isEmpty,
  user,
  projectName,
  isNew,
  boardAssetsExist,
  readmeExists,
}) => {
  const fullName = `${user}/${projectName}`
  const { reload } = useRouter()

  const { repo: project, isLoading, isError } = useRepo(fullName, {
    initialData: repo,
  })
  // If the repo is migrating, poll for update every second, otherwise use default config.

  const { status } = pollMigrationStatus(repo.id, {
    refreshInterval: isEmpty ? 1000 : null,
  })
  const [isSyncing, setIsSyncing] = useState(isEmpty)

  useEffect(() => {
    setIsSyncing(status === 'Queue' || status === 'Running')

    if (isEmpty && !isSynced && status === 'Finished') {
      reload()
    }
  }, [status])

  useEffect(() => {
    console.log({ project})
  }, [])

  if (isLoading) {
    return (
      <Page>
        <Loader active />
      </Page>
    )
  } else if (isSyncing) {
    return (
      <Page>
        <Loader active>Syncing repository...</Loader>
      </Page>
    )
  } else if (status === 'Failed') {
    return (
      <Page>
        <Loader active>Migration Failed, please try again later!</Loader>
      </Page>
    )
  } else if (isError) {
    return <ErrorPage statusCode={404} />
  }

  return (
    <Page>
      {isSynced && hasUploadPermission ? (
        <Message data-cy="sync-msg" color="yellow">
          <Message.Header>A synced repository!</Message.Header>
          <Message.Content>
            <p>Files uploading isn't supported for synced repositories.</p>
            Please commit files to the original git repository and it will be synced
            automatically.
          </Message.Content>
        </Message>
      ) : null}
      <UpdateForm
        repoFiles={repoFiles}
        hasUploadPermission={hasUploadPermission}
        hasInteractiveBom={hasInteractiveBom}
        zipUrl={zipUrl}
        boardInfo={boardInfo}
        boardSpecs={boardSpecs}
        renderedReadme={renderedReadme}
        isNew={isNew}
        previewOnly={isSynced}
        owner={user}
        name={projectName}
        description={project?.description}
        url={project.original_url}
        boardAssetsExist={boardAssetsExist}
        readmeExists={readmeExists}
      />
    </Page>
  )
}

const UpdateForm = ({
  repoFiles,
  hasUploadPermission,
  hasInteractiveBom,
  boardInfo,
  zipUrl,
  renderedReadme,
  boardSpecs,
  isNew,
  previewOnly,
  owner,
  name,
  description,
  url,
  boardAssetsExist,
  readmeExists,
}) => {
  const projectFullname = `${owner}/${name}`
  const canUpload = hasUploadPermission && !previewOnly
  // The files in the Gitea repo associated with this project and the newly loaded files
  const {
    files: remoteFiles,
    isLoading,
    mutate,
  } = useDefaultBranchFiles(projectFullname, { initialData: repoFiles })
  // UUIDs for files dropped in the update page, the files gets committed on submit
  const [newlyUploadedUUIDs, setNewlyUploadedUUIDs] = useState([])
  // Details(name, path, last_modified, etc...) for files dropped in the update page
  const [newlyUploadedDetails, setNewlyUploadedDetails] = useState([])
  const [allFiles, setAllFiles] = useState([])
  const [isValidProjectName, setIsValidProjectName] = useState(false)
  const [loading, setLoading] = useState(false)
  const { push } = useRouter()
  const { csrf } = useContext(AuthContext)
  const { form, onChange, populate, isValid, formatErrorPrompt } = useForm(
    ProjectUpdateFormModel,
  )

  // Set values of the form as the values of the project stored in the Gitea repo
  useEffect(() => {
    populate({ name, description }, true)
  }, [])

  // A disjoint between the newly uploaded files(waiting for submission) and the files
  // on the Gitea repo for this project
  useEffect(() => {
    setAllFiles(_.uniqBy([...remoteFiles, ...newlyUploadedDetails], 'name'))
  }, [remoteFiles, newlyUploadedUUIDs])

  useEffect(() => {
    if (form.name) {
      // noinspection JSIgnoredPromiseFromCall
      validateProjectName()
    }
  }, [form.name])

  const submit = async e => {
    /**
     * The update must be done in this order.
     *  i. Commit the files
     *  ii. update project details
     * If this order were reversed uploading new files and changing the project name wouldn't work;
     * The files would be committed to the old repo it won't be under the project with new name
     */
    e.preventDefault()
    setLoading(true)

    await commitFilesWithUUIDs({
      repo: projectFullname,
      filesUUIDs: newlyUploadedUUIDs,
      csrf,
    })
    await mutate()

    const updatedSuccessfully = await updateRepo(
      projectFullname,
      { name: form.name, description: form.description },
      csrf,
    )

    // If the user changed the project name redirect to the new project page
    if (updatedSuccessfully) {
      if (name !== `${owner}/${form.name}`) {
        await push(`/${owner}/${form.name}`)
      }
      setLoading(false)
    }
  }

  const onDrop = async files => {
    const filePaths = files.map(file => {
      let filePath = file.path
      if (!filePath) {
        console.warn(
          'File object in onDrop does not have a "path" property. Using "name" instead:',
          file.name,
        )
        filePath = file.name
      }
      // remove any leading "/"
      filePath = filePath.startsWith('/') ? filePath.substring(1) : filePath
      return filePath
    })
    // Upload files directly to gitea server on drop
    const UUIDs = await uploadFilesToGiteaServer(
      projectFullname,
      files,
      filePaths,
      csrf,
    )

    setNewlyUploadedDetails(files)
    setNewlyUploadedUUIDs([...newlyUploadedUUIDs, UUIDs])
  }

  const validateProjectName = async () => {
    // Check if the new name will cause a conflict.
    const repoFullname = `${owner}/${form.name}`

    // If the project name hasn't changed it's valid
    if (repoFullname === `${owner}/${name}`) {
      setIsValidProjectName(isValid)
    } else {
      // Otherwise check if there's no repo with same name
      if (!(await repoExists(repoFullname))) {
        setIsValidProjectName(isValid)
      } else {
        setIsValidProjectName(false)
      }
    }
  }

  const formatProjectNameError = () => {
    // disjoint form validation errors, e.g, maximum length, not empty, etc, with conflicting project name errors
    const formErrors = formatErrorPrompt('name')

    if (formErrors) {
      return formErrors
    } else {
      return !isValidProjectName
        ? {
            content: `A project named "${form.name}" already exists!`,
            pointing: 'below',
          }
        : null
    }
  }

  if (isLoading) return <Loader active />

  return (
    <>
      <InfoBar
        name={name}
        url={url}
        site={boardInfo?.site || ''}
        description={description}
      />
      <div>
        <UploadModal files={allFiles} activeTab="PCB" canUpload={canUpload} />
        {boardAssetsExist ? (
          <>
            <BoardShowcase projectFullname={projectFullname} />
            <BoardExtraMenus
              projectFullname={projectFullname}
              hasInteractiveBom={hasInteractiveBom}
              zipUrl={zipUrl}
            />
          </>
        ) : (
          <AssetPlaceholder asset="board" />
        )}
      </div>
      <div>
        <UploadModal files={allFiles} activeTab="BOM" canUpload={canUpload} />
        {boardAssetsExist ? (
          <>
            <OrderPCBs zipUrl={zipUrl} boardSpecs={boardSpecs} />
            <BuyParts
              project={'hard'}
              lines={boardInfo?.bom?.lines}
              parts={boardInfo?.bom?.parts}
            />
          </>
        ) : (
          <AssetPlaceholder asset="bill of materials" />
        )}
      </div>
      <div>
        <UploadModal files={allFiles} activeTab="README" canUpload={canUpload} />
        {readmeExists ? (
          <Readme renderedReadme={renderedReadme} />
        ) : (
          <AssetPlaceholder asset="readme" />
        )}
      </div>
      <Form>
        <Segment>
          <Form.Field
            data-cy="update-form-name"
            fluid
            required
            readOnly={previewOnly}
            control={Input}
            label="Project name"
            placeholder="Project name"
            name="name"
            value={form.name || ''}
            onChange={onChange}
            error={formatProjectNameError('name')}
          />
          <Form.Field
            data-cy="update-form-description"
            readOnly={previewOnly}
            control={TextArea}
            label="Project description"
            placeholder="Project description"
            name="description"
            value={form.description || ''}
            onChange={onChange}
            error={formatErrorPrompt('description')}
          />
          <Form.Field
            data-cy="update-form-submit"
            fluid
            control={Button}
            content={isNew ? 'Create' : 'Update'}
            disabled={previewOnly || !isValidProjectName || loading}
            onClick={submit}
            positive
            loading={loading}
          />
        </Segment>
      </Form>
    </>
  )
}

const AssetPlaceholder = ({ asset }) => {
  return (
    <div
      style={{
        width: '70%',
        margin: 'auto',
        textAlign: 'center',
        padding: '5em',
        borderStyle: 'dashed',
        borderRadius: '0.8em',
      }}
    >
      No {asset} files were found, upload some.
    </div>
  )
}

export default UpdateProject
