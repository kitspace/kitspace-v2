describe('Error pages messages', () => {
  it("should show 'This page could not be found.' for 404", () => {
    cy.visit('/not-found')
    cy.get('[data-cy="status-message"]').should(
      'have.text',
      'This page could not be found.',
    )
  })
})
