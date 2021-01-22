import faker from 'faker'

describe('Updating a project behavior validation', () => {
  const testRepoURL = 'https://github.com/AbdulrhmnGhanem/light-test-repo'
  const username = faker.name.firstName()
  const testRepoName = 'light-test-repo'
  const testRepoFullName = `${username}/${testRepoName}`
  const email = faker.internet.email()
  const password = '123456'

  before(() => {
    cy.clearCookies()
    // create a user and sign him in
    cy.createUser(username, email, password)
    cy.visit('/login')
    cy.intercept('http://gitea.kitspace.test:3000/user/kitspace/**')
    cy.signIn(username, password)

    // sync the test repo
    cy.visit('/projects/new/')
    cy.get('input[name=url]').type(testRepoURL)
    cy.get('button').contains('Sync').click()
    cy.syncTestRepo()
  })

  beforeEach(() => {
    cy.clearCookies()
    cy.visit('/login')
    cy.signIn(username, password)
  })

  it('should render the update page with correct project name', () => {
    cy.intercept(
      `http://gitea.kitspace.test:3000/api/v1/repos/${testRepoFullName}**`,
    ).as('getRepo')

    cy.visit(`/projects/update/${testRepoFullName}`)
    cy.wait('@getRepo')

    cy.get('input[name=name]').should('have.value', testRepoName)
  })

  it('should handle updating project name', () => {
    assert(false, 'NotImplemented')
  })

  it('should handle uploading files', () => {
    assert(false, 'NotImplemented')
  })

  it('should handle updating project name and uploading files at the same time', () => {
    assert(false, 'NotImplemented')
  })
})
