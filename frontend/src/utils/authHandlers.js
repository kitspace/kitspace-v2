import Router from 'next/router'
// eslint-disable-next-line no-unused-vars
import { NextApiRequest, NextApiResponse } from 'next'

/**
 * @param {string} asPath the page path e.g., `/project/new`.
 * @returns
 */
export const withRequireSignIn =
  asPath =>
  /**
   * @param {{req: NextApiRequest, res: NextApiResponse}}
   */
  ({ req, res }) => {
    const session = req?.session ?? window?.session

    if (!isAuthenticated(session)) {
      if (res) {
        res.writeHead(307, { Location: '/login' })
        res.end()
      } else {
        Router.replace(`/login?redirect=${asPath}`)
      }
    }
  }

/**
 *
 * @param {{req: NextApiRequest, res: NextApiResponse}}
 */
export const withRequireSignOut = ({ req, res }) => {
  const session = req?.session ?? window?.session

  if (isAuthenticated(session)) {
    if (res) {
      const { redirect = '/' } = req.query
      res.writeHead(307, { Location: redirect })
      res.end()
    } else {
      Router.replace('/')
    }
  }
}

const isAuthenticated = session => session?.user != null
