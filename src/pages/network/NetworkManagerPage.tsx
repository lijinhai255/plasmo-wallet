import React, { useState, useEffect } from 'react'
import { useChainStore } from '../../../store/ChainStore'
import { useWalletStore } from '../../../store/WalletStore'

interface NetworkConfig {
  chainId: string
  chainName: string
  nativeCurrency: {
    name: string
    symbol: string
    decimals: number
  }
  rpcUrls: string[]
  blockExplorerUrls?: string[]
  icon: string
  isTestnet?: boolean
  isCustom?: boolean
}

interface AddNetworkForm {
  chainName: string
  rpcUrl: string
  chainId: string
  symbol: string
  name: string
  decimals: string
  blockExplorerUrl: string
}

export const NetworkManagerPage = () => {
  const chainStore = useChainStore()
  const walletStore = useWalletStore()
  const [networks, setNetworks] = useState<NetworkConfig[]>([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedNetwork, setSelectedNetwork] = useState<NetworkConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [switchingNetwork, setSwitchingNetwork] = useState<string | null>(null)
  const [error, setError] = useState<string>('')

  // 添加网络表单状态
  const [addForm, setAddForm] = useState<AddNetworkForm>({
    chainName: '',
    rpcUrl: '',
    chainId: '',
    symbol: '',
    name: '',
    decimals: '18',
    blockExplorerUrl: ''
  })

  useEffect(() => {
    loadNetworks()
  }, [])

  const loadNetworks = async () => {
    setLoading(true)
    try {
      // 获取内置网络配置
      const builtInNetworks = chainStore.getAllNetworks()

      // TODO: 从存储中加载自定义网络
      const customNetworks: NetworkConfig[] = []

      setNetworks([...builtInNetworks, ...customNetworks])
    } catch (err) {
      console.error('加载网络列表失败:', err)
      setError('加载网络列表失败')
    } finally {
      setLoading(false)
    }
  }

  const handleSwitchNetwork = async (chainId: string) => {
    setSwitchingNetwork(chainId)
    setError('')

    try {
      await chainStore.connectToNetwork(chainId)
      console.log('已切换到网络:', chainId)
    } catch (err) {
      console.error('切换网络失败:', err)
      setError(err instanceof Error ? err.message : '切换网络失败')
    } finally {
      setSwitchingNetwork(null)
    }
  }

  const handleAddNetwork = async () => {
    setError('')

    // 验证表单
    if (!addForm.chainName || !addForm.rpcUrl || !addForm.chainId || !addForm.symbol || !addForm.name) {
      setError('请填写所有必需字段')
      return
    }

    try {
      // 验证 ChainId
      const chainIdNum = parseInt(addForm.chainId)
      if (isNaN(chainIdNum) || chainIdNum <= 0) {
        setError('无效的链ID')
        return
      }

      // 验证 RPC URL
      try {
        new URL(addForm.rpcUrl)
      } catch {
        setError('无效的RPC URL')
        return
      }

      // TODO: 实现真实的网络添加逻辑
      const newNetwork: NetworkConfig = {
        chainId: `0x${chainIdNum.toString(16)}`,
        chainName: addForm.chainName,
        nativeCurrency: {
          name: addForm.name,
          symbol: addForm.symbol,
          decimals: parseInt(addForm.decimals) || 18
        },
        rpcUrls: [addForm.rpcUrl],
        blockExplorerUrls: addForm.blockExplorerUrl ? [addForm.blockExplorerUrl] : undefined,
        icon: '🌐',
        isCustom: true
      }

      // 模拟添加
      setNetworks(prev => [...prev, newNetwork])
      setShowAddModal(false)
      resetForm()

      console.log('添加网络成功:', newNetwork)
    } catch (err) {
      console.error('添加网络失败:', err)
      setError(err instanceof Error ? err.message : '添加网络失败')
    }
  }

  const handleRemoveNetwork = async (chainId: string) => {
    if (!confirm('确定要删除这个网络吗？')) return

    try {
      // TODO: 实现真实的网络删除逻辑
      setNetworks(prev => prev.filter(n => n.chainId !== chainId))
      console.log('删除网络成功:', chainId)
    } catch (err) {
      console.error('删除网络失败:', err)
      setError(err instanceof Error ? err.message : '删除网络失败')
    }
  }

  const handleTestRpc = async () => {
    if (!addForm.rpcUrl) {
      setError('请先输入 RPC URL')
      return
    }

    try {
      setError('测试 RPC 连接中...')

      // TODO: 实现真实的 RPC 测试逻辑
      // 模拟测试
      await new Promise(resolve => setTimeout(resolve, 1000))

      setError('')
      alert('RPC 连接测试成功！')
    } catch (err) {
      console.error('RPC 测试失败:', err)
      setError('RPC 连接测试失败')
    }
  }

  const resetForm = () => {
    setAddForm({
      chainName: '',
      rpcUrl: '',
      chainId: '',
      symbol: '',
      name: '',
      decimals: '18',
      blockExplorerUrl: ''
    })
  }

  const getCurrentChainId = () => chainStore.currentChainId

  const formatChainId = (chainId: string) => {
    if (chainId.startsWith('0x')) {
      return parseInt(chainId, 16).toString()
    }
    return chainId
  }

  const getConnectionStatus = (chainId: string) => {
    const currentChainId = getCurrentChainId()
    const isConnected = chainStore.connectionState.isConnected
    return currentChainId === chainId && isConnected
  }

  if (loading) {
    return (
      <div className="plasmo-p-4 plasmo-bg-white plasmo-min-h-screen plasmo-flex plasmo-items-center plasmo-justify-center">
        <div className="plasmo-text-center">
          <div className="plasmo-w-8 plasmo-h-8 plasmo-border-2 plasmo-border-blue-600 plasmo-border-t-transparent plasmo-rounded-full plasmo-animate-spin plasmo-mx-auto plasmo-mb-4"></div>
          <p className="plasmo-text-gray-600">加载中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="plasmo-p-4 plasmo-bg-white plasmo-min-h-screen">
      {/* 页面标题 */}
      <div className="plasmo-text-center plasmo-mb-6">
        <div className="plasmo-w-12 plasmo-h-12 plasmo-bg-blue-100 plasmo-rounded-full plasmo-flex plasmo-items-center plasmo-justify-center plasmo-mx-auto plasmo-mb-3">
          <span className="plasmo-text-2xl">🌐</span>
        </div>
        <h1 className="plasmo-text-xl plasmo-font-bold plasmo-mb-2">
          网络管理
        </h1>
        <p className="plasmo-text-gray-600 plasmo-text-sm">
          管理区块链网络连接
        </p>
      </div>

      {/* 当前网络状态 */}
      <div className="plasmo-bg-blue-50 plasmo-p-4 plasmo-rounded-lg plasmo-mb-6">
        <div className="plasmo-flex plasmo-items-center plasmo-justify-between">
          <div>
            <p className="plasmo-text-sm plasmo-font-medium plasmo-mb-1">当前网络</p>
            <div className="plasmo-flex plasmo-items-center plasmo-space-x-2">
              <span className="plasmo-text-lg">
                {chainStore.getNetworkConfig(getCurrentChainId())?.icon || '🌐'}
              </span>
              <span className="plasmo-font-medium">
                {chainStore.getNetworkConfig(getCurrentChainId())?.chainName || 'Unknown Network'}
              </span>
            </div>
          </div>
          <div className="plasmo-text-right">
            <div className="plasmo-flex plasmo-items-center plasmo-space-x-2 plasmo-mb-1">
              <div className={`plasmo-w-2 plasmo-h-2 plasmo-rounded-full ${
                chainStore.connectionState.isConnected ? 'plasmo-bg-green-500' : 'plasmo-bg-red-500'
              }`}></div>
              <span className="plasmo-text-sm">
                {chainStore.connectionState.isConnected ? '已连接' : '未连接'}
              </span>
            </div>
            <p className="plasmo-text-xs plasmo-text-gray-500">
              Chain ID: {formatChainId(getCurrentChainId())}
            </p>
            {chainStore.connectionState.latency && (
              <p className="plasmo-text-xs plasmo-text-gray-500">
                延迟: {chainStore.connectionState.latency}ms
              </p>
            )}
          </div>
        </div>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="plasmo-bg-red-50 plasmo-border plasmo-border-red-200 plasmo-p-3 plasmo-rounded-lg plasmo-mb-4">
          <p className="plasmo-text-sm plasmo-text-red-800">
            ❌ {error}
          </p>
        </div>
      )}

      {/* 网络列表 */}
      <div className="plasmo-mb-6">
        <div className="plasmo-flex plasmo-items-center plasmo-justify-between plasmo-mb-4">
          <h2 className="plasmo-text-lg plasmo-font-semibold">可用网络</h2>
          <button
            onClick={() => setShowAddModal(true)}
            className="plasmo-bg-blue-600 plasmo-text-white plasmo-px-4 plasmo-py-2 plasmo-rounded-lg plasmo-text-sm hover:plasmo-bg-blue-700 plasmo-transition-colors">
            + 添加网络
          </button>
        </div>

        <div className="plasmo-space-y-3">
          {networks.map(network => {
            const isConnected = getConnectionStatus(network.chainId)
            const isCurrent = getCurrentChainId() === network.chainId

            return (
              <div
                key={network.chainId}
                className={`plasmo-p-4 plasmo-rounded-lg plasmo-border-2 ${
                  isCurrent
                    ? 'plasmo-bg-blue-50 plasmo-border-blue-300'
                    : 'plasmo-bg-white plasmo-border-gray-200'
                }`}
              >
                <div className="plasmo-flex plasmo-items-center plasmo-justify-between">
                  <div className="plasmo-flex plasmo-items-center plasmo-space-x-3">
                    <span className="plasmo-text-2xl">{network.icon}</span>
                    <div>
                      <div className="plasmo-flex plasmo-items-center plasmo-space-x-2">
                        <h3 className="plasmo-font-semibold">{network.chainName}</h3>
                        {network.isTestnet && (
                          <span className="plasmo-px-2 plasmo-py-1 plasmo-bg-yellow-100 plasmo-text-yellow-700 plasmo-text-xs plasmo-rounded">
                            测试网
                          </span>
                        )}
                        {network.isCustom && (
                          <span className="plasmo-px-2 plasmo-py-1 plasmo-bg-purple-100 plasmo-text-purple-700 plasmo-text-xs plasmo-rounded">
                            自定义
                          </span>
                        )}
                        {isCurrent && (
                          <span className="plasmo-px-2 plasmo-py-1 plasmo-bg-green-100 plasmo-text-green-700 plasmo-text-xs plasmo-rounded">
                            当前
                          </span>
                        )}
                      </div>
                      <p className="plasmo-text-sm plasmo-text-gray-600">
                        {network.nativeCurrency.symbol} • Chain ID: {formatChainId(network.chainId)}
                      </p>
                      {network.rpcUrls.length > 0 && (
                        <p className="plasmo-text-xs plasmo-text-gray-500">
                          RPC: {network.rpcUrls[0]}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="plasmo-flex plasmo-items-center plasmo-space-x-2">
                    {isConnected && (
                      <div className="plasmo-w-2 plasmo-h-2 plasmo-bg-green-500 plasmo-rounded-full"></div>
                    )}

                    {!isCurrent ? (
                      <button
                        onClick={() => handleSwitchNetwork(network.chainId)}
                        disabled={switchingNetwork === network.chainId}
                        className="plasmo-bg-blue-600 plasmo-text-white plasmo-px-3 plasmo-py-2 plasmo-rounded plasmo-text-sm hover:plasmo-bg-blue-700 disabled:plasmo-opacity-50 disabled:plasmo-cursor-not-allowed">
                        {switchingNetwork === network.chainId ? (
                          <div className="plasmo-flex plasmo-items-center plasmo-space-x-2">
                            <div className="plasmo-w-3 plasmo-h-3 plasmo-border-2 plasmo-border-white plasmo-border-t-transparent plasmo-rounded-full plasmo-animate-spin"></div>
                            <span>切换中</span>
                          </div>
                        ) : (
                          '切换'
                        )}
                      </button>
                    ) : (
                      <span className="plasmo-text-green-600 plasmo-text-sm plasmo-font-medium">
                        已连接
                      </span>
                    )}

                    {network.isCustom && (
                      <button
                        onClick={() => handleRemoveNetwork(network.chainId)}
                        className="plasmo-bg-red-100 plasmo-text-red-700 plasmo-px-3 plasmo-py-2 plasmo-rounded plasmo-text-sm hover:plasmo-bg-red-200 plasmo-transition-colors">
                        删除
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* 添加网络模态框 */}
      {showAddModal && (
        <div className="plasmo-fixed plasmo-inset-0 plasmo-bg-black plasmo-bg-opacity-50 plasmo-flex plasmo-items-center plasmo-justify-center plasmo-p-4 plasmo-z-50">
          <div className="plasmo-bg-white plasmo-p-6 plasmo-rounded-lg plasmo-max-w-md plasmo-w-full plasmo-max-h-[90vh] plasmo-overflow-y-auto">
            <h3 className="plasmo-text-lg plasmo-font-bold plasmo-mb-4">添加自定义网络</h3>

            <div className="plasmo-space-y-4">
              <div>
                <label className="plasmo-block plasmo-text-sm plasmo-font-medium plasmo-mb-2">
                  网络名称 *
                </label>
                <input
                  type="text"
                  value={addForm.chainName}
                  onChange={(e) => setAddForm(prev => ({ ...prev, chainName: e.target.value }))}
                  placeholder="例如: Ethereum Mainnet"
                  className="plasmo-w-full plasmo-border plasmo-border-gray-300 plasmo-rounded-lg plasmo-px-3 plasmo-py-2"
                />
              </div>

              <div>
                <label className="plasmo-block plasmo-text-sm plasmo-font-medium plasmo-mb-2">
                  新 RPC URL *
                </label>
                <div className="plasmo-flex plasmo-space-x-2">
                  <input
                    type="url"
                    value={addForm.rpcUrl}
                    onChange={(e) => setAddForm(prev => ({ ...prev, rpcUrl: e.target.value }))}
                    placeholder="https://mainnet.infura.io/v3/..."
                    className="plasmo-flex-1 plasmo-border plasmo-border-gray-300 plasmo-rounded-lg plasmo-px-3 plasmo-py-2"
                  />
                  <button
                    onClick={handleTestRpc}
                    className="plasmo-bg-gray-100 plasmo-text-gray-700 plasmo-px-4 plasmo-py-2 plasmo-rounded-lg plasmo-text-sm hover:plasmo-bg-gray-200">
                    测试
                  </button>
                </div>
              </div>

              <div>
                <label className="plasmo-block plasmo-text-sm plasmo-font-medium plasmo-mb-2">
                  链 ID *
                </label>
                <input
                  type="text"
                  value={addForm.chainId}
                  onChange={(e) => setAddForm(prev => ({ ...prev, chainId: e.target.value }))}
                  placeholder="例如: 1"
                  className="plasmo-w-full plasmo-border plasmo-border-gray-300 plasmo-rounded-lg plasmo-px-3 plasmo-py-2"
                />
              </div>

              <div>
                <label className="plasmo-block plasmo-text-sm plasmo-font-medium plasmo-mb-2">
                  货币符号 *
                </label>
                <input
                  type="text"
                  value={addForm.symbol}
                  onChange={(e) => setAddForm(prev => ({ ...prev, symbol: e.target.value }))}
                  placeholder="例如: ETH"
                  className="plasmo-w-full plasmo-border plasmo-border-gray-300 plasmo-rounded-lg plasmo-px-3 plasmo-py-2"
                />
              </div>

              <div>
                <label className="plasmo-block plasmo-text-sm plasmo-font-medium plasmo-mb-2">
                  货币名称 *
                </label>
                <input
                  type="text"
                  value={addForm.name}
                  onChange={(e) => setAddForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="例如: Ethereum"
                  className="plasmo-w-full plasmo-border plasmo-border-gray-300 plasmo-rounded-lg plasmo-px-3 plasmo-py-2"
                />
              </div>

              <div>
                <label className="plasmo-block plasmo-text-sm plasmo-font-medium plasmo-mb-2">
                  小数位数
                </label>
                <input
                  type="number"
                  value={addForm.decimals}
                  onChange={(e) => setAddForm(prev => ({ ...prev, decimals: e.target.value }))}
                  placeholder="18"
                  min="0"
                  max="36"
                  className="plasmo-w-full plasmo-border plasmo-border-gray-300 plasmo-rounded-lg plasmo-px-3 plasmo-py-2"
                />
              </div>

              <div>
                <label className="plasmo-block plasmo-text-sm plasmo-font-medium plasmo-mb-2">
                  区块浏览器 URL (可选)
                </label>
                <input
                  type="url"
                  value={addForm.blockExplorerUrl}
                  onChange={(e) => setAddForm(prev => ({ ...prev, blockExplorerUrl: e.target.value }))}
                  placeholder="https://etherscan.io"
                  className="plasmo-w-full plasmo-border plasmo-border-gray-300 plasmo-rounded-lg plasmo-px-3 plasmo-py-2"
                />
              </div>
            </div>

            <div className="plasmo-grid plasmo-grid-cols-2 plasmo-gap-3 plasmo-mt-6">
              <button
                onClick={() => {
                  setShowAddModal(false)
                  resetForm()
                  setError('')
                }}
                className="plasmo-bg-gray-100 plasmo-text-gray-700 plasmo-px-4 plasmo-py-2 plasmo-rounded plasmo-text-sm hover:plasmo-bg-gray-200">
                取消
              </button>
              <button
                onClick={handleAddNetwork}
                className="plasmo-bg-blue-600 plasmo-text-white plasmo-px-4 plasmo-py-2 plasmo-rounded plasmo-text-sm hover:plasmo-bg-blue-700">
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default NetworkManagerPage