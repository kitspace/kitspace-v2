import { EventEmitter } from 'events'

const events = new EventEmitter()

// increase the default to avoid warnings for our tests
events.setMaxListeners(40)

export default events
