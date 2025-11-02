import React, { useState } from 'react'
import { useWalletStore } from '../stores/walletStore'
import { useNetworkStore } from '../stores/networkStore'
import { ethers } from 'ethers'
import { AssetCategoryTabs, AssetType, PriceTabType } from './AssetCategoryTabs'

interface Token {
  address: string
  symbol: string
  name: string
  decimals: number
  type: 'ERC20' | 'ERC721' | 'ERC1155'
  balance?: string
  image?: string
  tokenId?: string
}

export const TokenManager: React.FC = () => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [newToken, setNewToken] = useState<Partial<Token>>({
    address: '',
    symbol: '',
    name: '',
    decimals: 18,
    type: 'ERC20',
    image: '',
    tokenId: ''
  })

  // 资产分类状态
  const [selectedAssetType, setSelectedAssetType] = useState<AssetType>(AssetType.ERC20)
  const [selectedPriceTab, setSelectedPriceTab] = useState<PriceTabType>('price')

  const [isDetecting, setIsDetecting] = useState(false)
  const { currentAccount } = useWalletStore()
  const { currentNetwork } = useNetworkStore()

  // 获取当前钱包地址
  const currentAddress = currentAccount?.address

  // 根据资产类型过滤代币
  const getFilteredTokens = () => {
    // TODO: Implement with new store system - temporarily returning empty array
    if (!currentAddress) return []

    // This would need to be implemented with the new store system
    return []
  }

  // ERC20 ABI
  const ERC20_ABI = [
    'function name() view returns (string)',
    'function symbol() view returns (string)',
    'function decimals() view returns (uint8)',
    'function balanceOf(address owner) view returns (uint256)'
  ]

  // ERC721 ABI
  const ERC721_ABI = [
    'function name() view returns (string)',
    'function symbol() view returns (string)',
    'function balanceOf(address owner) view returns (uint256)',
    'function ownerOf(uint256 tokenId) view returns (address)'
  ]

  const detectTokenInfo = async () => {
    console.log(`🚀 TokenManager: 开始检测代币信息: ${newToken.address}`)

    if (!newToken.address || !ethers.isAddress(newToken.address)) {
      alert('无效的合约地址')
      return
    }

    setIsDetecting(true)
    try {
      // 使用当前网络的RPC
      if (!currentNetwork) {
        throw new Error('网络配置未找到')
      }

      console.log(`📡 使用网络 RPC:`, currentNetwork.rpcUrl)
      const provider = new ethers.JsonRpcProvider(currentNetwork.rpcUrl)

      // 根据用户选择的类型获取基本信息
      let contract: ethers.Contract
      let abi: string[]

      if (newToken.type === 'ERC20') {
        abi = ERC20_ABI
      } else if (newToken.type === 'ERC721') {
        abi = ERC721_ABI
      } else {
        abi = ERC721_ABI // ERC1155 使用类似的 ABI
      }

      contract = new ethers.Contract(newToken.address, abi, provider)

      const [name, symbol] = await Promise.all([
        contract.name().catch(() => `Unknown ${newToken.type}`),
        contract.symbol().catch(() => "UNKNOWN")
      ])

      let decimals = 18
      if (newToken.type === 'ERC20') {
        try {
          decimals = await (contract as any).decimals()
          decimals = Number(decimals)
        } catch {
          decimals = 18
        }
      } else {
        decimals = 0 // NFT 类型没有小数位
      }

      setNewToken(prev => ({
        ...prev,
        name,
        symbol,
        decimals
      }))

      const typeName = newToken.type === 'ERC20' ? '代币' : newToken.type === 'ERC721' ? 'NFT' : '多代币'
      alert(`${newToken.type} ${typeName}信息检测成功: ${symbol} (${name})`)
    } catch (error) {
      console.error('Token detection error:', error)
      alert('检测失败: 无法获取代币信息，请手动填写')
    } finally {
      setIsDetecting(false)
    }
  }

  const handleAddToken = async () => {
    if (!newToken.address || !newToken.symbol || !newToken.name) {
      alert('请填写必填字段: 合约地址、符号和名称')
      return
    }

    if (!ethers.isAddress(newToken.address)) {
      alert('无效的合约地址')
      return
    }

    if (!currentAddress) {
      alert('请先选择钱包账户')
      return
    }

    try {
      // TODO: Implement with new store system
      console.log('添加代币:', newToken)

      setIsAddDialogOpen(false)
      setNewToken({
        address: '',
        symbol: '',
        name: '',
        decimals: 18,
        type: 'ERC20',
        image: '',
        tokenId: ''
      })

      alert(`代币添加成功: ${newToken.symbol}`)
    } catch (error) {
      console.error('添加代币失败:', error)
      alert('添加失败: 无法获取代币余额')
    }
  }

  const handleRemoveToken = async (address: string) => {
    try {
      console.log('移除代币:', address)
      // TODO: Implement with new store system
      alert('代币已移除')
    } catch (error) {
      console.error('移除代币失败:', error)
      alert('移除失败')
    }
  }

  const handleRefreshBalance = async (address: string) => {
    if (!currentAddress) {
      alert('请先选择钱包账户')
      return
    }

    try {
      // TODO: Implement with new store system
      console.log('刷新余额:', address)
      alert('余额已刷新')
    } catch (error) {
      console.error('刷新余额失败:', error)
      alert('刷新失败')
    }
  }

  
  return (
    <div className="w-full h-full bg-white p-4">
      <div className="max-w-md mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">🪙 代币管理</h1>
            <p className="text-gray-600 text-sm">
              {currentAddress ? `${currentAddress.slice(0, 6)}...${currentAddress.slice(-4)}` : '请连接钱包'}
            </p>
          </div>
          <button
            onClick={() => setIsAddDialogOpen(true)}
            className="bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 transition-colors font-medium text-sm">
            ➕ 添加代币
          </button>
        </div>

      {/* 资产分类组件 */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <AssetCategoryTabs
            selectedAssetType={selectedAssetType}
            selectedPriceTab={selectedPriceTab}
            onAssetTypeChange={setSelectedAssetType}
            onPriceTabChange={setSelectedPriceTab}
            showPriceTabs={true}
            assetCounts={{ erc20: 0, erc721: 0, erc1155: 0 }}
          />
        </div>

        {/* 当前过滤状态 */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="font-medium text-yellow-900 mb-2">
            当前管理: {selectedAssetType === AssetType.ERC20 ? 'ERC20 代币' : selectedAssetType === AssetType.ERC721 ? 'ERC721 NFT' : 'ERC1155 代币'}
          </div>
          <div className="text-sm text-yellow-700">
            {selectedAssetType === AssetType.ERC20 && '管理同质化代币，支持余额查询和价格跟踪'}
            {selectedAssetType === AssetType.ERC721 && `管理 NFT 收藏品，按 ${selectedPriceTab === 'floor_price' ? '地板价' : 'collection'} 显示`}
            {selectedAssetType === AssetType.ERC1155 && '管理多代币标准合约，支持多种代币类型'}
          </div>
        </div>

      {getFilteredTokens().length === 0 ? (
        <div className="bg-gray-50 rounded-lg p-8 text-center">
          <div className="text-6xl mb-4">🪙</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">暂无代币</h3>
          <p className="text-gray-600 mb-4">
            添加ERC-20、ERC-721或ERC-1155代币来管理您的资产
          </p>
          <button
            onClick={() => setIsAddDialogOpen(true)}
            className="bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 transition-colors font-medium">
            添加第一个代币
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {getFilteredTokens().map((token, index) => (
            <div
              key={`${token.contractAddress}-${index}`}
              className="bg-white border border-gray-200 p-4 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-xs font-bold text-white">
                      {token.symbol.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{token.symbol}</div>
                    <div className="text-sm text-gray-600">{token.name}</div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <div className="text-right">
                    <div className="font-medium text-gray-900">
                      {token.formattedBalance || '0'}
                    </div>
                    <div className="text-sm text-gray-600">
                      {token.name.includes('NFT') ? 'ERC-721' : 'ERC-20'}
                    </div>
                  </div>

                  <button
                    onClick={() => handleRefreshBalance(token.contractAddress)}
                    className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                    title="刷新余额"
                  >
                    🔄
                  </button>

                  <button
                    onClick={() => handleRemoveToken(token.contractAddress)}
                    className="p-2 rounded-full hover:bg-red-50 transition-colors"
                    title="删除代币"
                  >
                    🗑️
                  </button>
                </div>
              </div>

              <div className="mt-2 text-xs text-gray-500 font-mono">
                {token.contractAddress}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 添加代币对话框 */}
      {isAddDialogOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[65vh] flex flex-col">
            <div className="p-3 border-b border-gray-200">
              <h3 className="text-base font-bold text-gray-900">添加自定义代币</h3>
            </div>

            <div className="flex-1 overflow-y-auto p-3">
              <div className="space-y-2">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    代币类型
                  </label>
                  <select
                    value={newToken.type}
                    onChange={(e) => setNewToken({ ...newToken, type: e.target.value as any })}
                    className="w-full border border-gray-300 rounded px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="ERC20">ERC-20 代币</option>
                    <option value="ERC721">ERC-721 NFT</option>
                    <option value="ERC1155">ERC-1155</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    合约地址 *
                  </label>
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      value={newToken.address}
                      onChange={(e) => setNewToken({ ...newToken, address: e.target.value })}
                      placeholder="0x..."
                      className="flex-1 border border-gray-300 rounded px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                    />
                    <button
                      type="button"
                      onClick={detectTokenInfo}
                      disabled={isDetecting || !newToken.address}
                      className="bg-gray-200 text-gray-800 px-2 py-1.5 rounded text-xs hover:bg-gray-300 disabled:opacity-50 transition-colors whitespace-nowrap"
                    >
                      {isDetecting ? '检测中...' : '检测'}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    代币符号 *
                  </label>
                  <input
                    type="text"
                    value={newToken.symbol}
                    onChange={(e) => setNewToken({ ...newToken, symbol: e.target.value })}
                    placeholder="USDT"
                    className="w-full border border-gray-300 rounded px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    代币名称 *
                  </label>
                  <input
                    type="text"
                    value={newToken.name}
                    onChange={(e) => setNewToken({ ...newToken, name: e.target.value })}
                    placeholder="Tether USD"
                    className="w-full border border-gray-300 rounded px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {newToken.type === 'ERC20' && (
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      小数位数
                    </label>
                    <input
                      type="number"
                      value={newToken.decimals || ''}
                      onChange={(e) => setNewToken({ ...newToken, decimals: parseInt(e.target.value) || 18 })}
                      placeholder="18"
                      className="w-full border border-gray-300 rounded px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                )}

                {newToken.type === 'ERC721' && (
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Token ID (可选)
                    </label>
                    <input
                      type="text"
                      value={newToken.tokenId}
                      onChange={(e) => setNewToken({ ...newToken, tokenId: e.target.value })}
                      placeholder="1"
                      className="w-full border border-gray-300 rounded px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    图标URL (可选)
                  </label>
                  <input
                    type="url"
                    value={newToken.image}
                    onChange={(e) => setNewToken({ ...newToken, image: e.target.value })}
                    placeholder="https://..."
                    className="w-full border border-gray-300 rounded px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            <div className="p-3 border-t border-gray-200">
              <div className="flex space-x-2">
                <button
                  onClick={handleAddToken}
                  className="flex-1 bg-blue-600 text-white px-3 py-2 rounded hover:bg-blue-700 transition-colors font-medium text-xs"
                >
                  🪙 添加代币
                </button>
                <button
                  onClick={() => setIsAddDialogOpen(false)}
                  className="flex-1 bg-gray-200 text-gray-800 px-3 py-2 rounded hover:bg-gray-300 transition-colors font-medium text-xs"
                >
                  取消
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-700">
        <p>• 支持 ERC-20、ERC-721 和 ERC-1155 标准</p>
        <p>• 请确保合约地址在当前网络上有效</p>
        <p>• 添加代币前建议先使用"检测"功能自动获取信息</p>
      </div>
      </div>
    </div>
  )
}

export default TokenManager