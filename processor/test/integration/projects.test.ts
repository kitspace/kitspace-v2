import assert from 'assert'
import { Index, SearchResponse } from 'meilisearch'
import cp from 'node:child_process'
import path from 'node:path'
import util from 'node:util'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { any, mock, MockProxy } from 'vitest-mock-extended'
import { createApp, KitspaceProcessorApp } from '../../src/app.js'
import { DATA_DIR } from '../../src/env.js'
import { giteaDB as giteaDBImported, GiteaDB, RepoInfo } from '../../src/giteaDB.js'
import { s3 as s3Imported, S3 } from '../../src/s3.js'
import { delay } from '../../src/utils.js'

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
  s3.uploadFile.mockImplementation((filepath, contentType) =>
    s3.uploadFileContents(filepath, '', contentType),
  )
  return { s3 }
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

        // wait for the processor-report.json upload that happens when processing
        // is done
        let isDone = false
        while (!isDone) {
          await delay(10)
          isDone = s3.uploadFileContents.mock.calls.some(([f]) =>
            f.endsWith('processor-report.json'),
          )
        }

        for (const f of files) {
          const p = path.join(DATA_DIR, `files/kitspace/ruler/${hash}/${f}`)
          expect(s3.exists).toHaveBeenCalledWith(p)
          expect(s3.uploadFileContents).toHaveBeenCalledWith(p, any(), any())
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
        // wait for the processor-report.json upload that happens when processing
        // is done
        let isDone = false
        while (!isDone) {
          await delay(10)
          isDone = s3.uploadFileContents.mock.calls.some(([f]) =>
            f.endsWith(`${projectName}/processor-report.json`),
          )
        }
      }

      for (const p of files) {
        expect(s3.exists).toHaveBeenCalledWith(p)
        expect(s3.uploadFileContents).toHaveBeenCalledWith(p, any(), any())
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

      // wait for the processor-report.json upload that happens when processing
      // is done
      let isDone = false
      while (!isDone) {
        await delay(10)
        isDone = s3.uploadFileContents.mock.calls.some(([f]) =>
          f.endsWith('processor-report.json'),
        )
      }

      for (const f of files) {
        const p = path.join(
          DATA_DIR,
          `files/kitspace-test-repos/tinyogx360/${hash}/${f}`,
        )
        expect(s3.exists).toHaveBeenCalledWith(p)
        expect(s3.uploadFileContents).toHaveBeenCalledWith(p, any(), any())
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

      // wait for the processor-report.json upload that happens when processing
      // is done
      let isDone = false
      while (!isDone) {
        await delay(10)
        isDone = s3.uploadFileContents.mock.calls.some(([f]) =>
          f.endsWith('processor-report.json'),
        )
      }

      for (const f of files) {
        const p = path.join(
          DATA_DIR,
          `files/kitspace-test-repos/spaces-in-kitspace-data-paths/${hash}/${f}`,
        )
        expect(s3.exists).toHaveBeenCalledWith(p)
        expect(s3.uploadFileContents).toHaveBeenCalledWith(p, any(), any())
      }
    })

    afterEach(async function () {
      await app.stop()
      await exec(`rm -rf ${tmpDir}`)
      vi.clearAllMocks()
    })
  },
  { timeout: 120_000 },
)
