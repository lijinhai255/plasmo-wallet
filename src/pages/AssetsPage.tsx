import React, { useState, useEffect } from "react"
import { useBalanceStore } from "../../store/BalanceStore"
import { useWalletStore } from "../../store/WalletStore"
import { useChainStore } from "../../store/ChainStore"
import { AssetCategoryTabs, AssetType, PriceTabType } from "../components/AssetCategoryTabs"

interface Asset {
  id: string
  symbol: string
  name: string
  balance: string
  value: number
  change24h: string
  icon: string
  contractAddress?: string
}

export const AssetsPage = () => {
  const balanceStore = useBalanceStore()
  const walletStore = useWalletStore()
  const chainStore = useChainStore()

  // 资产分类状态
  const [selectedAssetType, setSelectedAssetType] = useState<AssetType>(AssetType.ERC20)
  const [selectedPriceTab, setSelectedPriceTab] = useState<PriceTabType>('price')

  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // 根据资产类型获取过滤后的资产
  const getFilteredAssets = () => {
    if (!walletStore.isUnlocked || !currentAddress) return []

    const tokens = balanceStore.getTokensByType(
      currentAddress,
      selectedAssetType === AssetType.ERC20 ? 'ERC20' :
      selectedAssetType === AssetType.ERC721 ? 'ERC721' : 'ERC1155'
    )

    // 转换为 Asset 格式
    return tokens.map((token, index) => ({
      id: `${token.contractAddress}-${index}`,
      symbol: token.symbol,
      name: token.name,
      balance: token.formattedBalance,
      value: calculateTokenValue(token),
      change24h: '+0.00%', // TODO: 从价格API获取
      icon: getTokenIcon(token.type),
      contractAddress: token.contractAddress
    }))
  }

  // 计算代币价值 (简化版)
  const calculateTokenValue = (token: any) => {
    const balance = parseFloat(token.formattedBalance) || 0

    // 简单的价值计算，实际应该从价格API获取
    switch (token.type) {
      case 'ERC20':
        return balance * 1.5 // 假设每个ERC20代币价值1.5美元
      case 'ERC721':
        return 100 // 假设每个NFT价值100美元
      case 'ERC1155':
        return balance * 5 // 假设每个ERC1155代币价值5美元
      default:
        return 0
    }
  }

  // 获取代币图标
  const getTokenIcon = (type: string) => {
    switch (type) {
      case 'ERC20': return '🪙'
      case 'ERC721': return '🖼️'
      case 'ERC1155': return '🎮'
      default: return '❓'
    }
  }

  // 获取代币统计
  const getTokenStats = () => {
    if (!walletStore.isUnlocked || !currentAddress) {
      return { erc20: 0, erc721: 0, erc1155: 0 }
    }

    return balanceStore.getTokenStats(currentAddress)
  }

  // 获取当前钱包地址
  const currentAddress = walletStore.currentWallet?.address

  useEffect(() => {
    // 🆕 页面加载时初始化钱包
    const initWallet = async () => {
      if (!walletStore.isInitialized) {
        await walletStore.initializeWallet()
      }
    }
    initWallet()
  }, [])

  useEffect(() => {
    // 当钱包连接或改变时，自动刷新余额
    if (currentAddress && walletStore.isUnlocked) {
      refreshAssets()
    }
  }, [currentAddress, walletStore.isUnlocked])

  // 将余额数据转换为资产列表
  const convertToAssets = (balanceData?: any): Asset[] => {
    if (!balanceData || !walletStore.isUnlocked) {
      return []
    }

    const assets: Asset[] = []
    const currentNetwork = chainStore.getNetworkConfig(chainStore.currentChainId)

    // 添加 ETH 资产
    if (balanceData.formattedEthBalance && parseFloat(balanceData.formattedEthBalance) > 0) {
      assets.push({
        id: "eth",
        symbol: currentNetwork?.nativeCurrency.symbol || "ETH",
        name: currentNetwork?.nativeCurrency.name || "Ethereum",
        balance: balanceData.formattedEthBalance,
        value: balanceData.ethValueUSD || 0,
        change24h: "+2.5%", // 模拟数据，后续可以接入真实价格 API
        icon: currentNetwork?.icon || "🔷"
      })
    }

    // 添加代币资产
    balanceData.tokens?.forEach((token: any) => {
      if (parseFloat(token.formattedBalance) > 0) {
        assets.push({
          id: token.contractAddress,
          symbol: token.symbol,
          name: token.name,
          balance: token.formattedBalance,
          value: token.valueUSD || 0,
          change24h: "+1.2%", // 模拟数据
          icon: "🪙",
          contractAddress: token.contractAddress
        })
      }
    })

    return assets
  }

  // 刷新资产数据
  const refreshAssets = async () => {
    if (!currentAddress || !walletStore.isUnlocked) return

    setIsRefreshing(true)
    try {
      await balanceStore.refreshBalance(currentAddress)
    } catch (error) {
      console.error("刷新资产失败:", error)
    } finally {
      setIsRefreshing(false)
    }
  }

  // 获取当前余额数据（避免在渲染期间调用 store 方法）
  const currentBalance = currentAddress ? balanceStore.balances[currentAddress] : undefined
  const assets = convertToAssets(currentBalance)

  // 格式化余额显示
  const formatBalance = (balance: string) => {
    const num = parseFloat(balance)
    if (num >= 1000000) {
      return (num / 1000000).toFixed(2) + "M"
    } else if (num >= 1000) {
      return (num / 1000).toFixed(2) + "K"
    }
    return num.toFixed(4)
  }

  // 格式化价值显示
  const formatValue = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value)
  }

  // 获取涨跌颜色
  const getChangeColor = (change: string) => {
    return change.startsWith("+") ? "text-green-600" : "text-red-600"
  }

  // 移除资产（仅用于UI显示，实际数据来自余额查询）
  const removeAsset = (assetId: string) => {
    setSelectedAsset(null)
    // 注意：这里不实际删除数据，因为资产数据来自余额查询
  }

  return (
    <div className="plasmo-p-4 plasmo-bg-white plasmo-rounded-lg plasmo-shadow-lg">
      {/* 头部 */}
      <div className="plasmo-flex plasmo-items-center plasmo-justify-between plasmo-mb-6">
        <div>
          <h1 className="plasmo-text-2xl plasmo-font-bold">💰 我的资产</h1>
          <p className="plasmo-text-gray-600 plasmo-text-sm">
            {walletStore.isUnlocked && currentAddress
              ? `${currentAddress.slice(0, 6)}...${currentAddress.slice(-4)}`
              : "请先连接钱包"
            }
          </p>
        </div>

        {/* 刷新按钮 */}
        <button
          onClick={refreshAssets}
          disabled={isRefreshing || !walletStore.isUnlocked}
          className="plasmo-p-2 plasmo-rounded-full plasmo-hover:bg-gray-100 plasmo-disabled:opacity-50"
          title="刷新资产"
        >
          <svg
            className={`plasmo-w-5 plasmo-h-5 ${isRefreshing ? 'plasmo-animate-spin' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>

      {/* 总价值卡片 */}
      <div className="plasmo-bg-gradient-to-r plasmo-from-green-500 plasmo-to-emerald-600 plasmo-p-6 plasmo-rounded-lg plasmo-text-white plasmo-mb-6">
        <div className="plasmo-text-center">
          <p className="plasmo-text-sm plasmo-opacity-80 plasmo-mb-1">总资产价值 (USD)</p>
          <p className="plasmo-text-3xl plasmo-font-bold">{formatValue(assets.reduce((sum, asset) => sum + asset.value, 0))}</p>
          <p className="plasmo-text-sm plasmo-opacity-80 plasmo-mt-2">
            共 {assets.length} 种资产 • {chainStore.getNetworkConfig(chainStore.currentChainId)?.chainName || "未知网络"}
          </p>
        </div>
      </div>

      {/* 资产分类组件 */}
      <div style={{ marginBottom: '20px' }}>
        <AssetCategoryTabs
          selectedAssetType={selectedAssetType}
          selectedPriceTab={selectedPriceTab}
          onAssetTypeChange={setSelectedAssetType}
          onPriceTabChange={setSelectedPriceTab}
          showPriceTabs={true}
          assetCounts={getTokenStats()}
        />
      </div>

      {/* 资产类型过滤说明 */}
      <div style={{
        backgroundColor: '#f0f9ff',
        borderRadius: '8px',
        padding: '12px',
        marginBottom: '20px',
        fontSize: '13px',
        color: '#0369a1'
      }}>
        <div style={{ fontWeight: '600', marginBottom: '4px' }}>
          当前显示: {selectedAssetType === AssetType.ERC20 ? 'ERC20 代币' : selectedAssetType === AssetType.ERC721 ? 'ERC721 NFT' : 'ERC1155 代币'}
        </div>
        <div>
          找到 {getFilteredAssets().length} 个 {selectedAssetType === AssetType.ERC20 ? '代币' : selectedAssetType === AssetType.ERC721 ? 'NFT' : '多代币'}
          {selectedAssetType === AssetType.ERC20 && ' • 显示所有同质化代币，按价格排序'}
          {selectedAssetType === AssetType.ERC721 && ` • 显示所有 NFT 收藏品，按 ${selectedPriceTab === 'floor_price' ? '地板价' : 'collection'} 排序`}
          {selectedAssetType === AssetType.ERC1155 && ' • 显示所有半同质化代币，支持多种类型'}
        </div>
      </div>

      {/* 错误提示 */}
      {balanceStore.error && (
        <div className="plasmo-bg-red-50 plasmo-border plasmo-border-red-200 plasmo-p-3 plasmo-rounded-lg plasmo-mb-4">
          <div className="plasmo-flex plasmo-items-center plasmo-justify-between">
            <p className="plasmo-text-sm plasmo-text-red-800">
              ❌ {balanceStore.error}
            </p>
            <button
              onClick={() => balanceStore.clearError()}
              className="plasmo-text-red-600 hover:plasmo-text-red-800 plasmo-text-sm"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* 未连接钱包提示 */}
      {!walletStore.isUnlocked && (
        <div className="plasmo-bg-yellow-50 plasmo-border plasmo-border-yellow-200 plasmo-p-6 plasmo-rounded-lg plasmo-mb-6 plasmo-text-center">
          <div className="plasmo-text-4xl plasmo-mb-2">🔐</div>
          <h3 className="plasmo-text-lg plasmo-font-semibold plasmo-mb-2">钱包未连接</h3>
          <p className="plasmo-text-gray-600 plasmo-text-sm">
            请先到钱包页面创建或导入钱包并解锁
          </p>
        </div>
      )}

      {/* 资产列表 */}
      {walletStore.isUnlocked && (
        <>
          {getFilteredAssets().length === 0 && !balanceStore.isLoading ? (
            <div className="plasmo-bg-gray-50 plasmo-p-8 plasmo-rounded-lg plasmo-text-center plasmo-mb-6">
              <div className="plasmo-text-4xl plasmo-mb-2">
                {selectedAssetType === AssetType.ERC20 && '🪙'}
                {selectedAssetType === AssetType.ERC721 && '🖼️'}
                {selectedAssetType === AssetType.ERC1155 && '🎮'}
              </div>
              <h3 className="plasmo-text-lg plasmo-font-semibold plasmo-mb-2">暂无{selectedAssetType === AssetType.ERC20 ? '代币' : selectedAssetType === AssetType.ERC721 ? 'NFT' : '多代币'}</h3>
              <p className="plasmo-text-gray-600 plasmo-text-sm plasmo-mb-4">
                您的当前地址没有任何 {selectedAssetType === AssetType.ERC20 ? 'ERC20 代币' : selectedAssetType === AssetType.ERC721 ? 'ERC721 NFT' : 'ERC1155 代币'}
              </p>
              <button
                onClick={refreshAssets}
                className="plasmo-bg-blue-600 plasmo-text-white plasmo-px-4 plasmo-py-2 plasmo-rounded-lg plasmo-text-sm hover:plasmo-bg-blue-700 plasmo-transition-colors"
              >
                重新扫描
              </button>
            </div>
          ) : (
            <div className="plasmo-space-y-3 plasmo-mb-6">
              {getFilteredAssets().map((asset) => (
                <div
                  key={asset.id}
                  onClick={() => setSelectedAsset(asset)}
                  className="plasmo-bg-gray-50 plasmo-p-4 plasmo-rounded-lg plasmo-cursor-pointer hover:plasmo-bg-gray-100 plasmo-transition-colors"
                >
                  <div className="plasmo-flex plasmo-items-center plasmo-justify-between">
                    <div className="plasmo-flex plasmo-items-center plasmo-space-x-3">
                      <div className="plasmo-text-2xl">{asset.icon}</div>
                      <div>
                        <p className="plasmo-font-medium">{asset.symbol}</p>
                        <p className="plasmo-text-sm plasmo-text-gray-600">{asset.name}</p>
                      </div>
                    </div>
                    <div className="plasmo-text-right">
                      <p className="plasmo-font-medium">{formatValue(asset.value)}</p>
                      <p className={`plasmo-text-sm ${getChangeColor(asset.change24h)}`}>
                        {asset.change24h}
                      </p>
                    </div>
                  </div>
                  <div className="plasmo-mt-2 plasmo-pt-2 plasmo-border-t plasmo-border-gray-200">
                    <p className="plasmo-text-sm plasmo-text-gray-600">
                      余额: {formatBalance(asset.balance)} {asset.symbol}
                    </p>
                    {asset.contractAddress && (
                      <p className="plasmo-text-xs plasmo-text-gray-500 plasmo-mt-1">
                        合约: {asset.contractAddress.slice(0, 8)}...{asset.contractAddress.slice(-6)}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 加载状态 */}
          {balanceStore.isLoading && (
            <div className="plasmo-text-center plasmo-py-8">
              <div className="plasmo-inline-flex plasmo-items-center plasmo-space-x-2">
                <div className="plasmo-w-6 plasmo-h-6 plasmo-border-2 plasmo-border-blue-600 plasmo-border-t-transparent plasmo-rounded-full plasmo-animate-spin"></div>
                <span className="plasmo-text-sm plasmo-text-gray-600">正在查询资产...</span>
              </div>
            </div>
          )}
        </>
      )}

      {/* 操作按钮 */}
      <div className="plasmo-flex plasmo-space-x-3">
        <button
          onClick={refreshAssets}
          disabled={!walletStore.isUnlocked || isRefreshing}
          className="plasmo-flex-1 plasmo-bg-blue-600 plasmo-text-white plasmo-px-4 plasmo-py-3 plasmo-rounded-lg plasmo-font-medium hover:plasmo-bg-blue-700 disabled:plasmo-bg-gray-400 plasmo-transition-colors"
        >
          {isRefreshing ? "🔄 刷新中..." : "🔄 刷新资产"}
        </button>
        <button
          disabled={!walletStore.isUnlocked}
          className="plasmo-flex-1 plasmo-bg-purple-600 plasmo-text-white plasmo-px-4 plasmo-py-3 plasmo-rounded-lg plasmo-font-medium hover:plasmo-bg-purple-700 disabled:plasmo-bg-gray-400 plasmo-transition-colors"
        >
          📊 分析
        </button>
      </div>

      {/* 资产详情弹窗 */}
      {selectedAsset && (
        <div className="plasmo-fixed plasmo-inset-0 plasmo-flex plasmo-items-center plasmo-justify-center plasmo-z-50 plasmo-modal-backdrop">
          <div className="plasmo-bg-white plasmo-p-6 plasmo-rounded-lg plasmo-m-4 plasmo-max-w-sm plasmo-w-full">
            <div className="plasmo-flex plasmo-items-center plasmo-justify-between plasmo-mb-4">
              <div className="plasmo-flex plasmo-items-center plasmo-space-x-3">
                <div className="plasmo-text-3xl">{selectedAsset.icon}</div>
                <div>
                  <h3 className="plasmo-text-lg plasmo-font-bold">{selectedAsset.symbol}</h3>
                  <p className="plasmo-text-sm plasmo-text-gray-600">{selectedAsset.name}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedAsset(null)}
                className="plasmo-text-gray-400 hover:plasmo-text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="plasmo-space-y-3 plasmo-mb-4">
              <div className="plasmo-flex plasmo-justify-between">
                <span className="plasmo-text-gray-600">余额</span>
                <span className="plasmo-font-medium">
                  {formatBalance(selectedAsset.balance)} {selectedAsset.symbol}
                </span>
              </div>
              <div className="plasmo-flex plasmo-justify-between">
                <span className="plasmo-text-gray-600">价值</span>
                <span className="plasmo-font-medium">{formatValue(selectedAsset.value)}</span>
              </div>
              <div className="plasmo-flex plasmo-justify-between">
                <span className="plasmo-text-gray-600">24h 涨跌</span>
                <span className={`plasmo-font-medium ${getChangeColor(selectedAsset.change24h)}`}>
                  {selectedAsset.change24h}
                </span>
              </div>
              {selectedAsset.contractAddress && (
                <div className="plasmo-flex plasmo-justify-between">
                  <span className="plasmo-text-gray-600">合约地址</span>
                  <span
                    className="plasmo-font-medium plasmo-text-xs plasmo-font-mono plasmo-cursor-pointer hover:plasmo-text-blue-600"
                    onClick={() => {
                      navigator.clipboard.writeText(selectedAsset.contractAddress!)
                    }}
                    title="点击复制合约地址"
                  >
                    {selectedAsset.contractAddress.slice(0, 8)}...{selectedAsset.contractAddress.slice(-6)}
                  </span>
                </div>
              )}
            </div>

            <div className="plasmo-flex plasmo-space-x-2">
              <button className="plasmo-flex-1 plasmo-bg-blue-600 plasmo-text-white plasmo-px-4 plasmo-py-2 plasmo-rounded-lg plasmo-text-sm hover:plasmo-bg-blue-700 plasmo-transition-colors">
                💸 发送
              </button>
              <button className="plasmo-flex-1 plasmo-bg-green-600 plasmo-text-white plasmo-px-4 plasmo-py-2 plasmo-rounded-lg plasmo-text-sm hover:plasmo-bg-green-700 plasmo-transition-colors">
                📥 接收
              </button>
              <button
                onClick={() => removeAsset(selectedAsset.id)}
                className="plasmo-flex-1 plasmo-bg-gray-600 plasmo-text-white plasmo-px-4 plasmo-py-2 plasmo-rounded-lg plasmo-text-sm hover:plasmo-bg-gray-700 plasmo-transition-colors"
              >
                ✕ 关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}