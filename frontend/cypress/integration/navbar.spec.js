import faker from 'faker'

describe('Validates `Add Project` behavior', () => {
  before(() => {
    cy.visit('/')
    cy.clearCookies()
  })

  it('unauthenticated user', () => {
    // The user is unauthenticated
    cy.signOut()
    cy.window().its('session.user').should('eq', null)

    // Clicking `Add Project` redirects to the login page.
    cy.get('#add_project').click()
    cy.url().should('eq', 'http://kitspace.test:3000/login')
  })

  it('authenticated user', () => {
    // create user and log him in.
    const username = faker.name.firstName()
    const email = faker.internet.email()
    const password = '123456'
    cy.createUser(username, email, password)
    cy.stubSignInReq(true, { LoggedInSuccessfully: true })

    cy.signIn(username, password)

     // Clicking `Add Project` redirects to the login page.
    cy.get('#add_project').click()
    cy.url().should('eq', 'http://kitspace.test:3000/projects/new')
  })
})
