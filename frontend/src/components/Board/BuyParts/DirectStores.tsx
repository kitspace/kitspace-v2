import React, { useEffect, useState, useCallback } from 'react'

import DigikeyData from '1-click-bom-minimal/lib/data/digikey.json'
import FarnellData from '1-click-bom-minimal/lib/data/farnell.json'
import countriesData from '1-click-bom-minimal/lib/data/countries.json'

const DirectStores = ({ items, multiplier }: DirectStoresProps) => {
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
        <input name={`part${index}`} type="hidden" value={part.sku} />
        <input name={`qty${index}`} type="hidden" value={part.quantity} />
        <input name={`cref${index}`} type="hidden" value={part.reference} />
      </span>
    )
  }

  const digikey = (code, parts) => {
    const site = DigikeyData.sites[DigikeyData.lookup[code]]
    return (
      <form
        key="DigikeyForm"
        action={`https${site}/classic/ordering/fastadd.aspx?WT.z_cid=ref_kitnic`}
        id="DigikeyForm"
        method="POST"
        target="_blank"
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
        key="FarnellForm"
        action={`https${site}/jsp/extlink.jsp`}
        id="FarnellForm"
        method="GET"
        target="_blank"
      >
        <input name="CMP" type="hidden" value="ref_kitnic" />
        <input name="action" type="hidden" value="buy" />
        <input name="product" type="hidden" value={queryString} />
      </form>
    )
  }

  const newark = parts => {
    const queryString = parts.map(tildeDelimiter).join('~')
    return (
      <form
        key="NewarkForm"
        action="https://www.newark.com/jsp/extlink.jsp"
        id="NewarkForm"
        method="GET"
        target="_blank"
      >
        <input name="CMP" type="hidden" value="ref_kitnic" />
        <input name="action" type="hidden" value="buy" />
        <input name="product" type="hidden" value={queryString} />
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

interface DirectStoresProps {
  items: Array<any>
  multiplier: number
}
export default DirectStores
