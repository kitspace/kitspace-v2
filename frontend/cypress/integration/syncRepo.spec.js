import faker from 'faker'

describe('Syncing a project behavior validation', () => {
  const username = faker.unique(faker.name.firstName)
  const email = faker.unique(faker.internet.email)
  const password = '123456'

  const syncedRepoUrl = 'https://github.com/AbdulrhmnGhanem/light-test-repo'
  const repoName = 'light-test-repo'

  before(() => {
    /*
     * The purpose of this isn't actually visiting the homepage.
     * Sometimes, the frontend has a slow startup time which results in a random failure.
     */
    cy.visit('/')
  })

  it('should sync a repo on gitea', () => {
    cy.clearCookies()
    cy.intercept('http://gitea.kitspace.test:3000/user/kitspace/**').as('sign_in')

    cy.createUser(username, email, password)
    cy.visit('/login')
    cy.signIn(username, password)
    cy.wait('@sign_in')

    cy.visit('/projects/new')

    cy.intercept('http://gitea.kitspace.test:3000/api/v1/repos/migrate**').as(
      'sync',
    )

    cy.url().then(url => {
      if (!url.endsWith('/projects/new')) {
        cy.visit('/projects/new')
      }
    })
    cy.get('input:first').type(syncedRepoUrl)
    cy.get('button').contains('Sync').click()
    cy.wait('@sync')

    // Go to Gitea dashboard and assert the repo has been migrated
    cy.visit(`http://gitea.kitspace.test:3000/${username}`)
    cy.get('.ui.repository.list').children().get('.header').contains(repoName)

    // assert the repo is on `{frontend}/projects/mine`
    cy.visit(`/${username}`)
    cy.get('.ui.card').contains(repoName)
  })
})
