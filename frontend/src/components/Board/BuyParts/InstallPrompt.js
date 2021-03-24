import React, { useEffect, useState } from 'react'

import BrowserVersion from 'browser-version'
import { Icon, Message } from 'semantic-ui-react'

const InstallPrompt = ({ bomInstallLink, extensionPresence }) => {
  const [isCompatible, setIsCompatible] = useState(true)
  const [timedOut, setTimedOut] = useState(false)

  const getCompatibility = () => {
    if (typeof navigator === 'undefined') {
      return true
    } else if (/Mobile/i.test(navigator.userAgent)) {
      return false
    } else {
      const version = BrowserVersion()
      return /Chrome/.test(version) || /Firefox/.test(version)
    }
  }

  useEffect(() => {
    setTimedOut(() => {
      setTimedOut(true)
      setIsCompatible(getCompatibility())
    }, 5000)
  }, [])

  if (extensionPresence === 'present') {
    return <div />
  } else if (timedOut) {
    return isCompatible ? (
      <PleaseInstall bomInstallLink={bomInstallLink} />
    ) : (
      <NotCompatible />
    )
  } else {
    return null
  }
}

const PleaseInstall = ({ bomInstallLink }) => (
  <Message attached warning>
    <Icon name="attention" />
    Please <a onClick={bomInstallLink}>install the 1-click BOM extension</a> to make
    full use of this feature.
  </Message>
)

const NotCompatible = () => {
  return (
    <Message attached warning>
      <Icon name="attention" />
      Sorry, the <a href="/1-click-bom">1-click BOM extension</a> is not yet
      available for your browser. Only the Digikey add-to-cart links work fully,
      Farnell and Newark should work but the references will not be added as
      line-notes.
    </Message>
  )
}

export default InstallPrompt
