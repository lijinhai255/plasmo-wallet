import { useCallback } from 'react'

export const useRouter = () => {
  const push = useCallback((path: string) => {
    if (typeof window !== 'undefined' && window.location) {
      window.location.hash = path
    }
  }, [])

  const replace = useCallback((path: string) => {
    if (typeof window !== 'undefined' && window.location) {
      window.location.replace(`#${path}`)
    }
  }, [])

  const back = useCallback(() => {
    if (typeof window !== 'undefined' && window.history) {
      window.history.back()
    }
  }, [])

  return {
    push,
    replace,
    back,
    pathname: typeof window !== 'undefined' ? window.location.hash.slice(1) : '/',
    hash: typeof window !== 'undefined' ? window.location.hash : '#'
  }
}