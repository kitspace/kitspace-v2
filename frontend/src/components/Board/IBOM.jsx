import React, { useEffect, useState } from 'react'
import NextHead from 'next/head'
import { string } from 'prop-types'
import { Loader } from 'semantic-ui-react'

import Page from '@components/Page'

const IBOM = ({ projectFullname, html, pcbData, projectHref }) => {
  const [IBOMScriptBody, setIBOMScriptBody] = useState(null)
  const isReady = IBOMScriptBody != null
  const title = `${projectFullname} Kitspace Interactive Assembly Guide`

  useEffect(() => {
    //We need the text content of the script, the execution is handled by the `IBOMScriptsWrapper` component.
    fetch('/static/IBOM/index.js')
      .then(r => r.text())
      .then(setIBOMScriptBody)
  }, [])

  return (
    <Page contentFullSize title={title}>
      <IBOMScriptsWrapper
        pcbData={pcbData}
        projectFullname={projectFullname}
        projectHref={projectHref}
        scriptBody={IBOMScriptBody}
      />
      {isReady ? (
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
  fields: ['Value', 'Footprint'],
}

/*
 * There are a couple of gotchas with the IBOM scripts:
 ! 1. We can't use the `next/script` it only fetches and execute the script the first time it renders the <Script> component.
 ! So navigating to another page and back will not execute the script again. This makes subsequent renders of the for other projects doesn't work too.
 ! 2. Using the `next/head` component to add the script tag to the head, will actually load and execute the script.
 ! *But* the ibom.js script has to many global variables that pollute the global namespace and cause conflicts. For example, visiting the ibom page
 ! for any project will show the ibom for the very first project that was visited.

 This wrapper component is a workaround for both of these issues.🔧
 */
const IBOMScriptsWrapper = ({
  scriptBody,
  pcbData,
  projectHref,
  projectFullname,
}) => {
  // To get around the global scope issue, we wrap the `ibom/index.js` script in a function and only set the required functions for user interactions
  // in the window object. This way we can execute the script multiple times without any conflicts. See ibom script variable
  const ibomScript = `
  function ibom() {
    ${scriptBody};
    // Must-have globals for user interactions with the ibom.
    return [
      changeBomLayout,
      changeBomMode,
      changeCanvasLayout,
      dnpOutline,
      fabricationVisible,
      initBOM,
      loadSettings,
      padsVisible,
      referencesVisible,
      saveImage,
      saveSettings,
      setBoardRotation,
      setBomCheckboxes,
      setDarkMode,
      setFullscreen,
      setHighlightPin1,
      setRedrawOnDrag,
      silkscreenVisible,
      tracksVisible,
      validateSaveImgDimension,
      valuesVisible,
      zonesVisible,
    ]}
  `

  const initScript = `(function() {
    // i. set the 'pcbdata' var needed by IBOM.
    window.pcbdata = ${pcbData};
    // ii. set the 'config' var needed by IBOM.
    window.config = ${JSON.stringify(config)}
    // iii. initialize IBOM.
    // Must-have globals for user interactions with the ibom.
    ibom().forEach(f => window[f.name] = f);
    window.initBOM();
    // iv. make the title anchor tag linking to the project page.
    document.querySelector('#title').innerHTML = "<a href=/${projectHref}>${projectFullname}</a>";
    // vi. prefetch project page.
    const link = document.createElement("link");
    link.rel = "prefetch";
    link.href = "${projectHref}";
    })()
    `
  return (
    <NextHead>
      {/* Styles for IBOM targets uses non pure selectors, e.g., `:root`, importing its style as
       * a  module doesn't work. The other option was to add the style to `_app.scss`
       * which will load on visiting any page.
       */}
      {/* eslint-disable-next-line @next/next/no-css-tags */}
      <link href="/static/IBOM/index.css" rel="stylesheet" />
      <script
        dangerouslySetInnerHTML={{
          __html: ibomScript,
        }}
      ></script>
      {scriptBody != null && (
        <script dangerouslySetInnerHTML={{ __html: initScript }}></script>
      )}
    </NextHead>
  )
}

IBOMScriptsWrapper.propTypes = {
  pcbData: string.isRequired,
  projectFullname: string.isRequired,
  projectHref: string.isRequired,
  scriptBody: string.isRequired,
}

IBOM.propTypes = {
  html: string.isRequired,
  pcbData: string.isRequired,
  projectFullname: string.isRequired,
  projectHref: string.isRequired,
}

export default IBOM
