import faker from 'faker'

import { getFakeUsername } from '../support/getFakeUsername'

describe('IBOM page', () => {
  before(() => {
    /*
     * The purpose of this isn't actually visiting the homepage.
     * Sometimes, the frontend has a slow startup time which results in a random failure.
     */
    cy.visit('/')
  })

  it('should redirect to the multi project page (multiproject)', () => {
    const username = getFakeUsername()
    const email = faker.unique(faker.internet.email)
    const password = '123456'

    cy.createUser(username, email, password)
    cy.visit('/login')
    cy.signIn(username, password)
    cy.get('[data-cy=user-menu]')

    cy.forceVisit('/projects/new')

    const multiProjectsNames = ['alpha-spectrometer', 'electron-detector']
    const multiProjectsRepoName = 'DIY_particle_detector'
    const syncedRepoUrlMultiProjects =
      'https://github.com/kitspace-forks/DIY_particle_detector'

    /* Migrate the multiproject repo */
    cy.get('[data-cy=sync-field]').type(syncedRepoUrlMultiProjects)
    cy.get('button').contains('Sync').click()

    // Wait for redirection for project page
    cy.url({ timeout: 60_000 }).should(
      'contain',
      `${username}/${multiProjectsRepoName}`,
    )
    // Wait for the repo to finish migration, by checking the visibility of processing-loader.
    cy.get('[data-cy=processing-loader]', { timeout: 60_000 })
    // Wait for the repo to finish processing, by checking the visibility sub projects cards.
    cy.get('[data-cy=project-card]', { timeout: 60_000 }).as('projectCards')

    cy.get('@projectCards').should('have.length', multiProjectsNames.length)

    // Go to IBOM page for a subproject
    const subProjectName = multiProjectsNames[0]
    cy.visit(`${username}/${multiProjectsRepoName}/${subProjectName}/IBOM`)

    // Click on the title
    cy.get('#title').click()

    // It should redirect to the subproject page
    cy.url({ timeout: 20_000 }).should(
      'eq',
      `${
        Cypress.config().baseUrl
      }/${username}/${multiProjectsRepoName}/${subProjectName}`,
    )
  })

  it('should redirect to the multi project page', () => {
    const username = getFakeUsername()
    const email = faker.unique(faker.internet.email)
    const password = '123456'

    cy.createUser(username, email, password)
    cy.visit('/login')
    cy.signIn(username, password)
    cy.get('[data-cy=user-menu]')

    /* Migrate the normal repo */
    cy.forceVisit('/projects/new')

    const syncedRepoUrl = 'https://github.com/kitspace-forks/CH330_Hardware'
    const normalRepoName = 'CH330_Hardware'

    cy.get('[data-cy=sync-field]').type(syncedRepoUrl)
    cy.get('button').contains('Sync').click()

    // Wait for redirection for project page
    cy.url({ timeout: 60_000 }).should('contain', `${username}/${normalRepoName}`)
    // Wait for the repo to finish migration, by checking the visibility of processing-loader.
    cy.get('[data-cy=processing-loader]', { timeout: 60_000 })
    // Wait for the repo to finish processing, by checking the visibility of info-bar.
    cy.get('[data-cy=info-bar]', { timeout: 60_000 }).should('be.visible')

    // Go to IBOM page for a single (not multi) project
    cy.visit(`${username}/${normalRepoName}/IBOM`)

    // Click on the title
    cy.get('#title').click()

    // It should redirect to the subproject page
    cy.url({ timeout: 20_000 }).should(
      'eq',
      `${Cypress.config().baseUrl}/${username}/${normalRepoName}`,
    )
  })
})
