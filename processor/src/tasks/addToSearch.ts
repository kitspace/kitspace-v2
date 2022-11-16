import { Index, Settings } from 'meilisearch'
import cheerio from 'cheerio'
import log from 'loglevel'

import { JobData } from '../jobData.js'
import { GiteaDB } from '../giteaDB.js'
import { InjectedDependencies } from '../injectedDependencies.js'

export const meiliSettings: Settings = {
  filterableAttributes: ['id', 'repoId', 'gitHash', 'ownerName'],
  searchableAttributes: [
    'projectName',
    'summary',
    'bom',
    'readme',
    'ownerName',
    'repoName',
  ],
}

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
  { meiliIndex }: Partial<InjectedDependencies>,
) {
  // A document identifier must be of type integer or string,
  // composed only of alphanumeric characters (a-z A-Z 0-9), hyphens (-), and underscores (_).
  // See, https://docs.meilisearch.com/reference/errors/error_codes.html#invalid-document-id
  const searchId = `${giteaId}-${subprojectName.replace(/[^\w\d-_]/g, '-')}`

  const readme = getReadmeAsText(readmeHTML)

  const document = {
    id: searchId,
    projectName: subprojectName,
    summary: kitspaceYaml.summary,
    bom: {
      lines: bom?.lines || [],
    },
    gitHash: hash,
    readme,
    ownerName,
    repoId: giteaId,
    repoName,
  }
  log.debug(
    `meilisearch: adding/updating document id='${searchId}' for repo ${ownerName}/${repoName}`,
  )

  await meiliIndex.addDocuments([document])

  // if there are any lingering docs with an old gitHash then the multi project
  // was renamed (so they were not over-written with new gitHash above), so we
  // delete them.
  const renamedMultis = await meiliIndex.search('', {
    filter: `(repoId = ${giteaId}) AND (gitHash != ${hash})`,
  })
  if (renamedMultis.hits.length > 0) {
    const docIds = renamedMultis.hits.map(x => x.id)
    await meiliIndex.deleteDocuments(docIds)
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
export function continuallySyncDeletions(giteaDB: GiteaDB, meiliIndex: Index) {
  return giteaDB.subscribeToRepoDeletions(async row => {
    const result = await meiliIndex.search('', {
      filter: `repoId = ${row.id}`,
    })
    const docIds = result.hits.map(x => x.id)
    await meiliIndex.deleteDocuments(docIds)
  })
}
