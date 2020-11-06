import faker from 'faker'

describe('Validates `Add Project` behavior', () => {
  const username = faker.name.firstName()
  const email = faker.internet.email()
  const password = '123456'

  before(() => {
    cy.visit('/')
    cy.createUser(username, email, password)
  })

  beforeEach(() => {
    cy.signOut()
  })

  it('unauthenticated user', () => {
    // The user is unauthenticated
    cy.window().its('session.user').should('eq', null)

    // Clicking `Add Project` redirects to the login page.
    // and adds redirect query to `/projects/new/`
    cy.get('#add_project').click()
    cy.url().should('eq', 'http://kitspace.test:3000/login?redirect=/projects/new')
  })

  it('authenticated user', () => {
    // sign the user in.
    cy.visit('/login')
    cy.stubSignInReq(true, { LoggedInSuccessfully: true })
    cy.signIn(username, password)

    // Clicking `Add Project` redirects to new project page.
    cy.get('#add_project').click()
    cy.url().should('eq', 'http://kitspace.test:3000/projects/new')
  })
})

describe('Validates redirects after login', () => {
  const username = faker.name.firstName()
  const email = faker.internet.email()
  const password = '123456'

  before(() => {
    cy.visit('/')
    cy.createUser(username, email, password)
  })

  beforeEach(() => {
    cy.signOut()
  })
  it('Redirect to homepage if there is no redirect query', () => {
    cy.visit('/login')

    // sign the user in.
    cy.stubSignInReq(true, { LoggedInSuccessfully: true })
    cy.signIn(username, password)

    // After a successful login the user is redirect to the homepage.
    cy.url().should('eq', 'http://kitspace.test:3000/')
  })

  it('Redirect to correct page if there is a redirect query', () => {
    const pageClickFrom = 'bom-builder'

    cy.visit(pageClickFrom)
    cy.get('#login').click()

    // sign the user in.
    cy.stubSignInReq(
      true,
      { LoggedInSuccessfully: true },
      `/login?redirect=/${pageClickFrom}`,
    )
    cy.signIn(username, password)

    cy.get('button').contains('Login').click()
    cy.url().should('eq', `http://kitspace.test:3000/${pageClickFrom}`)
  })
})
