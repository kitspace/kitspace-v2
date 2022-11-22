import { Index, SearchResponse } from 'meilisearch'
import assert from 'node:assert'
import cp from 'node:child_process'
import fs from 'node:fs/promises'
import path from 'node:path'
import util from 'node:util'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mock, MockProxy } from 'vitest-mock-extended'
import { createApp, KitspaceProcessorApp } from '../../src/app.js'
import { DATA_DIR } from '../../src/env.js'
import { GiteaDB, giteaDB as giteaDBImported, RepoInfo } from '../../src/giteaDB.js'
import * as s3Imported from '../../src/s3.js'
import { waitFor } from '../../src/utils.js'
import generateImageHash from './generateImageHash.js'

const timeout = 120_000

const exec = util.promisify(cp.exec)

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

/* eslint-disable no-console */
vi.mock('loglevel', () => {
  return {
    default: {
      debug: process.env.LOG_LEVEL === 'debug' ? console.debug : () => {},
      info: console.info,
      error: console.error,
      warn: console.warn,
    },
  }
})

type S3 = typeof s3Imported

vi.mock('../../src/s3.js', () => {
  const s3: MockProxy<S3> = mock<S3>()
  s3.exists.mockReturnValue(Promise.resolve(false))
  s3.existsAll.mockImplementation(filepaths => {
    // call it for every file since we check the `exists` mock calls in our
    // tests
    for (const p of filepaths) {
      s3.exists(p)
    }
    return Promise.resolve(false)
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

vi.mock('../../src/giteaDB.js', () => {
  const giteaDB: MockProxy<GiteaDB> = mock<GiteaDB>()
  giteaDB.waitForNonEmpty.mockReturnValue(Promise.resolve())
  giteaDB.waitForRepoMigration.mockReturnValue(Promise.resolve())
  giteaDB.subscribeToRepoDeletions.mockReturnValue(
    Promise.resolve({ unsubscribe: () => {} }),
  )
  return { giteaDB }
})

const giteaDB = giteaDBImported as MockProxy<GiteaDB>

describe(
  'gitea projects functionality',
  function () {
    let app: KitspaceProcessorApp
    beforeEach(async function () {
      await exec(`mkdir -p ${tmpDir}`)
      await exec(`mkdir -p ${repoDir}`)
      app = createApp(repoDir)
    })

    it('creates app', async function () {
      assert(app != null)
    })

    function generateRulerTest(hash: string) {
      return async function testRuler() {
        const repoInfo: RepoInfo = {
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
        await exec(`git clone --bare https://github.com/kitspace/ruler ${tmpBare}`)
        await exec(`cd ${tmpBare} && git update-ref HEAD ${hash}`)
        await exec(
          `git clone --bare ${tmpBare} ${path.join(repoDir, 'kitspace/ruler.git')}`,
        )

        const files = [
          'kitspace-yaml.json',
          '_/images/layout.svg',
          `_/ruler-${hash.slice(0, 7)}-gerbers.zip`,
          ...standardProjectFiles.map(f => `_/${f}`),
        ]

        await waitForDone({ projectName: '_' })

        for (const f of files) {
          const p = path.join(DATA_DIR, `files/kitspace/ruler/${hash}/${f}`)
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
      const repoInfo: RepoInfo = {
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
      await exec(
        `git clone --bare https://github.com/kitspace-forks/DIY_particle_detector ${tmpBare}`,
      )
      await exec(`cd ${tmpBare} && git update-ref HEAD ${hash}`)
      await exec(
        `git clone --bare ${tmpBare} ${path.join(
          repoDir,
          'kitspace-forks/diy_particle_detector.git',
        )}`,
      )

      const repoRoot = path.join(
        DATA_DIR,
        'files/kitspace-forks/diy_particle_detector',
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
      const repoInfo: RepoInfo = {
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
      await exec(
        `git clone --bare https://github.com/kitspace-test-repos/tinyogx360 ${tmpBare}`,
      )
      await exec(`cd ${tmpBare} && git update-ref HEAD ${hash}`)
      await exec(
        `git clone --bare ${tmpBare} ${path.join(
          repoDir,
          'kitspace-test-repos/tinyogx360.git',
        )}`,
      )

      const files = [
        'kitspace-yaml.json',
        `_/tinyogx360-${hash.slice(0, 7)}-gerbers.zip`,
        ...standardProjectFiles.map(f => `_/${f}`),
      ]

      await waitForDone({ projectName: '_' })

      for (const f of files) {
        const p = path.join(
          DATA_DIR,
          `files/kitspace-test-repos/tinyogx360/${hash}/${f}`,
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
      const repoInfo: RepoInfo = {
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
      await exec(
        `git clone --bare https://github.com/kitspace-test-repos/spaces-in-kitspace-data-paths ${tmpBare}`,
      )
      await exec(`cd ${tmpBare} && git update-ref HEAD ${hash}`)
      await exec(
        `git clone --bare ${tmpBare} ${path.join(
          repoDir,
          'kitspace-test-repos/spaces-in-kitspace-data-paths.git',
        )}`,
      )

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
          `files/kitspace-test-repos/spaces-in-kitspace-data-paths/${hash}/${f}`,
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
      const repoInfo: RepoInfo = {
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
      await exec(
        `git clone --bare https://github.com/kitspace-test-repos/rover ${tmpBare}`,
      )
      await exec(`cd ${tmpBare} && git update-ref HEAD ${hash}`)
      await exec(
        `git clone --bare ${tmpBare} ${path.join(
          repoDir,
          'kitspace-test-repos/rover.git',
        )}`,
      )

      const projectName = 'open-source-rover-shield'

      await waitForDone({ projectName })

      // Got these manually running md5sum on the files
      const topHashFixture = 'fb281b13a0404ba5a1e1f016c85e9251'
      const layoutHashFixture = '20c67554774b93489e068137765602e5'

      const topCall = s3.uploadFileContents.mock.calls.find(([f]) =>
        f.endsWith(`${projectName}/images/top.svg`),
      )
      const layoutCall = s3.uploadFileContents.mock.calls.find(([f]) =>
        f.endsWith(`${projectName}/images/layout.svg`),
      )

      assert(topCall != null)
      assert(layoutCall != null)

      expect(topCall).toHaveLength(3)
      expect(layoutCall).toHaveLength(3)

      const topHash = await generateImageHash(
        Buffer.from(topCall[1] as string, 'utf8'),
      )
      const layoutHash = await generateImageHash(layoutCall[1] as Buffer)

      assert(topHash === topHashFixture, "hash of top.svg doesn't match fixture")
      assert(
        layoutHash === layoutHashFixture,
        "hash of layout.svg doesn't match fixture",
      )
    })

    afterEach(async function () {
      await app.stop()
      await exec(`rm -rf ${tmpDir}`)
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
