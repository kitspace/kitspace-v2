import faker from 'faker'

import { getFakeUsername } from '../support/getFakeUsername'

describe('Syncing a project behavior validation', () => {
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
    const username = getFakeUsername()
    const email = faker.unique(faker.internet.email)
    const password = '123456'

    cy.createUser(username, email, password)
    cy.visit('/login')
    cy.signIn(username, password)
    cy.get('[data-cy=logout-button]')

    cy.get('input:first').type(syncedRepoUrl)
    cy.get('button').contains('Sync').click()
    cy.get('[data-cy=sync-result-message]').should('have.class', 'green')

    // Go to Gitea dashboard and assert the repo has been migrated
    cy.visit(`http://gitea.kitspace.test:3000/${username}`)
    cy.get('.ui.repository.list').children().get('.header').contains(repoName)

    // assert the repo is on `{frontend}/projects/mine`
    cy.visit(`/${username}`)
    cy.get('[data-cy=project-card]').contains(repoName)
  })
})
