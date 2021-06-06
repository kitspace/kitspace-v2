import React, { useEffect, useState } from 'react'
import { promises as fs } from 'fs'
import path from 'path'
import NextHead from 'next/head'

import { Page } from '@components/Page'
import { Loader } from 'semantic-ui-react'

export const getServerSideProps = async ({ params }) => {
  const IBOMHtml = await fs.readFile(
    path.join(process.cwd(), 'public/static/IBOM/index.html'),
    'utf-8',
  )

  const processorUrl = process.env.KITSPACE_PROCESSOR_URL
  const repoFullname = `${params.username}/${params.projectName}`
  const interactiveBOMStatus = await fetch(
    `${processorUrl}/status/${repoFullname}/HEAD/interactive_bom.json`,
  ).then(r => r.json().then(body => body.status))

  if (interactiveBOMStatus === 'done') {
    const pcbData = await fetch(
      `${processorUrl}/files/${repoFullname}/HEAD/interactive_bom.json`,
    ).then(res => res.blob().then(b => b.text()))

    return {
      props: { html: IBOMHtml, pcbData },
    }
  }
  return {
    notFound: true,
  }
}

const IBOM = ({ html, pcbData }) => {
  const [ready, setReady] = useState(false)
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

  /*
  i.   set the `pcbdata` var needed by IBOM
  ii.  initialize IBOM
  iii. make the title anchor tag linking to the project page.
  iv.  prefetch project page.
   */
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
    window.config = config
    setReady(true)
  }, [])

  if (ready) {
    return (
      <Page contentFullSize>
        <NextHead>
          <script
            type="text/javascript"
            src="/static/IBOM/index.js"
            id="IBOM_script"
          />
          <script type="text/javascript">{initScript}</script>
          <link rel="stylesheet" href="/static/IBOM/index.css" />
        </NextHead>
        <div
          className="ibom"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </Page>
    )
  }
  return (
    <Page>
      <Loader active>Loading IBOM</Loader>
    </Page>
  )
}

export default IBOM
