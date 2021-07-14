import yaml from 'js-yaml'
import { updateFile, uploadFile } from '@utils/giteaApi'
import { flatten } from 'lodash'

const processorUrl = process.env.KITSPACE_PROCESSOR_URL

/**
 * Given an array of kitspace repos return the an array of projects.
 * Each multi project is treated as a standalone project.
 * @param {object[]} repos
 * @returns {Promise<[]object>}
 */
export const getFlatProjects = async repos => {
  /**
   * @param {string} fullname
   * @returns {Promise<[boolean, object?]>} The first item is whether the project is multi, the second is the multi projects in kitspace.yaml.
   */
  const isMultiProject = async fullname => {
    const res = await fetch(
      `${processorUrl}/files/${fullname}/HEAD/kitspace-yaml.json`,
    )

    if (!res.ok) return [false, null]

    const kitspaceYAML = await res.json()
    return [kitspaceYAML.hasOwnProperty('multi'), kitspaceYAML?.multi]
  }

  /**
   * Get an array of multi projects in a project.
   * @param {object} project
   * @param {object} multi
   * @returns{object[]}
   */
  const multiProjects = async (project, multi) =>
    Object.keys(multi).map(projectName => ({
      name: projectName,
      full_name: project.full_name,
      description: multi[projectName].summary,
      owner: project.owner,
      isMultiProject: true,
    }))

  return flatten(
    await Promise.all(
      repos.map(async repo => {
        const [isMulti, multi] = await isMultiProject(repo.full_name)
        if (!isMulti) {
          return repo
        } else {
          return multiProjects(repo, multi)
        }
      }),
    ),
  )
}

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

export const processedAssets = async assetsPath => {
  const statusPath = assetsPath.replace(/\/files/, '/status')
  const rootStatusPath = statusPath.replace(/HEAD.+/, 'HEAD/')
  const rootAssetsPath = assetsPath.replace(/HEAD.+/, 'HEAD/')

  // https://github.com/kitspace/kitspace-v2/tree/master/processor#parameters
  const assetsNames = [
    'gerber-info.json',
    'images/bottom.svg',
    'images/top.svg',
    'images/top.png',
    'images/top-large.png',
    'images/top-meta.png',
    'images/top-with-background.png',
    // 'images/layout.svg',
    '1-click-BOM.tsv',
    'bom-info.json',
    'interactive_bom.json',
    // 'kitspace-yaml.json',
  ]

  const kitspaceYAML = await fetch(`${rootAssetsPath}/kitspace-yaml.json`)

  if (!kitspaceYAML.ok) return false

  const kitspaceYAMLBody = await kitspaceYAML.json()

  if (kitspaceYAMLBody.hasOwnProperty('multi')) {
    const multiProjectsNames = Object.keys(kitspaceYAMLBody.multi)
    const allMultiProjectsAssetsStatus = flatten(
      await Promise.all(
        multiProjectsNames.map(
          async multiProjectsName =>
            await Promise.all(
              assetsNames.map(assetName =>
                fetch(`${rootStatusPath}/${multiProjectsName}/${assetName}`),
              ),
            ),
        ),
      ),
    )

    if (allMultiProjectsAssetsStatus.some(r => !r.ok)) return false

    return allMultiProjectsAssetsStatus.every(async r => {
      const { status } = await r.json()
      return status !== 'in_progress'
    })
  }

  const allAssetsStatus = await Promise.all(
    assetsNames.map(assetName => fetch(`${rootStatusPath}/${assetName}`)),
  )

  if (allAssetsStatus.some(r => !r.ok)) return false

  return allAssetsStatus.every(async r => {
    const { status } = await r.json()
    return status !== 'in_progress'
  })
}

/**
 *
 * @param {string} assetsPath
 * @returns{Promise<boolean>}
 */
export const hasInteractiveBom = async assetsPath => {
  const statusPath = assetsPath.replace(/\/files/, '/status')
  const res = await fetch(`${statusPath}/interactive_bom.json`)

  if (!res.ok) return false

  const { status } = await res.json()
  return status === 'done'
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
