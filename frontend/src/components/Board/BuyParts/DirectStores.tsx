import React, { useEffect, useState, useCallback } from 'react'

import DigikeyData from '1-click-bom-minimal/lib/data/digikey.json'
import countriesData from '1-click-bom-minimal/lib/data/countries.json'

const DirectStores = ({ items, multiplier }: DirectStoresProps) => {
  const [countryCode, setCountryCode] = useState('Other')
  const [digikeyParts, setDigikeyParts] = useState([])

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

  useEffect(() => {
    const abortController = new AbortController()
    const signal = abortController.signal
    if (typeof window !== 'undefined') {
      getLocation(signal).then(code => {
        if (code && !signal.aborted) {
          setCountryCode(code)
        }
      })
    }
    setDigikeyParts(getParts('Digikey'))
    return () => {
      abortController.abort()
    }
  }, [getParts])

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

  return <span>{[digikey(countryCode, digikeyParts)]}</span>
}

const getLocation = async (signal: AbortSignal) => {
  const usedCountryCodes = Object.keys(countriesData).map(key => countriesData[key])

  try {
    const res = await fetch('/api/geoip/', { signal })
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
    if (!signal.aborted) {
      console.error(err)
    }
    return 'Other'
  }
}

interface DirectStoresProps {
  items: Array<any>
  multiplier: number
}
export default DirectStores
