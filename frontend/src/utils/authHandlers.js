// eslint-disable-next-line no-unused-vars
import { NextApiRequest } from 'next'

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
 * @param {{req: !NextApiRequest }}
 */
export const withAlreadySignedIn = ({ req }) => {
  const session = req.session

  if (isAuthenticated(session)) {
    const { redirect = '/' } = req.query

    // Only redirect if it belongs to our website.
    if (redirect.startsWith('/')) {
      return {
        redirect: {
          destination: redirect,
          permanent: false,
        },
      }
    }
  }
  return {}
}

const isAuthenticated = session => session?.user != null
