import assert from 'assert'
import cp from 'node:child_process'
import path from 'node:path'
import supertest from 'supertest'
import util from 'node:util'

import { createApp } from '../../src/app.js'
import { delay } from '../../src/utils.js'

const exec = util.promisify(cp.exec)

const tmpDir = '/data/test/temp/kitspace-processor-test-from-folder'
const repoDir = path.join(tmpDir, 'repos')
const sourceRepo = path.join(tmpDir, 'source-repo')

const standardProjectFiles = [
  'images/bottom.svg',
  'images/top.svg',
  'images/top.png',
  'images/top-large.png',
  'images/top-meta.png',
  'images/top-with-background.png',
  'images/layout.svg',
  '1-click-BOM.tsv',
  'interactive_bom.json',
  'gerber-info.json',
  'bom-info.json',
]

describe('projects API', function () {
  beforeEach(async function () {
    await exec(`mkdir -p ${tmpDir}`)
    await exec(`mkdir -p ${repoDir}`)
    this.app = createApp(repoDir, { giteaDB: null })
    this.supertest = supertest(this.app)
  })

  it('creates app', async function () {
    assert(this.app != null)
  })

  it('sends status on root', async function () {
    const r = await this.supertest.get('/').expect(200)
    assert(r.body.status, 'No status in response')
  })

  it('404s a file', async function () {
    await this.supertest.get('/files/user/project/HEAD/top.png').expect(404)
  })

  it('404s status', async function () {
    await this.supertest.get('/files/user/project/HEAD/top.png').expect(404)
  })

  it('reports status of failed processing', async function () {
    // make a simple git repo without the right files
    await exec(`mkdir -p ${sourceRepo}`)
    await exec(
      `cd ${sourceRepo} && git init && git config user.email "email@example.com" && git config user.name "Example Name" && touch test-file && git add test-file && git commit -m 'Initial commit'`,
    )
    // gitea uses bare repos, so we clone it into one
    await exec(
      `git clone --bare ${sourceRepo} ${path.join(repoDir, 'user/project.git')}`,
    )
    // at first it may not be processing yet so we get a 404
    let r = await this.supertest.get('/status/user/project/HEAD/images/top.png')
    while (r.status === 404) {
      r = await this.supertest.get('/status/user/project/HEAD/images/top.png')
      await delay(10)
    }

    // after a while it should report something
    assert(r.status === 200)
    // but it's probably 'in_progress'
    while (r.body.status === 'in_progress') {
      r = await this.supertest.get('/status/user/project/HEAD/images/top.png')
      await delay(10)
    }

    // at some point it should notice it failed
    assert(r.status === 200)
    assert(r.body.status === 'failed')

    // getting the file from HEAD should re-direct to the exact hash
    r = await this.supertest.get('/files/user/project/HEAD/images/top.png')
    assert(r.status === 302, `expected 302 but got ${r.status}`)

    // the file should report a 424 http error
    r = await this.supertest
      .get('/files/user/project/HEAD/images/top.png')
      .redirects()
    assert(r.status === 424, `expected 424 but got ${r.status}`)
  })

  const testRuler = hash =>
    async function () {
      // first we reset HEAD/master to an exact version of the ruler repo
      // so future changes of the repo don't affect this test
      const tmpBare = path.join(tmpDir, 'ruler.git')
      await exec(`git clone --bare https://github.com/kitspace/ruler ${tmpBare}`)
      await exec(`cd ${tmpBare} && git update-ref HEAD ${hash}`)
      await exec(
        `git clone --bare ${tmpBare} ${path.join(repoDir, 'kitspace/ruler.git')}`,
      )

      const files = [
        `ruler-${hash.slice(0, 7)}-gerbers.zip`,
        'kitspace-yaml.json',
        ...standardProjectFiles,
      ]

      for (const f of files) {
        // at first it may not be processing yet so we get a 404
        let r = await this.supertest.get(`/status/kitspace/ruler/HEAD/${f}`)
        while (r.status === 404) {
          r = await this.supertest.get(`/status/kitspace/ruler/HEAD/${f}`)
          await delay(10)
        }

        // after a while it should report something
        assert(r.status === 200)
        // but it's probably 'in_progress'
        while (r.body.status === 'in_progress') {
          r = await this.supertest.get(`/status/kitspace/ruler/HEAD/${f}`)
          await delay(10)
        }

        // at some point it should notice it succeeded
        assert(r.status === 200)
        assert(
          r.body.status === 'done',
          `expecting body.status to be 'done' but got '${r.body.status
          }' for ${f}\n${JSON.stringify(r.body, null, 2)}`,
        )

        // getting the file from HEAD should re-direct to the exact hash
        r = await this.supertest.get(`/files/kitspace/ruler/HEAD/${f}`)
        assert(r.status === 302, `expected 302 but got ${r.status} for ${f}`)

        // it serves up the file
        r = await this.supertest.get(`/files/kitspace/ruler/HEAD/${f}`).redirects()
        assert(r.status === 200, `expected 200 but got ${r.status} for ${f}`)
        assert(
          r.req.path.includes(hash),
          `expected '${r.req.path}' to include '${hash}'`,
        )

        // uppercase user and project name shouldn't matter
        r = await this.supertest.get(`/files/KITSPACE/RULER/HEAD/${f}`).redirects()
        assert(
          r.status === 200,
          `expected 200 but got ${r.status} for KITSPACE/RULER/${f}`,
        )
      }
    }

  const kicadHash = '2af1eef430b2382d22d3c8a95abe18ccc1ee5dc7'
  const nonKicadHash = 'f8bdf1d0c358f88b70a8306c6855538ac933914e'
  it('processes the kitspace ruler project', testRuler(nonKicadHash))
  it('processes the kitspace ruler project with eda: kicad', testRuler(kicadHash))

  it('processes a multi project correctly', async function () {
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

    for (const projectName of ['alpha-spectrometer', 'electron-detector']) {
      const projectFiles = standardProjectFiles.map(f => path.join(projectName, f))
      const files = [
        `${projectName}/${projectName}-${hash.slice(0, 7)}-gerbers.zip`,
        'kitspace-yaml.json',
        ...projectFiles,
      ]

      for (const f of files) {
        // at first it may not be processing yet so we get a 404
        let r = await this.supertest.get(
          `/status/kitspace-forks/diy_particle_detector/HEAD/${f}`,
        )
        while (r.status === 404) {
          r = await this.supertest.get(
            `/status/kitspace-forks/diy_particle_detector/HEAD/${f}`,
          )
          await delay(10)
        }

        // after a while it should report something
        assert(r.status === 200)
        // but it's probably 'in_progress'
        while (r.body.status === 'in_progress') {
          r = await this.supertest.get(
            `/status/kitspace-forks/diy_particle_detector/HEAD/${f}`,
          )
          await delay(10)
        }

        // at some point it should notice it succeeded
        assert(r.status === 200)
        assert(
          r.body.status === 'done',
          `expecting body.status to be 'done' but got '${r.body.status}' for ${f}` +
          `\n ${JSON.stringify(r.body, null, 2)}`,
        )

        // getting the file from HEAD should re-direct to the exact hash
        r = await this.supertest.get(
          `/files/kitspace-forks/diy_particle_detector/HEAD/${f}`,
        )
        assert(r.status === 302, `expected 302 but got ${r.status} for ${f}`)

        // it serves up the file
        r = await this.supertest
          .get(`/files/kitspace-forks/diy_particle_detector/HEAD/${f}`)
          .redirects()
        assert(r.status === 200, `expected 200 but got ${r.status} for ${f}`)
        assert(
          r.req.path.includes(hash),
          `expected '${r.req.path}' to include '${hash}'`,
        )

        // uppercase user and project name shouldn't matter
        r = await this.supertest
          .get(`/files/KITSPACE-FORKS/DIY_particle_detector/HEAD/${f}`)
          .redirects()
        assert(r.status === 200, `expected 200 but got ${r.status} for ${f}`)
      }
    }
  })

  it('process projects that has assets in hidden folders (.kitspace)', async function () {
    // first we reset HEAD/master to an exact version of the repo
    // so future changes of the repo don't affect this test
    const hash = '3f945920eb3d161d0f6d43a286d1f6ff2a7174d4'
    const tmpBare = path.join(tmpDir, 'tinyogx360.git')
    await exec(`git clone --bare https://github.com/kitspace-test-repos/tinyogx360 ${tmpBare}`)
    await exec(`cd ${tmpBare} && git update-ref HEAD ${hash}`)
    await exec(
      `git clone --bare ${tmpBare} ${path.join(repoDir, 'kitspace-test-repos/tinyogx360.git')}`,
    )

    const files = [
      `tinyogx360-${hash.slice(0, 7)}-gerbers.zip`,
      'kitspace-yaml.json',
      // We don't plot eagle files
      ...standardProjectFiles.filter(asset => asset === 'images/top.svg'),
    ]

    for (const f of files) {
      // at first it may not be processing yet so we get a 404
      let r = await this.supertest.get(`/status/kitspace-test-repos/tinyogx360/HEAD/${f}`)
      while (r.status === 404) {
        r = await this.supertest.get(`/status/kitspace-test-repos/tinyogx360/HEAD/${f}`)
        await delay(10)
      }

      // after a while it should report something
      assert(r.status === 200)
      // but it's probably 'in_progress'
      while (r.body.status === 'in_progress') {
        r = await this.supertest.get(`/status/kitspace-test-repos/tinyogx360/HEAD/${f}`)
        await delay(10)
      }

      // at some point it should notice it succeeded
      assert(r.status === 200)
      assert(
        r.body.status === 'done',
        `expecting body.status to be 'done' but got '${r.body.status
        }' for ${f}\n${JSON.stringify(r.body, null, 2)}`,
      )

      // getting the file from HEAD should re-direct to the exact hash
      r = await this.supertest.get(`/files/kitspace-test-repos/tinyogx360/HEAD/${f}`)
      assert(r.status === 302, `expected 302 but got ${r.status} for ${f}`)

      // it serves up the file
      r = await this.supertest.get(`/files/kitspace-test-repos/tinyogx360/HEAD/${f}`).redirects()
      assert(r.status === 200, `expected 200 but got ${r.status} for ${f}`)
      assert(
        r.req.path.includes(hash),
        `expected '${r.req.path}' to include '${hash}'`,
      )
    }
  })

  it('process projects with special characters in `gerbers` path', async function () {
    // first we reset HEAD/master to an exact version of the repo
    // so future changes of the repo don't affect this test
    const hash = 'ee609be1f1de831ed235b38db9808190aaf5e463'
    const tmpBare = path.join(tmpDir, 'spaces-in-kitspace-data-paths.git')
    await exec(`git clone --bare https://github.com/kitspace-test-repos/spaces-in-kitspace-data-paths ${tmpBare}`)
    await exec(`cd ${tmpBare} && git update-ref HEAD ${hash}`)
    await exec(
      `git clone --bare ${tmpBare} ${path.join(repoDir, 'kitspace-test-repos/spaces-in-kitspace-data-paths.git')}`,
    )

    const projectName = 'aux-ps-cs'
    const files = [
      `${projectName}/${projectName}-${hash.slice(0, 7)}-gerbers.zip`,
      'kitspace-yaml.json',
      'gerber-info.json'
    ]

    for (const f of files) {
      // at first it may not be processing yet so we get a 404
      let r = await this.supertest.get(
        `/status/kitspace-test-repos/spaces-in-kitspace-data-paths/HEAD/${f}`,
      )
      while (r.status === 404) {
        r = await this.supertest.get(
          `/status/kitspace-test-repos/spaces-in-kitspace-data-paths/HEAD/${f}`,
        )
        await delay(10)
      }

      // after a while it should report something
      assert(r.status === 200)
      // but it's probably 'in_progress'
      while (r.body.status === 'in_progress') {
        r = await this.supertest.get(
          `/status/kitspace-test-repos/spaces-in-kitspace-data-paths/HEAD/${f}`,
        )
        await delay(10)
      }

      // at some point it should notice it succeeded
      assert(r.status === 200)
      assert(
        r.body.status === 'done',
        `expecting body.status to be 'done' but got '${r.body.status}' for ${f}` +
        `\n ${JSON.stringify(r.body, null, 2)}`,
      )

      // it serves up the file
      r = await this.supertest
        .get(`/files/kitspace-test-repos/spaces-in-kitspace-data-paths/HEAD/${f}`)
        .redirects()
      assert(r.status === 200, `expected 200 but got ${r.status} for ${f}`)
      assert(
        r.req.path.includes(hash),
        `expected '${r.req.path}' to include '${hash}'`,
      )
    }
  })

  afterEach(async function () {
    await this.app.stop()
    await exec(`rm -rf ${tmpDir}`)
  })
})
