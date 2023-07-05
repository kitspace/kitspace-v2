import 'cypress-wait-until'

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

Cypress.Commands.add('importRepo', (remoteUrl, repoName, user) => {
  cy.createGiteaUser(user).then(giteaUser => {
    cy.mirrorRepo(remoteUrl, repoName, giteaUser)
  })
  cy.waitForStatusCode(
    `http://gitea.kitspace.test:3000/${user.username}/${repoName}`,
  )
})

Cypress.Commands.add('mirrorRepo', (remoteRepo, repoName, user) => {
  const endpoint = 'http://gitea.kitspace.test:3000/api/v1/repos/migrate'
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `token ${Cypress.env('GITEA_ADMIN_TOKEN')}`,
  }

  const giteaOptions = {
    clone_addr: remoteRepo,
    uid: user.id,
    repo_name: repoName,
    mirror: true,
    wiki: false,
    private: false,
    pull_requests: false,
    releases: true,
    issues: false,
    service: 'github',
  }

  cy.request({
    url: endpoint,
    method: 'POST',
    headers,
    body: JSON.stringify(giteaOptions),
    failOnStatusCode: false,
  }).then(response => {
    if (!response.status === 201) {
      throw new Error('Failed to mirror repo')
    }
  })
})

Cypress.Commands.add('createGiteaUser', user => {
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `token ${Cypress.env('GITEA_ADMIN_TOKEN')}`,
  }

  const url = 'http://gitea.kitspace.test:3000/api/v1/admin/users'

  // check if the user already exists
  cy.request({
    url: `http://gitea.kitspace.test:3000/api/v1/users/${user.username}`,
    method: 'GET',
    headers,
    failOnStatusCode: false,
  }).then(response => {
    if (response.status === 200) {
      return response.body
    }
    // if the user doesn't exist, create a new user and return the user object.
    return cy
      .request({
        url,
        method: 'POST',
        headers,
        body: JSON.stringify(user),
        failOnStatusCode: false,
      })
      .then(response => {
        if (response.status !== 201) {
          throw new Error('Failed to create user')
        }
        return response.body
      })
  })
})

Cypress.Commands.add(
  'waitForStatusCode',
  (url, timeout = 60_000, interval = 1000) => {
    cy.log(`Waiting for HTTP request to ${url} to return status 200...`)

    cy.waitUntil(
      () => {
        return cy
          .request({ url, method: 'GET', failOnStatusCode: false })
          .its('status')
          .then(status => {
            if (status === 200) {
              return true
            }
            cy.log(`Got status ${status}, retrying...`)
            return false
          })
      },
      { timeout, interval },
    )
  },
)
