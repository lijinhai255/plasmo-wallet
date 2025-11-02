import React from 'react'
import { routes, getVisibleRoutes } from '~router/index'

interface BottomNavigationProps {
  currentPath: string
  onNavigate: (path: string) => void
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({ currentPath, onNavigate }) => {
  const visibleRoutes = getVisibleRoutes()

  // 过滤出需要显示在底部导航的页面
  const navigationRoutes = visibleRoutes.filter(route =>
    !route.developmentOnly &&
    route.path !== '/password' &&
    route.path !== '/error-test' &&
    route.path !== '/wallet-status' && // 隐藏钱包状态页面以节省空间
    route.path !== '/network' // 去掉网络选择，保留网络管理
  )

  const handleNavigate = (path: string) => {
    if (path !== currentPath) {
      onNavigate(path)
    }
  }

  return (
    <div className="plasmo-fixed plasmo-bottom-0 plasmo-left-0 plasmo-right-0 plasmo-bg-white plasmo-border-t plasmo-border-gray-200 plasmo-px-1 plasmo-py-1 plasmo-z-50">
      <div className="plasmo-flex plasmo-justify-around plasmo-items-center">
        {navigationRoutes.map((route) => {
          const isActive = currentPath === route.path

          return (
            <button
              key={route.path}
              onClick={() => handleNavigate(route.path)}
              className={`plasmo-flex plasmo-flex-col plasmo-items-center plasmo-justify-center plasmo-py-1 plasmo-px-2 plasmo-rounded-lg plasmo-transition-colors plasmo-min-w-0 plasmo-flex-1 ${
                isActive
                  ? 'plasmo-bg-blue-50 plasmo-text-blue-600'
                  : 'plasmo-text-gray-600 hover:plasmo-bg-gray-50 hover:plasmo-text-gray-800'
              }`}
              title={route.label}
              style={{ minHeight: '60px' }}
            >
              <span className="plasmo-text-lg plasmo-leading-none">
                {route.icon}
              </span>
              <span className="plasmo-text-xs plasmo-mt-1 plasmo-font-medium plasmo-truncate">
                {route.label}
              </span>
              {isActive && (
                <div className="plasmo-absolute plasmo-bottom-1 plasmo-left-1/2 plasmo-transform plasmo--translate-x-1/2 plasmo-w-1 plasmo-h-1 plasmo-bg-blue-600 plasmo-rounded-full"></div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default BottomNavigation