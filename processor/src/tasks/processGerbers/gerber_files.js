const whatsThatGerber = require('whats-that-gerber')
const path = require('path')

function gerberFiles(files, gerberPath) {
  if (gerberPath != null) {
    files = files.filter(f => f.startsWith(gerberPath))
  }
  const layers = whatsThatGerber(files)
  const layerNames = Object.keys(layers).filter(k => layers[k].type != null)
  let hasDuplicates = false
  const existingLayers = []
  for (const name of layerNames) {
    hasDuplicates = existingLayers.find(
      t =>
        t.type === layers[name].type &&
        t.side === layers[name].side &&
        t.side !== 'inner',
    )
    if (hasDuplicates) {
      break
    }
    existingLayers.push(layers[name])
  }
  if (!hasDuplicates) {
    return layerNames
  }
  //if we have duplicates we reduce it down to the folder with the most
  //gerbers
  const fileCounts = layerNames.reduce((result, fileName) => {
    const folderName = path.dirname(fileName)
    const fileCount = result[folderName] ? result[folderName] + 1 : 1
    return { ...result, [folderName]: fileCount }
  }, {})
  const gerberFolder = Object.keys(fileCounts).reduce((result, folderName) => {
    if (fileCounts[folderName] > fileCounts[result]) {
      return folderName
    }
    return result
  })
  return layerNames.filter(fileName => path.dirname(fileName) === gerberFolder)
}

module.exports = gerberFiles
