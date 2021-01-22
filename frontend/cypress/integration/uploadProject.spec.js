import faker from 'faker'

const giteaApiUrl = 'http://gitea.kitspace.test:3000/api/v1'
const updateProjectUrl = 'http://kitspace.test:3000/projects/update'

describe('Upload project', () => {
  const username = faker.name.firstName()
  const email = faker.internet.email()
  const password = '123456'

  before(() => {
    cy.clearCookies()
    cy.createUser(username, email, password)
  })

  beforeEach(() => {
    cy.clearCookies()
    cy.visit('/login')
    cy.signIn(username, password)
  })

  it('Should create a project and redirect to its update route on file drop', () => {
    // This will match any request made by `utils/giteaApi.createRepo`,
    // The `**` for matching the csrf query param.
    cy.intercept(`${giteaApiUrl}/user/repos**`).as('createRepo')

    // This will match any request for `utils/giteaApi.getRepo`
    cy.intercept(`${giteaApiUrl}/repos/${username}/**`).as('getRepo')

    cy.visit('/projects/new')

    // Simulate dropping a single file('example.png') in the dropzone.
    cy.fixture('example.png', 'base64').then(file => {
      cy.get('.dropzone').dropFiles([file], ['example.png'])
    })

    // Wait until getting a response from the server then validate a redirection has happened
    cy.wait(['@createRepo', '@getRepo'])
    cy.url().should('eq', `${updateProjectUrl}/${username}/example?create=true`)

    cy.get('[data-cy=file-name]').contains('example.png')
  })

  it('Should show modal on project names collision', () => {
    // Dropping a single file with the same name as an existing project(example)
    // will trigger a name collision

    // This will match any request made by `utils/giteaApi.createRepo`,
    // The `**` for matching the csrf query param.
    cy.intercept(`${giteaApiUrl}/user/repos**`).as('createRepo')

    // This will match any request for `utils/giteaApi.getRepo`
    cy.intercept(`${giteaApiUrl}/repos/${username}/**`).as('getRepo')

    cy.visit('/projects/new')

    // Simulate dropping a single file('example.png') in the dropzone.
    cy.fixture('example.png', 'base64').then(file => {
      cy.get('.dropzone').dropFiles([file], ['example.png'])
    })

    cy.wait(['@createRepo', '@getRepo'])

    // Collision modal should open
    cy.get('[data-cy=collision-modal]').should('be.visible')

    // `Choose different name` should be disabled as the user haven't changed the name yet
    cy.get('[data-cy=collision-different-name]').should('be.disabled')
    cy.get('[data-cy=collision-update]').should('be.enabled')
  })

  it('Should commit files to the same project on choosing `Update existing project`', () => {
    // Dropping a single file with the same name as an existing project(example)
    // will trigger a name collision

    // This will match any request made by `utils/giteaApi.createRepo`,
    // The `**` for matching the csrf query param.
    cy.intercept(`${giteaApiUrl}/user/repos**`).as('createRepo')

    // This will match any request for `utils/giteaApi.getRepo`
    cy.intercept(`${giteaApiUrl}/repos/${username}/**`).as('getRepo')

    cy.visit('/projects/new')

    // Simulate dropping a single file('example.png') in the dropzone.
    cy.fixture('example.png', 'base64').then(f1 => {
      cy.fixture('example2.png', 'base64').then(f2 => {
        cy.get('.dropzone').dropFiles([f1, f2], ['example.png', 'example2.png'])
      })
    })

    cy.wait(['@createRepo', '@getRepo'])

    // Choose `Update existing project`
    cy.get('[data-cy=collision-update]').click()

    cy.wait('@getRepo')

    // redirect to the upload page
    cy.url().should('eq', `${updateProjectUrl}/${username}/example`)

    // The new file is committed and on the update page
    cy.get('[data-cy=file-name]').contains('example2.png')
  })
})
