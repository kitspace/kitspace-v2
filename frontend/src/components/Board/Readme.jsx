import React from 'react'
import { string } from 'prop-types'
import _JSXStyle from 'styled-jsx/style'

const Readme = ({ renderedReadme }) => (
  <div data-cy="readme" id="readme">
    <div
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: renderedReadme }}
    />
    <style global jsx>{`
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

      #readme table {
        border-collapse: collapse;
        border-spacing: 0;
        display: block;
        max-width: 100%;
        overflow: auto;
        width: 100%;
        width: max-content;
      }

      #readme table tr {
        background-color: #ffffff;
        border-top: 1px solid hsla(210, 18%, 91%, 1);
      }

      #readme table th,
      #readme table td {
        padding: 6px 13px;
        border: 1px solid #d0d7de;
      }

      #readme table tr:nth-child(2n) {
        background-color: #f6f8fa;
      }
    `}</style>
  </div>
)

Readme.propTypes = {
  renderedReadme: string.isRequired,
}

export default Readme
