const processorUrl = process.env.KITSPACE_PROCESSOR_URL

/**
 *
 * @param {string} assetsPath
 * @returns {Promise<[boolean, object]>}
 */
export const getBoardZipInfo = async assetsPath => {
  const zipInfoFields = { zipPath: '', width: 0, height: 0, layers: 0 }

  const res = await fetch(`${assetsPath}/zip-info.json`)
  return [res.ok, res.ok ? await res.json() : zipInfoFields]
}

/**
 *
 * @param {string} assetsPath
 * @returns {Promise<[boolean, object]>}
 */
export const getBoardInfo = async assetsPath => {
  const res = await fetch(`${assetsPath}/info.json`)
  return [res.ok, res.ok ? await res.json() : {}]
}

/**
 *  
 * @param {string} repoFullname 
 * @returns{Promise<boolean>}
 */
export const hasInteractiveBom = async repoFullname => {
  const res = await fetch(`${processorUrl}/status/${repoFullname}/HEAD/interactive_bom.json`)
  const body = await res.json()
  console.log(body.status)
  return body.status === 'done'
}
