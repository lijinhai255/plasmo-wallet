import React from 'react'

export interface SimpleToast {
  id: string
  message: string
  type: 'success' | 'error' | 'warning' | 'info'
}

interface SimpleToastProps {
  toast: SimpleToast
  onClose: (id: string) => void
}

export const SimpleToastComponent: React.FC<SimpleToastProps> = ({ toast, onClose }) => {
  const getStyles = () => {
    const baseStyles = {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '12px 16px',
      borderRadius: '6px',
      marginBottom: '8px',
      fontSize: '14px',
      fontWeight: '500',
      color: 'white',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
      transition: 'all 0.3s ease',
      opacity: 1,
      transform: 'translateX(0)',
    }

    const colorStyles = {
      success: { backgroundColor: '#10b981' },
      error: { backgroundColor: '#ef4444' },
      warning: { backgroundColor: '#f59e0b' },
      info: { backgroundColor: '#3b82f6' },
    }

    return { ...baseStyles, ...colorStyles[toast.type] }
  }

  const getIcon = () => {
    const icons = {
      success: '✓',
      error: '✕',
      warning: '⚠',
      info: 'ℹ',
    }
    return icons[toast.type]
  }

  return (
    <div style={getStyles()}>
      <span style={{ fontSize: '16px', lineHeight: 1 }}>{getIcon()}</span>
      <span style={{ flex: 1, lineHeight: 1.4 }}>{toast.message}</span>
      <button
        onClick={() => onClose(toast.id)}
        style={{
          background: 'none',
          border: 'none',
          color: 'white',
          fontSize: '16px',
          cursor: 'pointer',
          padding: '0 4px',
          opacity: 0.8,
          borderRadius: '2px',
          transition: 'opacity 0.2s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.opacity = '1'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.opacity = '0.8'
        }}
      >
        ×
      </button>
    </div>
  )
}

interface SimpleToastContainerProps {
  toasts: SimpleToast[]
  onClose: (id: string) => void
}

export const SimpleToastContainer: React.FC<SimpleToastContainerProps> = ({ toasts, onClose }) => {
  if (toasts.length === 0) {
    return null
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: '16px',
        right: '16px',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        pointerEvents: 'none',
      }}
    >
      <div style={{ pointerEvents: 'auto' }}>
        {toasts.map((toast, index) => (
          <div
            key={toast.id}
            style={{
              animation: `slideInRight 0.3s ease-out ${index * 0.1}s both`,
            }}
          >
            <SimpleToastComponent toast={toast} onClose={onClose} />
          </div>
        ))}
      </div>

      <style>{`
        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(100%);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
  )
}