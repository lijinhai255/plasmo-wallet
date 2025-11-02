import React, { useState } from 'react'
import { routes, getRouteByPath } from '~router/index'
import { BottomNavigation } from './BottomNavigation'

interface RouterProps {
  initialPath?: string
}

export const Router: React.FC<RouterProps> = ({ initialPath = '/' }) => {
  const [currentPath, setCurrentPath] = useState(initialPath)
  const CurrentComponent = routes.find(route => route.path === currentPath)?.component

  const handleNavigate = (path: string) => {
    setCurrentPath(path)
  }

  const CurrentPage = CurrentComponent ? React.createElement(CurrentComponent) : null

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