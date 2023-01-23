describe('Error pages messages', () => {
  it("should show 'This page could not be found.' for 404", () => {
    cy.visit('/not-found', { failOnStatusCode: false })
    cy.get('[data-cy="status-message"]').should(
      'have.text',
      'This page could not be found.',
    )
  })

  it('should return 404 status code for not-found pages', () => {
    cy.request({ url: '/not-found', failOnStatusCode: false }).then(res => {
      expect(res.status).to.eq(404)
    })
  })
})
