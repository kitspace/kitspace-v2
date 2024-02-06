import fetch from 'node-fetch'

import { log } from './log.js'

/**
 * Check the health of the partinfo.kitspace.org by checking the graphql IDE
 */
export async function checkPartInfoHealth() {
  const endpoint = 'https://partinfo.kitspace.org/graphql'
  const res = await fetch(endpoint, {
    headers: {
      accept: 'text/html',
    },
  })
  if (res.status !== 200) {
    log.error(`${endpoint} health check failed with status ${res.status}`)
    // throw new Error(`${endpoint} health check failed with status ${res.status}`)
  } else {
    log.debug(`${endpoint} health check passed`)
  }
}
