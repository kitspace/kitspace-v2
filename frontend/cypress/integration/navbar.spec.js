/// <reference types="../support" />

import faker from 'faker'

describe('It validates `Add Project` behavior', () => {
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

    cy.intercept('http://gitea.kitspace.test:3000/user/kitspace/**')
  })

  it('should redirect unauthenticated user to /login?redirect=/projects/new', () => {
    // The user is unauthenticated
    cy.window().its('session.user').should('eq', null)

    // Clicking `Add Project` redirects to the login page.
    // and adds redirect query to `/projects/new/`
    cy.get('#add_project').click()
    cy.wait(1000)
    cy.url().should('eq', 'http://kitspace.test:3000/login?redirect=/projects/new')
  })

  it('should redirect authenticated user to /projects/new', () => {
    // sign the user in.
    cy.visit('/login')
    cy.signIn(username, password)

    // Clicking `Add Project` redirects to new project page.
    cy.visit('/')
    cy.wait(1000)
    cy.get('#add_project').click()
    cy.url().should('eq', 'http://kitspace.test:3000/projects/new')
  })
})

describe('It validates redirects after login', () => {
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

    cy.intercept('http://gitea.kitspace.test:3000/user/kitspace/**')
  })

  it('should redirect to homepage if there is no redirect query', () => {
    cy.visit('/login')
    cy.wait(1000)
    // sign the user in.
    cy.signIn(username, password)

    // After a successful login the user is redirect to the homepage.
    cy.url().should('eq', 'http://kitspace.test:3000/')
  })

  it('should redirect to correct page if there is a redirect query', () => {
    const pageClickFrom = 'bom-builder'

    cy.visit(pageClickFrom)
    cy.wait(1000)
    cy.get('#login').click()

    // sign the user in.
    cy.signIn(username, password)
    cy.wait(1000)

    cy.url().should('eq', `http://kitspace.test:3000/${pageClickFrom}`)
  })
})
