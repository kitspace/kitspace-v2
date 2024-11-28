const DirectStores = ({ items, multiplier }: DirectStoresProps) => {
  const digikeyParts = items
    .filter(part => 'Digikey' in part.retailers && part.retailers['Digikey'] !== '')
    .map(part => ({
      sku: part.retailers['Digikey'],
      reference: part.reference,
      quantity: Math.ceil(multiplier * part.quantity),
    }))

  return (
    <span>
      <form
        key="DigikeyForm"
        action={`https://digikey.com/classic/ordering/fastadd.aspx?WT.z_cid=ref_kitnic`}
        id="DigikeyForm"
        method="POST"
      >
        {digikeyParts.map((part, i) => (
          <span key={i}>
            <input name={`part${i}`} type="hidden" value={part.sku} />
            <input name={`qty${i}`} type="hidden" value={part.quantity} />
            <input name={`cref${i}`} type="hidden" value={part.reference} />
          </span>
        ))}
      </form>
    </span>
  )
}

interface DirectStoresProps {
  items: Array<any>
  multiplier: number
}
export default DirectStores
