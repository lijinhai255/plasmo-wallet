import React, { createContext, useContext, ReactNode } from 'react'
import { useSimpleToast, UseSimpleToastReturn } from '../hooks/useSimpleToast'

const SimpleToastContext = createContext<UseSimpleToastReturn | null>(null)

interface SimpleToastProviderProps {
  children: ReactNode
}

export const SimpleToastProvider: React.FC<SimpleToastProviderProps> = ({ children }) => {
  const toastHook = useSimpleToast()

  return (
    <SimpleToastContext.Provider value={toastHook}>
      {children}
    </SimpleToastContext.Provider>
  )
}

export const useSimpleToastContext = (): UseSimpleToastReturn => {
  const context = useContext(SimpleToastContext)
  if (!context) {
    throw new Error('useSimpleToastContext must be used within a SimpleToastProvider')
  }
  return context
}