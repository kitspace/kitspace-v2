import React, { useEffect, useState, useContext } from 'react'
import { arrayOf, bool, objectOf, string, object, number, shape } from 'prop-types'
import { useRouter } from 'next/router'
import { uniqBy } from 'lodash'
import { Button, Form, Input, Loader, Segment, TextArea } from 'semantic-ui-react'

import useForm from '@hooks/useForm'
import ProjectUpdateFormModel from '@models/ProjectUpdateForm'
import { useDefaultBranchFiles } from '@hooks/Gitea'
import { commitFiles } from '@utils/giteaInternalApi'
import { canCommit, repoExists, updateRepo } from '@utils/giteaApi'
import { AuthContext } from '@contexts/AuthContext'
import BoardShowcase from '@components/Board/BoardShowcase'
import BoardExtraMenus from '@components/Board/BoardExtrasMenu'
import OrderPCBs from '@components/Board/OrderPCBs'
import BuyParts from '@components/Board/BuyParts/index'
import InfoBar from '@components/Board/InfoBar'
import Readme from '@components/Board/Readme'
import UploadModal from '@components/UploadModal'

const PageElements = ({
  assetsPath,
  repoFiles,
  hasUploadPermission,
  hasIBOM,
  kitspaceYAML,
  boardBomInfo,
  zipUrl,
  renderedReadme,
  boardSpecs,
  isNew,
  previewOnly,
  owner,
  description,
  projectName,
  projectFullname,
  url,
  boardAssetsExist,
  readmeExists,
  kitspaceYAMLExists,
}) => {
  // The files in the Gitea repo associated with this project and the newly loaded files
  const {
    files: remoteFiles,
    isLoading,
    mutate,
  } = useDefaultBranchFiles(projectFullname, { initialData: repoFiles })
  // Details (name, path, last_modified, etc...) for files dropped in the update page
  const [newlyUploadedDetails, setNewlyUploadedDetails] = useState([])
  const [allFiles, setAllFiles] = useState([])
  const [isValidProjectName, setIsValidProjectName] = useState(false)
  const [loading, setLoading] = useState(false)
  const { push } = useRouter()
  const { csrf, user } = useContext(AuthContext)
  const { form, onChange, populate, isValid, formatErrorPrompt } = useForm(
    ProjectUpdateFormModel,
  )
  const [canUpload, setCanUpload] = useState(hasUploadPermission && !previewOnly)

  const submit = async e => {
    e.preventDefault()
    setLoading(true)

    const updatedSuccessfully = await updateRepo(
      projectFullname,
      { name: form.name, description: form.description },
      csrf,
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

  useEffect(() => {
    // Handle client side rendering for uploading permissions,
    // `canUpload` previously relied on `hasUploadPermission` which is only provided in SSR mode.
    if (!hasUploadPermission) {
      canCommit(projectFullname, user?.username, csrf).then(res => {
        setCanUpload(res && !previewOnly)
      })
    }
  }, [user, projectFullname, hasUploadPermission, previewOnly, csrf])

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

  if (isLoading) return <Loader active />

  return (
    <>
      <InfoBar
        name={projectName}
        url={url}
        site={kitspaceYAML?.site}
        description={description}
      />
      <div>
        {canUpload && (
          <UploadModal
            kitspaceYAMLExists={kitspaceYAMLExists}
            files={allFiles}
            kitspaceYAML={kitspaceYAML}
            projectFullname={projectFullname}
            onDrop={onDrop}
          />
        )}
        {boardAssetsExist ? (
          <>
            <BoardShowcase assetsPath={assetsPath} />
            <BoardExtraMenus hasInteractiveBom={hasIBOM} zipUrl={zipUrl} />
          </>
        ) : (
          <AssetPlaceholder asset="board" />
        )}
      </div>
      <div>
        {boardAssetsExist ? (
          <>
            <OrderPCBs
              projectFullname={projectFullname}
              zipUrl={zipUrl}
              boardSpecs={boardSpecs}
            />
            <BuyParts
              projectFullName={projectFullname}
              lines={boardBomInfo?.bom?.lines}
              parts={boardBomInfo?.bom?.parts}
            />
          </>
        ) : (
          <AssetPlaceholder asset="bill of materials" />
        )}
      </div>
      <div>
        {readmeExists ? (
          <Readme renderedReadme={renderedReadme} />
        ) : (
          <AssetPlaceholder asset="readme" />
        )}
      </div>
      {canUpload && (
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
      )}
    </>
  )
}

const AssetPlaceholder = ({ asset }) => (
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

AssetPlaceholder.propTypes = {
  asset: string.isRequired,
}

PageElements.propTypes = {
  assetsPath: string.isRequired,
  repoFiles: arrayOf(object).isRequired,
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
  boardBomInfo: object.isRequired,
  zipUrl: string.isRequired,
  renderedReadme: string.isRequired,
  boardSpecs: objectOf(number).isRequired,
  isNew: bool.isRequired,
  previewOnly: bool.isRequired,
  owner: string.isRequired,
  description: string.isRequired,
  projectName: string.isRequired,
  projectFullname: string.isRequired,
  url: string.isRequired,
  boardAssetsExist: bool.isRequired,
  readmeExists: bool.isRequired,
  kitspaceYAMLExists: bool.isRequired,
}

export default PageElements
