import { getFakeUser } from '../support/getFakeUser'

const syncedRepoUrlMultiProjects =
  'https://github.com/kitspace-test-repos/DIY_particle_detector'
const syncedRepoUrl = 'https://github.com/kitspace-test-repos/CH330_Hardware'
const multiProjectsNames = ['alpha-spectrometer', 'electron-detector']
const multiProjectsRepoName = 'DIY_particle_detector'
const normalRepoName = 'CH330_Hardware'

describe('Render project cards', () => {
  before(() => {
    /*
     * The purpose of this isn't actually visiting the homepage.
     * Sometimes, the frontend has a slow startup time which results in a random failure.
     */
    cy.visit('/')
  })

  it('should render a card for each multiproject', () => {
    const { username, email, password } = getFakeUser()

    const repoName = syncedRepoUrlMultiProjects.split('/').slice(-1).toString()

    cy.createUser(username, email, password)
    cy.visit('/')
    cy.get('[data-cy=user-menu]')

    cy.forceVisit('/projects/new')

    // Migrate the multiproject repo
    cy.get('[data-cy=sync-field]').type(syncedRepoUrlMultiProjects)
    cy.get('button').contains('Sync').click()

    // Wait for redirection for project page
    cy.url({ timeout: 60_000 }).should('contain', `${username}/${repoName}`)
    // Wait for the repo to finish processing, by checking the visibility sub projects cards.
    cy.get('[data-cy=project-card]', { timeout: 60_000 }).should(
      'have.length',
      multiProjectsNames.length,
    )

    // should render a card for each multiproject
    cy.visit(`/${username}`)

    multiProjectsNames.forEach(name => {
      cy.get('[data-cy=project-card]').contains(name)
    })
  })

  it('should display card thumbnail', () => {
    const { username, email, password } = getFakeUser()

    cy.createUser(username, email, password)
    cy.visit('/')
    cy.get('[data-cy=user-menu]')

    cy.forceVisit('/projects/new')

    // Migrate the multiproject repo
    cy.get('[data-cy=sync-field]').type(syncedRepoUrlMultiProjects)
    cy.get('button').contains('Sync').click()

    // Wait for redirection for project page
    cy.url({ timeout: 60_000 }).should(
      'contain',
      `${username}/${multiProjectsRepoName}`,
    )
    // Wait for the repo to finish processing, by checking the visibility sub projects cards.
    cy.get('[data-cy=project-card]', { timeout: 60_000 }).should(
      'have.length',
      multiProjectsNames.length,
    )
    /* Migrate the normal repo */
    cy.forceVisit('/projects/new')

    cy.get('[data-cy=sync-field]').type(syncedRepoUrl)
    cy.get('button').contains('Sync').click()

    // Wait for redirection for project page
    cy.url({ timeout: 60_000 }).should('contain', `${username}/${normalRepoName}`)

    cy.visit(`/${username}`)
    // There should be 3 cards = 2 form multiprojects + 1 normal project
    cy.get('[data-cy=project-card]', { timeout: 60_000 }).should(
      'have.length',
      multiProjectsNames.length + 1,
    )
  })

  it('should redirect to the multi project page', () => {
    const { username, email, password } = getFakeUser()

    cy.createUser(username, email, password)
    cy.visit('/')
    cy.get('[data-cy=user-menu]')

    cy.forceVisit('/projects/new')

    /* Migrate the multiproject repo */
    cy.get('[data-cy=sync-field]').type(syncedRepoUrlMultiProjects)
    cy.get('button').contains('Sync').click()

    // Wait for redirection for project page
    cy.url({ timeout: 60_000 }).should(
      'contain',
      `${username}/${multiProjectsRepoName}`,
    )
    // Wait for the repo to finish processing, by checking the visibility sub projects cards.
    cy.get('[data-cy=project-card]', { timeout: 60_000 }).should(
      'have.length',
      multiProjectsNames.length,
    )
    const multiProjectName = multiProjectsNames[0]

    cy.visit('/')

    // Search for the project
    cy.get('nav [data-cy=search-field] > input').type(username)
    cy.get('nav [data-cy=search-form]').submit()

    // Click on a subproject project card
    cy.get('[data-cy=project-card]').within(() => {
      cy.contains(username)
      cy.contains(multiProjectName).click({ force: true })
    })

    // Should redirect to the `[username]/[projectName]/[multiProject]`
    cy.url({ timeout: 20_000 }).should(
      'contain',
      `${username}/${multiProjectsRepoName}/${multiProjectName}`,
    )
  })

  it('should handle subproject names with URL invalid characters', () => {
    const { username, email, password } = getFakeUser()

    cy.createUser(username, email, password)
    cy.visit('/')
    cy.get('[data-cy=user-menu]')

    cy.forceVisit('/projects/new')

    const projectWithInvalidCharsURL =
      'https://github.com/kitspace-test-repos/open-visual-stimulator'
    const projectWithInvalidCharsName = 'open-visual-stimulator'
    const numberOfSubProjects = 4

    /* Migrate the multiproject repo */
    cy.get('[data-cy=sync-field]').type(projectWithInvalidCharsURL)
    cy.get('button').contains('Sync').click()

    // Wait for redirection for project page
    cy.url({ timeout: 120_000 }).should(
      'contain',
      `${username}/${projectWithInvalidCharsName}`,
    )
    // Wait for the repo to finish processing, by checking the visibility sub projects cards.
    cy.get('[data-cy=project-card]', { timeout: 60_000 }).should(
      'have.length',
      numberOfSubProjects,
    )
    // Visit the first sub project,
    cy.get('[data-cy=project-card]').first().click({ force: true })
    // Assert the processing is done successfully
    cy.get('[data-cy=project-description]', { timeout: 60_000 }).should(
      'be.visible',
    )
  })
})

describe('Multi project page', () => {
  before(() => {
    // visit home before running the tests, instead of using `wait`.
    cy.visit('/')
  })

  it('should render the page components', () => {
    const { username, email, password } = getFakeUser()

    cy.createUser(username, email, password)
    cy.visit('/')
    cy.get('[data-cy=user-menu]')

    cy.forceVisit('/projects/new')

    // Migrate the multiproject repo
    cy.get('[data-cy=sync-field]').type(syncedRepoUrlMultiProjects)
    cy.get('button').contains('Sync').click()

    cy.url({ timeout: 60_000 }).should(
      'contain',
      `${username}/${multiProjectsRepoName}`,
    )
    // Wait for the repo to finish processing, by checking the visibility sub projects cards.
    cy.get('[data-cy=project-card]', { timeout: 60_000 }).as('projectCards')

    cy.get('@projectCards').should('have.length', multiProjectsNames.length)

    // Click on a subproject project card
    const subProjectName = multiProjectsNames[0]
    cy.get('@projectCards').contains(subProjectName).click()
    cy.url({ timeout: 20_000 }).should(
      'contain',
      `${username}/${multiProjectsRepoName}/${subProjectName}`,
    )

    // Different page elements should be visible.
    const pageComponents = [
      'sync-msg',
      'info-bar',
      'board-showcase',
      'board-showcase-top',
      'board-showcase-bottom',
      'board-extra-menus',
      'order-pcb',
      'buy-parts',
      'buy-parts-bom',
      'readme',
    ]

    pageComponents.forEach(c => {
      cy.get(`[data-cy=${c}]`)
    })
  })

  it('should render the details from multi project in kitspace.yaml', () => {
    const { username, email, password } = getFakeUser()

    cy.createUser(username, email, password)
    cy.visit('/')
    cy.get('[data-cy=user-menu]')

    cy.forceVisit('/projects/new')

    // Migrate the multiproject repo
    cy.get('[data-cy=sync-field]').type(syncedRepoUrlMultiProjects)
    cy.get('button').contains('Sync').click()

    cy.url({ timeout: 10_000 }).should(
      'contain',
      `${username}/${multiProjectsRepoName}`,
    )
    // Wait for the repo to finish processing, by checking the visibility sub projects cards.
    cy.get('[data-cy=project-card]', { timeout: 120_000 }).should(
      'have.length',
      multiProjectsNames.length,
    )

    const multiProjectName = multiProjectsNames[0]
    cy.visit('/')
    // Search for the project
    cy.get('nav [data-cy=search-field] > input').type(username)
    cy.get('nav [data-cy=search-form]').submit()

    // Click on a multiproject project card
    cy.get('[data-cy=project-card]').within(() => {
      cy.contains(username)
      cy.contains(multiProjectName).click({ force: true })
    })
    cy.url({ timeout: 20_000 }).should(
      'contain',
      `${username}/${multiProjectsRepoName}/${multiProjectName}`,
    )
    // The info bar should have the correct title.
    cy.get('[data-cy=project-title]').should('have.text', multiProjectName)

    /*
     ! The `Alpha-Spectrometer Variant` is dependant on the chosen repo for testing.
     ! Note, a kitspace fork is used not the upstream.
    */
    // The info bar should have the correct description.
    cy.get('[data-cy=project-description]').should(
      'contain',
      'Low-cost DIY particle detector for radioactivity: Alpha-spectrometer variant',
    )
    cy.get('[data-cy=readme]').should('contain', 'Alpha-Spectrometer Variant')
  })
})
