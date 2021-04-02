import React from 'react'

import UploadModal from '@components/UploadModal'

const Readme = ({ renderedReadme }) => {
  return (
    <div
      style={{ padding: '2rem 0' }}
      dangerouslySetInnerHTML={{ __html: renderedReadme }}
    />
  )
}

export default Readme
