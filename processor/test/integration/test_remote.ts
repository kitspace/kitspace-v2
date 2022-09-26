import assert from 'assert'
import child_process from 'node:child_process'
import path from 'node:path'
import supertest from 'supertest'
import url from 'node:url'
import util from 'node:util'

import { createApp } from '../../src/app.js'
import { delay } from '../../src/utils.js'

const exec = util.promisify(child_process.exec)

const tmpDir = '/data/test/kitspace-processor-test-from-remote'
const emptyRepoDir = '/data/test/kitspace-processor-test-empty-repo-dir'

const REMOTE_API_TOKEN = process.env.REMOTE_API_TOKENS
  .split(',')
  .map(x => x.trim())
  .filter(x => x)[0]
const __dirname = path.dirname(url.fileURLToPath(import.meta.url))

describe('remote API', function () {
  beforeEach(async function () {
    await exec(`mkdir -p ${tmpDir}`)
    await exec(`mkdir -p ${emptyRepoDir}`)
    this.app = createApp(emptyRepoDir, { giteaDB: null })
    this.supertest = supertest(this.app)
  })

  it('creates app', async function () {
    assert(this.app != null)
  })

  it('rejects posts to /process-file without token', async function () {
    await this.supertest
      .post('/process-file')
      .attach('upload', path.join(__dirname, 'fixtures/push-on-hold-off.kicad_pcb'))
      .expect(403)
  })

  it('accepts post on /process-file ', async function () {
    await this.supertest
      .post('/process-file')
      .set('Authorization', `Bearer ${REMOTE_API_TOKEN}`)
      .attach('upload', path.join(__dirname, 'fixtures/push-on-hold-off.kicad_pcb'))
      .expect(202)
  })

  it('gives a 422 error when no file uploaded ', async function () {
    await this.supertest
      .post('/process-file')
      .set('Authorization', `Bearer ${REMOTE_API_TOKEN}`)
      .expect(422)
  })

  it('plots layout.svg', async function () {
    let r = await this.supertest
      .post('/process-file')
      .set('Authorization', `Bearer ${REMOTE_API_TOKEN}`)
      .attach('upload', path.join(__dirname, 'fixtures/push-on-hold-off.kicad_pcb'))
      .expect(202)
    assert(r.body.id != null)
    const layoutSvgStatus = `/processed/status/${r.body.id}/images/layout.svg`
    const layoutSvg = `/processed/files/${r.body.id}/images/layout.svg`
    r = await this.supertest.get(layoutSvgStatus)
    while (r.body.status === 'in_progress') {
      r = await this.supertest.get(layoutSvgStatus)
      await delay(10)
    }
    assert(r.body.status === 'done')
    r = await this.supertest.get(layoutSvg).expect(200)
  })

  afterEach(async function () {
    await this.app.stop()
    await exec(`rm -rf ${tmpDir}`)
  })
})
