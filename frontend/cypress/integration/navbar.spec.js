describe('Navbar behavior validation', () => {
  before(() => {
    cy.visit('/')
    cy.clearCookies()
  })

  it('validates `Add Project` behavior (unauthenticated user)', () => {
    // The user is unauthenticated
    cy.signOut()
    cy.window().its('session.user').should('eq', null)

    // Clicking `Add Project` redirects to the login page.
    cy.get('#add_project').click()
    cy.url().should('eq', 'http://kitspace.test:3000/login')
  })
})
