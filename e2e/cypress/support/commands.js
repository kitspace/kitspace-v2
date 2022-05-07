const signUpEndpoint = 'http://gitea.kitspace.test:3000/user/kitspace/sign_up'
const signInEndpoint = 'http://gitea.kitspace.test:3000/user/kitspace/sign_in'

Cypress.Commands.add('createUser', (username, email, password) => {
  cy.request({
    url: signUpEndpoint,
    method: 'POST',
    body: { username, email, password },
    failOnStatusCode: false,
  })
})

Cypress.Commands.add('signUp', (username, email, password) => {
  cy.get('input[name=username]').clear().type(username)
  cy.get('input[name=email]').clear().type(email)
  cy.get('input[name=password]').clear().type(password)

  cy.get('button').contains('Sign up').click()
})

Cypress.Commands.add('signIn', (username, password) => {
  cy.get('[data-cy=page-container] .menu .item')
    .contains('Login')
    .click({ timeout: 10000 })
  cy.get('input[name=username]').clear().type(username, { force: true })
  cy.get('input[name=password]').clear().type(password, { force: true })

  cy.get('button').contains('Login').click()
})

Cypress.Commands.add('signOut', () => {
  cy.wait(100)
  cy.window().then(win => {
    if (win.session?.user != null) {
      cy.get('#logout').click()
    }
  })
})

// credits https://gist.github.com/ZwaarContrast/00101934954980bcaa4ae70ac9930c60
Cypress.Commands.add(
  'dropFiles',
  { prevSubject: 'element' },
  (subject, files, fileNames) => {
    cy.window().then(win => {
      const filesContent = files.map((f, idx) => {
        const blob = Cypress.Blob.base64StringToBlob(f)
        return new win.File([blob], fileNames[idx])
      })
      cy.wait(500)
      cy.wrap(subject).trigger('drop', {
        dataTransfer: { files: filesContent, types: ['Files'] },
      })
    })
  },
)

Cypress.Commands.add('forceVisit', (path, timeout) => {
  cy.visit('/', { timeout })
  cy.window().then(win => win.open(path, '_self'))
})
