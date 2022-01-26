import React, { useEffect, useState } from 'react'
import NextHead from 'next/head'
import Script from 'next/script'
import { string } from 'prop-types'
import { Loader } from 'semantic-ui-react'

import Page from '@components/Page'

const IBOM = ({ projectFullname, html, pcbData, projectHref }) => {
  const [ready, setReady] = useState(false)
  const title = `${projectFullname} Kitspace Interactive Assembly Guide`

  /*
    i.   set the `pcbdata` var needed by IBOM
    ii.  initialize IBOM
    iii. make the title anchor tag linking to the project page.
    iv.  prefetch project page.
  */
  const initScript = `
    var pcbdata = ${pcbData};
    document.getElementById('IBOM_script').addEventListener('load', () => {
      window.onresize = resizeAll;
      initBOM();
      const pcbTitle = pcbdata.metadata.title;
  
      document.querySelector('#title').innerHTML = "<a href=/${projectHref}>${projectFullname}</a>";
      const head = document.head;
      const link = document.createElement("link");
      link.rel = "prefetch";
      link.href = "${projectHref}";
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
    <Page contentFullSize title={title}>
      <Script
        id="IBOM_script"
        src="/static/IBOM/index.js"
        onLoad={() => {
          setReady(true)
          return
        }}
      />
      <Script id="init_script">{initScript}</Script>
      <NextHead>
        {/* Styles for IBOM targets uses non pure selectors, e.g., `:root`, importing its style as
         * a  module doesn't work. The other option was to add the style to `_app.scss`
         * which will load on visiting any page.
         */}
        {/* eslint-disable-next-line @next/next/no-css-tags */}
        <link href="/static/IBOM/index.css" rel="stylesheet" />
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
  projectFullname: string.isRequired,
  html: string.isRequired,
  pcbData: string.isRequired,
  projectHref: string.isRequired,
}

export default IBOM
