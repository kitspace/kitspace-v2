import React from 'react'
import { string } from 'prop-types'

const Readme = ({ renderedReadme }) => (
  <div data-cy="readme" id="readme">
    <div
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: renderedReadme }}
    />
  </div>
)

Readme.propTypes = {
  renderedReadme: string.isRequired,
}

export default Readme
