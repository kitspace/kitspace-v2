import React, { useEffect, useState, useCallback } from 'react'

import { array, number } from 'prop-types'
import DigikeyData from '1-click-bom-minimal/lib/data/digikey.json'
import FarnellData from '1-click-bom-minimal/lib/data/farnell.json'
import countriesData from '1-click-bom-minimal/lib/data/countries.json'

const DirectStores = ({ items, multiplier }) => {
  const [countryCode, setCountryCode] = useState('Other')
  const [digikeyParts, setDigikeyParts] = useState([])
  const [farnellParts, setFarnellParts] = useState([])
  const [newarkParts, setNewarkParts] = useState([])

  const getParts = useCallback(
    retailer =>
      items
        .filter(
          part => retailer in part.retailers && part.retailers[retailer] !== '',
        )
        .map(part => ({
          sku: part.retailers[retailer],
          reference: part.reference,
          quantity: Math.ceil(multiplier * part.quantity),
        })),
    [items, multiplier],
  )

  const getLocation = async () => {
    const usedCountryCodes = Object.keys(countriesData).map(
      key => countriesData[key],
    )
    const freegeoipEndpoint = 'https://freegeoip.kitspace.org'

    try {
      const res = await fetch(freegeoipEndpoint)
      const body = await res.json()
      const { country_code: code } = body
      if (code === 'GB') {
        return 'UK'
      }
      if (usedCountryCodes.indexOf(code) < 0) {
        return 'Other'
      }
      return code
    } catch (err) {
      console.error(err)
      return 'Other'
    }
  }

  useEffect(() => {
    if (typeof window !== 'undefined') {
      getLocation().then(code => setCountryCode(code))
    }

    setDigikeyParts(getParts('Digikey'))
    setFarnellParts(getParts('Farnell'))
    setNewarkParts(getParts('Newark'))
  }, [getParts])

  const tildeDelimiter = part => `${part.sku}~${part.quantity}`

  const digikeyPartRenderer = (part, index) => {
    index += 1
    return (
      <span key={`digikeyRenderer${index}`}>
        <input type="hidden" name={`part${index}`} value={part.sku} />
        <input type="hidden" name={`qty${index}`} value={part.quantity} />
        <input type="hidden" name={`cref${index}`} value={part.reference} />
      </span>
    )
  }

  const digikey = (code, parts) => {
    const site = DigikeyData.sites[DigikeyData.lookup[code]]
    return (
      <form
        target="_blank"
        key="DigikeyForm"
        id="DigikeyForm"
        method="POST"
        action={`https${site}/classic/ordering/fastadd.aspx?WT.z_cid=ref_kitnic`}
      >
        {parts?.map(digikeyPartRenderer)}
      </form>
    )
  }

  const farnell = (code, parts) => {
    const site = FarnellData.sites[FarnellData.lookup[code]]
    const queryString = parts.map(tildeDelimiter).join('~')
    return (
      <form
        target="_blank"
        key="FarnellForm"
        id="FarnellForm"
        method="GET"
        action={`https${site}/jsp/extlink.jsp`}
      >
        <input type="hidden" name="CMP" value="ref_kitnic" />
        <input type="hidden" name="action" value="buy" />
        <input type="hidden" name="product" value={queryString} />
      </form>
    )
  }

  const newark = parts => {
    const queryString = parts.map(tildeDelimiter).join('~')
    return (
      <form
        target="_blank"
        key="NewarkForm"
        id="NewarkForm"
        method="GET"
        action="https://www.newark.com/jsp/extlink.jsp"
      >
        <input type="hidden" name="CMP" value="ref_kitnic" />
        <input type="hidden" name="action" value="buy" />
        <input type="hidden" name="product" value={queryString} />
      </form>
    )
  }

  return (
    <span>
      {[
        digikey(countryCode, digikeyParts),
        farnell(countryCode, farnellParts),
        newark(newarkParts),
      ]}
    </span>
  )
}

DirectStores.propTypes = {
  items: array.isRequired,
  multiplier: number.isRequired,
}
export default DirectStores
