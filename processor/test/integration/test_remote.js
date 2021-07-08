const supertest = require('supertest')
const assert = require('assert')
const cp = require('child_process')
const util = require('util')
const path = require('path')

const exec = util.promisify(cp.exec)

const { createApp } = require('../../src/app')

const tmpDir = '/tmp/kitspace-processor-test-from-remote'
const emptyRepoDir = '/tmp/kitspace-proecessor-test-empty-repo-dir'

describe('remote API', () => {
  beforeEach(async () => {
    await exec(`mkdir -p ${tmpDir}`)
    await exec(`mkdir -p ${emptyRepoDir}`)
    this.app = createApp(emptyRepoDir)
    this.supertest = supertest(this.app)
  })

  it('creates app', async () => {
    assert(this.app != null)
  })

  it('accepts post on /process-file ', async () => {
    await this.supertest
      .post('/process-file')
      .attach('upload', path.join(__dirname, 'fixtures/push-on-hold-off.kicad_pcb'))
      .expect(200)
  })

  it('gives a 422 error when no file uploaded ', async () => {
    await this.supertest
      .post('/process-file')
      .expect(422)
  })

  afterEach(async () => {
    this.app.stop()
    await exec(`rm -rf ${tmpDir}`)
  })
})
