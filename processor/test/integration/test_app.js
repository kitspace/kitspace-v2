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
      `cd ${sourceRepo} && git init && touch test-file && git add test-file && git commit -m 'Initial commit'`,
    )
    // gitea uses bare repos, so we clone it into one
    await exec(
      `git clone --bare ${sourceRepo} ${path.join(repoDir, 'user/project.git')}`,
    )
    // clean up
    await exec(`rm -rf ${sourceRepo}`)
    let r = await this.supertest.get('/status/user/project/HEAD/images/top.png')
    // at first it may not be processing yet so we get a 404
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
  afterEach(async () => {
    this.app.stop()
    await exec(`rm -rf ${repoDir}`)
  })
})
