import { getFakeUser } from '../support/getFakeUser'

describe('Syncing a project behavior validation', () => {
  before(() => {
    /*
     * The purpose of this isn't actually visiting the homepage.
     * Sometimes, the frontend has a slow startup time which results in a random failure.
     */
    cy.visit('/')
  })

  it.skip('should sync a repo via UI', () => {
    const syncedRepoUrl = 'https://github.com/AbdulrhmnGhanem/light-test-repo'
    const repoName = 'light-test-repo'

    const user = getFakeUser()

    cy.createUser(user.username, email, password)
    cy.visit('/')
    cy.get('[data-cy=user-menu]')

    cy.forceVisit('/projects/new')
    cy.get('[data-cy=sync-field]').type(syncedRepoUrl)
    cy.get('button').contains('Sync').click()
    cy.get('[data-cy=sync-result-message]').should('have.class', 'green')

    // Wait for redirection for project page
    cy.url({ timeout: 60_000 }).should('contain', `${user.username}/${repoName}`)
    cy.get('[data-cy=project-title]')

    cy.visit(`/${user.username}`)
    // assert the repo is on the user's project page
    cy.get('[data-cy=project-card]').contains(repoName)
  })

  it('should display original url for synced repos', () => {
    const user = getFakeUser()

    const repoName = 'CH330_Hardware'
    const syncedRepoUrl = 'https://github.com/kitspace-test-repos/CH330_Hardware'

    // Migrate the repo
    cy.importRepo(syncedRepoUrl, repoName, user)

    cy.forceVisit(`/${user.username}/${repoName}`)

    // The info bar should include the original url
    cy.get('[data-cy=original-url] > a', { timeout: 60_000 })
      .should('have.attr', 'href')
      .and('include', 'github.com/kitspace-test-repos')
      .then(href =>
        assert(href === syncedRepoUrl, 'The href value is the synced repo url'),
      )
  })

  it('should fall back to repo description on missing `summary` key in `kitspace.yaml`', () => {
    const user = getFakeUser()

    const repoName = 'ArduTouch'
    const syncedRepoUrl = 'https://github.com/kitspace-test-repos/ArduTouch'

    // Migrate the repo
    cy.importRepo(syncedRepoUrl, repoName, user)

    cy.forceVisit(`/${user.username}/${repoName}`)

    // Wait for the repo to finish processing, by checking the visibility of info-bar.
    cy.get('[data-cy=info-bar]', { timeout: 60_000 }).should('be.visible')

    // Assert it fallback to repo description
    cy.get('[data-cy=project-description]').should('contain', 'ARDUTOUCH ')
  })

  it('should fall back to repo description in `ProjectCard` on missing `summary` in `kitspace.yaml', () => {
    const user = getFakeUser()

    const repoName = 'CH330_Hardware_without_summary'
    const syncedRepoUrl =
      'https://github.com/kitspace-test-repos/CH330_Hardware_without_summary'

    // Migrate the repo
    cy.importRepo(syncedRepoUrl, repoName, user)

    cy.forceVisit(`/${user.username}/${repoName}`)

    // Wait for the repo to finish processing, by checking the visibility of info-bar.
    cy.get('[data-cy=info-bar]', { timeout: 60_000 }).should('be.visible')

    // Go to user projects page to limit the results to the project synced above
    cy.visit(`/${user.username}`)

    cy.get('[data-cy=project-card]').should('contain', user.username).and(
      'contain.text',
      // This is github repo description.
      'To test that meilisearch falls back to repo description',
    )
  })

  it.skip('should escape and render project description correctly', () => {
    const user = getFakeUser()

    const repoName = 'LED-Zappelin'
    const syncedRepoUrl = 'https://github.com/kitspace-test-repos/LED-Zappelin'

    // Migrate the repo
    cy.importRepo(syncedRepoUrl, repoName, user)

    cy.forceVisit(`/${user.username}/${repoName}`)

    // Wait for the repo to finish processing, by checking the visibility of info-bar.
    cy.get('[data-cy=project-card]', { timeout: 60_000 })
    // Go to the PCB stimulator sub-project
    cy.visit(`${user.username}/${repoName}/PCB-Stimulator`)

    cy.get('[data-cy=project-description]').should(
      'contain',
      "A custom board to implement LED Zappelin', an opensource LED controller for 2-photon microscopy",
    )
  })
})
