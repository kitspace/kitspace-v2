import { getFakeUser } from '../support/getFakeUser'

describe('Legacy redirects', () => {
  before(() => {
    /*
     * The purpose of this isn't actually visiting the homepage.
     * Sometimes, the frontend has a slow startup time which results in a random failure.
     */
    cy.visit('/')
  })

  it('should redirect `/boards/*/user/project/*` to `/user/project/*`', () => {
    const user = getFakeUser()

    const multiProjectsRepoName = 'DIY_particle_detector'
    const multiProjectsNames = ['alpha-spectrometer', 'electron-detector']
    const syncedRepoUrlMultiProjects =
      'https://github.com/kitspace-test-repos/DIY_particle_detector'
    /* Migrate the multiproject repo */
    cy.importRepo(syncedRepoUrlMultiProjects, multiProjectsRepoName, user)

    cy.forceVisit(`/${user.username}/${multiProjectsRepoName}`)
    // Wait for the repo to finish processing, by checking the visibility sub projects cards.
    cy.get('[data-cy=project-card]', { timeout: 120_000 }).as('projectCards')

    cy.get('@projectCards').should('have.length', multiProjectsNames.length)

    /* Legacy redirect */
    cy.visit(
      `/boards/github.com/${user.username}/${multiProjectsRepoName}/${multiProjectsNames[0]}`,
    )
    cy.url().should(
      'eq',
      `${Cypress.config().baseUrl}/${user.username}/${multiProjectsRepoName}/${
        multiProjectsNames[0]
      }`,
    )
  })

  it('should redirect `/interactive_bom/?*/user/project*` to `/user/project/IBOM`', () => {
    const user = getFakeUser()
    const multiProjectsRepoName = 'DIY_particle_detector'
    const multiProjectsNames = ['alpha-spectrometer', 'electron-detector']
    const syncedRepoUrlMultiProjects =
      'https://github.com/kitspace-test-repos/DIY_particle_detector'

    /* Migrate the multiproject repo */
    cy.importRepo(syncedRepoUrlMultiProjects, multiProjectsRepoName, user)

    cy.forceVisit(`/${user.username}/${multiProjectsRepoName}`)
    // Wait for the repo to finish processing, by checking the visibility sub projects cards.
    cy.get('[data-cy=project-card]', { timeout: 120_000 }).as('projectCards')

    cy.get('@projectCards').should('have.length', multiProjectsNames.length)

    /* Legacy redirect */
    cy.visit(
      `/interactive_bom/?github.com/${user.username}/${multiProjectsRepoName}/${multiProjectsNames[0]}`,
      {
        failOnStatusCode: false,
      },
    )
    cy.url().should(
      'eq',
      `${Cypress.config().baseUrl}/${user.username}/${multiProjectsRepoName}/${
        multiProjectsNames[0]
      }/IBOM`,
    )
  })
})
