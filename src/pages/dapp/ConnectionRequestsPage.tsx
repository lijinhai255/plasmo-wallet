import React, { useState, useEffect } from 'react'
import { useWalletStore } from '../../stores/walletStore'

interface DAppConnection {
  id: string
  origin: string
  favicon?: string
  title?: string
  permissions: string[]
  connectedAt: number
  lastUsedAt: number
  isActive: boolean
}

interface PendingRequest {
  id: string
  origin: string
  favicon?: string
  title?: string
  requestedPermissions: string[]
  createdAt: number
}

export const ConnectionRequestsPage = () => {
  const { currentAccount } = useWalletStore()
  const [connections, setConnections] = useState<DAppConnection[]>([])
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([])
  const [selectedConnection, setSelectedConnection] = useState<DAppConnection | null>(null)
  const [showPermissionsModal, setShowPermissionsModal] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
    checkPendingRequests()

    // 定期检查pending请求
    const interval = setInterval(checkPendingRequests, 2000)
    return () => clearInterval(interval)
  }, [])

  const checkPendingRequests = async () => {
    try {
      // 向background script查询pending请求
      const response = await chrome.runtime.sendMessage({
        type: 'GET_PENDING_REQUESTS'
      })

      if (response && response.data && response.data.pendingRequests) {
        const realPendingRequests = response.data.pendingRequests.map((req: any) => ({
          id: req.messageId,
          origin: req.origin,
          title: new URL(req.origin).hostname,
          requestedPermissions: ['eth_accounts'],
          createdAt: Date.now()
        }))

        setPendingRequests(realPendingRequests)
      }
    } catch (error) {
      // 忽略错误，可能是background script未响应
    }
  }

  const loadData = async () => {
    setLoading(true)
    try {
      // TODO: 从存储中加载真实的连接数据
      // 模拟数据
      const mockConnections: DAppConnection[] = [
        {
          id: '1',
          origin: 'https://app.uniswap.org',
          title: 'Uniswap',
          favicon: 'https://app.uniswap.org/favicon.ico',
          permissions: ['eth_accounts', 'eth_chainId', 'personal_sign'],
          connectedAt: Date.now() - 86400000, // 1天前
          lastUsedAt: Date.now() - 3600000, // 1小时前
          isActive: true
        },
        {
          id: '2',
          origin: 'https://opensea.io',
          title: 'OpenSea',
          favicon: 'https://opensea.io/favicon.ico',
          permissions: ['eth_accounts', 'eth_chainId'],
          connectedAt: Date.now() - 172800000, // 2天前
          lastUsedAt: Date.now() - 7200000, // 2小时前
          isActive: true
        }
      ]

      const mockPendingRequests: PendingRequest[] = [
        {
          id: '3',
          origin: 'https://app.aave.com',
          title: 'Aave',
          favicon: 'https://app.aave.com/favicon.ico',
          requestedPermissions: ['eth_accounts', 'eth_chainId', 'personal_sign', 'eth_sendTransaction'],
          createdAt: Date.now() - 300000 // 5分钟前
        }
      ]

      setConnections(mockConnections)
      setPendingRequests(mockPendingRequests)
    } catch (error) {
      console.error('加载连接数据失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleApproveRequest = async (requestId: string) => {
    try {
      const request = pendingRequests.find(r => r.id === requestId)
      if (!request) return

      // 直接通过消息调用background script的处理函数
      await chrome.runtime.sendMessage({
        type: 'HANDLE_PENDING_REQUEST',
        approved: true,
        messageId: requestId
      })

      // 创建连接记录
      const newConnection: DAppConnection = {
        id: request.id,
        origin: request.origin,
        title: request.title,
        favicon: request.favicon,
        permissions: request.requestedPermissions,
        connectedAt: Date.now(),
        lastUsedAt: Date.now(),
        isActive: true
      }

      setConnections(prev => [...prev, newConnection])
      setPendingRequests(prev => prev.filter(r => r.id !== requestId))
    } catch (error) {
      console.error('批准连接失败:', error)
    }
  }

  const handleRejectRequest = async (requestId: string) => {
    try {
      // 直接通过消息调用background script的处理函数
      await chrome.runtime.sendMessage({
        type: 'HANDLE_PENDING_REQUEST',
        approved: false,
        messageId: requestId
      })

      setPendingRequests(prev => prev.filter(r => r.id !== requestId))
    } catch (error) {
      console.error('拒绝连接失败:', error)
    }
  }

  const handleDisconnect = async (connectionId: string) => {
    try {
      // TODO: 实现真实的断开连接逻辑
      console.log('断开连接:', connectionId)
      setConnections(prev => prev.filter(c => c.id !== connectionId))
    } catch (error) {
      console.error('断开连接失败:', error)
    }
  }

  const handleUpdatePermissions = (connection: DAppConnection) => {
    setSelectedConnection(connection)
    setShowPermissionsModal(true)
  }

  const formatOrigin = (origin: string) => {
    try {
      const url = new URL(origin)
      return url.hostname
    } catch {
      return origin
    }
  }

  const formatTime = (timestamp: number) => {
    const diff = Date.now() - timestamp
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(hours / 24)

    if (days > 0) {
      return `${days}天前`
    } else if (hours > 0) {
      return `${hours}小时前`
    } else {
      return '刚刚'
    }
  }

  const getRiskLevel = (permissions: string[]) => {
    const hasSendTx = permissions.includes('eth_sendTransaction')
    const hasSign = permissions.includes('personal_sign')

    if (hasSendTx) return { level: 'high', color: 'red', text: '高风险' }
    if (hasSign) return { level: 'medium', color: 'yellow', text: '中风险' }
    return { level: 'low', color: 'green', text: '低风险' }
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
          <span className="plasmo-text-2xl">🔗</span>
        </div>
        <h1 className="plasmo-text-xl plasmo-font-bold plasmo-mb-2">
          DApp 连接管理
        </h1>
        <p className="plasmo-text-gray-600 plasmo-text-sm">
          管理您的 DApp 连接和权限
        </p>
      </div>

      {/* 待处理连接请求 */}
      {pendingRequests.length > 0 && (
        <div className="plasmo-mb-6">
          <h2 className="plasmo-text-lg plasmo-font-semibold plasmo-mb-3 plasmo-flex plasmo-items-center">
            <span className="plasmo-w-2 plasmo-h-2 plasmo-bg-orange-500 plasmo-rounded-full plasmo-mr-2"></span>
            待处理请求 ({pendingRequests.length})
          </h2>

          {pendingRequests.map(request => (
            <div key={request.id} className="plasmo-bg-orange-50 plasmo-border plasmo-border-orange-200 plasmo-p-4 plasmo-rounded-lg plasmo-mb-3">
              <div className="plasmo-flex plasmo-items-start plasmo-space-x-3">
                {request.favicon && (
                  <img
                    src={request.favicon}
                    alt=""
                    className="plasmo-w-8 plasmo-h-8 plasmo-rounded plasmt-1"
                  />
                )}
                <div className="plasmo-flex-1">
                  <div className="plasmo-flex plasmo-items-center plasmo-justify-between plasmo-mb-2">
                    <h3 className="plasmo-font-medium">
                      {request.title || formatOrigin(request.origin)}
                    </h3>
                    <span className="plasmo-text-xs plasmo-text-orange-600">
                      {formatTime(request.createdAt)}
                    </span>
                  </div>

                  <p className="plasmo-text-sm plasmo-text-gray-600 plasmo-mb-3">
                    {formatOrigin(request.origin)}
                  </p>

                  <div className="plasmo-mb-3">
                    <p className="plasmo-text-xs plasmo-font-medium plasmo-mb-1">请求权限:</p>
                    <div className="plasmo-flex plasmo-flex-wrap plasmo-gap-1">
                      {request.requestedPermissions.map(permission => (
                        <span
                          key={permission}
                          className="plasmo-px-2 plasmo-py-1 plasmo-bg-orange-100 plasmo-text-orange-700 plasmo-text-xs plasmo-rounded"
                        >
                          {permission}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="plasmo-grid plasmo-grid-cols-2 plasmo-gap-2">
                    <button
                      onClick={() => handleRejectRequest(request.id)}
                      className="plasmo-bg-red-100 plasmo-text-red-700 plasmo-px-3 plasmo-py-2 plasmo-rounded plasmo-text-sm hover:plasmo-bg-red-200 plasmo-transition-colors">
                      拒绝
                    </button>
                    <button
                      onClick={() => handleApproveRequest(request.id)}
                      className="plasmo-bg-green-100 plasmo-text-green-700 plasmo-px-3 plasmo-py-2 plasmo-rounded plasmo-text-sm hover:plasmo-bg-green-200 plasmo-transition-colors">
                      批准
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 已连接的 DApp */}
      <div>
        <h2 className="plasmo-text-lg plasmo-font-semibold plasmo-mb-3 plasmo-flex plasmo-items-center">
          <span className="plasmo-w-2 plasmo-h-2 plasmo-bg-green-500 plasmo-rounded-full plasmo-mr-2"></span>
          已连接 ({connections.length})
        </h2>

        {connections.length === 0 ? (
          <div className="plasmo-bg-gray-50 plasmo-p-6 plasmo-rounded-lg plasmo-text-center">
            <div className="plasmo-text-4xl plasmo-mb-3">🔐</div>
            <p className="plasmo-text-gray-600">暂无已连接的 DApp</p>
            <p className="plasmo-text-sm plasmo-text-gray-500 plasmo-mt-1">
              连接 DApp 后会在这里显示
            </p>
          </div>
        ) : (
          connections.map(connection => {
            const risk = getRiskLevel(connection.permissions)
            return (
              <div key={connection.id} className="plasmo-bg-white plasmo-border plasmo-border-gray-200 plasmo-p-4 plasmo-rounded-lg plasmo-mb-3">
                <div className="plasmo-flex plasmo-items-start plasmo-space-x-3">
                  {connection.favicon && (
                    <img
                      src={connection.favicon}
                      alt=""
                      className="plasmo-w-8 plasmo-h-8 plasmo-rounded plasmt-1"
                    />
                  )}
                  <div className="plasmo-flex-1">
                    <div className="plasmo-flex plasmo-items-center plasmo-justify-between plasmo-mb-2">
                      <h3 className="plasmo-font-medium">
                        {connection.title || formatOrigin(connection.origin)}
                      </h3>
                      <div className="plasmo-flex plasmo-items-center plasmo-space-x-2">
                        <span className={`plasmo-px-2 plasmo-py-1 plasmo-bg-${risk.color}-100 plasmo-text-${risk.color}-700 plasmo-text-xs plasmo-rounded`}>
                          {risk.text}
                        </span>
                        {connection.isActive && (
                          <span className="plasmo-w-2 plasmo-h-2 plasmo-bg-green-500 plasmo-rounded-full"></span>
                        )}
                      </div>
                    </div>

                    <p className="plasmo-text-sm plasmo-text-gray-600 plasmo-mb-3">
                      {formatOrigin(connection.origin)}
                    </p>

                    <div className="plasmo-flex plasmo-items-center plasmo-justify-between plasmo-mb-3">
                      <p className="plasmo-text-xs plasmo-text-gray-500">
                        连接时间: {formatTime(connection.connectedAt)}
                      </p>
                      <p className="plasmo-text-xs plasmo-text-gray-500">
                        最后使用: {formatTime(connection.lastUsedAt)}
                      </p>
                    </div>

                    <div className="plasmo-mb-3">
                      <p className="plasmo-text-xs plasmo-font-medium plasmo-mb-1">当前权限:</p>
                      <div className="plasmo-flex plasmo-flex-wrap plasmo-gap-1">
                        {connection.permissions.map(permission => (
                          <span
                            key={permission}
                            className="plasmo-px-2 plasmo-py-1 plasmo-bg-gray-100 plasmo-text-gray-700 plasmo-text-xs plasmo-rounded"
                          >
                            {permission}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="plasmo-grid plasmo-grid-cols-2 plasmo-gap-2">
                      <button
                        onClick={() => handleUpdatePermissions(connection)}
                        className="plasmo-bg-blue-100 plasmo-text-blue-700 plasmo-px-3 plasmo-py-2 plasmo-rounded plasmo-text-sm hover:plasmo-bg-blue-200 plasmo-transition-colors">
                        管理权限
                      </button>
                      <button
                        onClick={() => handleDisconnect(connection.id)}
                        className="plasmo-bg-red-100 plasmo-text-red-700 plasmo-px-3 plasmo-py-2 plasmo-rounded plasmo-text-sm hover:plasmo-bg-red-200 plasmo-transition-colors">
                        断开连接
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* 权限管理模态框 */}
      {showPermissionsModal && selectedConnection && (
        <div className="plasmo-fixed plasmo-inset-0 plasmo-bg-black plasmo-bg-opacity-50 plasmo-flex plasmo-items-center plasmo-justify-center plasmo-p-4 plasmo-z-50">
          <div className="plasmo-bg-white plasmo-p-6 plasmo-rounded-lg plasmo-max-w-md plasmo-w-full">
            <h3 className="plasmo-text-lg plasmo-font-bold plasmo-mb-4">
              管理权限 - {selectedConnection.title}
            </h3>

            <div className="plasmo-mb-6">
              <p className="plasmo-text-sm plasmo-font-medium plasmo-mb-2">当前权限:</p>
              <div className="plasmo-space-y-2">
                {selectedConnection.permissions.map(permission => (
                  <label key={permission} className="plasmo-flex plasmo-items-center plasmo-space-x-2">
                    <input
                      type="checkbox"
                      defaultChecked={true}
                      className="plasmo-rounded"
                    />
                    <span className="plasmo-text-sm">{permission}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="plasmo-grid plasmo-grid-cols-2 plasmo-gap-3">
              <button
                onClick={() => setShowPermissionsModal(false)}
                className="plasmo-bg-gray-100 plasmo-text-gray-700 plasmo-px-4 plasmo-py-2 plasmo-rounded plasmo-text-sm hover:plasmo-bg-gray-200">
                取消
              </button>
              <button
                onClick={() => {
                  // TODO: 实现权限更新逻辑
                  setShowPermissionsModal(false)
                }}
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

export default ConnectionRequestsPage