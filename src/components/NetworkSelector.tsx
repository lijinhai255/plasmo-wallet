import React, { useEffect, useState } from "react"
import { useNetworkStore } from "@/stores/networkStore"

export const NetworkSelector: React.FC = () => {
  const {
    currentNetwork,
    networks,
    isLoading,
    connectionStatus,
    lastError,
    switchNetwork,
    addNetwork,
    removeNetwork,
    testConnection
  } = useNetworkStore()

  const [isSwitching, setIsSwitching] = useState(false)
  const [showAddNetwork, setShowAddNetwork] = useState(false)
  const [newNetwork, setNewNetwork] = useState({
    id: "",
    name: "",
    rpcUrl: "",
    chainId: "",
    symbol: "",
    blockExplorerUrl: ""
  })
  const [isValidating, setIsValidating] = useState(false)
  const [validationErrors, setValidationErrors] = useState<string[]>([])

  useEffect(() => {
    // 定期测试连接状态
    const interval = setInterval(() => {
      if (currentNetwork) {
        testConnection(currentNetwork.id)
      }
    }, 30000) // 每30秒测试一次

    return () => clearInterval(interval)
  }, [currentNetwork?.id])

  const handleNetworkSwitch = async (networkId: string) => {
    if (networkId === currentNetwork.id || isSwitching) return

    setIsSwitching(true)
    try {
      await switchNetwork(networkId)
    } catch (error) {
      console.error("切换网络失败:", error)
      alert(`切换网络失败: ${error instanceof Error ? error.message : "未知错误"}`)
    } finally {
      setIsSwitching(false)
    }
  }

  const validateNetworkForm = () => {
    const { validateNetwork } = useNetworkStore.getState()
    const validation = validateNetwork(newNetwork)
    setValidationErrors(validation.errors)
    return validation.isValid
  }

  const handleAddNetwork = async () => {
    if (!validateNetworkForm()) {
      return
    }

    setIsValidating(true)
    try {
      await addNetwork(newNetwork as any)
      setShowAddNetwork(false)
      setNewNetwork({
        id: "",
        name: "",
        rpcUrl: "",
        chainId: "",
        symbol: "",
        blockExplorerUrl: ""
      })
      setValidationErrors([])
      alert("网络添加成功！")
    } catch (error) {
      console.error("添加网络失败:", error)
      alert(`添加网络失败: ${error instanceof Error ? error.message : "未知错误"}`)
    } finally {
      setIsValidating(false)
    }
  }

  const handleRemoveNetwork = async (networkId: string, e: React.MouseEvent) => {
    e.stopPropagation() // 防止触发网络切换

    if (!confirm("确定要删除这个网络吗？")) {
      return
    }

    try {
      await removeNetwork(networkId)
      alert("网络删除成功！")
    } catch (error) {
      console.error("删除网络失败:", error)
      alert(`删除网络失败: ${error instanceof Error ? error.message : "未知错误"}`)
    }
  }

  return (
    <div className="p-4 bg-white rounded-lg shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">网络选择</h2>
        <button
          onClick={() => setShowAddNetwork(true)}
          className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors">
          ➕ 添加网络
        </button>
      </div>

      {/* 当前网络状态 */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-2xl">🌐</span>
            <div>
              <div className="font-medium">
                {currentNetwork?.name || "Unknown Network"}
              </div>
              <div className="text-sm text-gray-600">
                Chain ID: {currentNetwork?.chainId}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <div
              className={`w-3 h-3 rounded-full ${
                connectionStatus === 'connected'
                  ? "bg-green-500"
                  : connectionStatus === 'connecting'
                  ? "bg-yellow-500"
                  : "bg-red-500"
              }`}></div>
            {connectionStatus === 'connected' && (
              <span className="text-sm text-green-600">
                已连接
              </span>
            )}
            {connectionStatus === 'connecting' && (
              <span className="text-sm text-yellow-600">
                连接中...
              </span>
            )}
            {connectionStatus === 'error' && (
              <span className="text-sm text-red-600">
                连接失败
              </span>
            )}
          </div>
        </div>

        {lastError && (
          <div className="mt-2 text-sm text-red-600">
            ⚠️ {lastError}
          </div>
        )}
      </div>

      {/* 网络列表 */}
      <div className="space-y-2">
        {networks.map((network) => {
          const isDefaultNetwork = network.id === 'ethereum' || network.id === 'sepolia' ||
                                  network.id === 'polygon' || network.id === 'polygon-amoy';

          return (
            <div
              key={network.id}
              onClick={() => handleNetworkSwitch(network.id)}
              className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                network.id === currentNetwork.id
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 hover:bg-gray-50"
              }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="text-xl">🌐</span>
                  <div>
                    <div className="font-medium">{network.name}</div>
                    <div className="text-sm text-gray-600">
                      {network.symbol} • Chain ID: {network.chainId}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {network.id === currentNetwork.id && (
                    <div className="text-blue-600 text-sm">
                      ✓ 当前
                    </div>
                  )}

                  {isSwitching && network.id !== currentNetwork.id && (
                    <div className="text-gray-500 text-sm">
                      切换中...
                    </div>
                  )}

                  {!isDefaultNetwork && (
                    <button
                      onClick={(e) => handleRemoveNetwork(network.id, e)}
                      className="text-red-500 hover:text-red-700 text-sm px-2 py-1 rounded hover:bg-red-50">
                      删除
                    </button>
                  )}
                </div>
              </div>

              <div className="mt-2 text-xs text-gray-500">
                {network.blockExplorerUrl && (
                  <span>
                    浏览器: {new URL(network.blockExplorerUrl).hostname}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 网络统计 */}
      <div className="mt-4 text-sm text-gray-600">
        <p>• 已配置 {networks.length} 个网络</p>
        <p>• 当前连接: {connectionStatus === 'connected' ? "已连接" : connectionStatus === 'connecting' ? "连接中" : "未连接"}</p>
      </div>

      {/* 添加网络对话框 */}
      {showAddNetwork && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg m-4 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold mb-4">
              添加自定义网络
            </h3>

            {validationErrors.length > 0 && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600 font-medium mb-1">请修正以下错误:</p>
                <ul className="text-sm text-red-600 list-disc list-inside">
                  {validationErrors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  网络ID *
                </label>
                <input
                  type="text"
                  value={newNetwork.id}
                  onChange={(e) => {
                    setNewNetwork({ ...newNetwork, id: e.target.value });
                    setValidationErrors([]);
                  }}
                  placeholder="my-custom-network"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  网络名称 *
                </label>
                <input
                  type="text"
                  value={newNetwork.name}
                  onChange={(e) => {
                    setNewNetwork({ ...newNetwork, name: e.target.value });
                    setValidationErrors([]);
                  }}
                  placeholder="My Custom Network"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  RPC URL *
                </label>
                <input
                  type="url"
                  value={newNetwork.rpcUrl}
                  onChange={(e) => {
                    setNewNetwork({ ...newNetwork, rpcUrl: e.target.value });
                    setValidationErrors([]);
                  }}
                  placeholder="https://..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Chain ID *
                </label>
                <input
                  type="number"
                  value={newNetwork.chainId}
                  onChange={(e) => {
                    setNewNetwork({ ...newNetwork, chainId: e.target.value });
                    setValidationErrors([]);
                  }}
                  placeholder="1"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  代币符号 *
                </label>
                <input
                  type="text"
                  value={newNetwork.symbol}
                  onChange={(e) => {
                    setNewNetwork({ ...newNetwork, symbol: e.target.value });
                    setValidationErrors([]);
                  }}
                  placeholder="ETH"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  区块浏览器 (可选)
                </label>
                <input
                  type="url"
                  value={newNetwork.blockExplorerUrl}
                  onChange={(e) => {
                    setNewNetwork({ ...newNetwork, blockExplorerUrl: e.target.value });
                    setValidationErrors([]);
                  }}
                  placeholder="https://etherscan.io"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={handleAddNetwork}
                  disabled={isValidating}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                  {isValidating ? "添加中..." : "添加网络"}
                </button>
                <button
                  onClick={() => {
                    setShowAddNetwork(false);
                    setValidationErrors([]);
                  }}
                  className="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors">
                  取消
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mt-4 text-xs text-gray-500">
        <p>💡 提示: 请确保使用可靠的 RPC 端点</p>
        <p>🔒 建议使用官方或知名的 RPC 提供商</p>
      </div>
    </div>
  )
}

export default NetworkSelector
