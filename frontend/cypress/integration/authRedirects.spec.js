describe('Validates authentication redirects', () => {
  it("Redirect unauthenticated user to '/login' when accessing reqSignIn page", () => {
    //  `/project/new` is marked as `reqSignIn`.
    cy.visit('/projects/new')
    cy.url().should('eq', 'http://kitspace.test:3000/login')
  })
})