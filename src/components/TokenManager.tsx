import React, { useState } from 'react'
import { useBalanceStore } from '~store/BalanceStore'
import { useChainStore } from '~store/ChainStore'
import { useWalletStore } from '~store/WalletStore'
import { ethers } from 'ethers'
import { useSimpleToastContext } from '../contexts/SimpleToastContext'
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
  const balanceStore = useBalanceStore()
  const chainStore = useChainStore()
  const walletStore = useWalletStore()
  const { showSuccess, showError, showWarning } = useSimpleToastContext()

  // 获取当前钱包地址
  const currentAddress = walletStore.currentWallet?.address

  // 根据资产类型过滤代币
  const getFilteredTokens = () => {
    if (!walletStore.isUnlocked || !currentAddress) return []

    const tokens = balanceStore.getTokensByType(
      currentAddress,
      selectedAssetType === AssetType.ERC20 ? 'ERC20' :
      selectedAssetType === AssetType.ERC721 ? 'ERC721' : 'ERC1155'
    )

    return tokens.map((token, index) => ({
      ...token,
      id: `${token.contractAddress}-${index}`
    }))
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
      showError('无效的合约地址')
      return
    }

    setIsDetecting(true)
    try {
      const networkConfig = chainStore.getNetworkConfig(chainStore.currentChainId)
      if (!networkConfig) {
        throw new Error('网络配置未找到')
      }

      console.log(`📡 使用网络 RPC:`, networkConfig.rpcUrls[0])
      const provider = new ethers.JsonRpcProvider(networkConfig.rpcUrls[0])

      // 先检测代币类型
      let detectedType: 'ERC20' | 'ERC721' | 'ERC1155' = 'ERC20'
      try {
        console.log(`🔍 调用 balanceStore.detectTokenType...`)
        detectedType = await balanceStore.detectTokenType(newToken.address)
        console.log(`✅ 检测完成，代币类型: ${detectedType}`)
      } catch (error) {
        console.log(`❌ 检测失败，使用默认类型:`, error.message)
        // 如果检测失败，使用用户选择的类型
        detectedType = newToken.type || 'ERC20'
      }

      setNewToken(prev => ({
        ...prev,
        type: detectedType
      }))

      // 根据检测到的类型获取基本信息
      let contract: ethers.Contract
      let abi: string[]

      if (detectedType === 'ERC20') {
        abi = ERC20_ABI
      } else if (detectedType === 'ERC721') {
        abi = ERC721_ABI
      } else {
        abi = ERC721_ABI // ERC1155 使用类似的 ABI
      }

      contract = new ethers.Contract(newToken.address, abi, provider)

      const [name, symbol] = await Promise.all([
        contract.name().catch(() => `Unknown ${detectedType}`),
        contract.symbol().catch(() => "UNKNOWN")
      ])

      let decimals = 18
      if (detectedType === 'ERC20') {
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
        decimals,
        type: detectedType
      }))

      const typeName = detectedType === 'ERC20' ? '代币' : detectedType === 'ERC721' ? 'NFT' : '多代币'
      showSuccess(`${detectedType} ${typeName}信息检测成功: ${symbol} (${name})`)
    } catch (error) {
      console.error('Token detection error:', error)
      showWarning('检测失败: 无法获取代币信息，请手动填写')
    } finally {
      setIsDetecting(false)
    }
  }

  const handleAddToken = async () => {
    if (!newToken.address || !newToken.symbol || !newToken.name) {
      showWarning('请填写必填字段: 合约地址、符号和名称')
      return
    }

    if (!ethers.isAddress(newToken.address)) {
      showError('无效的合约地址')
      return
    }

    if (!currentAddress) {
      showWarning('请先选择钱包账户')
      return
    }

    try {
      // 使用 BalanceStore 的 fetchTokenBalance 方法，不传递类型让系统自动检测
      await balanceStore.fetchTokenBalance(currentAddress, newToken.address!)

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

      showSuccess(`代币添加成功: ${newToken.symbol}`)
    } catch (error) {
      console.error('添加代币失败:', error)
      showError('添加失败: 无法获取代币余额')
    }
  }

  const handleRemoveToken = async (address: string) => {
    try {
      console.log('移除代币:', address)
      // 这里需要在 BalanceStore 中添加移除代币的方法
      // 暂时使用清除所有余额的方法
      balanceStore.clearBalances()
      showSuccess('代币已移除')
    } catch (error) {
      console.error('移除代币失败:', error)
      showError('移除失败')
    }
  }

  const handleRefreshBalance = async (address: string) => {
    if (!currentAddress) {
      showWarning('请先选择钱包账户')
      return
    }

    try {
      // 获取代币类型信息，如果无法获取则使用默认的 ERC20
      const currentTokens = balanceStore.getBalanceByAddress(currentAddress)?.tokens || []
      const tokenType = currentTokens.find(token => token.contractAddress === address)?.type || 'ERC20'

      await balanceStore.fetchTokenBalance(currentAddress, address, tokenType)
      showSuccess(`${tokenType} 余额已刷新`)
    } catch (error) {
      console.error('刷新余额失败:', error)
      showError('刷新失败')
    }
  }

  // 测试函数 - 暴露到全局用于调试
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).testTokenDetection = async (address: string) => {
        console.log(`🧪 手动测试代币检测: ${address}`)
        try {
          const result = await balanceStore.detectTokenType(address)
          console.log(`✅ 检测结果: ${result}`)
          return result
        } catch (error) {
          console.error(`❌ 检测失败:`, error)
          return 'ERC20'
        }
      }
    }
  }, [])

  return (
    <div className="plasmo-p-4 plasmo-bg-white plasmo-rounded-lg plasmo-shadow-lg">
      <div className="plasmo-flex plasmo-items-center plasmo-justify-between plasmo-mb-6">
        <h2 className="plasmo-text-lg plasmo-font-semibold">代币管理</h2>
        <button
          onClick={() => setIsAddDialogOpen(true)}
          className="plasmo-bg-blue-600 plasmo-text-white plasmo-px-4 plasmo-py-2 plasmo-rounded-lg plasmo-text-sm hover:plasmo-bg-blue-700 plasmo-transition-colors">
          ➕ 添加代币
        </button>
      </div>

      {/* 资产分类组件 */}
      <div style={{ marginBottom: '20px' }}>
        <AssetCategoryTabs
          selectedAssetType={selectedAssetType}
          selectedPriceTab={selectedPriceTab}
          onAssetTypeChange={setSelectedAssetType}
          onPriceTabChange={setSelectedPriceTab}
          showPriceTabs={true}
          assetCounts={currentAddress ? balanceStore.getTokenStats(currentAddress) : { erc20: 0, erc721: 0, erc1155: 0 }}
        />
      </div>

      {/* 当前过滤状态 */}
      <div style={{
        backgroundColor: '#fef3c7',
        borderRadius: '8px',
        padding: '12px',
        marginBottom: '20px',
        fontSize: '13px',
        color: '#92400e'
      }}>
        <div style={{ fontWeight: '600', marginBottom: '4px' }}>
          当前管理: {selectedAssetType === AssetType.ERC20 ? 'ERC20 代币' : selectedAssetType === AssetType.ERC721 ? 'ERC721 NFT' : 'ERC1155 代币'}
        </div>
        <div>
          {selectedAssetType === AssetType.ERC20 && '管理同质化代币，支持余额查询和价格跟踪'}
          {selectedAssetType === AssetType.ERC721 && `管理 NFT 收藏品，按 ${selectedPriceTab === 'floor_price' ? '地板价' : 'collection'} 显示`}
          {selectedAssetType === AssetType.ERC1155 && '管理多代币标准合约，支持多种代币类型'}
        </div>
      </div>

      {getFilteredTokens().length === 0 ? (
        <div className="plasmo-text-center plasmo-py-8">
          <div className="plasmo-text-6xl plasmo-mb-4">🪙</div>
          <h3 className="plasmo-text-lg plasmo-font-medium plasmo-mb-2">暂无代币</h3>
          <p className="plasmo-text-gray-600 plasmo-mb-4">
            添加ERC-20、ERC-721或ERC-1155代币来管理您的资产
          </p>
          <button
            onClick={() => setIsAddDialogOpen(true)}
            className="plasmo-bg-blue-600 plasmo-text-white plasmo-px-4 plasmo-py-2 plasmo-rounded-lg hover:plasmo-bg-blue-700 plasmo-transition-colors">
            添加第一个代币
          </button>
        </div>
      ) : (
        <div className="plasmo-space-y-3">
          {getFilteredTokens().map((token, index) => (
            <div
              key={`${token.contractAddress}-${index}`}
              className="plasmo-border plasmo-border-gray-200 plasmo-p-4 plasmo-rounded-lg"
            >
              <div className="plasmo-flex plasmo-items-center plasmo-justify-between">
                <div className="plasmo-flex plasmo-items-center plasmo-space-x-3">
                  <div className="plasmo-w-10 plasmo-h-10 plasmo-bg-blue-500 plasmo-rounded-full plasmo-flex plasmo-items-center plasmo-justify-center">
                    <span className="plasmo-text-xs plasmo-font-bold plasmo-text-white">
                      {token.symbol.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <div className="plasmo-font-medium">{token.symbol}</div>
                    <div className="plasmo-text-sm plasmo-text-gray-600">{token.name}</div>
                  </div>
                </div>

                <div className="plasmo-flex plasmo-items-center plasmo-space-x-2">
                  <div className="plasmo-text-right">
                    <div className="plasmo-font-medium">
                      {token.formattedBalance || '0'}
                    </div>
                    <div className="plasmo-text-sm plasmo-text-gray-600">
                      {token.name.includes('NFT') ? 'ERC-721' : 'ERC-20'}
                    </div>
                  </div>

                  <button
                    onClick={() => handleRefreshBalance(token.contractAddress)}
                    className="plasmo-p-2 plasmo-rounded-full plasmo-hover:bg-gray-100"
                    title="刷新余额"
                  >
                    🔄
                  </button>

                  <button
                    onClick={() => handleRemoveToken(token.contractAddress)}
                    className="plasmo-p-2 plasmo-rounded-full plasmo-hover:bg-red-50"
                    title="删除代币"
                  >
                    🗑️
                  </button>
                </div>
              </div>

              <div className="plasmo-mt-2 plasmo-text-xs plasmo-text-gray-500 plasmo-font-mono">
                {token.contractAddress}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 添加代币对话框 */}
      {isAddDialogOpen && (
        <div className="plasmo-fixed plasmo-inset-0 plasmo-flex plasmo-items-center plasmo-justify-center plasmo-z-50 plasmo-modal-backdrop">
          <div className="plasmo-bg-white plasmo-p-6 plasmo-rounded-lg plasmo-m-4 plasmo-max-w-md plasmo-w-full">
            <h3 className="plasmo-text-lg plasmo-font-bold plasmo-mb-4">添加自定义代币</h3>

            <div className="plasmo-space-y-4">
              <div>
                <label className="plasmo-block plasmo-text-sm plasmo-font-medium plasmo-mb-2">
                  代币类型
                </label>
                <select
                  value={newToken.type}
                  onChange={(e) => setNewToken({ ...newToken, type: e.target.value as any })}
                  className="plasmo-w-full plasmo-border plasmo-border-gray-300 plasmo-rounded-lg plasmo-px-3 plasmo-py-2"
                >
                  <option value="ERC20">ERC-20 代币</option>
                  <option value="ERC721">ERC-721 NFT</option>
                  <option value="ERC1155">ERC-1155</option>
                </select>
              </div>

              <div>
                <label className="plasmo-block plasmo-text-sm plasmo-font-medium plasmo-mb-2">
                  合约地址 *
                </label>
                <div className="plasmo-flex plasmo-gap-2">
                  <input
                    type="text"
                    value={newToken.address}
                    onChange={(e) => setNewToken({ ...newToken, address: e.target.value })}
                    placeholder="0x..."
                    className="plasmo-flex-1 plasmo-border plasmo-border-gray-300 plasmo-rounded-lg plasmo-px-3 plasmo-py-2"
                  />
                  <button
                    type="button"
                    onClick={detectTokenInfo}
                    disabled={isDetecting || !newToken.address}
                    className="plasmo-bg-gray-200 plasmo-text-gray-800 plasmo-px-3 plasmo-py-2 plasmo-rounded-lg plasmo-text-sm hover:plasmo-bg-gray-300 disabled:plasmo-opacity-50"
                  >
                    {isDetecting ? '检测中...' : '检测'}
                  </button>
                </div>
              </div>

              <div>
                <label className="plasmo-block plasmo-text-sm plasmo-font-medium plasmo-mb-2">
                  代币符号 *
                </label>
                <input
                  type="text"
                  value={newToken.symbol}
                  onChange={(e) => setNewToken({ ...newToken, symbol: e.target.value })}
                  placeholder="USDT"
                  className="plasmo-w-full plasmo-border plasmo-border-gray-300 plasmo-rounded-lg plasmo-px-3 plasmo-py-2"
                />
              </div>

              <div>
                <label className="plasmo-block plasmo-text-sm plasmo-font-medium plasmo-mb-2">
                  代币名称 *
                </label>
                <input
                  type="text"
                  value={newToken.name}
                  onChange={(e) => setNewToken({ ...newToken, name: e.target.value })}
                  placeholder="Tether USD"
                  className="plasmo-w-full plasmo-border plasmo-border-gray-300 plasmo-rounded-lg plasmo-px-3 plasmo-py-2"
                />
              </div>

              {newToken.type === 'ERC20' && (
                <div>
                  <label className="plasmo-block plasmo-text-sm plasmo-font-medium plasmo-mb-2">
                    小数位数
                  </label>
                  <input
                    type="number"
                    value={newToken.decimals || ''}
                    onChange={(e) => setNewToken({ ...newToken, decimals: parseInt(e.target.value) || 18 })}
                    placeholder="18"
                    className="plasmo-w-full plasmo-border plasmo-border-gray-300 plasmo-rounded-lg plasmo-px-3 plasmo-py-2"
                  />
                </div>
              )}

              {newToken.type === 'ERC721' && (
                <div>
                  <label className="plasmo-block plasmo-text-sm plasmo-font-medium plasmo-mb-2">
                    Token ID (可选)
                  </label>
                  <input
                    type="text"
                    value={newToken.tokenId}
                    onChange={(e) => setNewToken({ ...newToken, tokenId: e.target.value })}
                    placeholder="1"
                    className="plasmo-w-full plasmo-border plasmo-border-gray-300 plasmo-rounded-lg plasmo-px-3 plasmo-py-2"
                  />
                </div>
              )}

              <div>
                <label className="plasmo-block plasmo-text-sm plasmo-font-medium plasmo-mb-2">
                  图标URL (可选)
                </label>
                <input
                  type="url"
                  value={newToken.image}
                  onChange={(e) => setNewToken({ ...newToken, image: e.target.value })}
                  placeholder="https://..."
                  className="plasmo-w-full plasmo-border plasmo-border-gray-300 plasmo-rounded-lg plasmo-px-3 plasmo-py-2"
                />
              </div>

              <button
                onClick={handleAddToken}
                className="plasmo-w-full plasmo-bg-blue-600 plasmo-text-white plasmo-px-4 plasmo-py-2 plasmo-rounded-lg hover:plasmo-bg-blue-700 plasmo-transition-colors"
              >
                🪙 添加代币
              </button>
            </div>

            <div className="plasmo-flex plasmo-justify-end plasmo-mt-4">
              <button
                onClick={() => setIsAddDialogOpen(false)}
                className="plasmo-bg-gray-200 plasmo-text-gray-800 plasmo-px-4 plasmo-py-2 plasmo-rounded-lg hover:plasmo-bg-gray-300"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="plasmo-mt-6 plasmo-text-sm plasmo-text-gray-600">
        <p>• 支持 ERC-20、ERC-721 和 ERC-1155 标准</p>
        <p>• 请确保合约地址在当前网络上有效</p>
        <p>• 添加代币前建议先使用"检测"功能自动获取信息</p>
      </div>
    </div>
  )
}

export default TokenManager