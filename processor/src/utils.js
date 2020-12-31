const fs = require('fs')
const util = require('util')
const accessPromise = util.promisify(fs.access)

function exists(file) {
  return accessPromise(file, fs.constants.F_OK)
    .then(x => x == null)
    .catch(err => {
      if (err.code === 'ENOENT') {
        return false
      } else {
        throw err
      }
    })
}

function existsAll(paths) {
  return paths.reduce(
    async (prev, p) => (await prev) && (await exists(p)),
    Promise.resolve(true),
  )
}

module.exports = { exists, existsAll }
