import React, { useState } from "react"
import { useWalletStore } from "../stores/walletStore"
import { useNetworkStore } from "../stores/networkStore"

interface Asset {
  id: string
  symbol: string
  name: string
  balance: string
  value: number
  change24h: string
  icon: string
}

export const AssetsPage = () => {
  const { currentAccount, isLocked } = useWalletStore()
  const { currentNetwork } = useNetworkStore()
  const [isRefreshing, setIsRefreshing] = useState(false)

  // 模拟资产数据
  const mockAssets: Asset[] = [
    {
      id: "eth",
      symbol: currentNetwork.symbol,
      name: currentNetwork.name,
      balance: "0.0000",
      value: 0,
      change24h: "+2.5%",
      icon: "🔷"
    },
    {
      id: "usdc",
      symbol: "USDC",
      name: "USD Coin",
      balance: "0.00",
      value: 0,
      change24h: "+0.1%",
      icon: "💵"
    },
    {
      id: "usdt",
      symbol: "USDT",
      name: "Tether",
      balance: "0.00",
      value: 0,
      change24h: "-0.05%",
      icon: "🪙"
    }
  ]

  const refreshAssets = async () => {
    setIsRefreshing(true)
    // 模拟刷新延迟
    setTimeout(() => {
      setIsRefreshing(false)
    }, 2000)
  }

  const formatBalance = (balance: string) => {
    const num = parseFloat(balance)
    if (num >= 1000000) {
      return (num / 1000000).toFixed(2) + "M"
    } else if (num >= 1000) {
      return (num / 1000).toFixed(2) + "K"
    }
    return num.toFixed(4)
  }

  const formatValue = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value)
  }

  const getChangeColor = (change: string) => {
    return change.startsWith("+") ? "text-green-600" : "text-red-600"
  }

  if (!currentAccount) {
    return (
      <div className="w-full h-full bg-white p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">🔐</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            没有找到账户
          </h3>
          <p className="text-gray-600 text-sm">
            请创建或导入钱包账户
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-full bg-white p-4">
      <div className="max-w-md mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">💰 我的资产</h1>
            <p className="text-gray-600 text-sm">
              {currentAccount.address.slice(0, 6)}...{currentAccount.address.slice(-4)}
            </p>
          </div>
          <button
            onClick={refreshAssets}
            disabled={isRefreshing}
            className="p-2 rounded-full hover:bg-gray-100 disabled:opacity-50"
            title="刷新资产"
          >
            <div className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`}>
              🔄
            </div>
          </button>
        </div>

        {/* Total Value Card */}
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg p-6 text-white">
          <div className="text-center">
            <p className="text-sm opacity-80 mb-1">总资产价值 (USD)</p>
            <p className="text-3xl font-bold">$0.00</p>
            <p className="text-sm opacity-80 mt-2">
              共 {mockAssets.length} 种资产 • {currentNetwork.name}
            </p>
          </div>
        </div>

        {/* Assets List */}
        <div className="space-y-3">
          {mockAssets.map((asset) => (
            <div
              key={asset.id}
              className="bg-gray-50 p-4 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="text-2xl">{asset.icon}</div>
                  <div>
                    <p className="font-medium text-gray-900">{asset.symbol}</p>
                    <p className="text-sm text-gray-600">{asset.name}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-900">{formatValue(asset.value)}</p>
                  <p className={`text-sm ${getChangeColor(asset.change24h)}`}>
                    {asset.change24h}
                  </p>
                </div>
              </div>
              <div className="mt-2 pt-2 border-t border-gray-200">
                <p className="text-sm text-gray-600">
                  余额: {formatBalance(asset.balance)} {asset.symbol}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={refreshAssets}
            disabled={isRefreshing}
            className="bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 transition-colors font-medium"
          >
            {isRefreshing ? "🔄 刷新中..." : "🔄 刷新资产"}
          </button>
          <button className="bg-purple-600 text-white py-3 px-4 rounded-md hover:bg-purple-700 transition-colors font-medium">
            📊 分析
          </button>
        </div>

        {/* Empty State for Development */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
          <div className="text-2xl mb-2">🚧</div>
          <h3 className="font-medium text-blue-900 mb-1">开发中</h3>
          <p className="text-sm text-blue-700">
            资产功能正在开发中，暂时显示模拟数据
          </p>
        </div>
      </div>
    </div>
  )
}