import React, { useEffect, useState, useContext } from 'react'
import { bool, objectOf, string, number, shape, object } from 'prop-types'
import { useRouter } from 'next/router'
import uniqBy from 'lodash/uniqBy'
import { Button, Form, Input, Loader, Segment, TextArea } from 'semantic-ui-react'

import useForm from '@hooks/useForm'
import ProjectUpdateFormModel from '@models/ProjectUpdateForm'
import { useDefaultBranchFiles } from '@hooks/Gitea'
import { commitFiles } from '@utils/giteaInternalApi'
import { repoExists, updateRepo } from '@utils/giteaApi'
import { AuthContext } from '@contexts/AuthContext'
import BoardShowcase from '@components/Board/BoardShowcase'
import BoardExtraMenus from '@components/Board/BoardExtrasMenu'
import OrderPCBs from '@components/Board/OrderPCBs'
import BuyParts from '@components/Board/BuyParts/index'
import InfoBar from '@components/Board/InfoBar'
import Readme from '@components/Board/Readme'
import UploadModal from '@components/UploadModal'

const PageElements = ({
  assetPath,
  repoName,
  hasUploadPermission,
  hasIBOM,
  kitspaceYAML,
  bomInfo,
  zipUrl,
  readme,
  boardSpecs,
  isNew,
  previewOnly,
  owner,
  description,
  projectName,
  projectFullname,
  originalUrl,
  gerberInfoExists,
  bomInfoExists,
  readmeExists,
  kitspaceYAMLExists,
  boardShowcaseAssetsExist,
}) => {
  // The files in the Gitea repo associated with this project and the newly loaded files
  const {
    files: remoteFiles,
    isLoading,
    mutate,
  } = useDefaultBranchFiles(projectFullname)
  // Details (name, path, last_modified, etc...) for files dropped in the update page
  const [newlyUploadedDetails, setNewlyUploadedDetails] = useState([])
  const [allFiles, setAllFiles] = useState([])
  const [isValidProjectName, setIsValidProjectName] = useState(false)
  const [loading, setLoading] = useState(false)
  const { push } = useRouter()
  const { csrf, apiToken } = useContext(AuthContext)
  const { form, onChange, populate, isValid, formatErrorPrompt } = useForm(
    ProjectUpdateFormModel,
  )
  const canUpload = hasUploadPermission && !previewOnly

  const submit = async e => {
    e.preventDefault()
    setLoading(true)

    const updatedSuccessfully = await updateRepo(
      projectFullname,
      { name: form.name, description: form.description },
      apiToken,
    )

    // If the user changed the project name redirect to the new project page
    if (updatedSuccessfully) {
      if (projectName !== `${owner}/${form.name}`) {
        await push(`/${owner}/${form.name}`)
      }
      setLoading(false)
    }
  }

  const onDrop = async files => {
    setNewlyUploadedDetails(files)

    const committedSuccessfully = await commitFiles({
      repo: projectFullname,
      files,
      csrf,
    })
    if (committedSuccessfully) {
      // After uploading the files successfully, revalidate the files from gitea, and clear `newlyUploadedDetails`
      mutate().then(mutatedFiles => {
        setNewlyUploadedDetails([])
        setAllFiles(mutatedFiles)
      })
    }
  }

  const formatProjectNameError = () => {
    // disjoint form validation errors, e.g, maximum length, not empty, etc, with conflicting project name errors
    const formErrors = formatErrorPrompt('name')

    if (formErrors) {
      return formErrors
    }
    return !isValidProjectName
      ? {
          content: `A project named "${form.name}" already exists!`,
          pointing: 'below',
        }
      : null
  }

  // Set values of the form as the values of the project stored in the Gitea repo
  useEffect(() => {
    populate({ name: projectName, description })
  }, [projectName, description, populate])

  // A disjoint between the newly uploaded files (waiting for submission) and the files
  // on the Gitea repo for this project
  useEffect(() => {
    setAllFiles(uniqBy([...remoteFiles, ...newlyUploadedDetails], 'name'))
  }, [remoteFiles, newlyUploadedDetails])

  useEffect(() => {
    const validateProjectName = async () => {
      // Check if the new name will cause a conflict.
      const repoFullname = `${owner}/${form.name}`

      // If the project name hasn't changed it's valid
      if (repoFullname === `${owner}/${projectName}`) {
        setIsValidProjectName(isValid)
      } else if (!(await repoExists(repoFullname))) {
        // Otherwise check if there's no repo with same name
        setIsValidProjectName(isValid)
      } else {
        setIsValidProjectName(false)
      }
    }

    if (form.name) {
      validateProjectName()
    }
  }, [form.name, isValid, projectName, owner])

  if (isLoading) {
    return <Loader active />
  }

  const AssetPlaceholderWithUploadPermissions = ({ asset }) => (
    <AssetPlaceholder
      asset={asset}
      hasUploadPermission={hasUploadPermission}
      previewOnly={previewOnly}
    />
  )

  AssetPlaceholderWithUploadPermissions.propTypes = {
    asset: string.isRequired,
  }

  return (
    <>
      <InfoBar
        description={description}
        name={projectName === '_' ? repoName : projectName}
        originalUrl={originalUrl}
        site={kitspaceYAML?.site}
      />
      <div>
        {canUpload && (
          <UploadModal
            files={allFiles}
            kitspaceYAML={kitspaceYAML}
            kitspaceYAMLExists={kitspaceYAMLExists}
            projectFullname={projectFullname}
            onDrop={onDrop}
          />
        )}
        {boardShowcaseAssetsExist ? (
          <>
            <BoardShowcase assetPath={assetPath} />
            <BoardExtraMenus hasInteractiveBom={hasIBOM} zipUrl={zipUrl} />
          </>
        ) : (
          <AssetPlaceholderWithUploadPermissions asset="board" />
        )}
      </div>
      <div>
        {gerberInfoExists ? (
          <OrderPCBs
            boardSpecs={boardSpecs}
            projectFullname={projectFullname}
            zipUrl={zipUrl}
          />
        ) : (
          <AssetPlaceholderWithUploadPermissions asset="gerber files" />
        )}
        {bomInfoExists ? (
          <BuyParts
            lines={bomInfo?.bom?.lines}
            parts={bomInfo?.bom?.parts}
            projectFullName={projectFullname}
          />
        ) : (
          <AssetPlaceholderWithUploadPermissions asset="bill of materials" />
        )}
      </div>
      <div>
        {readmeExists ? (
          <Readme renderedReadme={readme} />
        ) : (
          <AssetPlaceholderWithUploadPermissions asset="README" />
        )}
      </div>
      {canUpload && (
        <Form>
          <Segment>
            <Form.Field
              fluid
              required
              control={Input}
              data-cy="update-form-name"
              error={formatProjectNameError('name')}
              label="Project name"
              name="name"
              placeholder="Project name"
              readOnly={previewOnly}
              value={form.name || ''}
              onChange={onChange}
            />
            <Form.Field
              control={TextArea}
              data-cy="update-form-description"
              error={formatErrorPrompt('description')}
              label="Project description"
              name="description"
              placeholder="Project description"
              readOnly={previewOnly}
              value={form.description || ''}
              onChange={onChange}
            />
            <Form.Field
              fluid
              positive
              content={isNew ? 'Create' : 'Update'}
              control={Button}
              data-cy="update-form-submit"
              disabled={previewOnly || !isValidProjectName || loading}
              loading={loading}
              onClick={submit}
            />
          </Segment>
        </Form>
      )}
    </>
  )
}

const AssetPlaceholder = ({ asset, hasUploadPermission, previewOnly }) => {
  let message = `No ${asset} files were found`

  if (hasUploadPermission && previewOnly) {
    message += ', commit files to the original repo and it will be synced'
  } else if (hasUploadPermission && !previewOnly) {
    message += ', upload some'
  }

  return (
    <div
      style={{
        width: '70%',
        margin: 'auto',
        marginBottom: '2rem',
        marginTop: '2rem',
        textAlign: 'center',
        padding: '4em',
        borderStyle: 'dashed',
        borderRadius: '0.8em',
      }}
    >
      {message}.
    </div>
  )
}

AssetPlaceholder.propTypes = {
  asset: string.isRequired,
  hasUploadPermission: bool.isRequired,
  previewOnly: bool.isRequired,
}

PageElements.propTypes = {
  assetPath: string.isRequired,
  hasUploadPermission: bool.isRequired,
  hasIBOM: bool.isRequired,
  kitspaceYAML: shape({
    summary: string,
    site: string,
    color: string,
    bom: string,
    gerbers: string,
    eda: shape({ type: string, pcb: string }),
    readme: string,
  }).isRequired,
  bomInfo: object.isRequired,
  zipUrl: string.isRequired,
  readme: string.isRequired,
  boardSpecs: objectOf(number).isRequired,
  isNew: bool.isRequired,
  previewOnly: bool.isRequired,
  owner: string.isRequired,
  description: string.isRequired,
  projectName: string.isRequired,
  repoName: string.isRequired,
  projectFullname: string.isRequired,
  originalUrl: string.isRequired,
  gerberInfoExists: bool.isRequired,
  bomInfoExists: bool.isRequired,
  boardShowcaseAssetsExist: bool.isRequired,
  readmeExists: bool.isRequired,
  kitspaceYAMLExists: bool.isRequired,
}

export default PageElements
