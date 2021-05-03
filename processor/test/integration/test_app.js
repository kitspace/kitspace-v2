const supertest = require('supertest')
const assert = require('assert')
const cp = require('child_process')
const util = require('util')
const path = require('path')

const exec = util.promisify(cp.exec)

const { createApp } = require('../../src/app')

const tmpDir = '/tmp/kitspace-processor-test'
const repoDir = path.join(tmpDir, 'repos')
const sourceRepo = path.join(tmpDir, 'source-repo')

describe('app', () => {
  beforeEach(async () => {
    await exec(`mkdir -p ${tmpDir}`)
    await exec(`mkdir -p ${repoDir}`)
    this.app = createApp(repoDir)
    this.supertest = supertest(this.app)
  })

  it('creates app', async () => {
    assert(this.app != null)
  })

  it('404s root', async () => {
    await this.supertest.get('/').expect(404)
  })

  it('404s a file', async () => {
    await this.supertest.get('/files/user/project/HEAD/top.png').expect(404)
  })

  it('404s status', async () => {
    await this.supertest.get('/files/user/project/HEAD/top.png').expect(404)
  })

  it('reports status of failed processing', async () => {
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
    }

    // after a while it should report something
    assert(r.status === 200)
    // but it's probably 'in_progress'
    while (r.body.status === 'in_progress') {
      r = await this.supertest.get('/status/user/project/HEAD/images/top.png')
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

  const testRuler = hash => async () => {
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
      'zip-info.json',
      'images/bottom.svg',
      'images/top.svg',
      'images/top.png',
      'images/top-large.png',
      'images/top-meta.png',
      'images/top-with-background.png',
      '1-click-BOM.tsv',
      'info.json',
      'interactive_bom.json',
    ]

    for (const f of files) {
      // at first it may not be processing yet so we get a 404
      let r = await this.supertest.get(`/status/kitspace/ruler/HEAD/${f}`)
      while (r.status === 404) {
        r = await this.supertest.get(`/status/kitspace/ruler/HEAD/${f}`)
      }

      // after a while it should report something
      assert(r.status === 200)
      // but it's probably 'in_progress'
      while (r.body.status === 'in_progress') {
        r = await this.supertest.get(`/status/kitspace/ruler/HEAD/${f}`)
      }

      // at some point it should notice it succeeded
      assert(r.status === 200)
      assert(
        r.body.status === 'done',
        `expecting body.status to be 'done' but got '${r.body.status}'`,
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

  it('processes a multi project correctly', async () => {
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

    const projectFiles = [
      'zip-info.json',
      'images/bottom.svg',
      'images/top.svg',
      'images/top.png',
      'images/top-large.png',
      'images/top-meta.png',
      'images/top-with-background.png',
      '1-click-BOM.tsv',
      'info.json',
      'interactive_bom.json',
    ]

    const files = projectFiles
      .map(f => path.join('alpha-spectrometer', f))
      .concat(projectFiles.map(f => path.join('electron-detector', f)))
      .concat([
        `alpha-spectrometer/alpha-spectrometer-${hash.slice(0, 7)}-gerbers.zip`,
        `electron-detector/electron-detector-${hash.slice(0, 7)}-gerbers.zip`,
      ])

    for (const f of files) {
      // at first it may not be processing yet so we get a 404
      let r = await this.supertest.get(
        `/status/kitspace-forks/diy_particle_detector/HEAD/${f}`,
      )
      while (r.status === 404) {
        r = await this.supertest.get(
          `/status/kitspace-forks/diy_particle_detector/HEAD/${f}`,
        )
      }

      // after a while it should report something
      assert(r.status === 200)
      // but it's probably 'in_progress'
      while (r.body.status === 'in_progress') {
        r = await this.supertest.get(
          `/status/kitspace-forks/diy_particle_detector/HEAD/${f}`,
        )
      }

      // at some point it should notice it succeeded
      assert(r.status === 200)
      assert(
        r.body.status === 'done',
        `expecting body.status to be 'done' but got '${r.body.status}'`,
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
      assert(
        r.status === 200,
        `expected 200 but got ${r.status} for KITSPACE-FORKS/DIY_particle_detector/${f}`,
      )
    }
  })

  afterEach(async () => {
    this.app.stop()
    await exec(`rm -rf ${tmpDir}`)
  })
})
