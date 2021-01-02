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

async function existsAll(paths) {
  let allDoExist = true
  for (const path of paths) {
    allDoExist = allDoExist && (await exists(path))
  }
  return allDoExist
}

module.exports = { exists, existsAll }
