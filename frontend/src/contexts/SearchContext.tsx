import { useRouter } from 'next/router'
import { createContext, useContext, useEffect, useState } from 'react'

const SearchContext = createContext<SearchContext | null>({
  query: '',
  updateQuery: () => {},
})

const SearchProvider = ({ children, initialQuery }: SearchProviderProps) => {
  const [query, setQuery] = useState(initialQuery)

  const {
    query: { q },
    events,
  } = useRouter()

  useEffect(() => {
    if (q == null) {
      setQuery('')
    }
  }, [q])

  events?.on('routeChangeComplete', (url: string) => {
    /*
     * Handle history navigation by update the search query in the context when the url changes.
     * We read the query parameter from the url instead of using the router query
     * because the router query gets updated asynchronously.
     */
    const latestQuery = new URLSearchParams(url.split('?')[1]).get('q')
    if (latestQuery != null) {
      setQuery(latestQuery)
    }
  })

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
