import React from 'react'
import { routes, getVisibleRoutes } from '~router/index'
import { cn } from '@/lib/utils'

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
    <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-lg border-t border-gray-200/60 px-3 py-3 z-50 shadow-2xl">
      <div className="flex justify-around items-center max-w-md mx-auto">
        {navigationRoutes.map((route) => {
          const isActive = currentPath === route.path

          return (
            <button
              key={route.path}
              onClick={() => handleNavigate(route.path)}
              className={cn(
                "group flex flex-col items-center justify-center py-3 px-4 rounded-2xl transition-all duration-300 min-w-0 flex-1 relative",
                "hover:bg-gray-100/80",
                isActive && [
                  "bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 text-white",
                  "shadow-xl shadow-blue-500/25 transform scale-105",
                  "hover:from-blue-600 hover:via-blue-700 hover:to-indigo-700"
                ],
                !isActive && "text-gray-600 hover:text-gray-900"
              )}
              title={route.label}
            >
              <div className={cn(
                "relative flex items-center justify-center w-6 h-6 mb-2 transition-transform duration-300",
                isActive && "transform scale-110",
                "group-hover:transform group-hover:scale-110"
              )}>
                <span className="text-xl leading-none">
                  {route.icon}
                </span>
                {isActive && (
                  <div className="absolute inset-0 bg-blue-400/20 rounded-full animate-ping"></div>
                )}
              </div>

              <span className={cn(
                "text-xs font-semibold truncate max-w-full transition-all duration-300",
                isActive && "text-white drop-shadow-sm",
                !isActive && "text-gray-600 group-hover:text-gray-900"
              )}>
                {route.label}
              </span>

              {isActive && (
                <div className="absolute -top-1 left-1/2 transform -translate-x-1/2">
                  <div className="w-2 h-2 bg-gradient-to-r from-blue-400 to-indigo-400 rounded-full shadow-lg ring-2 ring-white animate-pulse"></div>
                </div>
              )}

              {/* Ripple effect on hover */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500/0 to-indigo-500/0 group-hover:from-blue-500/10 group-hover:to-indigo-500/10 transition-all duration-300"></div>
            </button>
          )
        })}
      </div>

      {/* Add subtle gradient border at top */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gray-300/60 to-transparent"></div>
    </div>
  )
}

export default BottomNavigation