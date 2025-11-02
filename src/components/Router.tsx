import React, { useState, useEffect } from 'react'
import { routes, getRouteByPath } from '~router/index'
import { BottomNavigation } from './BottomNavigation'

interface RouterProps {
  initialPath?: string
}

export const Router: React.FC<RouterProps> = ({ initialPath = '/' }) => {
  // 从hash获取当前路径，如果没有hash则使用initialPath
  const getCurrentPathFromHash = () => {
    if (typeof window !== 'undefined' && window.location) {
      const hash = window.location.hash.slice(1) // 移除#号
      return hash || initialPath
    }
    return initialPath
  }

  const [currentPath, setCurrentPath] = useState(initialPath) // 直接使用initialPath而不是hash
  const CurrentComponent = routes.find(route => route.path === currentPath)?.component

  // 监听hash变化
  useEffect(() => {
    const handleHashChange = () => {
      const newPath = getCurrentPathFromHash()
      console.log('🔄 Hash变化，切换到路径:', newPath)
      setCurrentPath(newPath)
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('hashchange', handleHashChange)
      return () => {
        window.removeEventListener('hashchange', handleHashChange)
      }
    }
  }, [])

  // 监听initialPath变化（当父组件更新路径时）
  useEffect(() => {
    console.log('🚀 Router收到新的初始路径:', initialPath)
    setCurrentPath(initialPath)
  }, [initialPath])

  const handleNavigate = (path: string) => {
    console.log('🧭 Router导航到:', path)
    if (typeof window !== 'undefined' && window.location) {
      window.location.hash = path
    } else {
      setCurrentPath(path)
    }
  }

  // 检查是否是签名确认页面，需要特殊处理props
  const isSignatureConfirmPage = currentPath === '/signature-confirm'

  const CurrentPage = CurrentComponent ? (() => {
    if (isSignatureConfirmPage) {
      // 为签名确认页面提供必要的props
      const handleConfirm = (approved: boolean, signature?: string) => {
        console.log('🔐 Router: 签名确认处理完成，准备跳转:', { approved, signature })

        // 签名处理逻辑已在SignatureConfirmPage中完成
        // 这里只需要负责导航回首页
        if (typeof window !== 'undefined' && window.location) {
          console.log('🔙 Router: 导航回首页')
          window.location.hash = '/'
        }
      }

      const handleCancel = () => {
        console.log('❌ Router: 签名取消，准备跳转')

        // 签名处理逻辑已在SignatureConfirmPage中完成
        // 这里只需要负责导航回首页
        if (typeof window !== 'undefined' && window.location) {
          console.log('🔙 Router: 导航回首页')
          window.location.hash = '/'
        }
      }

      return React.createElement(CurrentComponent, {
        onConfirm: handleConfirm,
        onCancel: handleCancel
      })
    } else {
      return React.createElement(CurrentComponent)
    }
  })() : null

  return (
    <div className="w-full h-full bg-white flex flex-col">
      {/* 主要内容区域 */}
      <div className="flex-1 overflow-auto pb-[70px]">
        {CurrentPage}
      </div>

      {/* 底部导航 - 固定在底部 */}
      <div className="h-[70px] flex-shrink-0 border-t border-gray-200">
        <BottomNavigation currentPath={currentPath} onNavigate={handleNavigate} />
      </div>
    </div>
  )
}

export default Router