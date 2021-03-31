/// <reference types="../support" />

import faker from 'faker'

describe('It validates authentication redirects', () => {
  const username = faker.name.firstName()
  const email = faker.internet.email()
  const password = '123456'

  before(() => {
    cy.visit('/')
    cy.createUser(username, email, password)
  })

  beforeEach(() => {
    // deauthenticate the user and reload the page to update the CSRF token
    cy.clearCookies()
    cy.reload()
    cy.intercept('http://gitea.kitspace.test:3000/user/kitspace/**').as('sign_in')

    cy.visit('/login')
    cy.signIn(username, password)
    cy.wait('@sign_in')
  })

  it("should redirect unauthenticated users to '/login' when accessing reqSignIn page", () => {
    // Clear the cookies to make sure the user isn't authenticated
    cy.clearCookies()
    cy.wait(1000)

    // `/project/new` is marked as `reqSignIn`.
    cy.visit('/projects/new')
    cy.url().should('eq', 'http://kitspace.test:3000/login?redirect=/projects/new')
  })

  it('should redirects authenticated users to homepage when accessing reqSignOut page', () => {
    // `/login` is marked as `reqSignOut`.
    cy.visit('/login')
    cy.url().should('eq', 'http://kitspace.test:3000/')
  })
})
