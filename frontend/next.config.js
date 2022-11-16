const { MeiliSearch } = require('meilisearch')
const {
  PHASE_PRODUCTION_SERVER,
  PHASE_DEVELOPMENT_SERVER,
} = require('next/constants')

module.exports = async phase => {
  let meiliSearchOnlyKey = {}
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
  }
  return {
    // we use nginx to compress so we turn off next.js gzip compression
    compress: false,
    publicRuntimeConfig: {
      KITSPACE_GITEA_URL: process.env.KITSPACE_GITEA_URL,
      KITSPACE_PROCESSOR_URL: process.env.KITSPACE_PROCESSOR_URL,
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
      domains: [
        // TODO: use a wildcard when https://github.com/vercel/next.js/pull/27345 get merged
        `gitea.${process.env.KITSPACE_DOMAIN}`,
        `processor.${process.env.KITSPACE_DOMAIN}`,
        'github.com',
        'raw.githubusercontent.com',
        'secure.gravatar.com',
      ],
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
          source: '/:user/:repo/1-click-BOM.tsv',
          destination: '/:user/:repo/_/1-click-BOM.tsv',
          permanent: true,
        },
      ]
    },
    async rewrites() {
      // TODO: https://github.com/kitspace/kitspace-v2/issues/486
      // we should get rid of this rewrite and just link to `/_/IBOM`
      return [
        {
          source: '/:user/:repo/IBOM',
          destination: '/:user/:repo/_/IBOM',
        },
      ]
    },
    webpack(config) {
      config.module.rules.push({
        test: /\.(png|svg)$/,
        use: {
          loader: 'url-loader',
          options: {
            limit: 8192,
            publicPath: '/_next/static/',
            outputPath: 'static/',
            name: '[name].[ext]',
          },
        },
      })
      return config
    },
  }
}
