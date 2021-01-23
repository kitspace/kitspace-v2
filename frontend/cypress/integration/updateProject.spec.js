import faker from 'faker'

describe('Updating a project behavior validation', () => {
  const username = faker.name.firstName()
  const testRepoName = 'example'
  const testRepoFullName = `${username}/${testRepoName}`
  const updatePageRoute = `/projects/update/${testRepoFullName}`
  const email = faker.internet.email()
  const password = '123456'

  before(() => {
    cy.clearCookies()
    // create a user and sign him in
    cy.intercept('http://gitea.kitspace.test:3000/user/kitspace/**')
    cy.intercept(`http://gitea.kitspace.test:3000/api/v1/repos/**`)

    cy.createUser(username, email, password)
    cy.visit('/login')
    cy.signIn(username, password)

    // sync the test repo
    cy.visit('/projects/new/')
    // Simulate dropping a single file('example.png') in the dropzone.
    // So it will create a project named `example`
    cy.intercept(
      `http://gitea.kitspace.test:3000/${testRepoFullName}/upload-file**`,
    ).as('upload')
    cy.preFileDrop(username)
    cy.fixture('example.png', 'base64').then(file => {
      cy.get('.dropzone').dropFiles([file], ['example.png'])
    })

    // Wait until the file is uploaded otherwise cypress terminates the request
    cy.wait('@upload')
  })

  beforeEach(() => {
    cy.clearCookies()
    cy.intercept('http://gitea.kitspace.test:3000/user/kitspace/**')
    cy.visit('/login')
    cy.signIn(username, password)

    cy.visit(updatePageRoute)
    cy.intercept(`http://gitea.kitspace.test:3000/api/v1/repos/**`).as('getRepo')
  })

  it('should render the update page with correct project name', () => {
    cy.get('[data-cy=update-form-name] > input').should('have.value', testRepoName)
  })

  it('should handle uploading files', () => {
    // Intercept request for the uploading route
    cy.intercept(
      `http://gitea.kitspace.test:3000/${testRepoFullName}/upload-file**`,
    ).as('upload')
    cy.preFileDrop(username)
    cy.fixture('example2.png', 'base64').then(file => {
      cy.get('.dropzone').dropFiles([file], ['example2.png'])
    })

    // Dropping a file should make it appear in the preview component
    cy.get('[data-cy=file-name]').contains('example2.png')

    cy.wait('@upload')

    // Commit files to the repo
    cy.get('[data-cy=update-form-submit]').click()

    // After reloading the update page the files should still in the preview component
    cy.reload()
    cy.get('[data-cy=file-name]').contains('example2.png')
  })

  it('should handle changing project name', () => {
    const newName = 'new-cool-name'

    // Changing the project name a submitting it
    cy.get('[data-cy=update-form-name] > input').clear().type(newName)
    cy.get('[data-cy=update-form-submit]').click()

    // should redirect to the new update page
    cy.url().should('contain', `/projects/update/${username}/${newName}`)
  })

  it('should handle updating project name and uploading files at the same time', () => {
    // notice that the project name has changed to `new-cool-name` in the previous test
    const testRepoFullName = `${username}/new-cool-name`
    const newName = 'even-cooler-name'

    cy.visit(`/projects/update/${testRepoFullName}`)

    // Update project name to `even-cooler-name`
    cy.get('[data-cy=update-form-name] > input').clear().type(newName)

    // Intercept request for the uploading route
    cy.intercept(
      `http://gitea.kitspace.test:3000/${testRepoFullName}/upload-file**`,
    ).as('upload')

    // Upload `example3.png`
    cy.preFileDrop(username)
    cy.fixture('example3.png', 'base64').then(file => {
      cy.get('.dropzone').dropFiles([file], ['example3.png'])
    })

    // Submit the update form
    cy.get('[data-cy=update-form-submit]').click()

     // Should redirect to the new update page
    cy.url().should('contain', `/projects/update/${username}/${newName}`)

    // `example3.png` should be in the preview
    cy.get('[data-cy=file-name]').contains('example3.png')
  })
})
