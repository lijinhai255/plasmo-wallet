import React, { useEffect, useState } from "react"
import { useWalletStore } from "./stores/walletStore";
import { WalletSetup } from "./components/WalletSetup";
import { WalletUnlock } from "./components/WalletUnlock";
import { Router } from "./components/Router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useSignatureRequests } from "./hooks/useSignatureRequests";
import "./style.css";

// 开发环境导入存储调试工具
if (process.env.NODE_ENV === 'development') {
  import("./lib/storage-debug")
}

// 导入存储管理器并触发数据迁移
import { storageManager } from "./lib/storage"

const queryClient = new QueryClient({})

export default function popup() {
  // 触发数据迁移（仅在应用启动时执行一次）
  useEffect(() => {
    const runMigration = async () => {
      try {
        await storageManager.migrate()
        console.log('✅ 数据迁移检查完成')
      } catch (error) {
        console.error('❌ 数据迁移失败:', error)
      }
    }

    runMigration()
  }, [])

  const { accounts, isLocked } = useWalletStore()

  // 监听签名请求
  const { hasPendingRequests, pendingRequests, checkPendingRequests } = useSignatureRequests()

  // 使用一个状态来管理路由，避免时序问题
  const [currentPath, setCurrentPath] = useState(hasPendingRequests ? "/signature-confirm" : "/")

  // 当popup打开时，如果有待处理请求，清除Badge
  useEffect(() => {
    if (hasPendingRequests) {
      chrome.action.setBadgeText({ text: "" })
    }
  }, [hasPendingRequests])

  // 监听hasPendingRequests变化，动态更新路由
  useEffect(() => {
    const newPath = hasPendingRequests ? "/signature-confirm" : "/"
    console.log('🔄 Popup: hasPendingRequests变化:', hasPendingRequests, '新路径:', newPath)
    setCurrentPath(newPath)
  }, [hasPendingRequests])

  // 添加一个额外的监听器，确保路由状态正确
  useEffect(() => {
    const checkHashAndNavigate = () => {
      if (typeof window !== 'undefined' && window.location) {
        const currentHash = window.location.hash.slice(1) || '/'

        // 如果当前在签名确认页面但没有待处理请求，跳转回首页
        if (currentHash === '/signature-confirm' && !hasPendingRequests) {
          console.log('🔄 Popup: 检测到签名页面无请求，跳转回首页')
          window.location.hash = '/'
          setCurrentPath('/')
        }
      }
    }

    checkHashAndNavigate()

    // 监听hash变化
    if (typeof window !== 'undefined') {
      window.addEventListener('hashchange', checkHashAndNavigate)
      return () => window.removeEventListener('hashchange', checkHashAndNavigate)
    }
  }, [hasPendingRequests])

  // 如果没有账户，显示设置页面
  if (accounts.length === 0) {
    return (
      <QueryClientProvider client={queryClient}>
        <div className="w-[400px] min-h-[600px] bg-white">
          <WalletSetup />
        </div>
      </QueryClientProvider>
    )
  }

  // 如果钱包被锁定，显示解锁页面
  if (isLocked) {
    return (
      <QueryClientProvider client={queryClient}>
        <div className="w-[400px] min-h-[600px] bg-white">
          <WalletUnlock />
        </div>
      </QueryClientProvider>
    )
  }

  // 显示钱包主界面
  return (
    <QueryClientProvider client={queryClient}>
      <div className="w-[400px] min-h-[600px] bg-white">
        <Router initialPath={currentPath} />
      </div>
    </QueryClientProvider>
  )
}