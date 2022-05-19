import { MeiliSearch } from 'meilisearch'
import log from 'loglevel'
import cheerio from 'cheerio'

const meili = new MeiliSearch({
  host: 'http://meilisearch:7700',
  apiKey: process.env.MEILI_MASTER_KEY,
})

export default async function addToSearch(
  job,
  { searchId, bom, kitspaceYaml, name, hash, readmeHTML },
) {
  if (searchId == null) {
    log.warn(`Not adding '${name}' to meilisearch due to missing searchId`)
    return
  }
  const index = meili.index('projects')
  let multiParentId = null
  if (searchId.split('-').length > 1) {
    multiParentId = searchId.split('-')[0]
  }
  const readme = getReadmeAsText(readmeHTML)
  const document = {
    id: searchId,
    name,
    summary: kitspaceYaml.summary || '',
    bom: {
      lines: bom.lines,
    },
    gitHash: hash,
    readme,
    multiParentId,
  }
  log.debug(`meilisearch: adding/updating document id='${searchId}'`)
  await index.addDocuments([document])
}

function getReadmeAsText(readmeHTML) {
  const $ = cheerio.load(readmeHTML)
  return $.text()
}
