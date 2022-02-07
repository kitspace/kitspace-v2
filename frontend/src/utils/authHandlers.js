import Router from 'next/router'
// eslint-disable-next-line no-unused-vars
import { NextApiRequest, NextApiResponse } from 'next'

/**
 * @param {string} asPath the page path e.g., `/projects/new`.
 */
export const withRequireSignIn =
  asPath =>
  /**
   * @param {{req: !NextApiRequest }}
   */
  ({ req }) => {
    const session = req.session

    const isRelativePath = asPath.startsWith('/')
    if (!isAuthenticated(session) && isRelativePath) {
      return {
        redirect: {
          destination: `/login?redirect=${encodeURIComponent(asPath)}`,
          permanent: false,
        },
      }
    }
    return {}
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

      // Only redirect if it belongs to our website.
      if (redirect.startsWith('/')) {
        res.writeHead(307, { Location: redirect })
        res.end()
      }
    } else {
      Router.replace('/')
    }
  }
}

const isAuthenticated = session => session?.user != null
