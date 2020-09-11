Cypress.Commands.add('signUp', (username, email, password) => {
  cy.request({
    url: 'http://gitea.kitspace.test:3000/user/kitspace/sign_up',
    method: 'POST',
    body: { username, email, password },
    failOnStatusCode: false,
  })

  cy.get('input[name=username]').clear().type(username)
  cy.get('input[name=email]').clear().type(email)
  cy.get('input[name=password]').clear().type(password)

  cy.get('button').contains('Sign up').click()
})

Cypress.Commands.add('stubSignUpReq', (ok, response) => {
  // stub all request to the Gitea `/user/kitspace/sign_up`
  // with a specific response.

  const endpoint = 'http://gitea.kitspace.test:3000/user/kitspace/sign_up'

  cy.visit('/login?sign_up', {
    onBeforeLoad(win) {
      cy.stub(win, 'fetch')
        .withArgs(endpoint)
        .resolves({
          ok,
          json: () => response,
        })
    },
  })
})
