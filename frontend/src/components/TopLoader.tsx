import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import styles from './TopLoader.module.scss'

export default function TopLoader() {
  const [isLoading, setIsLoading] = useState(false)
  const [isCompleting, setIsCompleting] = useState(false)
  const router = useRouter()

  const isRootOrSearchRoute = (path: string) => {
    return path === '/' || path.startsWith('/search?')
  }

  useEffect(() => {
    let timeoutId: NodeJS.Timeout

    const handleStart = (url: string) => {
      // Skip showing loader when navigating between root and search routes
      // since they're essentially the same page
      if (isRootOrSearchRoute(router.asPath) && isRootOrSearchRoute(url)) {
        return // Don't show loader for these transitions
      }

      setIsLoading(true)
      setIsCompleting(false)
    }

    const handleComplete = () => {
      setIsCompleting(true)

      // Give a moment for the completion animation, then hide
      timeoutId = setTimeout(() => {
        setIsLoading(false)
        setIsCompleting(false)
      }, 300)
    }

    const handleError = () => {
      timeoutId = setTimeout(() => {
        setIsLoading(false)
        setIsCompleting(false)
      }, 100)
    }

    router.events.on('routeChangeStart', handleStart)
    router.events.on('routeChangeComplete', handleComplete)
    router.events.on('routeChangeError', handleError)

    return () => {
      router.events.off('routeChangeStart', handleStart)
      router.events.off('routeChangeComplete', handleComplete)
      router.events.off('routeChangeError', handleError)
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
    }
  }, [router])

  if (!isLoading) {
    return null
  }

  return (
    <div className={styles.topLoaderContainer}>
      <div
        className={`${styles.topLoader} ${isCompleting ? styles.completing : ''}`}
      />
    </div>
  )
}
