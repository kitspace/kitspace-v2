const supertest = require('supertest')
const assert = require('assert')

const { createApp } = require('../../src/app')

describe('app', () => {
  beforeEach(() => {
    this.app = createApp('/tmp/repos')
    this.supertest = supertest(this.app)
  })
  it('creates app', () => {
    assert(this.app != null)
  })
  it('404s root', () => {
    return this.supertest.get('/').expect(404)
  })
  it('404s a file', () => {
    return this.supertest.get('/files/user/project/HEAD/top.png').expect(404)
  })
  it('404s status', () => {
    return this.supertest.get('/files/user/project/HEAD/top.png').expect(404)
  })
  afterEach(() => {
    this.app.stop()
  })
})
