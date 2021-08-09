/// <reference types="cypress" />

import * as Joi from 'joi'

declare namespace Cypress {
  interface Chainable<Subject> {
    /**
     * stub all request to the Gitea `/user/kitspace/sign_up`
     * @example
     * cy.stubSignUpReq(true, { email, ActiveCodeLives: duration })
     */
    stubSignUpReq(ok: boolean, response: object): Chainable<any>
  }

  interface Chainable<Subject> {
      /**
     * stub all request to the Gitea `/user/kitspace/sign_in`
     * @example
     * cy.stubSignUpReq(true, LoggedInSuccessfully: true)
     */
    stubSignInReq(ok: boolean, response: object, path?: string): Chainable<any>
  }

  interface Chainable<Subject> {
    /**
     * Creat a user into Gitea
     * @example
     * cy.creatUser(username, email, password)
     */
    createUser(username: string, email: string, password: string): Chainable<any>
  }

  interface Chainable<Subject> {
    /**
     * stub request for the
     * @param ok
     * @param response
     * @param projectName
     */
    stubUpdateProject(ok: boolean, response: object, projectName: string): Chainable<any>
  }

  interface Chainable<Subject> {
    /**
     * Sign up a user
     * @example
     * cy.signUp(username, email, password)
     */
    signUp(username: string, email: string, password: string): Chainable<any>
  }

  interface Chainable<Subject> {
    /**
     * log in a user
     * @example
     * cy.signIn(username, password)
     */
   signIn(username: string, password: string): Chainable<any>
  }

  interface Chainable<Subject> {
    /**
     * Sign out a user
     * @example
     * cy.signUp()
     */
    signOut(): Chainable<any>
  }

  interface Chainable<Subject> {
    /**
     * Users database are at `{gitea}/admin/users`
     * Kitspace user interaction should appear there.
     * @example
     * cy.goToUsersAdminPanel()
     */
    goToUsersAdminPanel()
  }

  interface Chainable<Subject> {
    /**
     * Validate the form has all the proper fields defined in a schema
     * ignoring private fields(added automatically e.g., _csrf)
     * @example
     * hasProperFields(SignInForm)
     */
    hasProperFields(schema: Joi.ObjectSchema)
  }

  interface Chainable<Subject> {
    /**
     * Create a drop event with file on the parent subject
     * @credits Zwaar Contrast <postduif@zwaarcontrast.nl>
     * @param files
     * @param fileNames
     * @param username the owner of repo
     * @param newProject if the project is new wait for `@create` and `@upload`.
     * cy.get('.dropzone').dropFile(file, 'example.txt')
     */
      dropFiles(files, fileNames: string[], username: string, newProject=true): Chainable<any>
  }

  interface Chainable<Subject> {
    /**
     * 
     * @param path
     * @param timeout number of milliseconds 
     */
    forceVisit(path: string, timeout: number): Chainable<any>
  }
}
