import yaml from 'js-yaml'
import { updateFile, uploadFile } from '@utils/giteaApi'

const processorUrl = process.env.KITSPACE_PROCESSOR_URL

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
 * @returns {Promise<[boolean, object]>}
 */
export const getKitspaceYAMLJson = async assetsPath => {
  const kitspaceYAMLFields = {
    summary: '',
    site: '',
    color: '',
    bom: '',
    gerbers: '',
    eda: { type: '', pcb: '' },
    readme: '',
    multi: {},
  }

  const res = await fetch(`${assetsPath}/kitspace-yaml.json`)
  return [res.ok, res.ok ? await res.json() : kitspaceYAMLFields]
}

/**
 *
 * @param {string} repoFullname
 * @returns{Promise<boolean>}
 */
export const hasInteractiveBom = async repoFullname => {
  const res = await fetch(
    `${processorUrl}/status/${repoFullname}/HEAD/interactive_bom.json`,
  )

  if (!res.ok) return false

  const body = await res.json()
  return body.status === 'done'
}

/**
 * Update the contents of kitspace.yaml if it exists or create it.
 * @param {string} selectedFile the path of the file
 * @param {string} kitspaceYAML the contents of `kitspace.yml` as JSON
 * @param {'gerbers' | 'bom' | 'readme'} assetName
 * @param {string} projectFullname
 * @param {object} user
 * @param {string} csrf
 * @param {boolean} kitspaceYAMLExists
 * @returns {Promise<boolean} : whether the update was successful or not.
 */
export const submitKitspaceYaml = async (
  selectedFile,
  kitspaceYAML,
  assetName,
  projectFullname,
  user,
  csrf,
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
    return updateFile(projectFullname, 'kitspace.yaml', newKitspaceYAML, user, csrf)
  }
  return uploadFile(projectFullname, 'kitspace.yaml', newKitspaceYAML, user, csrf)
}
