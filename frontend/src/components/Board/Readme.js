import React from 'react'

import UploadModal from '@components/UploadModal'

const Readme = ({ renderedReadme }) => {
  return (
    <div>
      <div
        style={{
          padding: '0.5rem 0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
        }}
      >
        <UploadModal activeTab={2} />
      </div>
      <div
        style={{ padding: '2rem 0' }}
        dangerouslySetInnerHTML={{ __html: renderedReadme }}
      />
    </div>
  )
}

export default Readme
