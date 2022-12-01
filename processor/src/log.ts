import { LOG_LEVEL } from './env.js'

const logLevels: ReadonlyArray<string> = ['debug', 'info', 'warn', 'error']

const level = logLevels.indexOf(LOG_LEVEL)

/* eslint-disable no-console */
export const log = {
  debug: level <= 0 ? console.debug : () => {},
  info: level <= 1 ? console.info : () => {},
  warn: level <= 2 ? console.warn : () => {},
  error: level <= 3 ? console.error : () => {},
}
