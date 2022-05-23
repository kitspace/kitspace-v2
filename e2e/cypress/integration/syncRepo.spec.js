import faker from 'faker'

import { getFakeUsername } from '../support/getFakeUsername'

describe('Syncing a project behavior validation', () => {
  before(() => {
    /*
     * The purpose of this isn't actually visiting the homepage.
     * Sometimes, the frontend has a slow startup time which results in a random failure.
     */
    cy.visit('/')
  })

  it('should sync a repo on gitea', () => {
    const syncedRepoUrl = 'https://github.com/AbdulrhmnGhanem/light-test-repo'
    const repoName = 'light-test-repo'

    const username = getFakeUsername()
    const email = faker.unique(faker.internet.email)
    const password = '123456'

    cy.createUser(username, email, password)
    cy.visit('/')
    cy.get('[data-cy=user-menu]')

    cy.forceVisit('/projects/new')
    cy.get('[data-cy=sync-field]').type(syncedRepoUrl)
    cy.get('button').contains('Sync').click()
    cy.get('[data-cy=sync-result-message]').should('have.class', 'green')

    // Wait for redirection for project page
    cy.url({ timeout: 60_000 }).should('contain', `${username}/${repoName}`)
    cy.get('[data-cy=project-title]')

    cy.visit(`/${username}`)
    // assert the repo is on the user's project page
    cy.get('[data-cy=project-card]').contains(repoName)
  })

  it('should display original url for synced repos', () => {
    const username = getFakeUsername()
    const email = faker.unique(faker.internet.email)
    const password = '123456'

    const repoName = 'CH330_Hardware'
    const syncedRepoUrl = 'https://github.com/kitspace-forks/CH330_Hardware'

    cy.createUser(username, email, password)
    cy.visit('/')
    cy.get('[data-cy=user-menu]')

    cy.forceVisit('/projects/new')

    // Migrate the repo
    cy.get('[data-cy=sync-field]').type(syncedRepoUrl)
    cy.get('button').contains('Sync').click()

    // Wait for redirection for project page
    cy.url({ timeout: 60_000 }).should('contain', `${username}/${repoName}`)

    // The info bar should include the original url
    cy.get('[data-cy=original-url] > a', { timeout: 60_000 })
      .should('have.attr', 'href')
      .and('include', 'github.com/kitspace-forks')
      .then(href =>
        assert(href === syncedRepoUrl, 'The href value is the synced repo url'),
      )
  })
})
