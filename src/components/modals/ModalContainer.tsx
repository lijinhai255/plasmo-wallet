import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface Modal {
  id: string
  type: 'transaction' | 'connection' | 'signature' | 'network-switch' | 'add-token' | 'security' | 'error'
  title?: string
  content: ReactNode
  props?: Record<string, any>
  onClose?: () => void
}

interface ModalContextType {
  modals: Modal[]
  showModal: (modal: Omit<Modal, 'id'>) => string
  hideModal: (id: string) => void
  hideAllModals: () => void
}

const ModalContext = createContext<ModalContextType | undefined>(undefined)

export const useModal = () => {
  const context = useContext(ModalContext)
  if (!context) {
    throw new Error('useModal must be used within a ModalProvider')
  }
  return context
}

export const ModalProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [modals, setModals] = useState<Modal[]>([])

  const showModal = (modal: Omit<Modal, 'id'>) => {
    const id = `modal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const newModal: Modal = { ...modal, id }
    setModals(prev => [...prev, newModal])
    return id
  }

  const hideModal = (id: string) => {
    setModals(prev => {
      const modal = prev.find(m => m.id === id)
      if (modal?.onClose) {
        modal.onClose()
      }
      return prev.filter(m => m.id !== id)
    })
  }

  const hideAllModals = () => {
    modals.forEach(modal => {
      if (modal.onClose) {
        modal.onClose()
      }
    })
    setModals([])
  }

  // 处理 ESC 键关闭最上层的模态框
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && modals.length > 0) {
        hideModal(modals[modals.length - 1].id)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [modals])

  return (
    <ModalContext.Provider value={{ modals, showModal, hideModal, hideAllModals }}>
      {children}
      {modals.map(modal => (
        <ModalWrapper key={modal.id} modal={modal} onClose={() => hideModal(modal.id)} />
      ))}
    </ModalContext.Provider>
  )
}

interface ModalWrapperProps {
  modal: Modal
  onClose: () => void
}

const ModalWrapper: React.FC<ModalWrapperProps> = ({ modal, onClose }) => {
  useEffect(() => {
    // 防止背景滚动
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [])

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <div
      className="plasmo-fixed plasmo-inset-0 plasmo-bg-black plasmo-bg-opacity-50 plasmo-flex plasmo-items-center plasmo-justify-center plasmo-p-4 plasmo-z-[9999]"
      onClick={handleBackdropClick}
    >
      <div className="plasmo-bg-white plasmo-rounded-lg plasmo-shadow-xl plasmo-max-w-md plasmo-w-full plasmo-max-h-[90vh] plasmo-overflow-hidden">
        {modal.content}
      </div>
    </div>
  )
}

// 预定义的模态框组件
export const TransactionConfirmModal: React.FC<{
  transaction: any
  onConfirm: (approved: boolean) => void
}> = ({ transaction, onConfirm }) => {
  return (
    <div className="plasmo-p-6">
      <div className="plasmo-text-center plasmo-mb-4">
        <div className="plasmo-w-12 plasmo-h-12 plasmo-bg-orange-100 plasmo-rounded-full plasmo-flex plasmo-items-center plasmo-justify-center plasmo-mx-auto plasmo-mb-3">
          <span className="plasmo-text-2xl">🔄</span>
        </div>
        <h2 className="plasmo-text-xl plasmo-font-bold plasmo-mb-2">确认交易</h2>
        <p className="plasmo-text-gray-600 plasmo-text-sm">请仔细检查交易详情</p>
      </div>

      <div className="plasmo-bg-gray-50 plasmo-p-4 plasmo-rounded-lg plasmo-mb-4">
        <div className="plasmo-grid plasmo-grid-cols-2 plasmo-gap-2 plasmo-text-sm">
          <div>
            <span className="plasmo-text-gray-600">发送到:</span>
            <p className="plasmo-font-mono plasmo-truncate">{transaction.to}</p>
          </div>
          <div className="plasmo-text-right">
            <span className="plasmo-text-gray-600">金额:</span>
            <p className="plasmo-font-medium">{transaction.value} ETH</p>
          </div>
        </div>
      </div>

      <div className="plasmo-grid plasmo-grid-cols-2 plasmo-gap-3">
        <button
          onClick={() => onConfirm(false)}
          className="plasmo-bg-gray-100 plasmo-text-gray-700 plasmo-px-4 plasmo-py-3 plasmo-rounded-lg plasmo-font-medium hover:plasmo-bg-gray-200"
        >
          拒绝
        </button>
        <button
          onClick={() => onConfirm(true)}
          className="plasmo-bg-blue-600 plasmo-text-white plasmo-px-4 plasmo-py-3 plasmo-rounded-lg plasmo-font-medium hover:plasmo-bg-blue-700"
        >
          确认
        </button>
      </div>
    </div>
  )
}

export const ConnectionRequestModal: React.FC<{
  dAppInfo: any
  onApprove: (permissions: string[]) => void
  onReject: () => void
}> = ({ dAppInfo, onApprove, onReject }) => {
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>(
    dAppInfo.requestedPermissions || []
  )

  const handlePermissionToggle = (permission: string) => {
    setSelectedPermissions(prev =>
      prev.includes(permission)
        ? prev.filter(p => p !== permission)
        : [...prev, permission]
    )
  }

  return (
    <div className="plasmo-p-6">
      <div className="plasmo-text-center plasmo-mb-4">
        <div className="plasmo-w-12 plasmo-h-12 plasmo-bg-blue-100 plasmo-rounded-full plasmo-flex plasmo-items-center plasmo-justify-center plasmo-mx-auto plasmo-mb-3">
          <span className="plasmo-text-2xl">🔗</span>
        </div>
        <h2 className="plasmo-text-xl plasmo-font-bold plasmo-mb-2">连接请求</h2>
        <p className="plasmo-text-gray-600 plasmo-text-sm">{dAppInfo.title} 请求连接到您的钱包</p>
      </div>

      <div className="plasmo-bg-gray-50 plasmo-p-4 plasmo-rounded-lg plasmo-mb-4">
        <div className="plasmo-flex plasmo-items-center plasmo-space-x-3 plasmo-mb-3">
          {dAppInfo.favicon && (
            <img src={dAppInfo.favicon} alt="" className="plasmo-w-8 plasmo-h-8 plasmo-rounded" />
          )}
          <div>
            <p className="plasmo-font-medium">{dAppInfo.title}</p>
            <p className="plasmo-text-sm plasmo-text-gray-600">{dAppInfo.origin}</p>
          </div>
        </div>
      </div>

      <div className="plasmo-mb-4">
        <p className="plasmo-text-sm plasmo-font-medium plasmo-mb-2">请求权限:</p>
        <div className="plasmo-space-y-2">
          {dAppInfo.requestedPermissions?.map((permission: string) => (
            <label key={permission} className="plasmo-flex plasmo-items-center plasmo-space-x-2 plasmo-p-2 plasmo-bg-gray-50 plasmo-rounded">
              <input
                type="checkbox"
                checked={selectedPermissions.includes(permission)}
                onChange={() => handlePermissionToggle(permission)}
                className="plasmo-rounded"
              />
              <span className="plasmo-text-sm">{permission}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="plasmo-grid plasmo-grid-cols-2 plasmo-gap-3">
        <button
          onClick={onReject}
          className="plasmo-bg-red-100 plasmo-text-red-700 plasmo-px-4 plasmo-py-3 plasmo-rounded-lg plasmo-font-medium hover:plasmo-bg-red-200"
        >
          拒绝
        </button>
        <button
          onClick={() => onApprove(selectedPermissions)}
          className="plasmo-bg-blue-600 plasmo-text-white plasmo-px-4 plasmo-py-3 plasmo-rounded-lg plasmo-font-medium hover:plasmo-bg-blue-700"
        >
          连接
        </button>
      </div>
    </div>
  )
}

export default ModalProvider