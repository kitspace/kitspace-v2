import React from 'react'
import { Container } from 'semantic-ui-react'

const Readme = ({ renderedReadme }) => {
  return (
    <Container
      style={{
        margin: '2rem 0',
        padding: '0.8rem',
        borderRadius: '5px',
        border: '1px solid #eeeeee',
      }}
      dangerouslySetInnerHTML={{ __html: renderedReadme }}
    />
  )
}

export default Readme
