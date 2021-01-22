import faker from 'faker'

describe('Syncing a project behavior validation', () => {
  const username = faker.name.firstName()
  const email = faker.internet.email()
  const password = '123456'

  before(() => {
    cy.clearCookies()
    cy.intercept('http://gitea.kitspace.test:3000/user/kitspace/**')

    cy.createUser(username, email, password)
  })

  beforeEach(() => {
    cy.visit('/login')
    cy.signIn(username, password)
  })

  it('should sync a repo on gitea', () => {
    const syncedRepoUrl = 'https://github.com/AbdulrhmnGhanem/light-test-repo'
    const repoName = 'light-test-repo'

    cy.visit('/projects/new')
    cy.get('input:first').type(syncedRepoUrl)
    cy.get('button').contains('Sync').click()
    cy.syncTestRepo()

    // Go to Gitea dashboard and assert the repo has been migrated
    cy.visit(`http://gitea.kitspace.test:3000/${username}`)
    cy.get('.ui.repository.list').children().get('.header').contains(repoName)

    cy.intercept(
      `http://gitea.kitspace.test:3000/api/v1/users/${username}/repos`,
    ).as('getRepos')

    // assert the repo is on `{frontend}/projects/mine`
    cy.visit('/projects/mine')
    cy.wait('@getRepos')
    cy.get('.list > .item > .content > .header').contains(repoName)
  })
})
