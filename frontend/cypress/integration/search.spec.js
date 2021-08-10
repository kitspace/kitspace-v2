import faker from 'faker'

describe('Homepage search bar', () => {
  it('should redirect to /search on clicking `Search` button', () => {
    const queryTerm = 'awesome project'

    // Visit homepage
    cy.visit('/')
    // Write query term in the search field
    cy.get('[data-cy=search-field] > input').type(queryTerm)
    // The URL shouldn't change before clicking on `Search`
    cy.url().should('equal', `${Cypress.config().baseUrl}/`)
    // Click on the `Search` button
    cy.get('[data-cy=search-button]').click({ force: true })
    // Should redirect to the search page
    cy.url().should('include', `/search?q=${encodeURI(queryTerm)}`)
  })

  it('should display project card on submitting search form', () => {
    const username = faker.unique(faker.name.firstName)
    const email = faker.unique(faker.internet.email)
    const password = '123456'

    const repoName = 'CH330_Hardware'
    const syncedRepoUrl = 'https://github.com/kitspace-forks/CH330_Hardware'

    cy.intercept('http://gitea.kitspace.test:3000/user/kitspace/**').as('sign_in')

    cy.createUser(username, email, password)
    cy.visit('/login')
    cy.signIn(username, password)
    cy.wait('@sign_in')

    cy.visit('/projects/new')

    cy.url().then(url => {
      if (!url.endsWith('/projects/new')) {
        cy.visit('/projects/new')
      }
    })

    // Migrate the repo
    cy.get('input:first').type(syncedRepoUrl)
    cy.get('button').contains('Sync').click()

    // Wait for redirection for project page
    cy.url({ timeout: 60_000 }).should('contain', `${username}/${repoName}`)
    // Wait for the repo to finish migration, by checking the visibility of processing-loader.
    cy.get('[data-cy=processing-loader]', { timeout: 60_000 })
    // Wait for the repo to finish processing, by checking the visibility of info-bar.
    cy.get('[data-cy=info-bar]', { timeout: 60_000 }).should('be.visible')

    cy.visit('/')

    cy.get('[data-cy=search-field] > input').type(repoName)
    // Click on the `Search` button
    cy.get('[data-cy=search-button]').click({ force: true })
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
    const username = faker.unique(faker.name.firstName)
    const email = faker.unique(faker.internet.email)
    const password = '123456'

    const repoName = 'HACK'
    const syncedRepoUrl = 'https://github.com/kitspace-forks/HACK'

    cy.intercept('http://gitea.kitspace.test:3000/user/kitspace/**').as('sign_in')

    cy.createUser(username, email, password)
    cy.visit('/login')
    cy.signIn(username, password)
    cy.wait('@sign_in')

    cy.visit('/projects/new')

    cy.url().then(url => {
      if (!url.endsWith('/projects/new')) {
        cy.visit('/projects/new')
      }
    })

    // Migrate the repo
    cy.get('input:first').type(syncedRepoUrl)
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
    cy.get('[data-cy=search-field] > input').clear().type('{enter}')
    cy.url().should('equal', `${Cypress.config().baseUrl}/search?q=`)
  })
})
