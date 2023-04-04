import cheerio from 'cheerio'
import { SubscriptionHandle } from 'postgres'
import * as giteaDB from '../giteaDB.js'
import { Job, ProjectJobData } from '../job.js'
import { log } from '../log.js'
import { meiliIndex } from '../meili.js'

export const outputFiles = [] as const

interface BOM {
  lines: Array<object>
}

interface AddToSearchData {
  bom?: BOM
  readmeHTML?: string
}

export default async function addToSearch(
  job: Job,
  {
    subprojectName,
    giteaId,
    bom,
    kitspaceYaml,
    ownerName,
    repoName,
    hash,
    readmeHTML,
  }: AddToSearchData & Partial<ProjectJobData>,
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
export function continuallySyncDeletions(): Promise<SubscriptionHandle> {
  return giteaDB.subscribeToRepoEvents(giteaDB.Operation.Delete, async row => {
    meiliIndex
      .search('', {
        filter: `repoId = ${row.id}`,
      })
      .then(result => {
        const docIds = result.hits.map(x => x.id)
        return meiliIndex.deleteDocuments(docIds)
      })
      .catch(e => {
        log.error(e)
      })
  })
}
