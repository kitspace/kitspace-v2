import { Index, SearchResponse } from 'meilisearch'
import assert from 'node:assert'
import crypto from 'node:crypto'
import fs from 'node:fs/promises'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mock, MockProxy } from 'vitest-mock-extended'
import { ReplicationEvent } from 'postgres'
import { createApp, KitspaceProcessorApp } from '../../src/app.js'
import { DATA_DIR, PROCESSOR_ASSET_VERSION } from '../../src/env.js'
import * as giteaDBImported from '../../src/giteaDB.js'
import * as s3Imported from '../../src/s3.js'
import { sh } from '../../src/shell.js'
import { waitFor } from '../../src/utils.js'

const timeout = 120_000

const tmpDir = '/data/test/temp/kitspace-processor-test-projects'
const repoDir = path.join(tmpDir, 'repos')

const standardProjectFiles = [
  '1-click-BOM.tsv',
  'bom-info.json',
  'gerber-info.json',
  'images/bottom.svg',
  'images/top-large.png',
  'images/top-with-background.png',
  'images/top.png',
  'images/top.svg',
  'interactive_bom.json',
  'readme.html',
]

type S3 = typeof s3Imported

vi.mock('../../src/s3.js', () => {
  const s3: MockProxy<S3> = mock<S3>()
  s3.exists.mockReturnValue(Promise.resolve(false))
  s3.existsAll.mockImplementation(async filepaths => {
    // call it for every file since we check the `exists` mock calls in our
    // tests
    for (const p of filepaths) {
      await s3.exists(p)
    }
    return false
  })
  s3.uploadFileContents.mockReturnValue(Promise.resolve())
  s3.uploadFile.mockImplementation(async (filepath, contentType) => {
    const contents = await fs.readFile(filepath)
    return s3.uploadFileContents(filepath, contents, contentType)
  })
  return s3
})

const s3 = s3Imported as MockProxy<S3>

vi.mock('../../src/meili.js', () => {
  const meiliIndex: MockProxy<Index> = mock<Index>()
  const searchResponse = mock<SearchResponse<unknown>>()
  searchResponse.hits = []
  meiliIndex.search.mockReturnValue(Promise.resolve(searchResponse))
  return { meiliIndex }
})

type GiteaDBMock = MockProxy<typeof giteaDBImported>

vi.mock('../../src/giteaDB.js', () => {
  const giteaDB: GiteaDBMock = mock<typeof giteaDBImported>()
  giteaDB.waitForNonEmpty.mockReturnValue(Promise.resolve())
  giteaDB.waitForRepoMigration.mockReturnValue(Promise.resolve())
  giteaDB.subscribeToRepoEvents.mockReturnValue(
    Promise.resolve({ unsubscribe: () => {} }),
  )
  giteaDB.getAllRepoInfo.mockReturnValue(Promise.resolve([]))

  return giteaDB
})

async function dispatchRepoEvent(
  giteaDB: GiteaDBMock,
  repoInfo: giteaDBImported.RepoInfo,
  event: ReplicationEvent,
) {
  for (const [_, callback] of giteaDB.subscribeToRepoEvents.mock.calls) {
    await callback(repoInfo, event)
  }
}

const repoEventFixture: ReplicationEvent = {
  command: 'update',
  relation: null,
  old: null,
  key: null,
}

const giteaDB = giteaDBImported as GiteaDBMock

describe(
  'gitea projects functionality',
  function () {
    let app: KitspaceProcessorApp
    beforeEach(async function () {
      await sh`mkdir -p ${tmpDir}`
      await sh`mkdir -p ${repoDir}`
      app = await createApp(repoDir)
    })

    it('creates app', async function () {
      assert(app != null)
    })

    function generateRulerTest(hash: string) {
      return async function testRuler() {
        const repoInfo: giteaDBImported.RepoInfo = {
          id: '1',
          is_mirror: true,
          is_empty: false,
          owner_name: 'kitspace',
          default_branch: 'master',
          original_url: 'https://github.com/kitspace/ruler',
          name: 'ruler',
          description: '',
        }
        giteaDB.getRepoInfo.mockReturnValue(Promise.resolve(repoInfo))

        // first we reset HEAD/master to an exact version of the ruler repo
        // so future changes of the repo don't affect this test
        const tmpBare = path.join(tmpDir, 'ruler.git')
        await sh`git clone --bare https://github.com/kitspace/ruler ${tmpBare}`
        await sh`cd ${tmpBare} && git update-ref HEAD ${hash}`
        await sh`git clone --bare ${tmpBare} ${path.join(
          repoDir,
          'kitspace/ruler.git',
        )}`

        await dispatchRepoEvent(giteaDB, repoInfo, repoEventFixture)

        const files = [
          'kitspace-yaml.json',
          '_/images/layout.svg',
          `_/ruler-${hash.slice(0, 7)}-gerbers.zip`,
          ...standardProjectFiles.map(f => `_/${f}`),
        ]

        await waitForDone({ projectName: '_' })

        for (const f of files) {
          const p = path.join(
            DATA_DIR,
            PROCESSOR_ASSET_VERSION,
            `kitspace/ruler/${hash}/${f}`,
          )
          expect(s3.exists).toHaveBeenCalledWith(p)
          expect(s3.uploadFileContents).toHaveBeenCalledWith(
            p,
            expect.anything(),
            expect.anything(),
          )
        }
      }
    }

    const kicadHash = '2af1eef430b2382d22d3c8a95abe18ccc1ee5dc7'
    const nonKicadHash = 'f8bdf1d0c358f88b70a8306c6855538ac933914e'
    it('processes the kitspace ruler project', generateRulerTest(nonKicadHash))
    it(
      'processes the kitspace ruler project with `eda: kicad` in kitspace.yaml',
      generateRulerTest(kicadHash),
    )

    it('processes a multi project correctly', async function () {
      const repoInfo: giteaDBImported.RepoInfo = {
        id: '1',
        is_mirror: true,
        is_empty: false,
        owner_name: 'kitspace-forks',
        default_branch: 'master',
        original_url: 'https://github.com/kitspace-forks/diy_particle_detector',
        name: 'diy_particle_detector',
        description: '',
      }
      giteaDB.getRepoInfo.mockReturnValue(Promise.resolve(repoInfo))
      // first we reset HEAD/master to an exact version of the repo
      // so future changes of the repo don't affect this test
      const hash = '53a7770a66fe0209b38a826d560bc8a4b6b56a0d'
      const tmpBare = path.join(tmpDir, 'diy_particle_detector.git')
      await sh`git clone --bare https://github.com/kitspace-forks/DIY_particle_detector ${tmpBare}`
      await sh`cd ${tmpBare} && git update-ref HEAD ${hash}`
      await sh`git clone --bare ${tmpBare} ${path.join(
        repoDir,
        'kitspace-forks/diy_particle_detector.git',
      )}`

      await dispatchRepoEvent(giteaDB, repoInfo, repoEventFixture)

      const repoRoot = path.join(
        DATA_DIR,
        PROCESSOR_ASSET_VERSION,
        'kitspace-forks/diy_particle_detector',
        hash,
      )

      let files = [path.join(repoRoot, 'kitspace-yaml.json')]

      for (const projectName of ['alpha-spectrometer', 'electron-detector']) {
        const projectRoot = path.join(repoRoot, projectName)
        const projectFiles = standardProjectFiles.map(f =>
          path.join(projectRoot, f),
        )
        files = files.concat(projectFiles)

        const zipFileName = `${projectName}-${hash.slice(0, 7)}-gerbers.zip`
        files.push(path.join(projectRoot, zipFileName))
        files.push(path.join(projectRoot, 'images/layout.svg'))
        await waitForDone({ projectName })
      }

      for (const p of files) {
        expect(s3.exists).toHaveBeenCalledWith(p)
        expect(s3.uploadFileContents).toHaveBeenCalledWith(
          p,
          expect.anything(),
          expect.anything(),
        )
      }
    })

    it('processes project that has assets in hidden folders (.kitspace)', async function () {
      const repoInfo: giteaDBImported.RepoInfo = {
        id: '1',
        is_mirror: true,
        is_empty: false,
        owner_name: 'kitspace-test-repos',
        default_branch: 'master',
        original_url: 'https://github.com/kitspace-test-repos/tinyogx360',
        name: 'tinyogx360',
        description: '',
      }
      giteaDB.getRepoInfo.mockReturnValue(Promise.resolve(repoInfo))
      // first we reset HEAD/master to an exact version of the repo
      // so future changes of the repo don't affect this test
      const hash = '3f945920eb3d161d0f6d43a286d1f6ff2a7174d4'
      const tmpBare = path.join(tmpDir, 'tinyogx360.git')
      await sh`git clone --bare https://github.com/kitspace-test-repos/tinyogx360 ${tmpBare}`
      await sh`cd ${tmpBare} && git update-ref HEAD ${hash}`
      await sh`git clone --bare ${tmpBare} ${path.join(
        repoDir,
        'kitspace-test-repos/tinyogx360.git',
      )}`

      await dispatchRepoEvent(giteaDB, repoInfo, repoEventFixture)

      const files = [
        'kitspace-yaml.json',
        `_/tinyogx360-${hash.slice(0, 7)}-gerbers.zip`,
        ...standardProjectFiles.map(f => `_/${f}`),
      ]

      await waitForDone({ projectName: '_' })

      for (const f of files) {
        const p = path.join(
          DATA_DIR,
          PROCESSOR_ASSET_VERSION,
          `kitspace-test-repos/tinyogx360/${hash}/${f}`,
        )
        expect(s3.exists).toHaveBeenCalledWith(p)
        expect(s3.uploadFileContents).toHaveBeenCalledWith(
          p,
          expect.anything(),
          expect.anything(),
        )
      }
    })

    it('processes project with special characters in `gerbers` path', async function () {
      const repoInfo: giteaDBImported.RepoInfo = {
        id: '1',
        is_mirror: true,
        is_empty: false,
        owner_name: 'kitspace-test-repos',
        default_branch: 'master',
        original_url:
          'https://github.com/kitspace-test-repos/spaces-in-kitspace-data-paths',
        name: 'spaces-in-kitspace-data-paths',
        description: '',
      }

      giteaDB.getRepoInfo.mockReturnValue(Promise.resolve(repoInfo))
      // first we reset HEAD/master to an exact version of the repo
      // so future changes of the repo don't affect this test
      const hash = 'eacd4ccc160c4ff7cfa9ca5d0047c90ff3f95d42'
      const tmpBare = path.join(tmpDir, 'spaces-in-kitspace-data-paths.git')
      await sh`git clone --bare https://github.com/kitspace-test-repos/spaces-in-kitspace-data-paths ${tmpBare}`
      await sh`cd ${tmpBare} && git update-ref HEAD ${hash}`
      await sh`git clone --bare ${tmpBare} ${path.join(
        repoDir,
        'kitspace-test-repos/spaces-in-kitspace-data-paths.git',
      )}`

      await dispatchRepoEvent(giteaDB, repoInfo, repoEventFixture)

      const projectName = 'aux-ps-cs'
      const files = [
        'kitspace-yaml.json',
        `${projectName}/${projectName}-${hash.slice(0, 7)}-gerbers.zip`,
        ...standardProjectFiles.map(f => path.join(projectName, f)),
      ]

      await waitForDone({ projectName })

      for (const f of files) {
        const p = path.join(
          DATA_DIR,
          PROCESSOR_ASSET_VERSION,
          `kitspace-test-repos/spaces-in-kitspace-data-paths/${hash}/${f}`,
        )
        expect(s3.exists).toHaveBeenCalledWith(p)
        expect(s3.uploadFileContents).toHaveBeenCalledWith(
          p,
          expect.anything(),
          expect.anything(),
        )
      }
    })

    it('generates correct images when `eda` is specified', async function () {
      const repoInfo: giteaDBImported.RepoInfo = {
        id: '1',
        is_mirror: true,
        is_empty: false,
        owner_name: 'kitspace-test-repos',
        default_branch: 'master',
        original_url: 'https://github.com/kitspace-test-repos/rover',
        name: 'rover',
        description: '',
      }

      giteaDB.getRepoInfo.mockReturnValue(Promise.resolve(repoInfo))
      // first we reset HEAD/master to an exact version of the repo
      // so future changes of the repo don't affect this test
      const hash = '4cb9f9a659b4b68e57fde0d5c2d2930157157c96'
      const tmpBare = path.join(tmpDir, 'kitspace-test-repos/rover.git')
      await sh`git clone --bare https://github.com/kitspace-test-repos/rover ${tmpBare}`
      await sh`cd ${tmpBare} && git update-ref HEAD ${hash}`
      await sh`git clone --bare ${tmpBare} ${path.join(
        repoDir,
        'kitspace-test-repos/rover.git',
      )}`

      await dispatchRepoEvent(giteaDB, repoInfo, repoEventFixture)

      const projectName = 'open-source-rover-shield'

      await waitForDone({ projectName })

      const topCall = s3.uploadFileContents.mock.calls.find(([f]) =>
        f.endsWith(`${projectName}/images/top.png`),
      )
      assert(topCall != null)
      expect(topCall).toHaveLength(3)

      const topHashExpected = 'ce39d383a091f4b2ba41509606bbbbf4'
      const topContents = topCall[1]
      const topHash = crypto.createHash('md5').update(topContents).digest('hex')
      assert(
        topHash === topHashExpected,
        `hash of top.png doesn't match expected. topHash=${topHash} !== topHashExpected=${topHashExpected}`,
      )
    })

    it('plot gerbers if the `gerbers` path is archive', async function () {
      const repoInfo: giteaDBImported.RepoInfo = {
        id: '1',
        is_mirror: true,
        is_empty: false,
        owner_name: 'kitspace-test-repos',
        default_branch: 'main',
        original_url: 'https://github.com/kitspace-test-repos/The-Open-Book',
        name: 'the-open-book',
        description: '',
      }

      giteaDB.getRepoInfo.mockReturnValue(Promise.resolve(repoInfo))
      // first we reset HEAD/master to an exact version of the repo
      // so future changes of the repo don't affect this test
      const hash = 'ffd5be064b6db3cff5ef8a93c00232e580ce704c'
      const tmpBare = path.join(tmpDir, 'kitspace-test-repos/the-open-book.git')
      await sh`git clone --bare https://github.com/kitspace-test-repos/The-Open-Book ${tmpBare}`
      await sh`cd ${tmpBare} && git update-ref HEAD ${hash}`
      await sh`git clone --bare ${tmpBare} ${path.join(
        repoDir,
        'kitspace-test-repos/the-open-book.git',
      )}`

      await dispatchRepoEvent(giteaDB, repoInfo, repoEventFixture)

      const projectName = 'Open-Book-Abridged'

      const files = [...standardProjectFiles.map(f => path.join(projectName, f))]

      await waitForDone({ projectName })

      for (const f of files) {
        const p = path.join(
          DATA_DIR,
          PROCESSOR_ASSET_VERSION,
          `kitspace-test-repos/the-open-book/${hash}/${f}`,
        )
        expect(s3.exists).toHaveBeenCalledWith(p)
        expect(s3.uploadFileContents).toHaveBeenCalledWith(
          p,
          expect.anything(),
          expect.anything(),
        )
      }
    })

    afterEach(async function () {
      await app.stop()
      await sh`rm -rf ${tmpDir}`
      vi.clearAllMocks()
    }, timeout)
  },
  { timeout },
)

async function waitForDone({ projectName }): Promise<void> {
  const checkFn = async () =>
    s3.uploadFileContents.mock.calls.some(
      ([filepath, contents]) =>
        filepath.endsWith(`${projectName}/processor-report.json`) &&
        JSON.parse(contents as string).status === 'done',
    )
  const isDone = await waitFor(checkFn, { timeoutMs: timeout })
  assert(isDone, 'waitForDone timed out')
}
