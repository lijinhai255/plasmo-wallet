import React, { useState, useEffect } from 'react'
import { useWalletStore } from '../../../store/WalletStore'

interface DAppPermission {
  id: string
  origin: string
  favicon?: string
  title?: string
  permissions: PermissionItem[]
  connectedAt: number
  lastUsedAt: number
  isActive: boolean
  riskLevel: 'low' | 'medium' | 'high'
}

interface PermissionItem {
  type: string
  name: string
  description: string
  granted: boolean
  category: 'account' | 'network' | 'sign' | 'transaction'
}

const PERMISSION_DESCRIPTIONS: Record<string, { name: string; description: string; category: PermissionItem['category'] }> = {
  'eth_accounts': {
    name: '账户访问',
    description: '获取您的钱包账户地址',
    category: 'account'
  },
  'eth_chainId': {
    name: '网络信息',
    description: '获取当前连接的区块链网络信息',
    category: 'network'
  },
  'personal_sign': {
    name: '消息签名',
    description: '代表您签名消息，用于身份验证',
    category: 'sign'
  },
  'eth_signTypedData_v4': {
    name: '结构化数据签名',
    description: '签名结构化数据，用于去中心化登录',
    category: 'sign'
  },
  'eth_sendTransaction': {
    name: '发送交易',
    description: '代表您发送以太坊交易',
    category: 'transaction'
  },
  'eth_signTransaction': {
    name: '签名交易',
    description: '代表您签名以太坊交易',
    category: 'transaction'
  },
  'wallet_addEthereumChain': {
    name: '添加网络',
    description: '添加新的区块链网络到钱包',
    category: 'network'
  },
  'wallet_switchEthereumChain': {
    name: '切换网络',
    description: '切换区块链网络',
    category: 'network'
  }
}

export const PermissionsPage = () => {
  const walletStore = useWalletStore()
  const [permissions, setPermissions] = useState<DAppPermission[]>([])
  const [selectedApp, setSelectedApp] = useState<DAppPermission | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      // TODO: 从存储中加载真实的权限数据
      // 模拟数据
      const mockPermissions: DAppPermission[] = [
        {
          id: '1',
          origin: 'https://app.uniswap.org',
          title: 'Uniswap',
          favicon: 'https://app.uniswap.org/favicon.ico',
          permissions: [
            {
              type: 'eth_accounts',
              name: PERMISSION_DESCRIPTIONS['eth_accounts'].name,
              description: PERMISSION_DESCRIPTIONS['eth_accounts'].description,
              category: PERMISSION_DESCRIPTIONS['eth_accounts'].category,
              granted: true
            },
            {
              type: 'eth_chainId',
              name: PERMISSION_DESCRIPTIONS['eth_chainId'].name,
              description: PERMISSION_DESCRIPTIONS['eth_chainId'].description,
              category: PERMISSION_DESCRIPTIONS['eth_chainId'].category,
              granted: true
            },
            {
              type: 'eth_sendTransaction',
              name: PERMISSION_DESCRIPTIONS['eth_sendTransaction'].name,
              description: PERMISSION_DESCRIPTIONS['eth_sendTransaction'].description,
              category: PERMISSION_DESCRIPTIONS['eth_sendTransaction'].category,
              granted: true
            }
          ],
          connectedAt: Date.now() - 86400000,
          lastUsedAt: Date.now() - 3600000,
          isActive: true,
          riskLevel: 'high'
        },
        {
          id: '2',
          origin: 'https://opensea.io',
          title: 'OpenSea',
          favicon: 'https://opensea.io/favicon.ico',
          permissions: [
            {
              type: 'eth_accounts',
              name: PERMISSION_DESCRIPTIONS['eth_accounts'].name,
              description: PERMISSION_DESCRIPTIONS['eth_accounts'].description,
              category: PERMISSION_DESCRIPTIONS['eth_accounts'].category,
              granted: true
            },
            {
              type: 'personal_sign',
              name: PERMISSION_DESCRIPTIONS['personal_sign'].name,
              description: PERMISSION_DESCRIPTIONS['personal_sign'].description,
              category: PERMISSION_DESCRIPTIONS['personal_sign'].category,
              granted: true
            }
          ],
          connectedAt: Date.now() - 172800000,
          lastUsedAt: Date.now() - 7200000,
          isActive: true,
          riskLevel: 'medium'
        }
      ]

      setPermissions(mockPermissions)
    } catch (error) {
      console.error('加载权限数据失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdatePermission = async (appId: string, permissionType: string, granted: boolean) => {
    try {
      // TODO: 实现真实的权限更新逻辑
      console.log('更新权限:', { appId, permissionType, granted })

      setPermissions(prev =>
        prev.map(app =>
          app.id === appId
            ? {
                ...app,
                permissions: app.permissions.map(p =>
                  p.type === permissionType ? { ...p, granted } : p
                )
              }
            : app
        )
      )
    } catch (error) {
      console.error('更新权限失败:', error)
    }
  }

  const handleRevokeAllPermissions = async (appId: string) => {
    try {
      // TODO: 实现真实的权限撤销逻辑
      console.log('撤销所有权限:', appId)
      setPermissions(prev => prev.filter(app => app.id !== appId))
      setShowEditModal(false)
    } catch (error) {
      console.error('撤销权限失败:', error)
    }
  }

  const calculateRiskLevel = (permissions: PermissionItem[]): 'low' | 'medium' | 'high' => {
    const hasTransaction = permissions.some(p => p.category === 'transaction' && p.granted)
    const hasSign = permissions.some(p => p.category === 'sign' && p.granted)

    if (hasTransaction) return 'high'
    if (hasSign) return 'medium'
    return 'low'
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

  const getRiskLevelInfo = (level: 'low' | 'medium' | 'high') => {
    switch (level) {
      case 'high':
        return { color: 'red', text: '高风险', icon: '🔴' }
      case 'medium':
        return { color: 'yellow', text: '中风险', icon: '🟡' }
      case 'low':
        return { color: 'green', text: '低风险', icon: '🟢' }
    }
  }

  const getCategoryInfo = (category: PermissionItem['category']) => {
    switch (category) {
      case 'account':
        return { color: 'blue', text: '账户', icon: '👤' }
      case 'network':
        return { color: 'purple', text: '网络', icon: '🌐' }
      case 'sign':
        return { color: 'orange', text: '签名', icon: '✍️' }
      case 'transaction':
        return { color: 'red', text: '交易', icon: '💸' }
    }
  }

  const filteredPermissions = permissions.filter(app => {
    const matchesSearch = !searchTerm ||
      app.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      formatOrigin(app.origin).toLowerCase().includes(searchTerm.toLowerCase())

    const matchesCategory = filterCategory === 'all' ||
      app.permissions.some(p => p.category === filterCategory)

    return matchesSearch && matchesCategory
  })

  const permissionCategories = [
    { value: 'all', text: '全部权限' },
    { value: 'account', text: '账户权限' },
    { value: 'network', text: '网络权限' },
    { value: 'sign', text: '签名权限' },
    { value: 'transaction', text: '交易权限' }
  ]

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
        <div className="plasmo-w-12 plasmo-h-12 plasmo-bg-purple-100 plasmo-rounded-full plasmo-flex plasmo-items-center plasmo-justify-center plasmo-mx-auto plasmo-mb-3">
          <span className="plasmo-text-2xl">🛡️</span>
        </div>
        <h1 className="plasmo-text-xl plasmo-font-bold plasmo-mb-2">
          权限管理
        </h1>
        <p className="plasmo-text-gray-600 plasmo-text-sm">
          管理和控制 DApp 访问权限
        </p>
      </div>

      {/* 统计信息 */}
      <div className="plasmo-grid plasmo-grid-cols-3 plasmo-gap-3 plasmo-mb-6">
        <div className="plasmo-bg-green-50 plasmo-p-3 plasmo-rounded-lg plasmo-text-center">
          <div className="plasmo-text-2xl plasmo-mb-1">🟢</div>
          <div className="plasmo-text-lg plasmo-font-bold plasmo-text-green-700">
            {permissions.filter(p => p.riskLevel === 'low').length}
          </div>
          <div className="plasmo-text-xs plasmo-text-green-600">低风险</div>
        </div>
        <div className="plasmo-bg-yellow-50 plasmo-p-3 plasmo-rounded-lg plasmo-text-center">
          <div className="plasmo-text-2xl plasmo-mb-1">🟡</div>
          <div className="plasmo-text-lg plasmo-font-bold plasmo-text-yellow-700">
            {permissions.filter(p => p.riskLevel === 'medium').length}
          </div>
          <div className="plasmo-text-xs plasmo-text-yellow-600">中风险</div>
        </div>
        <div className="plasmo-bg-red-50 plasmo-p-3 plasmo-rounded-lg plasmo-text-center">
          <div className="plasmo-text-2xl plasmo-mb-1">🔴</div>
          <div className="plasmo-text-lg plasmo-font-bold plasmo-text-red-700">
            {permissions.filter(p => p.riskLevel === 'high').length}
          </div>
          <div className="plasmo-text-xs plasmo-text-red-600">高风险</div>
        </div>
      </div>

      {/* 搜索和筛选 */}
      <div className="plasmo-mb-4">
        <input
          type="text"
          placeholder="搜索 DApp..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="plasmo-w-full plasmo-border plasmo-border-gray-300 plasmo-rounded-lg plasmo-px-3 plasmo-py-2 plasmo-mb-3"
        />

        <div className="plasmo-flex plasmo-gap-2 plasmo-overflow-x-auto">
          {permissionCategories.map(category => (
            <button
              key={category.value}
              onClick={() => setFilterCategory(category.value)}
              className={`plasmo-px-3 plasmo-py-1 plasmo-rounded-lg plasmo-text-sm plasmo-whitespace-nowrap ${
                filterCategory === category.value
                  ? 'plasmo-bg-blue-600 plasmo-text-white'
                  : 'plasmo-bg-gray-100 plasmo-text-gray-700 hover:plasmo-bg-gray-200'
              }`}
            >
              {category.text}
            </button>
          ))}
        </div>
      </div>

      {/* 权限列表 */}
      <div className="plasmo-space-y-3">
        {filteredPermissions.length === 0 ? (
          <div className="plasmo-bg-gray-50 plasmo-p-6 plasmo-rounded-lg plasmo-text-center">
            <div className="plasmo-text-4xl plasmo-mb-3">🔐</div>
            <p className="plasmo-text-gray-600">未找到匹配的权限</p>
          </div>
        ) : (
          filteredPermissions.map(app => {
            const riskInfo = getRiskLevelInfo(app.riskLevel)
            return (
              <div key={app.id} className="plasmo-bg-white plasmo-border plasmo-border-gray-200 plasmo-p-4 plasmo-rounded-lg">
                <div className="plasmo-flex plasmo-items-start plasmo-space-x-3">
                  {app.favicon && (
                    <img
                      src={app.favicon}
                      alt=""
                      className="plasmo-w-10 plasmo-h-10 plasmo-rounded plasmt-1"
                    />
                  )}
                  <div className="plasmo-flex-1">
                    <div className="plasmo-flex plasmo-items-center plasmo-justify-between plasmo-mb-3">
                      <div>
                        <h3 className="plasmo-font-semibold">{app.title}</h3>
                        <p className="plasmo-text-sm plasmo-text-gray-600">
                          {formatOrigin(app.origin)}
                        </p>
                      </div>
                      <div className="plasmo-flex plasmo-items-center plasmo-space-x-2">
                        <span className={`plasmo-px-2 plasmo-py-1 plasmo-bg-${riskInfo.color}-100 plasmo-text-${riskInfo.color}-700 plasmo-text-xs plasmo-rounded plasmo-flex plasmo-items-center plasmo-space-x-1`}>
                          <span>{riskInfo.icon}</span>
                          <span>{riskInfo.text}</span>
                        </span>
                        {app.isActive && (
                          <div className="plasmo-w-2 plasmo-h-2 plasmo-bg-green-500 plasmo-rounded-full"></div>
                        )}
                      </div>
                    </div>

                    <div className="plasmo-mb-3">
                      <div className="plasmo-flex plasmo-items-center plasmo-justify-between plasmo-mb-2">
                        <p className="plasmo-text-sm plasmo-font-medium">权限列表</p>
                        <p className="plasmo-text-xs plasmo-text-gray-500">
                          {app.permissions.filter(p => p.granted).length}/{app.permissions.length} 已授权
                        </p>
                      </div>

                      <div className="plasmo-space-y-1">
                        {app.permissions.map(permission => {
                          const categoryInfo = getCategoryInfo(permission.category)
                          return (
                            <div
                              key={permission.type}
                              className="plasmo-flex plasmo-items-center plasmo-justify-between plasmo-p-2 plasmo-bg-gray-50 plasmo-rounded"
                            >
                              <div className="plasmo-flex plasmo-items-center plasmo-space-x-2">
                                <span className="plasmo-text-sm">{categoryInfo.icon}</span>
                                <div>
                                  <p className="plasmo-text-sm plasmo-font-medium">
                                    {permission.name}
                                  </p>
                                  <p className="plasmo-text-xs plasmo-text-gray-500">
                                    {permission.description}
                                  </p>
                                </div>
                              </div>
                              <label className="plasmo-relative plasmo-inline-flex plasmo-items-center plasmo-cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={permission.granted}
                                  onChange={(e) => handleUpdatePermission(app.id, permission.type, e.target.checked)}
                                  className="plasmo-sr-only plasmo-peer"
                                />
                                <div className="plasmo-w-11 plasmo-h-6 plasmo-bg-gray-200 peer-focus:plasmo-outline-none peer-focus:plasmo-ring-4 peer-focus:plasmo-ring-blue-300 plasmo-rounded-full peer peer-checked:after:plasmo-translate-x-full peer-checked:after:plasmo-border-white after:plasmo-content-[''] after:plasmo-absolute after:plasmo-top-[2px] after:plasmo-left-[2px] after:plasmo-bg-white after:plasmo-border-gray-300 after:plasmo-border after:plasmo-rounded-full after:plasmo-h-5 after:plasmo-w-5 after:plasmo-transition-all peer-checked:plasmo-bg-blue-600"></div>
                              </label>
                            </div>
                          )
                        })}
                      </div>
                    </div>

                    <div className="plasmo-flex plasmo-items-center plasmo-justify-between plasmo-text-xs plasmo-text-gray-500 plasmo-mb-3">
                      <span>连接时间: {formatTime(app.connectedAt)}</span>
                      <span>最后使用: {formatTime(app.lastUsedAt)}</span>
                    </div>

                    <div className="plasmo-grid plasmo-grid-cols-2 plasmo-gap-2">
                      <button
                        onClick={() => {
                          setSelectedApp(app)
                          setShowEditModal(true)
                        }}
                        className="plasmo-bg-blue-100 plasmo-text-blue-700 plasmo-px-3 plasmo-py-2 plasmo-rounded plasmo-text-sm hover:plasmo-bg-blue-200 plasmo-transition-colors">
                        详细管理
                      </button>
                      <button
                        onClick={() => handleRevokeAllPermissions(app.id)}
                        className="plasmo-bg-red-100 plasmo-text-red-700 plasmo-px-3 plasmo-py-2 plasmo-rounded plasmo-text-sm hover:plasmo-bg-red-200 plasmo-transition-colors">
                        撤销所有权限
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* 详细权限管理模态框 */}
      {showEditModal && selectedApp && (
        <div className="plasmo-fixed plasmo-inset-0 plasmo-bg-black plasmo-bg-opacity-50 plasmo-flex plasmo-items-center plasmo-justify-center plasmo-p-4 plasmo-z-50">
          <div className="plasmo-bg-white plasmo-p-6 plasmo-rounded-lg plasmo-max-w-md plasmo-w-full plasmo-max-h-[80vh] plasmo-overflow-y-auto">
            <div className="plasmo-flex plasmo-items-center plasmo-space-x-3 plasmo-mb-4">
              {selectedApp.favicon && (
                <img
                  src={selectedApp.favicon}
                  alt=""
                  className="plasmo-w-8 plasmo-h-8 plasmo-rounded"
                />
              )}
              <div>
                <h3 className="plasmo-text-lg plasmo-font-bold">{selectedApp.title}</h3>
                <p className="plasmo-text-sm plasmo-text-gray-600">{formatOrigin(selectedApp.origin)}</p>
              </div>
            </div>

            <div className="plasmo-mb-6">
              <p className="plasmo-font-medium plasmo-mb-3">详细权限设置</p>
              <div className="plasmo-space-y-3">
                {Object.entries(PERMISSION_DESCRIPTIONS).map(([type, info]) => {
                  const categoryInfo = getCategoryInfo(info.category)
                  const hasPermission = selectedApp.permissions.some(p => p.type === type)
                  const currentPermission = selectedApp.permissions.find(p => p.type === type)

                  return (
                    <div key={type} className="plasmo-p-3 plasmo-border plasmo-border-gray-200 plasmo-rounded">
                      <div className="plasmo-flex plasmo-items-start plasmo-space-x-3">
                        <span className="plasmo-text-lg plasmo-mt-1">{categoryInfo.icon}</span>
                        <div className="plasmo-flex-1">
                          <div className="plasmo-flex plasmo-items-center plasmo-justify-between plasmo-mb-1">
                            <p className="plasmo-font-medium">{info.name}</p>
                            <label className="plasmo-relative plasmo-inline-flex plasmo-items-center plasmo-cursor-pointer">
                              <input
                                type="checkbox"
                                checked={currentPermission?.granted || false}
                                onChange={(e) => handleUpdatePermission(selectedApp.id, type, e.target.checked)}
                                className="plasmo-sr-only plasmo-peer"
                              />
                              <div className="plasmo-w-11 plasmo-h-6 plasmo-bg-gray-200 peer-focus:plasmo-outline-none peer-focus:plasmo-ring-4 peer-focus:plasmo-ring-blue-300 plasmo-rounded-full peer peer-checked:after:plasmo-translate-x-full peer-checked:after:plasmo-border-white after:plasmo-content-[''] after:plasmo-absolute after:plasmo-top-[2px] after:plasmo-left-[2px] after:plasmo-bg-white after:plasmo-border-gray-300 after:plasmo-border after:plasmo-rounded-full after:plasmo-h-5 after:plasmo-w-5 after:plasmo-transition-all peer-checked:plasmo-bg-blue-600"></div>
                            </label>
                          </div>
                          <p className="plasmo-text-sm plasmo-text-gray-600">{info.description}</p>
                          <p className="plasmo-text-xs plasmo-text-gray-500 plasmo-mt-1">
                            类别: {categoryInfo.text}
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="plasmo-grid plasmo-grid-cols-2 plasmo-gap-3">
              <button
                onClick={() => setShowEditModal(false)}
                className="plasmo-bg-gray-100 plasmo-text-gray-700 plasmo-px-4 plasmo-py-2 plasmo-rounded plasmo-text-sm hover:plasmo-bg-gray-200">
                取消
              </button>
              <button
                onClick={() => {
                  setShowEditModal(false)
                }}
                className="plasmo-bg-blue-600 plasmo-text-white plasmo-px-4 plasmo-py-2 plasmo-rounded plasmo-text-sm hover:plasmo-bg-blue-700">
                保存更改
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PermissionsPage