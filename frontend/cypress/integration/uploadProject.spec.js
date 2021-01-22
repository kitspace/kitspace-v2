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
      cy.get('.dropzone').dropFile(file, 'example.png')
    })

    // Wait until getting a response from the server then validate a redirection has happened
    cy.wait(['@createRepo', '@getRepo'])
    cy.url().should('eq', `${updateProjectUrl}/${username}/example?create=true`)
  })
})
