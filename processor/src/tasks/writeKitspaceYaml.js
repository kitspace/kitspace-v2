const path = require('path')

function writeKitspaceYaml(eventBus, kitspaceYaml, outputDir) {
  const kitspaceYamlJson = path.join(filesDir, 'kitspace-yaml.json')
  eventBus.emit('in_progress', kitspaceYamlJson)

  return writeFile(kitspaceYamlJson, JSON.stringify(kitspaceYaml, null, 2))
    .then(() => eventBus.emit('done', kitspaceYamlJson))
    .catch(err => eventBus.emit('failed', kitspaceYamlJson, err))
}
