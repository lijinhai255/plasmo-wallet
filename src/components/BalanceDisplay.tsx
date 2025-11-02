import React, { useEffect, useState } from 'react'
import { useBalanceStore, formatAddress, formatUSD } from '~store/BalanceStore'
import { useChainStore } from '~store/ChainStore'

interface BalanceDisplayProps {
  address?: string
}

export const BalanceDisplay: React.FC<BalanceDisplayProps> = ({ address }) => {
  const {
    balances,
    isLoading,
    error,
    selectedAccount,
    updateSelectedAccount,
    fetchAllBalances,
    refreshBalance,
    clearBalances
  } = useBalanceStore()

  const { currentChainId, connectionState, getAllNetworks } = useChainStore()

  const [isRefreshing, setIsRefreshing] = useState(false)
  const [showFullAddress, setShowFullAddress] = useState(false)

  // 当前显示的地址
  const currentAddress = address || selectedAccount
  const currentBalance = currentAddress ? balances[currentAddress] : undefined
  const currentNetwork = getAllNetworks().find(n => n.chainId === currentChainId)

  useEffect(() => {
    if (address && address !== selectedAccount) {
      updateSelectedAccount(address)
    }
  }, [address, selectedAccount]) // 移除 store 函数依赖

  useEffect(() => {
    if (currentAddress && connectionState.isConnected) {
      fetchAllBalances(currentAddress)
    }
  }, [currentAddress, connectionState.isConnected]) // 移除 store 函数依赖

  // 刷新余额
  const handleRefresh = async () => {
    if (!currentAddress) return

    setIsRefreshing(true)
    try {
      await refreshBalance(currentAddress)
    } catch (error) {
      console.error('刷新余额失败:', error)
    } finally {
      setIsRefreshing(false)
    }
  }

  // 清除余额数据
  const handleClear = () => {
    clearBalances()
  }

  if (!currentAddress) {
    return (
      <div className="plasmo-p-4 plasmo-text-center">
        <p className="plasmo-text-gray-500">请选择钱包地址</p>
      </div>
    )
  }

  return (
    <div className="plasmo-p-4 plasmo-bg-white plasmo-rounded-lg plasmo-shadow-sm">
      {/* 头部信息 */}
      <div className="plasmo-flex plasmo-justify-between plasmo-items-center plasmo-mb-4">
        <div className="plasmo-flex plasmo-items-center plasmo-space-x-2">
          {currentNetwork && (
            <div className="plasmo-flex plasmo-items-center plasmo-space-x-1">
              <span className="plasmo-text-lg">{currentNetwork.icon}</span>
              <span className="plasmo-text-sm plasmo-font-medium plasmo-text-gray-600">
                {currentNetwork.chainName}
              </span>
            </div>
          )}
        </div>

        <div className="plasmo-flex plasmo-items-center plasmo-space-x-2">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing || isLoading}
            className="plasmo-p-2 plasmo-rounded-full plasmo-hover:bg-gray-100 plasmo-disabled:opacity-50"
            title="刷新余额"
          >
            <svg
              className={`plasmo-w-4 plasmo-h-4 ${isRefreshing ? 'plasmo-animate-spin' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>

          <button
            onClick={handleClear}
            className="plasmo-p-2 plasmo-rounded-full plasmo-hover:bg-gray-100"
            title="清除数据"
          >
            <svg className="plasmo-w-4 plasmo-h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* 地址显示 */}
      <div className="plasmo-mb-4">
        <div className="plasmo-flex plasmo-items-center plasmo-space-x-2">
          <span className="plasmo-text-sm plasmo-text-gray-500">地址:</span>
          <button
            onClick={() => setShowFullAddress(!showFullAddress)}
            className="plasmo-text-sm plasmo-font-mono plasmo-text-gray-800 plasmo-hover:text-gray-600"
          >
            {showFullAddress ? currentAddress : formatAddress(currentAddress)}
          </button>
          <button
            onClick={() => {
              navigator.clipboard.writeText(currentAddress)
            }}
            className="plasmo-text-xs plasmo-text-blue-600 plasmo-hover:text-blue-800"
          >
            复制
          </button>
        </div>
      </div>

      {/* 错误显示 */}
      {error && (
        <div className="plasmo-mb-4 plasmo-p-3 plasmo-bg-red-50 plasmo-border plasmo-border-red-200 plasmo-rounded-md">
          <p className="plasmo-text-sm plasmo-text-red-600">{error}</p>
        </div>
      )}

      {/* 加载状态 */}
      {isLoading && (
        <div className="plasmo-mb-4 plasmo-text-center">
          <div className="plasmo-inline-flex plasmo-items-center plasmo-space-x-2">
            <div className="plasmo-w-4 plasmo-h-4 plasmo-border-2 plasmo-border-blue-600 plasmo-border-t-transparent plasmo-rounded-full plasmo-animate-spin"></div>
            <span className="plasmo-text-sm plasmo-text-gray-600">正在查询余额...</span>
          </div>
        </div>
      )}

      {/* ETH 余额 */}
      {currentBalance && (
        <div className="plasmo-mb-6">
          <div className="plasmo-bg-gradient-to-r plasmo-from-blue-50 plasmo-to-blue-100 plasmo-p-4 plasmo-rounded-lg">
            <div className="plasmo-flex plasmo-justify-between plasmo-items-center">
              <div>
                <p className="plasmo-text-sm plasmo-font-medium plasmo-text-gray-600">ETH 余额</p>
                <p className="plasmo-text-2xl plasmo-font-bold plasmo-text-gray-900">
                  {currentBalance.formattedEthBalance}
                  <span className="plasmo-ml-1 plasmo-text-lg plasmo-text-gray-600">ETH</span>
                </p>
              </div>
              <div className="plasmo-text-right">
                {currentBalance.ethValueUSD && (
                  <p className="plasmo-text-sm plasmo-font-medium plasmo-text-gray-600">
                    {formatUSD(currentBalance.ethValueUSD)}
                  </p>
                )}
                <p className="plasmo-xs plasmo-text-gray-500">
                  更新: {new Date(currentBalance.lastUpdated).toLocaleTimeString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 代币余额 */}
      {currentBalance && currentBalance.tokens.length > 0 && (
        <div className="plasmo-mb-4">
          <h3 className="plasmo-text-sm plasmo-font-semibold plasmo-text-gray-700 plasmo-mb-3">
            代币余额 ({currentBalance.tokens.length})
          </h3>
          <div className="plasmo-space-y-2">
            {currentBalance.tokens.map((token, index) => (
              <div
                key={`${token.contractAddress}-${index}`}
                className="plasmo-flex plasmo-justify-between plasmo-items-center plasmo-p-3 plasmo-bg-gray-50 plasmo-rounded-lg"
              >
                <div className="plasmo-flex plasmo-items-center plasmo-space-x-3">
                  <div className="plasmo-w-8 plasmo-h-8 plasmo-bg-blue-500 plasmo-rounded-full plasmo-flex plasmo-items-center plasmo-justify-center">
                    <span className="plasmo-text-xs plasmo-font-bold plasmo-text-white">
                      {token.symbol.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <p className="plasmo-text-sm plasmo-font-medium plasmo-text-gray-900">
                      {token.symbol}
                    </p>
                    <p className="plasmo-xs plasmo-text-gray-500">{token.name}</p>
                  </div>
                </div>

                <div className="plasmo-text-right">
                  <p className="plasmo-text-sm plasmo-font-medium plasmo-text-gray-900">
                    {token.formattedBalance}
                  </p>
                  {token.valueUSD && (
                    <p className="plasmo-xs plasmo-text-gray-500">
                      {formatUSD(token.valueUSD)}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 无余额数据 */}
      {currentBalance && currentBalance.tokens.length === 0 && !isLoading && (
        <div className="plasmo-text-center plasmo-py-4">
          <p className="plasmo-text-sm plasmo-text-gray-500">
            暂无代币余额
          </p>
        </div>
      )}

      {/* 总价值 */}
      {currentBalance && currentBalance.totalValueUSD && (
        <div className="plasmo-mt-4 plasmo-pt-4 plasmo-border-t plasmo-border-gray-200">
          <div className="plasmo-flex plasmo-justify-between plasmo-items-center">
            <span className="plasmo-text-sm plasmo-font-medium plasmo-text-gray-700">
              总价值 (USD)
            </span>
            <span className="plasmo-text-lg plasmo-font-bold plasmo-text-gray-900">
              {formatUSD(currentBalance.totalValueUSD)}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

export default BalanceDisplay