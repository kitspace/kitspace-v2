import 'cypress-fail-fast'
import installLogsCollector from 'cypress-terminal-report/src/installLogsCollector.js'

import './commands'

Cypress.on('uncaught:exception', (err, runnable, promise) => {
  /*
   * Next hot reloading sometimes gets terminated while the tests are running which make cypress fail.
   * NOTE: this isn't a problem when using production config.
   * ----------------------------------------------------------
   * see https://docs.cypress.io/guides/references/migration-guide#Turn-off-uncaught-exception-handling-unhandled-promise-rejections
   * when the exception originated from an unhandled promise
   * rejection, the promise is provided as a third argument
   * you can turn off failing the test in this case
   */
  if (promise) return false
})
installLogsCollector()
