import faker from 'faker'

describe('Syncing a project behavior validation', () => {
  const username = faker.name.firstName()
  const email = faker.internet.email()
  const password = '123456'

  const syncedRepoUrl = 'https://github.com/AbdulrhmnGhanem/light-test-repo'
  const repoName = 'light-test-repo'

  before(() => {
    cy.clearCookies()
    cy.intercept('http://gitea.kitspace.test:3000/user/kitspace/**')

    cy.createUser(username, email, password)
  })

  beforeEach(() => {
    // deauthenticate the user and reload the page to update the CSRF token
    cy.clearCookies()
    cy.reload()

    cy.intercept('http://gitea.kitspace.test:3000/user/kitspace/**').as('sign_in')

    cy.visit('/login')
    cy.signIn(username, password)
    cy.wait('@sign_in')
  })

  it('should sync a repo on gitea', () => {
    cy.wait(2000)
    cy.visit('/projects/new')

    cy.get('input:first').type(syncedRepoUrl)
    cy.get('button').contains('Sync').click()
    cy.syncTestRepo()

    // Go to Gitea dashboard and assert the repo has been migrated
    cy.visit(`http://gitea.kitspace.test:3000/${username}`)
    cy.wait(1000)
    cy.get('.ui.repository.list').children().get('.header').contains(repoName)

    // assert the repo is on `{frontend}/projects/mine`
    cy.visit(`/${username}`)
    cy.wait(1000)

    cy.get('.ui.card').contains(repoName)
  })
})
