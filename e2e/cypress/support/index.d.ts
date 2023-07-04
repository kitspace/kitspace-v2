/// <reference types="cypress" />

import * as Joi from 'joi'

declare namespace Cypress {
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
    dropFiles(files, fileNames: string[], username: string, newProject: boolean): Chainable<any>
  }

  interface Chainable<Subject> {
    /**
     *
     * @param path
     * @param timeout number of milliseconds
     */
    forceVisit(path: string, timeout: number): Chainable<any>
  }

  interface Chainable<Subject> {
    /**
     * Import a repo from a url
     * @param remoteUrl
     * @param repoName
     * @param user
     */
    importRepo(remoteUrl: string, repoName: string, user: any): Chainable<any>
  }
}
