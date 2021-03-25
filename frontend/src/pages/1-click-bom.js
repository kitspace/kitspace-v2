import React from 'react'
import Link from 'next/link'

import { Page } from '@components/Page'

const OneClickBom = () => {
  return (
    <Page>
      <p style={{ textAlign: 'center', minHeight: 86 }}>
        <a href="https://chrome.google.com/webstore/detail/1clickbom/mflpmlediakefinapghmabapjeippfdi">
          <img src="https://raw.githubusercontent.com/kitspace/1clickBOM/master/readme_images/chrome.png" />
        </a>
        <a href="https://addons.mozilla.org/firefox/downloads/latest/634060/addon-634060-latest.xpi">
          <img src="https://raw.githubusercontent.com/kitspace/1clickBOM/master/readme_images/firefox.png" />
        </a>
      </p>
      <p>
        1-click BOM is a browser extension that fills your shopping carts for you on
        sites like Digikey and Mouser. It lets you simply click on the "buy parts"
        links on Kitspace to get the right parts. You can also use it directly with
        your own spreadsheets or with our{' '}
        <Link href="/bom-builder">
          <a>BOM Builder</a>
        </Link>{' '}
        tool.
      </p>
      <p>
        <a href="https://github.com/kitspace/1clickBOM#readme">
          Read further documentation on GitHub
        </a>
      </p>
      <p style={{ textAlign: 'center', marginTop: 10, minHeight: 454 }}>
        <img src="https://raw.githubusercontent.com/kitspace/1clickBOM/master/readme_images/demo.gif" />
      </p>
    </Page>
  )
}

export default OneClickBom
