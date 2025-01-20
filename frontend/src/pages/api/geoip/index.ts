import { CountryResponse, Reader } from 'maxmind'
import type { NextApiRequest, NextApiResponse } from 'next'
import fs from 'node:fs'
import path, { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const file = fileURLToPath(import.meta.url)
const dir = dirname(file)
const buffer = fs.readFileSync(path.join(dir, 'GeoLite2-Country.mmdb'))

const geo = new Reader<CountryResponse>(buffer)

export default async function handleGeoip(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  let ip = req.headers['x-forwarded-for']
  if (Array.isArray(ip)) {
    ip = ip[0]
  }
  const lookup = geo.get(ip)
  res.json({ country_code: lookup?.country?.iso_code })
}
