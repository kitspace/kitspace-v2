const signUpEndpoint = 'http://gitea.kitspace.test:3000/user/kitspace/sign_up'
const signInEndpoint = 'http://gitea.kitspace.test:3000/user/kitspace/sign_in'
const giteaApiUrl = 'http://gitea.kitspace.test:3000/api/v1'

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

Cypress.Commands.add('stubSignInReq', (ok, response, path) => {
  cy.visit(path ? path : '/login', {
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

Cypress.Commands.add('stubUpdateProject', (ok, response, projectName) => {
  cy.visit(`/projects/update/${projectName}`, {
    onBeforeLoad(win) {
      cy.stub(win, 'fetch')
        .withArgs(`http://gitea.kitspace.test:3000/api/v1/repos/${projectName}`)
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

  cy.clearCookies()
  cy.reload()
  cy.visit('http://gitea.kitspace.test:3000/user/login')
  cy.wait(1000)
  cy.get('input#user_name').type(Cypress.env('GITEA_ADMIN_USERNAME'))
  cy.get('input#password').type(Cypress.env('GITEA_ADMIN_PASSWORD'))
  cy.get('button').click()
  cy.visit('http://gitea.kitspace.test:3000/admin/users?sort=newest')
})

Cypress.Commands.add('hasProperFields', schema => {
  const formFields = schema.schema().$_terms.keys.map(field => field.key)

  formFields.forEach(field => {
    if (!field.startsWith('_')) {
      // fields starting with `_` are added automatically not by the user
      // e.g., `_csrf` field
      cy.get(`input[name=${field}]`)
    }
  })
})

// credits https://gist.github.com/ZwaarContrast/00101934954980bcaa4ae70ac9930c60
Cypress.Commands.add(
  'dropFiles',
  { prevSubject: 'element' },
  (subject, files, fileNames, username, newProject = true) => {
    // This will match any request made by `utils/giteaApi.createRepo`,
    // The `**` for matching the csrf query param.
    cy.intercept(`${giteaApiUrl}/user/repos**`).as('createRepo')

    // This will match any request for `utils/giteaApi.getRepo`
    cy.intercept(`${giteaApiUrl}/repos/${username}/**`).as('getRepo')

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
    const waitedRequests = newProject ? ['@createRepo', '@getRepo'] : '@getRepo'
    // Wait until getting a response from the server
    cy.wait(waitedRequests, { timeout: 20_000 })
  },
)
