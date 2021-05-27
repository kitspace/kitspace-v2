import React from 'react'

const Readme = ({ renderedReadme }) => {
  return (
    <div
      style={{
        margin: '2rem 0',
        padding: '0.8rem',
        borderRadius: '5px',
        border: '1px solid #eeeeee',
      }}
    >
      <div
        style={{ maxWidth: '1000px' }}
        dangerouslySetInnerHTML={{ __html: renderedReadme }}
      />
    </div>
  )
}

export default Readme
