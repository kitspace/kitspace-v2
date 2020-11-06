import faker from 'faker'

describe('It validates authentication redirects', () => {
  const username = faker.name.firstName()
  const email = faker.internet.email()
  const password = '123456'

  before(() => {
    cy.visit('/')
    cy.createUser(username, email, password)
  })
  it("should redirect unauthenticated users to '/login' when accessing reqSignIn page", () => {
    // `/project/new` is marked as `reqSignIn`.
    cy.visit('/projects/new')
    cy.url().should('eq', 'http://kitspace.test:3000/login?redirect=/projects/new')
  })

  it('should redirects authenticated users to homepage when accessing reqSignOut page', () => {
    // sign the user in.
    cy.visit('/login')
    cy.stubSignInReq(true, { LoggedInSuccessfully: true })
    cy.signIn(username, password)

    // `/login` is marked as `reqSignOut`.
    cy.visit('/login')
    cy.url().should('eq', 'http://kitspace.test:3000/')
  })
})
