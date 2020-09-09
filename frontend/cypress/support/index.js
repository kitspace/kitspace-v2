import './commands'


Cypress.on('fail', (error, runnable) => {
  debugger

  throw error
})
