import React from 'react'
import { bool, objectOf, string, number, shape, object } from 'prop-types'

import BoardExtraMenus from '@components/Board/BoardExtrasMenu'
import BoardShowcase from '@components/Board/BoardShowcase'
import BuyParts from '@components/Board/BuyParts/index'
import InfoBar from '@components/Board/InfoBar'
import OrderPCBs from '@components/Board/OrderPCBs'
import Readme from '@components/Board/Readme'

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
  previewOnly,
  description,
  projectName,
  projectFullname,
  originalUrl,
  gerberInfoExists,
  bomInfoExists,
  readmeExists,
  boardShowcaseAssetsExist,
}) => {
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
        {boardShowcaseAssetsExist ? (
          <>
            <BoardShowcase assetPath={assetPath} />
            <BoardExtraMenus
              hasInteractiveBom={hasIBOM}
              interactiveBomPath={projectName === '_' ? '_/IBOM' : 'IBOM'}
              zipUrl={zipUrl}
            />
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
  previewOnly: bool.isRequired,
  description: string.isRequired,
  projectName: string.isRequired,
  repoName: string.isRequired,
  projectFullname: string.isRequired,
  originalUrl: string.isRequired,
  gerberInfoExists: bool.isRequired,
  bomInfoExists: bool.isRequired,
  boardShowcaseAssetsExist: bool.isRequired,
  readmeExists: bool.isRequired,
}

export default PageElements
