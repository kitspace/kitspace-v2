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
  hasIBOM,
  kitspaceYAML,
  bomInfo,
  zipUrl,
  readme,
  boardSpecs,
  description,
  projectName,
  projectFullname,
  originalUrl,
  gerberInfoExists,
  bomInfoExists,
  readmeExists,
  boardShowcaseAssetsExist,
}) => {
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
          <AssetPlaceholder asset="board" />
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
          <AssetPlaceholder asset="gerber files" />
        )}
        {bomInfoExists ? (
          <BuyParts
            lines={bomInfo?.bom?.lines}
            parts={bomInfo?.bom?.parts}
            projectFullName={projectFullname}
          />
        ) : (
          <AssetPlaceholder asset="bill of materials" />
        )}
      </div>
      <div>
        {readmeExists ? (
          <Readme renderedReadme={readme} />
        ) : (
          <AssetPlaceholder asset="README" />
        )}
      </div>
    </>
  )
}

const AssetPlaceholder = ({ asset }) => {
  let message = `No ${asset} files were found`

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
        borderColor: '#eee',
        color: '#aaa',
      }}
    >
      {message}.
    </div>
  )
}

AssetPlaceholder.propTypes = {
  asset: string.isRequired,
}

PageElements.propTypes = {
  assetPath: string.isRequired,
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
