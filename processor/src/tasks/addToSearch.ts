import { MeiliSearch } from 'meilisearch'
import cheerio from 'cheerio'
import log from 'loglevel'

import { JobData } from '../jobData.js'

const meili = new MeiliSearch({
  host: 'http://meilisearch:7700',
  apiKey: process.env.MEILI_MASTER_KEY,
})
const index = meili.index('projects')
index.updateSettings({
  filterableAttributes: ['id', 'multiParentId', 'gitHash', 'ownerName'],
  searchableAttributes: [
    'name',
    'summary',
    'bom',
    'readme',
    'ownerName',
    'multiParentName',
  ],
})

interface BOM {
  lines: Array<object>
}

interface AddToSearchData {
  bom?: BOM
  readmeHTML?: string
}

export default async function addToSearch(
  job,
  {
    subprojectName,
    giteaId,
    bom,
    kitspaceYaml,
    ownerName,
    repoName,
    hash,
    readmeHTML,
  }: AddToSearchData & Partial<JobData>,
) {
  if (giteaId == null) {
    log.warn(
      `Not adding '${ownerName}/${repoName}' to meilisearch due to missing giteaId`,
    )
    return
  }

  const searchId = `${giteaId}-${subprojectName}`
  const readme = getReadmeAsText(readmeHTML)
  const multiParentId = subprojectName ? giteaId : null

  const document = {
    id: searchId,
    name: subprojectName,
    summary: kitspaceYaml.summary,
    bom: {
      lines: bom?.lines || [],
    },
    gitHash: hash,
    readme,
    ownerName,
    multiParentId,
    multiParentName: subprojectName ? repoName : null,
  }
  log.debug(
    `meilisearch: adding/updating document id='${searchId}' for repo ${ownerName}/${repoName}`,
  )

  await index.addDocuments([document])

  // if there are any lingering docs with an old gitHash then the multi project
  // was renamed (thus they were not over-written above), so we delete them.
  const renamedMultis = await index.search('', {
    filter: `(multiParentId = ${multiParentId}) AND (gitHash != ${hash})`,
  })
  if (renamedMultis.hits.length > 0) {
    const docIds = renamedMultis.hits.map(x => x.id)
    await index.deleteDocuments(docIds)
  }
}

function getReadmeAsText(readmeHTML) {
  const $ = cheerio.load(readmeHTML || '')
  return $.text()
}

/*
 * Subscribe to deletions on the repository table in the GiteaDB and delete
 * search index documents accordingly.
 */
export function continuallySyncDeletions(giteaDB) {
  return giteaDB.subscribeToRepoDeletions(async row => {
    const result = await index.search('', {
      filter: `(id = ${row.id}) OR (multiParentId = ${row.id})`,
    })
    const docIds = result.hits.map(x => x.id)
    await index.deleteDocuments(docIds)
  })
}
