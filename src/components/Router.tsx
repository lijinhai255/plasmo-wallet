import React, { useState } from 'react'
import { routes, getRouteByPath } from '~router/index'
import { BottomNavigation } from './BottomNavigation'
import { SimpleToastProvider, useSimpleToastContext } from '../contexts/SimpleToastContext'
import { SimpleToastContainer } from './ToastSimple'

interface RouterProps {
  initialPath?: string
}

const RouterContent: React.FC<RouterProps> = ({ initialPath = '/' }) => {
  const [currentPath, setCurrentPath] = useState(initialPath)
  const CurrentComponent = routes.find(route => route.path === currentPath)?.component
  const { toasts, removeToast } = useSimpleToastContext()

  const handleNavigate = (path: string) => {
    setCurrentPath(path)
  }

  const CurrentPage = CurrentComponent ? React.createElement(CurrentComponent) : null

  return (
    <div style={{
      width: '100%',
      height: '100%',
      backgroundColor: '#ffffff',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Toast 容器 - 放在最顶层 */}
      <SimpleToastContainer toasts={toasts} onClose={removeToast} />

      {/* 主要内容区域 */}
      <div style={{
        flex: 1,
        overflow: 'auto',
        paddingBottom: '70px'
      }}>
        {CurrentPage}
      </div>

      {/* 底部导航 - 固定在底部 */}
      <div style={{
        height: '70px',
        flexShrink: 0,
        borderTop: '1px solid #e5e7eb'
      }}>
        <BottomNavigation currentPath={currentPath} onNavigate={handleNavigate} />
      </div>
    </div>
  )
}

export const Router: React.FC<RouterProps> = (props) => {
  return (
    <SimpleToastProvider>
      <RouterContent {...props} />
    </SimpleToastProvider>
  )
}

export default Router