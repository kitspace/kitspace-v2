const whatsThatGerber = require('whats-that-gerber')
const path = require('path')

function findGerberFiles(files, gerberPath) {
  if (gerberPath != null) {
    files = files.filter(f => f.startsWith(gerberPath))
  }
  const layerTypes = whatsThatGerber(files)
  const layerNames = Object.keys(layerTypes).filter(k => layerTypes[k].type != null)
  let hasDuplicates = false
  const existingLayers = []
  for (const name of layerNames) {
    hasDuplicates = existingLayers.find(
      t =>
        t.type === layerTypes[name].type &&
        t.side === layerTypes[name].side &&
        t.side !== 'inner',
    )
    if (hasDuplicates) {
      break
    }
    existingLayers.push(layerTypes[name])
  }
  if (!hasDuplicates) {
    return toLayersWithTypes(layerNames, layerTypes)
  }
  // if we have duplicates we reduce it down to the folder with the most
  // gerbers
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
  const inFolderLayerNames = layerNames.filter(
    fileName => path.dirname(fileName) === gerberFolder,
  )
  return toLayersWithTypes(inFolderLayerNames, layerTypes)
}

// gives object layer info (type and side) for all layers in layerNames by
// looking them up in layerTypes
// e.g. {"whatever-F.Cu.gbr": {type: "copper", side: "top"}}
function toLayersWithTypes(layerNames, layerTypes) {
  return layerNames.reduce((result, name) => {
    return { ...result, [name]: layerTypes[name] }
  }, {})
}

module.exports = findGerberFiles
