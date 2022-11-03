import assert from 'assert'
import cp from 'node:child_process'
import path from 'node:path'
import supertest from 'supertest'
import util from 'node:util'

import { createApp } from '../../src/app.js'
import { delay } from '../../src/utils.js'

const exec = util.promisify(cp.exec)

const tmpDir =
  '/data/test/temp/kitspace-processor-test-from-folder-readme-processing'
const repoDir = path.join(tmpDir, 'repos')

describe('readme processing', function () {
  beforeEach(async function () {
    await exec(`mkdir -p ${tmpDir}`)
    await exec(`mkdir -p ${repoDir}`)
    this.app = createApp(repoDir, { giteaDB: null })
    this.supertest = supertest(this.app)
  })

  it('processes readme with invalid <a> tags', async function () {
    /*
        This project readme
        * # 8BitmixtapeNEO_ShenzhenReady

        * summary: <a summary for your project> <- This invalid <a>  tag, probably it's meant as a placeholder
        * site: https://8bitmixtape.github.io/NeoWiki
        */
    // first we reset HEAD/master to an exact version of the repo
    // so future changes of the repo don't affect this test
    const hash = 'd8f86818c2ad3206abc9b7a0ed26dfdf672dba10'
    const tmpBare = path.join(tmpDir, '8BitmixtapeNEO_ShenzhenReady.git')
    await exec(
      `git clone --bare https://github.com/kitspace-test-repos/8BitmixtapeNEO_ShenzhenReady ${tmpBare}`,
    )
    await exec(`cd ${tmpBare} && git update-ref HEAD ${hash}`)
    await exec(
      `git clone --bare ${tmpBare} ${path.join(
        repoDir,
        'kitspace-test-repos/8BitmixtapeNEO_ShenzhenReady.git',
      )}`,
    )

    const files = ['kitspace-yaml.json', '_/readme.html']

    for (const f of files) {
      // at first it may not be processing yet so we get a 404
      let r = await this.supertest.get(
        `/status/kitspace-test-repos/8BitmixtapeNEO_ShenzhenReady/HEAD/${f}`,
      )
      while (r.status === 404) {
        r = await this.supertest.get(
          `/status/kitspace-test-repos/8BitmixtapeNEO_ShenzhenReady/HEAD/${f}`,
        )
        await delay(10)
      }

      // after a while it should report something
      assert(r.status === 200)
      // but it's probably 'in_progress'
      while (r.body.status === 'in_progress') {
        r = await this.supertest.get(
          `/status/kitspace-test-repos/8BitmixtapeNEO_ShenzhenReady/HEAD/${f}`,
        )
        await delay(10)
      }

      // at some point it should notice it succeeded
      assert(r.status === 200)
      assert(
        r.body.status === 'done',
        `expecting body.status to be 'done' but got '${
          r.body.status
        }' for ${f}\n${JSON.stringify(r.body, null, 2)}`,
      )
    }
  })

  afterEach(async function () {
    await this.app.stop()
    await exec(`rm -rf ${tmpDir}`)
  })
})
