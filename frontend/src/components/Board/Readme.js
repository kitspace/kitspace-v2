import React from 'react'
import { string } from 'prop-types'
import _JSXStyle from 'styled-jsx/style'

const Readme = ({ renderedReadme }) => (
  <div data-cy="readme" id="readme">
    <div
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: renderedReadme }}
    />
    <style jsx global>{`
      #readme {
        margin: 2rem 0;
        padding: 0.8rem;
        border-radius: 5px;
        border: 1px solid #eeeeee;
      }
      #readme > div {
        max-width: 1000px;
      }
      #readme img {
        max-width: 100%;
      }

      #readme pre {
        overflow-x: auto;
      }

      #readme code,
      #readme .highlight {
        padding: 0.2em 0.4em 0.2em 0.4em;
        margin: 0;
        font-size: 85%;
        background-color: rgba(0, 0, 0, 0.04);
        border-radius: 3px;
      }

      #readme input[type='checkbox'] {
        margin-right: 5px;
      }
    `}</style>
  </div>
)

Readme.propTypes = {
  renderedReadme: string.isRequired,
}

export default Readme
