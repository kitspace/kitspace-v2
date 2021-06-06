import React, { useEffect, useState } from 'react'

import BrowserVersion from 'browser-version'
import { Icon, Message } from 'semantic-ui-react'
import { func, string } from 'prop-types'

export const install1ClickBOM = () => {
  const version = BrowserVersion()
  let onClick
  if (/Chrome/.test(version)) {
    onClick = () => {
      if (window.plausible != null) {
        window.plausible('Install Extension')
      }
      window.open(
        'https://chrome.google.com/webstore/detail/kitspace-1-click-bom/mflpmlediakefinapghmabapjeippfdi',
      )
    }
  } else if (/Firefox/.test(version)) {
    onClick = () => {
      if (window.plausible != null) {
        window.plausible('Install Extension')
      }
      window.open('https://addons.mozilla.org/en-US/firefox/addon/1clickbom')
    }
  } else {
    onClick = () => {
      if (window.plausible != null) {
        window.plausible('Install Extension')
      }
      window.open('/1-click-bom', '_self')
    }
  }
  return onClick()
}

const InstallPrompt = ({ extensionPresence }) => {
  const [isCompatible, setIsCompatible] = useState(true)
  const [timedOut, setTimedOut] = useState(false)

  const getCompatibility = () => {
    if (typeof navigator === 'undefined') {
      return true
    }
    if (/Mobile/i.test(navigator.userAgent)) {
      return false
    }
    const version = BrowserVersion()
    return /Chrome/.test(version) || /Firefox/.test(version)
  }

  useEffect(() => {
    setTimedOut(() => {
      setTimedOut(true)
      setIsCompatible(getCompatibility())
    }, 5000)
  }, [])

  if (extensionPresence === 'present') {
    return <div />
  }
  if (timedOut) {
    return isCompatible ? (
      <PleaseInstall install1ClickBOMCallback={install1ClickBOM} />
    ) : (
      <NotCompatible />
    )
  }
  return null
}

/* eslint-disable jsx-a11y/anchor-is-valid ,jsx-a11y/click-events-have-key-events, jsx-a11y/interactive-supports-focus */
const PleaseInstall = ({ install1ClickBOMCallback }) => (
  <Message attached warning>
    <Icon name="attention" />
    Please{' '}
    <a onClick={() => install1ClickBOMCallback()} role="link">
      install the 1-click BOM extension
    </a>{' '}
    make full use of this feature.
  </Message>
)

const NotCompatible = () => (
  <Message attached warning>
    <Icon name="attention" />
    Sorry, the <a href="/1-click-bom">1-click BOM extension</a> is not yet available
    for your browser. Only the Digikey add-to-cart links work fully, Farnell and
    Newark should work but the references will not be added as line-notes.
  </Message>
)

InstallPrompt.propTypes = {
  extensionPresence: string.isRequired,
}

PleaseInstall.propTypes = {
  install1ClickBOMCallback: func.isRequired,
}

export default InstallPrompt
