const EventEmitter = require('events')

const events = new EventEmitter()

// increase the default to avoid warnings for our tests
events.setMaxListeners(40)

module.exports = events
