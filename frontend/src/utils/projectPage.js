import { updateFile, uploadFile } from '@utils/giteaApi'

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

  const assetNames = [
    'gerber-info.json',
    'images/bottom.svg',
    'images/top.svg',
    'images/top.png',
    '1-click-BOM.tsv',
    'bom-info.json',
    'readme.html',
  ]
  const assetUrls = kitspaceYamlArray.flatMap(project =>
    assetNames.map(assetName => `${rootAssetPath}/${project.name}/${assetName}`),
  )
  const responses = await Promise.all(
    assetUrls.map(url => fetch(url, { method: 'HEAD' })),
  )
  return responses.every(r => r.ok)
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

/**
 * Update the contents of kitspace.yaml if it exists or create it.
 * @param {string} selectedFile the path of the file
 * @param {string} kitspaceYAML the contents of `kitspace.yml` as JSON
 * @param {'gerbers' | 'bom' | 'readme'} assetName
 * @param {string} projectFullname
 * @param {object} user
 * @param {string} apiToken
 * @param {boolean} kitspaceYAMLExists
 * @returns {Promise<boolean} : whether the update was successful or not.
 */
export const submitKitspaceYaml = async (
  selectedFile,
  kitspaceYAML,
  assetName,
  projectFullname,
  user,
  apiToken,
  kitspaceYAMLExists,
) => {
  /**
   * From any gerber file, the path for the gerbers dir can be specified.
   * For readme, and bom only a single file can be selected
   */
  const { path } = selectedFile
  const basePath = path.split('/')[0]
  const _kitspaceYAML = JSON.parse(JSON.stringify(kitspaceYAML))
  _kitspaceYAML[assetName] = basePath

  const newKitspaceYAML = yaml.dump(_kitspaceYAML)

  if (kitspaceYAMLExists) {
    return updateFile(
      projectFullname,
      'kitspace.yaml',
      newKitspaceYAML,
      user,
      apiToken,
    )
  }
  return uploadFile(
    projectFullname,
    'kitspace.yaml',
    newKitspaceYAML,
    user,
    apiToken,
  )
}

/**
 *
 * @param {string} assetsPath url for project assets.
 * @returns {string} url for assets processing status.
 */
export const getStatusPath = assetsPath => {
  return assetsPath.replace(/\/files\//, '/status/')
}
