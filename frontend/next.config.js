module.exports = {
  env: {
    KITSPACE_GITEA_URL: process.env.KITSPACE_GITEA_URL,
    KITSPACE_PROCESSOR_URL: process.env.KITSPACE_PROCESSOR_URL,
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
  exportTrailingSlash: true,
  exportPathMap(map) {
    for (const key in map) {
      map[key].query = map[key].query || {}
      map[key].query.isStaticFallback = true
    }
    const codes = [
      400,
      401,
      402,
      403,
      404,
      405,
      406,
      407,
      408,
      409,
      410,
      411,
      412,
      413,
      414,
      415,
      416,
      417,
      418,
      421,
      422,
      423,
      424,
      425,
      426,
      428,
      429,
      431,
      451,
      500,
      501,
      502,
      503,
      504,
      505,
      506,
      507,
      508,
      510,
      511,
    ]
    codes.forEach(err => {
      map['/error/' + err] = { page: '/_error', query: { staticStatusCode: err } }
    })
    return map
  },
}
