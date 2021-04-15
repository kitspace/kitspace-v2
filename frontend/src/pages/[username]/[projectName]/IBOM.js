import React, { useEffect } from 'react'
import { promises as fs } from 'fs'
import path from 'path'
import NextHead from 'next/head'

import { Page } from '@components/Page'

export const getServerSideProps = async ({ params }) => {
  const basePath = 'src/IBOM'
  const IBOMHtml = await fs.readFile(
    path.join(process.cwd(), `${basePath}/index.html`),
    'utf-8',
  )
  // TODO: Both index.js and index.css should be served by nginx
  const IBOMScript = await fs.readFile(
    path.join(process.cwd(), `${basePath}/index.js`),
    'utf-8',
  )
  const IBOMStyle = await fs.readFile(
    path.join(process.cwd(), `${basePath}/index.css`),
    'utf-8',
  )
  const processorUrl = process.env.KITSPACE_PROCESSOR_URL
  const repoFullname = `${params.username}/${params.projectName}`
  const interactiveBOMStatus = await fetch(
    `${processorUrl}/status/${repoFullname}/HEAD/interactive_bom.json`,
  ).then(r => r.json().then(body => body.status))


  if (interactiveBOMStatus === 'done') {
    const pcbData = await fetch(
    // `${processorUrl}/files/${repoFullname}/HEAD/interactive_bom.json`,
      `https://kitspace.org/boards/github.com/emard/ulx3s/interactive_bom.json`,
    ).then(res => res.blob().then(b => b.text()))
    return {

      props: { html: IBOMHtml, script: IBOMScript, style: IBOMStyle, pcbData},
    }
  } else {
    return {
      notFound: true
    }
  }
}

const IBOM = ({ html, script, style, pcbData }) => {
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

  useEffect(() => {
    window.config = config

  }, [])

  return (
    <Page>
      <NextHead>
        <script type="text/javascript" id="IBOM">{script};</script>
        <script type="text/javascript">
          var pcbdata = {pcbData};
          window.onresize = resizeAll;
          window.matchMedia("print").addListener(resizeAll);
          initBOM();
        </script>
        <style type="text/css">{style}</style>
      </NextHead>

      <div className="ibom" dangerouslySetInnerHTML={{ __html: html }} />
    </Page>
  )
}

export default IBOM
