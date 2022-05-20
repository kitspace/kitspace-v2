import { MeiliSearch } from 'meilisearch'
import log from 'loglevel'
import cheerio from 'cheerio'

const meili = new MeiliSearch({
  host: 'http://meilisearch:7700',
  apiKey: process.env.MEILI_MASTER_KEY,
})
const index = meili.index('projects')
index.updateSettings({
  filterableAttributes: ['id', 'multiParentId', 'gitHash'],
})

export default async function addToSearch(
  job,
  {
    searchId,
    bom,
    kitspaceYaml,
    name,
    ownerName,
    multiParentName,
    hash,
    readmeHTML,
  },
) {
  if (searchId == null) {
    log.warn(`Not adding '${name}' to meilisearch due to missing searchId`)
    return
  }
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
    ownerName,
    multiParentId,
    multiParentName,
  }
  log.debug(`meilisearch: adding/updating document id='${searchId}', name=${name}`)

  await index.addDocuments([document])

  // multi names can change in kitspace.yaml, the project can also go from a
  // multi to a single project or vice versa. we need to clear out any
  // documents that could be left over due to id changes.
  if (multiParentId == null) {
    // if we are not a multi project clear out any multi document that refer to
    // this id as parent (if we went from multi to single)
    const previousMultis = await index.search('', {
      filter: `multiParentId = ${searchId}`,
    })
    const docIds = previousMultis.hits.map(x => x.id)
    await index.deleteDocuments(docIds)
  } else {
    // if we are a multi project, clear any previous parent (if we went from
    // single to multi). also clear any documents with the same multiParentId
    // that are not from this latest git commit hash (if a multi project was
    // renamed)
    const [parent, renamedMultis] = await Promise.all([
      index.search('', { filter: `id = ${multiParentId}` }),
      index.search('', {
        filter: `(multiParentId = ${multiParentId}) AND (gitHash != ${hash})`,
      }),
    ])
    const docIds = parent.hits.concat(renamedMultis.hits).map(x => x.id)
    await index.deleteDocuments(docIds)
  }
}

function getReadmeAsText(readmeHTML) {
  const $ = cheerio.load(readmeHTML)
  return $.text()
}
