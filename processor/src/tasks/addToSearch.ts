import { MeiliSearch } from 'meilisearch'
import log from 'loglevel'
import cheerio from 'cheerio'

import { JobData } from '../jobData'

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

  const searchId = subprojectName ? `${giteaId}-${subprojectName}` : giteaId
  const readme = getReadmeAsText(readmeHTML)
  const multiParentId = subprojectName ? giteaId : null

  const document = {
    id: searchId,
    name: subprojectName ?? repoName,
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

  // multi names can change in kitspace.yaml, the project can also go from a
  // multi to a single project or vice versa. we need to clear out any
  // documents that could be left over due to id changes.
  if (multiParentId == null) {
    // if we are not a multi project clear out any multi document that refer to
    // this id as parent (if we went from multi to single)
    const previousMultis = await index.search('', {
      filter: `multiParentId = ${giteaId}`,
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
