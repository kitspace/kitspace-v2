/**
 *
 * @param {string} assetsPath
 * @returns {Promise<[boolean, object]>}
 */
export const getBoardGerberInfo = async assetsPath => {
  const gerberInfoFields = {
    zipPath: '',
    width: 0,
    height: 0,
    layers: 0,
    inputFiles: {},
  }

  const res = await fetch(`${assetsPath}/gerber-info.json`)
  return [res.ok, res.ok ? await res.json() : gerberInfoFields]
}

/**
 *
 * @param {string} assetsPath
 * @returns {Promise<[boolean, object]>}
 */
export const getBoardBomInfo = async assetsPath => {
  const res = await fetch(`${assetsPath}/bom-info.json`)
  return [res.ok, res.ok ? await res.json() : {}]
}

/**
 *
 * @param {string} assetsPath
 * @returns {Promise<string|null>}
 */
export const getReadme = async assetsPath => {
  const res = await fetch(`${assetsPath}/readme.html`)

  return res.ok ? res.text() : null
}

/**
 *
 * @param {string} assetsPath
 * @returns {Promise<[boolean, object]>}
 */
export const getKitspaceYamlArray = async assetsPath => {
  const res = await fetch(`${assetsPath}/kitspace-yaml.json`)
  return [res.ok, res.ok ? await res.json() : []]
}

/**
 *
 * @param {string} rootAssetPath
 * @returns {Promise<boolean>} whether the processor is done whether the processor is still processing or not.
 */
export const getIsProcessingDone = async rootAssetPath => {
  const res = await fetch(`${rootAssetPath}/kitspace-yaml.json`)

  if (!res.ok) {
    return false
  }

  const kitspaceYamlArray = await res.json()

  for (const project of kitspaceYamlArray) {
    const r = await fetch(`${rootAssetPath}/${project.name}/processor-report.json`)
    if (!r.ok) {
      return false
    }
    const report = await r.json()
    if (report.status !== 'done') {
      return false
    }
  }
  return true
}

/**
 *
 * @param {string} assetsPath
 * @returns{Promise<boolean>}
 */
export const hasInteractiveBom = async assetsPath => {
  const res = await fetch(`${assetsPath}/interactive_bom.json`, { method: 'HEAD' })
  return res.ok
}
