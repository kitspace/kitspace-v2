/**
 * Installs gitea in default configuration and creates admin
 */

const puppeteer = require('puppeteer');

;(async () => {
  const browser = await puppeteer.launch({args: ['--no-sandbox', '--disable-setuid-sandbox']});
  const page = await browser.newPage()
  const url = `http://gitea.${process.env.KITSPACE_DOMAIN}${process.env.KITSPACE_EXTERNAL_PORT}/install`
  await page.goto(url)

  try {
    await page.type('#admin_name', process.env.CYPRESS_GITEA_ADMIN_USERNAME)
    await page.type('#admin_passwd', process.env.CYPRESS_GITEA_ADMIN_PASSWORD)
    await page.type(
      '#admin_confirm_passwd',
      process.env.CYPRESS_GITEA_ADMIN_PASSWORD,
    )
    await page.type('#admin_email', 'admin@kitspace.com')
    await page.click('form > div > button')
  } catch (e) {
    // If gitea is already installed do nothing
  } finally {
    await browser.close()
  }
})()
