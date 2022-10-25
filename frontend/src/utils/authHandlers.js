// eslint-disable-next-line @typescript-eslint/no-unused-vars
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
        props: {},
        redirect: {
          destination: `/login?redirect=${encodeURIComponent(asPath)}`,
          permanent: false,
        },
      }
    }
    return { props: {} }
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
        props: {},
        redirect: {
          destination: redirect,
          permanent: false,
        },
      }
    }
  }
  return { props: {} }
}

const isAuthenticated = session => session?.user != null
