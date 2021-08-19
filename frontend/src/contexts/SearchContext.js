import { useRouter } from 'next/router'
import { createContext, useContext, useEffect, useState } from 'react'

const SearchContext = createContext({
  query: '',
  updateQuery: () => {},
})

const SearchProvider = ({ children, initialQuery }) => {
  const [query, setQuery] = useState(initialQuery ?? '')

  const {
    query: { q },
  } = useRouter()

  useEffect(() => {
    if (q == null) setQuery('')
  }, [q])

  return (
    <SearchContext.Provider value={{ query, updateQuery: setQuery }}>
      {children}
    </SearchContext.Provider>
  )
}

export const useSearchQuery = () => useContext(SearchContext)

export default SearchProvider
