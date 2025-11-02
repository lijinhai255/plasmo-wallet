import { useState, useCallback, useRef, useEffect } from 'react'

export interface SimpleToast {
  id: string
  message: string
  type: 'success' | 'error' | 'warning' | 'info'
}

export const useSimpleToast = () => {
  const [toasts, setToasts] = useState<SimpleToast[]>([])
  const timeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map())

  // 清理所有定时器
  useEffect(() => {
    return () => {
      timeoutsRef.current.forEach(timeout => clearTimeout(timeout))
      timeoutsRef.current.clear()
    }
  }, [])

  const showToast = useCallback((message: string, type: SimpleToast['type'] = 'info', duration = 3000) => {
    const id = Date.now().toString()
    const newToast: SimpleToast = { id, message, type }

    setToasts(prev => [...prev, newToast])

    if (duration > 0) {
      const timeout = setTimeout(() => {
        removeToast(id)
      }, duration)

      timeoutsRef.current.set(id, timeout)
    }

    return id
  }, [])

  const removeToast = useCallback((id: string) => {
    const timeout = timeoutsRef.current.get(id)
    if (timeout) {
      clearTimeout(timeout)
      timeoutsRef.current.delete(id)
    }

    setToasts(prev => prev.filter(toast => toast.id !== id))
  }, [])

  const showSuccess = useCallback((message: string, duration?: number) =>
    showToast(message, 'success', duration), [showToast])

  const showError = useCallback((message: string, duration?: number) =>
    showToast(message, 'error', duration), [showToast])

  const showWarning = useCallback((message: string, duration?: number) =>
    showToast(message, 'warning', duration), [showToast])

  const showInfo = useCallback((message: string, duration?: number) =>
    showToast(message, 'info', duration), [showToast])

  const clearAll = useCallback(() => {
    timeoutsRef.current.forEach(timeout => clearTimeout(timeout))
    timeoutsRef.current.clear()
    setToasts([])
  }, [])

  return {
    toasts,
    showToast,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    removeToast,
    clearAll,
  }
}