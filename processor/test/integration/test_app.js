const request = require('supertest')
const assert = require('assert')

const { createApp } = require('../../src/app')

describe('app', () => {
  it('creates app', () => {
    const app = createApp()
    assert(app != null)
    app.stop()
  })
})
