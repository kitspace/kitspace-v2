import React, { useEffect, useState } from 'react'

import DigikeyData from '1-click-bom-minimal/lib/data/digikey.json'
import FarnellData from '1-click-bom-minimal/lib/data/farnell.json'
import countriesData from '1-click-bom-minimal/lib/data/countries.json'

const DirectStores = ({ items, multiplier }) => {
  const [countryCode, setCountryCode] = useState('Other')
  const [digikeyParts, setDigikeyParts] = useState([])
  const [farnellParts, setFarnellParts] = useState([])
  const [newarkParts, setNewarkParts] = useState([])

  useEffect(() => {
    if (typeof window != null) {
      getLocation().then(code => setCountryCode(code))
    }

    setDigikeyParts(getParts('Digikey'))
    setFarnellParts(getParts('Farnell'))
    setNewarkParts(getParts('Newark'))
  }, [])

  const getLocation = () => {
    const usedCountryCodes = Object.keys(countriesData).map(
      key => countriesData[key],
    )
    const freegeoipEndpoint = 'https://freegeoip.kitspace.org'

    return fetch(freegeoipEndpoint)
      .then(res => res.json())
      .then(body => {
        const { country_code: code } = body
        if (code === 'GB') {
          return 'UK'
        }
        if (usedCountryCodes.indexOf(code) < 0) {
          return 'Other'
        }
        return code
      })
      .catch(err => {
        // eslint-disable-next-line no-console
        console.error(err)
        return 'Other'
      })
  }

  const getParts = retailer =>
    items
      .filter(part => retailer in part.retailers && part.retailers[retailer] != '')
      .map(part => ({
        sku: part.retailers[retailer],
        reference: part.reference,
        quantity: Math.ceil(multiplier * part.quantity),
      }))

  const tildeDelimiter = part => `${part.sku}~${part.quantity}`

  const digikeyPartRenderer = (part, index) => {
    index++
    return (
      <span key={`digikeyRenderer${index}`}>
        <input type="hidden" name={`part${index}`} value={part.sku} />
        <input type="hidden" name={`qty${index}`} value={part.quantity} />
        <input type="hidden" name={`cref${index}`} value={part.reference} />
      </span>
    )
  }

  const digikey = (countryCode, parts) => {
    const site = DigikeyData.sites[DigikeyData.lookup[countryCode]]
    return (
      <form
        target="_blank"
        key="DigikeyForm"
        id="DigikeyForm"
        method="POST"
        action={
          `https${site}/classic/ordering/fastadd.aspx` + '?WT.z_cid=ref_kitnic'
        }
      >
        {parts?.map(digikeyPartRenderer)}
      </form>
    )
  }

  const farnell = (countryCode, parts) => {
    const site = FarnellData.sites[FarnellData.lookup[countryCode]]
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

export default DirectStores
