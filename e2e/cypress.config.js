const { defineConfig } = require('cypress')

module.exports = defineConfig({
  projectId: 'd8hk55',
  experimentalFetchPolyfill: true,
  numTestsKeptInMemory: 25,
  includeShadowDom: true,
  defaultCommandTimeout: 10000,
  pageLoadTimeout: 80000,
  viewportWidth: 1500,
  viewportHeight: 800,
  videoUploadOnPasses: false,
  retries: {
    runMode: 3,
  },
  env: {
    home_path: '/',
  },
  e2e: {
    // We've imported your old cypress plugins here.
    // You may want to clean this up later by importing these.
    setupNodeEvents(on, config) {
      return require('./cypress/plugins/index.js')(on, config)
    },
    baseUrl: 'http://kitspace.test:3000',
    specPattern: 'cypress/e2e/**/*.{js,jsx,ts,tsx}',
  },
})
