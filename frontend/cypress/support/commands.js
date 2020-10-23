const signUpEndpoint = 'http://gitea.kitspace.test:3000/user/kitspace/sign_up'
const signInEndpoint = 'http://gitea.kitspace.test:3000/user/kitspace/sign_in'
const signOutEndpoint = 'http://gitea.kitspace.test:3000/user/logout'

Cypress.Commands.add('createUser', (username, email, password) => {
  cy.request({
    url: signUpEndpoint,
    method: 'POST',
    body: { username, email, password },
    failOnStatusCode: false,
  })
})

Cypress.Commands.add('signUp', (username, email, password) => {
  cy.createUser(username, email, password)

  cy.get('input[name=username]').clear().type(username)
  cy.get('input[name=email]').clear().type(email)
  cy.get('input[name=password]').clear().type(password)

  cy.get('button').contains('Sign up').click()
})

Cypress.Commands.add('signIn', (username, password) => {
  cy.request({
    url: signInEndpoint,
    method: 'POST',
    body: { username, password },
    failOnStatusCode: false,
  })

  cy.get('input[name=username]').clear().type(username)
  cy.get('input[name=password]').clear().type(password)

  cy.get('button').contains('Login').click()
})

Cypress.Commands.add('signOut', () => {
  cy.get('#logout').click()
})

Cypress.Commands.add('stubSignUpReq', (ok, response) => {
  cy.visit('/login?sign_up', {
    onBeforeLoad(win) {
      cy.stub(win, 'fetch')
        .withArgs(signUpEndpoint)
        .resolves({
          ok,
          json: () => response,
        })
    },
  })
})

Cypress.Commands.add('stubSignInReq', (ok, response) => {
  cy.visit('/login', {
    onBeforeLoad(win) {
      cy.stub(win, 'fetch')
        .withArgs(signInEndpoint)
        .resolves({
          ok,
          json: () => response,
        })
    },
  })
})

Cypress.Commands.add('goToUsersAdminPanel', () => {
  // Users database are at `{gitea}/admin/users`
  // Kitspace user interaction should appear there.

  cy.visit('http://gitea.kitspace.test:3000/user/login')
  cy.get('input#user_name').type(Cypress.env('GITEA_ADMIN_USERNAME'))
  cy.get('input#password').type(Cypress.env('GITEA_ADMIN_PASSWORD'))
  cy.get('button').click()
  cy.visit('http://gitea.kitspace.test:3000/admin/users?sort=newest')
})
