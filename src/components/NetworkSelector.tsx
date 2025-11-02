import React, { useState, useEffect } from 'react'
import { useChainStore } from '~store/ChainStore'
import { useSimpleToastContext } from '../contexts/SimpleToastContext'

export const NetworkSelector: React.FC = () => {
  const {
    currentChainId,
    connectionState,
    networks,
    connectToNetwork,
    switchNetwork,
    testConnection
  } = useChainStore()

  const [isSwitching, setIsSwitching] = useState(false)
  const [showAddNetwork, setShowAddNetwork] = useState(false)
  const [newNetwork, setNewNetwork] = useState({
    chainId: '',
    chainName: '',
    rpcUrl: '',
    symbol: '',
    icon: '🌐'
  })

  const currentNetwork = networks[currentChainId]
  const { showError, showSuccess, showInfo } = useSimpleToastContext()

  useEffect(() => {
    // 定期测试连接状态
    const interval = setInterval(() => {
      if (currentChainId) {
        testConnection(currentChainId)
      }
    }, 30000) // 每30秒测试一次

    return () => clearInterval(interval)
  }, [currentChainId]) // 移除 testConnection 依赖，因为它是 store 函数

  const handleNetworkSwitch = async (chainId: string) => {
    if (chainId === currentChainId) return

    setIsSwitching(true)
    try {
      await switchNetwork(chainId)
    } catch (error) {
      console.error('切换网络失败:', error)
      showError(`切换网络失败: ${error instanceof Error ? error.message : '未知错误'}`)
    } finally {
      setIsSwitching(false)
    }
  }

  const handleAddNetwork = async () => {
    try {
      // 这里需要实现添加自定义网络的逻辑
      // 暂时只支持预设网络
      showInfo('自定义网络功能开发中...', 0) // 不自动关闭
      setShowAddNetwork(false)
    } catch (error) {
      console.error('添加网络失败:', error)
      showError('添加网络失败')
    }
  }

  return (
    <div className="plasmo-p-4 plasmo-bg-white plasmo-rounded-lg plasmo-shadow-lg">
      <div className="plasmo-flex plasmo-items-center plasmo-justify-between plasmo-mb-4">
        <h2 className="plasmo-text-lg plasmo-font-semibold">网络选择</h2>
        <button
          onClick={() => setShowAddNetwork(true)}
          className="plasmo-bg-blue-600 plasmo-text-white plasmo-px-3 plasmo-py-1 plasmo-rounded plasmo-text-sm hover:plasmo-bg-blue-700 plasmo-transition-colors">
          ➕ 添加网络
        </button>
      </div>

      {/* 当前网络状态 */}
      <div className="plasmo-mb-6 plasmo-p-4 plasmo-bg-gray-50 plasmo-rounded-lg">
        <div className="plasmo-flex plasmo-items-center plasmo-justify-between">
          <div className="plasmo-flex plasmo-items-center plasmo-space-x-2">
            <span className="plasmo-text-2xl">{currentNetwork?.icon || '🌐'}</span>
            <div>
              <div className="plasmo-font-medium">{currentNetwork?.chainName || 'Unknown Network'}</div>
              <div className="plasmo-text-sm plasmo-text-gray-600">Chain ID: {currentChainId}</div>
            </div>
          </div>

          <div className="plasmo-flex plasmo-items-center plasmo-space-x-2">
            <div className={`plasmo-w-3 plasmo-h-3 plasmo-rounded-full ${
              connectionState.isConnected ? 'plasmo-bg-green-500' : 'plasmo-bg-red-500'
            }`}></div>
            {connectionState.isConnected && connectionState.latency && (
              <span className="plasmo-text-sm plasmo-text-gray-600">
                {connectionState.latency}ms
              </span>
            )}
          </div>
        </div>

        {connectionState.error && (
          <div className="plasmo-mt-2 plasmo-text-sm plasmo-text-red-600">
            ⚠️ {connectionState.error}
          </div>
        )}
      </div>

      {/* 网络列表 */}
      <div className="plasmo-space-y-2">
        {Object.values(networks).map((network) => (
          <div
            key={network.chainId}
            onClick={() => handleNetworkSwitch(network.chainId)}
            className={`plasmo-p-3 plasmo-border plasmo-rounded-lg plasmo-cursor-pointer plasmo-transition-colors ${
              network.chainId === currentChainId
                ? 'plasmo-border-blue-500 plasmo-bg-blue-50'
                : 'plasmo-border-gray-200 hover:plasmo-bg-gray-50'
            }`}
          >
            <div className="plasmo-flex plasmo-items-center plasmo-justify-between">
              <div className="plasmo-flex plasmo-items-center plasmo-space-x-3">
                <span className="plasmo-text-xl">{network.icon}</span>
                <div>
                  <div className="plasmo-font-medium">{network.chainName}</div>
                  <div className="plasmo-text-sm plasmo-text-gray-600">
                    {network.nativeCurrency.symbol} • {network.chainId}
                  </div>
                </div>
              </div>

              {network.chainId === currentChainId && (
                <div className="plasmo-text-blue-600 plasmo-text-sm">
                  ✓ 当前
                </div>
              )}

              {isSwitching && network.chainId !== currentChainId && (
                <div className="plasmo-text-gray-500 plasmo-text-sm">
                  切换中...
                </div>
              )}
            </div>

            <div className="plasmo-mt-2 plasmo-text-xs plasmo-text-gray-500">
              {network.blockExplorerUrls?.[0] && (
                <span>
                  浏览器: {new URL(network.blockExplorerUrls[0]).hostname}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* 网络统计 */}
      <div className="plasmo-mt-4 plasmo-text-sm plasmo-text-gray-600">
        <p>• 已配置 {Object.keys(networks).length} 个网络</p>
        <p>• 当前连接: {connectionState.isConnected ? '已连接' : '未连接'}</p>
        {connectionState.latency && (
          <p>• 网络延迟: {connectionState.latency}ms</p>
        )}
      </div>

      {/* 添加网络对话框 */}
      {showAddNetwork && (
        <div className="plasmo-fixed plasmo-inset-0 plasmo-flex plasmo-items-center plasmo-justify-center plasmo-z-50 plasmo-modal-backdrop">
          <div className="plasmo-bg-white plasmo-p-6 plasmo-rounded-lg plasmo-m-4 plasmo-max-w-md plasmo-w-full">
            <h3 className="plasmo-text-lg plasmo-font-bold plasmo-mb-4">添加自定义网络</h3>

            <div className="plasmo-space-y-4">
              <div>
                <label className="plasmo-block plasmo-text-sm plasmo-font-medium plasmo-mb-2">
                  网络名称
                </label>
                <input
                  type="text"
                  value={newNetwork.chainName}
                  onChange={(e) => setNewNetwork({ ...newNetwork, chainName: e.target.value })}
                  placeholder="My Custom Network"
                  className="plasmo-w-full plasmo-border plasmo-border-gray-300 plasmo-rounded-lg plasmo-px-3 plasmo-py-2"
                />
              </div>

              <div>
                <label className="plasmo-block plasmo-text-sm plasmo-font-medium plasmo-mb-2">
                  RPC URL
                </label>
                <input
                  type="url"
                  value={newNetwork.rpcUrl}
                  onChange={(e) => setNewNetwork({ ...newNetwork, rpcUrl: e.target.value })}
                  placeholder="https://..."
                  className="plasmo-w-full plasmo-border plasmo-border-gray-300 plasmo-rounded-lg plasmo-px-3 plasmo-py-2"
                />
              </div>

              <div>
                <label className="plasmo-block plasmo-text-sm plasmo-font-medium plasmo-mb-2">
                  Chain ID
                </label>
                <input
                  type="text"
                  value={newNetwork.chainId}
                  onChange={(e) => setNewNetwork({ ...newNetwork, chainId: e.target.value })}
                  placeholder="1"
                  className="plasmo-w-full plasmo-border plasmo-border-gray-300 plasmo-rounded-lg plasmo-px-3 plasmo-py-2"
                />
              </div>

              <div>
                <label className="plasmo-block plasmo-text-sm plasmo-font-medium plasmo-mb-2">
                  代币符号
                </label>
                <input
                  type="text"
                  value={newNetwork.symbol}
                  onChange={(e) => setNewNetwork({ ...newNetwork, symbol: e.target.value })}
                  placeholder="ETH"
                  className="plasmo-w-full plasmo-border plasmo-border-gray-300 plasmo-rounded-lg plasmo-px-3 plasmo-py-2"
                />
              </div>

              <button
                onClick={handleAddNetwork}
                className="plasmo-w-full plasmo-bg-blue-600 plasmo-text-white plasmo-px-4 plasmo-py-2 plasmo-rounded-lg hover:plasmo-bg-blue-700 plasmo-transition-colors"
              >
                添加网络
              </button>
            </div>

            <div className="plasmo-flex plasmo-justify-end plasmo-mt-4">
              <button
                onClick={() => setShowAddNetwork(false)}
                className="plasmo-bg-gray-200 plasmo-text-gray-800 plasmo-px-4 plasmo-py-2 plasmo-rounded-lg hover:plasmo-bg-gray-300"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="plasmo-mt-4 plasmo-text-xs plasmo-text-gray-500">
        <p>💡 提示: 请确保使用可靠的 RPC 端点</p>
        <p>🔒 建议使用官方或知名的 RPC 提供商</p>
      </div>
    </div>
  )
}

export default NetworkSelector