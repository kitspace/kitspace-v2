import faker from 'faker'

import { getFakeUsername } from '../support/getFakeUsername'

const syncedRepoUrlMultiProjects =
  'https://github.com/kitspace-forks/DIY_particle_detector'
const syncedRepoUrl = 'https://github.com/kitspace-forks/CH330_Hardware'
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
    const username = getFakeUsername()
    const email = faker.unique(faker.internet.email)
    const password = '123456'

    const repoName = syncedRepoUrlMultiProjects.split('/').slice(-1).toString()

    cy.createUser(username, email, password)
    cy.visit('/login')
    cy.signIn(username, password)
    cy.get('[data-cy=user-menu]')

    cy.forceVisit('/projects/new')

    // Migrate the multiproject repo
    cy.get('[data-cy=sync-field]').type(syncedRepoUrlMultiProjects)
    cy.get('button').contains('Sync').click()

    // Wait for redirection for project page
    cy.url({ timeout: 60_000 }).should('contain', `${username}/${repoName}`)
    // Wait for the repo to finish migration, by checking the visibility of processing-loader.
    cy.get('[data-cy=processing-loader]', { timeout: 60_000 })
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
    const username = getFakeUsername()
    const email = faker.unique(faker.internet.email)
    const password = '123456'

    cy.createUser(username, email, password)
    cy.visit('/login')
    cy.signIn(username, password)
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
    // Wait for the repo to finish migration, by checking the visibility of processing-loader.
    cy.get('[data-cy=processing-loader]', { timeout: 60_000 })
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
    // Wait for the repo to finish migration, by checking the visibility of processing-loader.
    cy.get('[data-cy=processing-loader]', { timeout: 60_000 })
    // Wait for the repo to finish processing, by checking the visibility of info-bar.
    cy.get('[data-cy=info-bar]', { timeout: 60_000 }).should('be.visible')

    cy.visit(`/${username}`)
    // There should be 3 thumbnails = 2 form multiprojects + 1 normal project
    cy.get('[data-cy=project-card-thumbnail]').should(
      'have.length',
      multiProjectsNames.length + 1,
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

    cy.forceVisit('/projects/new')

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
    cy.get('[data-cy=project-card]', { timeout: 60_000 }).should(
      'have.length',
      multiProjectsNames.length,
    )
    // Go to the home page and click on a multiproject project card
    const multiProjectName = multiProjectsNames[0]
    cy.visit('/')
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
})

describe('Multi project page', () => {
  before(() => {
    // visit home before running the tests, instead of using `wait`.
    cy.visit('/')
  })

  beforeEach(() => cy.clearCookies())

  it('should render the page components', () => {
    const username = getFakeUsername()
    const email = faker.unique(faker.internet.email)
    const password = '123456'

    cy.createUser(username, email, password)
    cy.visit('/login')
    cy.signIn(username, password)
    cy.get('[data-cy=user-menu]')

    cy.forceVisit('/projects/new')

    // Migrate the multiproject repo
    cy.get('[data-cy=sync-field]').type(syncedRepoUrlMultiProjects)
    cy.get('button').contains('Sync').click()

    cy.url({ timeout: 60_000 }).should(
      'contain',
      `${username}/${multiProjectsRepoName}`,
    )
    // Wait for the repo to finish migration, by checking the visibility of processing-loader.
    cy.get('[data-cy=processing-loader]', { timeout: 60_000 })
    // Wait for the repo to finish processing, by checking the visibility sub projects cards.
    cy.get('[data-cy=project-card]', { timeout: 60_000 }).should(
      'have.length',
      multiProjectsNames.length,
    )

    // Go to the home page and click on a multiproject project card
    const multiProjectName = multiProjectsNames[0]
    cy.visit(`${username}/${multiProjectsRepoName}/${multiProjectName}`)

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
      'readme',
    ]

    pageComponents.forEach(c => {
      cy.get(`[data-cy=${c}]`)
    })
  })

  it('should render the details from multi project in kitspace.yaml', () => {
    const username = getFakeUsername()
    const email = faker.unique(faker.internet.email)
    const password = '123456'

    cy.createUser(username, email, password)
    cy.visit('/login')
    cy.signIn(username, password)
    cy.get('[data-cy=user-menu]')

    cy.forceVisit('/projects/new')

    // Migrate the multiproject repo
    cy.get('[data-cy=sync-field]').type(syncedRepoUrlMultiProjects)
    cy.get('button').contains('Sync').click()

    cy.url({ timeout: 60_000 }).should(
      'contain',
      `${username}/${multiProjectsRepoName}`,
    )
    // Wait for the repo to finish migration, by checking the visibility of processing-loader.
    cy.get('[data-cy=processing-loader]', { timeout: 60_000 })
    // Wait for the repo to finish processing, by checking the visibility sub projects cards.
    cy.get('[data-cy=project-card]', { timeout: 60_000 }).should(
      'have.length',
      multiProjectsNames.length,
    )

    // Go to the home page and click on a multiproject project card
    const multiProjectName = multiProjectsNames[0]
    cy.visit('/')
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
