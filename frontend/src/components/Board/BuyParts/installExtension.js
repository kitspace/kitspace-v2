import BrowserVersion from 'browser-version'

const installExtension = () => {
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

export default installExtension
