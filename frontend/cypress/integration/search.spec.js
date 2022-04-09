import faker from 'faker'

import { getFakeUsername } from '../support/getFakeUsername'

describe('Homepage search bar', () => {
  it('should redirect to /search when search is submitted', () => {
    const queryTerm = 'awesome project'

    // Visit homepage
    cy.visit('/')
    // Write query term in the search field
    cy.get('[data-cy=search-field] > input').type(queryTerm)
    // The URL shouldn't change before clicking on `Search`
    cy.url().should('equal', `${Cypress.config().baseUrl}/`)
    // Press enter
    cy.get('[data-cy=search-form]').submit()
    // Should redirect to the search page
    cy.url().should('include', `/search?q=${encodeURI(queryTerm)}`)
  })

  it('should display project card on submitting search form', () => {
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
    // Wait for the repo to finish migration, by checking the visibility of processing-loader.
    cy.get('[data-cy=processing-loader]', { timeout: 60_000 })
    // Wait for the repo to finish processing, by checking the visibility of info-bar.
    cy.get('[data-cy=info-bar]', { timeout: 60_000 }).should('be.visible')

    cy.visit('/')
    // Write query term in the search field
    cy.get('[data-cy=search-field] > input').type(repoName)
    // Press enter
    cy.get('[data-cy=search-form]').submit()
    // Should redirect to the search page
    cy.url().should('include', `/search?q=${encodeURI(repoName)}`)
    cy.get('[data-cy=project-card]').should('have.length.gte', 1)
  })
})

describe('Search', () => {
  before(() => {
    /*
     * The purpose of this isn't actually visiting the homepage.
     * Sometimes, the frontend has a slow startup time which results in a random failure.
     */
    cy.visit('/')
  })

  it('should use `q` from query parameters', () => {
    const username = getFakeUsername()
    const email = faker.unique(faker.internet.email)
    const password = '123456'

    const repoName = 'HACK'
    const syncedRepoUrl = 'https://github.com/kitspace-forks/HACK'

    cy.createUser(username, email, password)
    cy.visit('/')
    cy.get('[data-cy=user-menu]')

    cy.forceVisit('/projects/new')

    // Migrate the repo
    cy.get('[data-cy=sync-field]').type(syncedRepoUrl)
    cy.get('button').contains('Sync').click()

    // Wait for redirection for project page
    cy.url({ timeout: 60_000 }).should('contain', `${username}/${repoName}`)
    // Wait for the repo to finish migration, by checking the visibility of processing-loader.
    cy.get('[data-cy=processing-loader]', { timeout: 60_000 })
    // Wait for the repo to finish processing, by checking the visibility of info-bar.
    cy.get('[data-cy=info-bar]', { timeout: 60_000 }).should('be.visible')

    cy.visit(`/search?q=${repoName}`)
    cy.get('[data-cy=project-card]').should('have.length.gte', 1)
  })

  it('should redirect to /search when search box is cleared', () => {
    cy.visit('search?q=query')
    // Clear the search form and press enter
    cy.get('[data-cy=search-field] > input').clear()
    cy.get('[data-cy=search-form]').submit()
    cy.url().should('equal', `${Cypress.config().baseUrl}/search?q=`)
  })
})
