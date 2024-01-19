import { LOG_LEVEL } from './env.js'

const logLevels: ReadonlyArray<string> = ['debug', 'info', 'warn', 'error']

const level = logLevels.indexOf(LOG_LEVEL)

const getTimeString = () => {
  const now = new Date()
  const isoString = `[${now.toISOString().split('.')[0]}Z] `
  return isoString
}

/* eslint-disable no-console */
export const log = {
  debug:
    level <= 0
      ? (...args: Array<unknown>) => console.debug(getTimeString(), ...args)
      : () => {},
  info:
    level <= 1
      ? (...args: Array<unknown>) => console.info(getTimeString(), ...args)
      : () => {},
  warn:
    level <= 2
      ? (...args: Array<unknown>) => console.warn(getTimeString(), ...args)
      : () => {},
  error:
    level <= 3
      ? (...args: Array<unknown>) => console.error(getTimeString(), ...args)
      : () => {},
}
