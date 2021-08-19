import faker from 'faker'

import { getFakeUsername } from '../support/getFakeUsername'

describe('It validates authentication redirects', () => {
  const username = getFakeUsername()
  const email = faker.unique(faker.internet.email)
  const password = '123456'

  before(() => {
    /*
     * The purpose of this isn't actually visiting the homepage.
     * Sometimes, the frontend has a slow startup time which results in a random failure.
     */
    cy.visit('/')
    cy.createUser(username, email, password)
  })

  beforeEach(() => {
    // deauthenticate the user and reload the page to update the CSRF token
    cy.clearCookies()
    cy.reload()

    cy.visit('/login')
    cy.signIn(username, password)
    cy.get('[data-cy=logout-button]')
  })

  it("should redirect unauthenticated users to '/login' when accessing requireSignIn page", () => {
    // Clear the cookies to make sure the user isn't authenticated
    cy.clearCookies()
    // sign in, and migrate `light-test-repo`
    cy.visit('/login')
    // `/project/new` is marked as `reqSignIn`.
    cy.forceVisit('/projects/new')
    cy.url().should('eq', 'http://kitspace.test:3000/login?redirect=/projects/new')
  })

  it('should redirects authenticated users to homepage when accessing reqSignOut page', () => {
    // `/login` is marked as `reqSignOut`.
    cy.visit('/login')
    cy.url().should('eq', `${Cypress.config().baseUrl}/${Cypress.env('home_url')}`)
  })
})
