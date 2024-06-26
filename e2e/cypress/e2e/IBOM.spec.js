import { getFakeUser } from '../support/getFakeUser'

describe('IBOM page', () => {
  before(() => {
    /*
     * The purpose of this isn't actually visiting the homepage.
     * Sometimes, the frontend has a slow startup time which results in a random failure.
     */
    cy.visit('/')
  })

  it('should redirect to project page (multi project)', () => {
    const user = getFakeUser()

    const multiProjectsNames = ['alpha-spectrometer', 'electron-detector']
    const multiProjectsRepoName = 'DIY_particle_detector'
    const syncedRepoUrlMultiProjects =
      'https://github.com/kitspace-test-repos/DIY_particle_detector'

    cy.importRepo(syncedRepoUrlMultiProjects, multiProjectsRepoName, user)

    cy.forceVisit(`/${user.username}/${multiProjectsRepoName}`)

    // Wait for the repo to finish processing, by checking the visibility sub projects cards.
    cy.get('[data-cy=project-card]', { timeout: 120_000 }).as('projectCards')

    cy.get('@projectCards').should('have.length', multiProjectsNames.length)

    // Go to IBOM page for a subproject
    const subProjectName = multiProjectsNames[0]

    cy.waitForStatusCode(
      `${user.username}/${multiProjectsRepoName}/${subProjectName}/IBOM`,
    )
    cy.visit(`${user.username}/${multiProjectsRepoName}/${subProjectName}/IBOM`)

    // Click on the title
    cy.get('#title').click()

    // It should redirect to the subproject page
    cy.url({ timeout: 20_000 }).should(
      'eq',
      `${Cypress.config().baseUrl}/${
        user.username
      }/${multiProjectsRepoName}/${subProjectName}`,
    )
  })

  it('should redirect to the project page (normal project)', () => {
    const user = getFakeUser()

    const syncedRepoUrl = 'https://github.com/kitspace-test-repos/CH330_Hardware'
    const normalRepoName = 'CH330_Hardware'
    cy.importRepo(syncedRepoUrl, normalRepoName, user)

    cy.forceVisit(`/${user.username}/${normalRepoName}`)
    // Wait for the repo to finish processing, by checking the visibility of info-bar.
    cy.get('[data-cy=info-bar]', { timeout: 60_000 }).should('be.visible')

    // Go to IBOM page for a single (not multi) project
    cy.get('[data-cy=ibom]').should('be.visible')
    cy.visit(`${user.username}/${normalRepoName}/_/IBOM`)

    // Click on the title
    cy.get('#title').click()

    // It should redirect to the project page
    cy.url({ timeout: 20_000 }).should(
      'eq',
      `${Cypress.config().baseUrl}/${user.username}/${normalRepoName}`,
    )
  })

  it('should not render `Assembly Guide` button for projects with `ibom-enabled: false', () => {
    const user = getFakeUser()
    /* Migrate a repo with `omit-ibom` set to `true` */
    const repoName = 'solarbird_shenzen_rdy'
    const IBOMDisabledRepoURL =
      'https://github.com/kitspace-test-repos/solarbird_shenzen_rdy'
    cy.importRepo(IBOMDisabledRepoURL, repoName, user)

    cy.forceVisit(`/${user.username}/${repoName}`)
    cy.url({ timeout: 60_000 }).should('contain', `${user.username}/${repoName}`)
    // Wait for the repo to finish processing, by checking the visibility of info-bar.
    cy.get('[data-cy=info-bar]', { timeout: 100_000 }).should('be.visible')
    // The ibom button shouldn't get rendered for this project.
    cy.get('[data-cy=ibom]').should('not.exist')
  })
})

describe('404 IBOM for nonexistent projects', () => {
  it("should return 404 status code for IBOM if the project isn't found (multiproject)", () => {
    cy.request({
      url: '/someone/multi/project/IBOM',
      failOnStatusCode: false,
    }).then(res => {
      expect(res.status).to.eq(404)
    })
  })

  it("should return 404 status code for IBOM if the project isn't found (normal project)", () => {
    cy.request({ url: '/someone/repo/_/IBOM', failOnStatusCode: false }).then(
      res => {
        expect(res.status).to.eq(404)
      },
    )
  })
})
