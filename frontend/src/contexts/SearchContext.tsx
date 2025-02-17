import { createContext, useContext, useEffect } from 'react'
import { useSessionStorage } from 'usehooks-ts'

const SearchContext = createContext<SearchContext | null>({
  query: '',
  updateQuery: () => {},
})

const SearchProvider = ({ children, initialQuery }: SearchProviderProps) => {
  const [query, setQuery] = useSessionStorage('searchQuery', initialQuery)

  useEffect(() => {
    if (initialQuery) {
      setQuery(initialQuery)
    }
  }, [initialQuery, setQuery])

  return (
    <SearchContext.Provider value={{ query, updateQuery: setQuery }}>
      {children}
    </SearchContext.Provider>
  )
}

export const useSearchQuery = () => useContext(SearchContext)

export default SearchProvider

interface SearchContext {
  query: string
  updateQuery: (q: string) => void
}

interface SearchProviderProps {
  children: React.ReactNode
  initialQuery: string
}
