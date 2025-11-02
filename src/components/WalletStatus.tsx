import React, { useEffect, useState } from 'react'
import { useWalletStore } from '~store/WalletStore'

export const WalletStatus: React.FC = () => {
  const [walletInjected, setWalletInjected] = useState(false)
  const [walletConnected, setWalletConnected] = useState(false)
  const [isPageInjectable, setIsPageInjectable] = useState(false)
  const walletStore = useWalletStore()

  useEffect(() => {
    // 检查钱包注入状态
    const checkWalletInjection = () => {
      // 检查钱包对象是否注入
      const injected = typeof window !== 'undefined' && (window as any).plasmoWallet
      setWalletInjected(!!injected)

      // 检查是否在可注入的页面
      const injectable = typeof window !== 'undefined' &&
        window.location &&
        !window.location.protocol.startsWith('chrome://') &&
        !window.location.protocol.startsWith('chrome-extension://')
      setIsPageInjectable(injectable)

      console.log('🔍 钱包注入状态检测:', {
        injected: !!injected,
        injectable,
        location: window.location?.href
      })
    }

    // 检查钱包连接状态
    const checkWalletConnection = async () => {
      try {
        const isConnected = await walletStore.checkWalletConnection()
        setWalletConnected(isConnected)

        console.log('🔗 钱包连接状态:', isConnected)
      } catch (error) {
        console.error('检查钱包连接失败:', error)
        setWalletConnected(false)
      }
    }

    // 立即检查一次
    checkWalletInjection()
    checkWalletConnection()

    // 定期检查状态
    const interval = setInterval(() => {
      checkWalletInjection()
      checkWalletConnection()
    }, 5000) // 每5秒检查一次

    return () => clearInterval(interval)
  }, [walletStore])

  const handleConnect = async () => {
    try {
      console.log('🔗 尝试连接钱包...')
      const account = await walletStore.connectToWallet()
      console.log('✅ 钱包连接成功:', account)
      setWalletConnected(true)
    } catch (error) {
      console.error('❌ 钱包连接失败:', error)
    }
  }

  const handleDisconnect = async () => {
    try {
      console.log('🔌 尝试断开钱包连接...')
      await walletStore.disconnectWallet()
      console.log('✅ 钱包已断开连接')
      setWalletConnected(false)
    } catch (error) {
      console.error('❌ 断开连接失败:', error)
    }
  }

  const testWalletInjection = () => {
    if (typeof window !== 'undefined' && (window as any).plasmoWallet) {
      console.log('🧪 测试钱包对象:', (window as any).plasmoWallet)
      console.log(`✅ 钱包对象已注入! 版本: ${(window as any).plasmoWallet.version}`)
    } else {
      console.log('❌ 钱包对象未注入')
    }
  }

  const refreshPage = () => {
    window.location.reload()
  }

  return (
    <div className="plasmo-p-4 plasmo-bg-white plasmo-rounded-lg plasmo-shadow-lg">
      <h2 className="plasmo-text-lg plasmo-font-semibold plasmo-mb-4">📊 钱包状态检测</h2>

      <div className="plasmo-space-y-3">
        {/* 钱包注入状态 */}
        <div className="plasmo-p-3 plasmo-border plasmo-border-gray-200 plasmo-rounded-lg">
          <div className="plasmo-flex plasmo-items-center plasmo-justify-between">
            <span className="plasmo-font-medium">钱包对象:</span>
            <span className={`plasmo-px-2 plasmo-py-1 plasmo-rounded plasmo-text-sm ${
              walletInjected
                ? 'plasmo-bg-green-100 plasmo-text-green-800'
                : 'plasmo-bg-red-100 plasmo-text-red-800'
            }`}>
              {walletInjected ? '✅ 存在' : '❌ 不存在'}
            </span>
          </div>
          {walletInjected && (
            <div className="plasmo-mt-2 plasmo-text-sm plasmo-text-gray-600">
              版本: {(window as any).plasmoWallet?.version || '未知'}
            </div>
          )}
        </div>

        {/* 页面可注入性 */}
        <div className="plasmo-p-3 plasmo-border plasmo-border-gray-200 plasmo-rounded-lg">
          <div className="plasmo-flex plasmo-items-center plasmo-justify-between">
            <span className="plasmo-font-medium">页面可注入:</span>
            <span className={`plasmo-px-2 plasmo-py-1 plasmo-rounded plasmo-text-sm ${
              isPageInjectable
                ? 'plasmo-bg-blue-100 plasmo-text-blue-800'
                : 'plasmo-bg-gray-100 plasmo-text-gray-800'
            }`}>
              {isPageInjectable ? '✅ 是' : '⚠️ 否'}
            </span>
          </div>
          {!isPageInjectable && (
            <div className="plasmo-mt-2 plasmo-text-sm plasmo-text-gray-600">
              当前页面不支持钱包注入 (如 chrome:// 页面)
            </div>
          )}
        </div>

        {/* 钱包连接状态 */}
        <div className="plasmo-p-3 plasmo-border plasmo-border-gray-200 plasmo-rounded-lg">
          <div className="plasmo-flex plasmo-items-center plasmo-justify-between">
            <span className="plasmo-font-medium">连接状态:</span>
            <span className={`plasmo-px-2 plasmo-py-1 plasmo-rounded plasmo-text-sm ${
              walletConnected
                ? 'plasmo-bg-green-100 plasmo-text-green-800'
                : 'plasmo-bg-yellow-100 plasmo-text-yellow-800'
            }`}>
              {walletConnected ? '✅ 已连接' : '⚠️ 未连接'}
            </span>
          </div>
          {walletStore.currentWallet && (
            <div className="plasmo-mt-2 plasmo-text-sm plasmo-text-gray-600">
              当前地址: {walletStore.currentWallet.address.slice(0, 6)}...{walletStore.currentWallet.address.slice(-4)}
            </div>
          )}
        </div>

        {/* 钱包版本信息 */}
        <div className="plasmo-p-3 plasmo-border plasmo-border-gray-200 plasmo-rounded-lg">
          <div className="plasmo-flex plasmo-items-center plasmo-justify-between">
            <span className="plasmo-font-medium">钱包版本:</span>
            <span className="plasmo-text-sm plasmo-text-gray-600">
              {walletStore.isInitialized ? '✅ 已初始化' : '⚠️ 未初始化'}
            </span>
          </div>
          <div className="plasmo-mt-2 plasmo-text-sm plasmo-text-gray-600">
            解锁状态: {walletStore.isUnlocked ? '🔓 已解锁' : '🔒 已锁定'}
          </div>
        </div>

        {/* 当前账户信息 */}
        <div className="plasmo-p-3 plasmo-border plasmo-border-gray-200 plasmo-rounded-lg">
          <div className="plasmo-flex plasmo-items-center plasmo-justify-between">
            <span className="plasmo-font-medium">当前账户:</span>
            <span className="plasmo-text-sm plasmo-text-gray-600">
              {walletStore.currentWallet ? walletStore.currentWallet.name : '无'}
            </span>
          </div>
          {walletStore.currentWallet && (
            <div className="plasmo-mt-2 plasmo-text-sm plasmo-text-gray-600">
              地址: {walletStore.currentWallet.address}
            </div>
          )}
        </div>

        {/* 网络信息 */}
        <div className="plasmo-p-3 plasmo-border plasmo-border-gray-200 plasmo-rounded-lg">
          <div className="plasmo-flex plasmo-items-center plasmo-justify-between">
            <span className="plasmo-font-medium">网络信息:</span>
            <span className="plasmo-text-sm plasmo-text-gray-600">
              {walletStore.currentNetwork?.chainName || '未设置'}
            </span>
          </div>
        </div>
      </div>

      {/* 操作按钮 */}
      <div className="plasmo-mt-4 plasmo-space-y-2">
        {walletInjected && !walletConnected && (
          <button
            onClick={handleConnect}
            className="plasmo-w-full plasmo-bg-blue-600 plasmo-text-white plasmo-px-4 plasmo-py-2 plasmo-rounded-lg hover:plasmo-bg-blue-700 plasmo-transition-colors"
          >
            🔗 连接钱包
          </button>
        )}

        {walletConnected && (
          <button
            onClick={handleDisconnect}
            className="plasmo-w-full plasmo-bg-red-600 plasmo-text-white plasmo-px-4 plasmo-py-2 plasmo-rounded-lg hover:plasmo-bg-red-700 plasmo-transition-colors"
          >
            🔌 断开连接
          </button>
        )}

        {!walletInjected && isPageInjectable && (
          <button
            onClick={refreshPage}
            className="plasmo-w-full plasmo-bg-yellow-600 plasmo-text-white plasmo-px-4 plasmo-py-2 plasmo-rounded-lg hover:plasmo-bg-yellow-700 plasmo-transition-colors"
          >
            🔄 刷新页面
          </button>
        )}

        <button
          onClick={testWalletInjection}
          className="plasmo-w-full plasmo-bg-gray-600 plasmo-text-white plasmo-px-4 plasmo-py-2 plasmo-rounded-lg hover:plasmo-bg-gray-700 plasmo-transition-colors"
        >
          🧪 测试钱包对象
        </button>
      </div>

      {/* 状态说明 */}
      <div className="plasmo-mt-4 plasmo-text-sm plasmo-text-gray-600">
        <p>💡 提示:</p>
        <ul className="plasmo-list-disc plasmo-list-inside plasmo-mt-1 plasmo-space-y-1">
          <li>钱包对象注入到网页中，供 DApp 使用</li>
          <li>只有非 chrome:// 页面才能注入钱包</li>
          <li>连接钱包后可以进行签名等操作</li>
          <li>刷新页面可能需要重新连接</li>
        </ul>
      </div>
    </div>
  )
}

export default WalletStatus