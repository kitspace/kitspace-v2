import React, { useEffect, useState } from 'react'
import { promises as fs } from 'fs'
import path from 'path'
import NextHead from 'next/head'
import Script from 'next/script'
import { string } from 'prop-types'
import { Loader } from 'semantic-ui-react'

import Page from '@components/Page'

export const getServerSideProps = async ({ params }) => {
  const IBOMHtml = await fs.readFile(
    path.join(process.cwd(), 'public/static/IBOM/index.html'),
    'utf-8',
  )

  const processorUrl = process.env.KITSPACE_PROCESSOR_URL
  const repoFullname = `${params.username}/${params.projectName}`
  const interactiveBOMStatus = await fetch(
    `${processorUrl}/status/${repoFullname}/HEAD/${params.multiProjectName}/interactive_bom.json`,
  ).then(r => r.json().then(body => body.status))

  if (interactiveBOMStatus === 'done') {
    const pcbData = await fetch(
      `${processorUrl}/files/${repoFullname}/HEAD/${params.multiProjectName}/interactive_bom.json`,
    ).then(res => res.blob().then(b => b.text()))

    return {
      props: { repoFullname, html: IBOMHtml, pcbData },
    }
  }
  return {
    notFound: true,
  }
}

const IBOM = ({ repoFullname, html, pcbData }) => {
  const [ready, setReady] = useState(false)
  const title = `${repoFullname} Kitspace Interactive Assembly Guide`

  /*
  i.   set the `pcbdata` var needed by IBOM
  ii.  initialize IBOM
  iii. make the title anchor tag linking to the project page.
  iv.  prefetch project page.
   */
  /* eslint-disable no-template-curly-in-string */
  const titleTemplate = '`<a href=/${pcbTitle}>${pcbTitle}</a>`'
  const hrefTemplate = '`/${pcbTitle}`'
  const initScript = `
  var pcbdata = ${pcbData};
  document.getElementById('IBOM_script').addEventListener('load', () => {
    window.onresize = resizeAll;
    initBOM();
    const pcbTitle = pcbdata.metadata.title;

    document.querySelector('#title').innerHTML = ${titleTemplate};
    const head = document.head;
    const link = document.createElement("link");
    link.rel = "prefetch";
    link.href = ${hrefTemplate};
  });
  `

  useEffect(() => {
    const config = {
      dark_mode: false,
      show_pads: true,
      show_fabrication: false,
      show_silkscreen: true,
      highlight_pin1: true,
      redraw_on_drag: true,
      board_rotation: 0,
      checkboxes: 'Sourced,Placed',
      bom_view: 'left-right',
      layer_view: 'FB',
      extra_fields: [],
    }

    window.config = config
  }, [])

  return (
    <Page title={title} contentFullSize>
      <Script
        src="/static/IBOM/index.js"
        id="IBOM_script"
        onLoad={() => {
          setReady(true)
          return
        }}
      />
      <Script>{initScript}</Script>
      <NextHead>
        {/* Styles for IBOM targets uses non pure selectors, e.g., `:root`, importing its style as
         * a  module doesn't work. The other option was to add the style to `_app.scss`
         * which will load on visiting any page.
         */}
        {/* eslint-disable-next-line @next/next/no-css-tags */}
        <link rel="stylesheet" href="/static/IBOM/index.css" />
      </NextHead>
      {ready ? (
        <div
          className="ibom"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: html }}
        />
      ) : (
        <Loader active>Loading IBOM</Loader>
      )}
    </Page>
  )
}

IBOM.propTypes = {
  repoFullname: string.isRequired,
  html: string.isRequired,
  pcbData: string.isRequired,
}

export default IBOM
