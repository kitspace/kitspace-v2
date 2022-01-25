const path = require('path')
const { writeFile } = require('../utils')

function writeKitspaceYaml(eventBus, { kitspaceYaml, filesDir }) {
  const kitspaceYamlJson = path.join(filesDir, 'kitspace-yaml.json')
  eventBus.emit('in_progress', kitspaceYamlJson)

  return writeFile(kitspaceYamlJson, JSON.stringify(kitspaceYaml, null, 2))
    .then(() => eventBus.emit('done', kitspaceYamlJson))
    .catch(err => eventBus.emit('failed', kitspaceYamlJson, err))
}

module.exports = writeKitspaceYaml
