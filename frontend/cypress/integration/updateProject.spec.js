import faker from 'faker'

describe('Updating a project behavior validation', () => {
  const testRepoURL = 'https://github.com/AbdulrhmnGhanem/light-test-repo'
  const username = faker.name.firstName()
  const testRepoName = 'light-test-repo'
  const testRepoFullName = `${username}/${testRepoName}`
  const updatePageRoute = `/projects/update/${testRepoFullName}`
  const email = faker.internet.email()
  const password = '123456'

  before(() => {
    cy.clearCookies()
    // create a user and sign him in
    cy.intercept('http://gitea.kitspace.test:3000/user/kitspace/**')
    cy.createUser(username, email, password)
    cy.visit('/login')
    cy.signIn(username, password)

    // sync the test repo
    cy.visit('/projects/new/')
    cy.get('input[name=url]').type(testRepoURL)
    cy.get('button').contains('Sync').click()
    cy.syncTestRepo()
  })

  beforeEach(() => {
    cy.clearCookies()
    cy.intercept('http://gitea.kitspace.test:3000/user/kitspace/**')
    cy.visit('/login')
    cy.signIn(username, password)


    cy.visit(updatePageRoute)
    cy.intercept(
      `http://gitea.kitspace.test:3000/api/v1/repos/**`,
    ).as('getRepo')
  })

  it('should render the update page with correct project name', () => {
    cy.wait('@getRepo')

    cy.get('[data-cy=update-form-name] > input').should('have.value', testRepoName)
  })

  it('should handle changing project name', () => {
    const newName = 'new-cool-name'
    cy.wait('@getRepo')

    cy.get('[data-cy=update-form-name] > input').clear().type(newName)
    cy.get('[data-cy=update-form-submit]').click()

    cy.url().should('contain', `/projects/update/${username}/${newName}`)
  })

  it('should handle uploading files', () => {
    assert(false, 'NotImplemented')
  })

  it('should handle updating project name and uploading files at the same time', () => {
    assert(false, 'NotImplemented')
  })
})
