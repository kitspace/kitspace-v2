const { MeiliSearch } = require('meilisearch')
const {
  PHASE_PRODUCTION_SERVER,
  PHASE_DEVELOPMENT_SERVER,
} = require('next/constants')

module.exports = async phase => {
  let meiliSearchOnlyKey = {}
  let imageDomains = []
  if ([PHASE_DEVELOPMENT_SERVER, PHASE_PRODUCTION_SERVER].includes(phase)) {
    // the search-only api key gets generated by meili so we have to retrieve
    // it at runtime rather than use an env variable
    const meiliMaster = new MeiliSearch({
      host: 'http://meilisearch:7700',
      apiKey: process.env.MEILI_MASTER_KEY,
    })
    // get the api key which _only_ has the "search" capability
    const meiliKeys = await meiliMaster.getKeys()
    meiliSearchOnlyKey = meiliKeys.results.find(
      key => key.actions.length === 1 && key.actions[0] === 'search',
    )

    imageDomains = [
      // TODO: use a wildcard when https://github.com/vercel/next.js/pull/27345 get merged
      `gitea.${process.env.KITSPACE_DOMAIN}`,
      new URL(process.env.KITSPACE_ASSET_URL).hostname,
      'github.com',
      'raw.githubusercontent.com',
      'secure.gravatar.com',
    ]
  }
  return {
    // we use nginx to compress so we turn off next.js gzip compression
    compress: false,
    publicRuntimeConfig: {
      KITSPACE_DOMAIN: process.env.KITSPACE_DOMAIN,
      KITSPACE_GITEA_URL: process.env.KITSPACE_GITEA_URL,
      KITSPACE_ASSET_URL: process.env.KITSPACE_ASSET_URL,
      KITSPACE_MEILISEARCH_URL: process.env.KITSPACE_MEILISEARCH_URL,
      MAX_FILE_SIZE: process.env.MAX_FILE_SIZE,
      meiliApiKey: meiliSearchOnlyKey.key,
    },
    eslint: {
      ignoreDuringBuilds: true,
    },
    exportPathMap(map) {
      for (const key in map) {
        map[key].query = map[key].query || {}
        map[key].query.isStaticFallback = true
      }
      const codes = [
        400, 401, 402, 403, 404, 405, 406, 407, 408, 409, 410, 411, 412, 413, 414,
        415, 416, 417, 418, 421, 422, 423, 424, 425, 426, 428, 429, 431, 451, 500,
        501, 502, 503, 504, 505, 506, 507, 508, 510, 511,
      ]
      codes.forEach(err => {
        map['/error/' + err] = { page: '/_error', query: { staticStatusCode: err } }
      })
      return map
    },
    images: {
      domains: imageDomains,
    },
    async redirects() {
      // we use "_" as the project name when there is only one project but we
      // don't want it to appear in the URL of the project page
      return [
        {
          source: '/:user/:repo/_',
          destination: '/:user/:repo',
          permanent: true,
        },
        {
          source: '/boards/:service/:user/:repo*',
          destination: '/:user/:repo*',
          permanent: true,
        },
      ]
    },
  }
}
