const withCss = require('@zeit/next-css')
const withSass = require('@zeit/next-sass')

module.exports = withSass(
  withCss({
    env: {
      KITSPACE_GITEA_URL: process.env.KITSPACE_GITEA_URL,
    },
    webpack(config) {
      // Fixes npm packages that depend on `fs` module
      config.node = {
        fs: 'empty',
      }
      config.module.rules.push({
        test: /\.(png|svg|eot|otf|ttf|woff|woff2)$/,
        use: {
          loader: 'file-loader',
          options: {
            publicPath: '/_next/static/',
            outputPath: 'static',
            name: '[name].[hash].[ext]',
          },
        },
      })

      return config
    },
  }),
)
