import React, { useState, useEffect } from 'react'
import { useWalletStore } from '../../stores/walletStore'
import { useNetworkStore } from '../../stores/networkStore'

interface TransactionRequest {
  id?: string
  from: string
  to: string
  value: string
  data?: string
  gasLimit?: string
  gasPrice?: string
  maxFeePerGas?: string
  maxPriorityFeePerGas?: string
  nonce?: string
  // DApp信息
  origin?: string
  favicon?: string
  title?: string
}

interface TransactionConfirmProps {
  transaction: TransactionRequest
  onConfirm: (approved: boolean) => void
  onCancel: () => void
}

export const TransactionConfirmPage: React.FC<TransactionConfirmProps> = ({
  transaction,
  onConfirm,
  onCancel
}) => {
  const { currentAccount } = useWalletStore()
  const { currentNetwork } = useNetworkStore()
  const [isProcessing, setIsProcessing] = useState(false)
  const [gasEstimate, setGasEstimate] = useState<string>('0')
  const [totalCost, setTotalCost] = useState<string>('0')
  const [error, setError] = useState<string>('')

  useEffect(() => {
    const estimateGas = async () => {
      try {
        // TODO: 实现真实的Gas估算
        const estimatedGas = '21000' // 标准转账的Gas限制
        const gasPrice = '20000000000' // 20 Gwei
        const value = BigInt(transaction.value || '0')
        const gasFee = BigInt(estimatedGas) * BigInt(gasPrice)
        const total = value + gasFee

        setGasEstimate(gasFee.toString())
        setTotalCost(total.toString())
      } catch (err) {
        console.error('Gas估算失败:', err)
        setError('Gas估算失败')
      }
    }

    estimateGas()
  }, [transaction])

  const formatAddress = (address: string) => {
    return address.slice(0, 6) + '...' + address.slice(-4)
  }

  const formatEther = (wei: string) => {
    const ether = parseFloat(wei) / 1e18
    return ether.toFixed(6)
  }

  const handleConfirm = async () => {
    setIsProcessing(true)
    setError('')

    try {
      // TODO: 实现真实的交易发送逻辑
      console.log('确认交易:', transaction)

      // 模拟交易处理
      await new Promise(resolve => setTimeout(resolve, 2000))

      onConfirm(true)
    } catch (err) {
      console.error('交易发送失败:', err)
      setError(err instanceof Error ? err.message : '交易发送失败')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleCancel = () => {
    onCancel()
  }

  return (
    <div className="w-full h-full bg-white p-4">
      {/* 交易确认标题 */}
      <div className="text-center mb-6">
        <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
          <span className="text-2xl">🔄</span>
        </div>
        <h1 className="text-xl font-bold mb-2">
          确认交易
        </h1>
        <p className="text-gray-600 text-sm">
          请仔细检查交易详情
        </p>
      </div>

      {/* DApp信息 */}
      {transaction.origin && (
        <div className="bg-gray-50 p-3 rounded-lg mb-4">
          <div className="flex items-center space-x-3">
            {transaction.favicon && (
              <img
                src={transaction.favicon}
                alt=""
                className="w-6 h-6 rounded"
              />
            )}
            <div className="flex-1">
              <p className="text-sm font-medium">
                {transaction.title || transaction.origin}
              </p>
              <p className="text-xs text-gray-500">
                请求交易签名
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 网络信息 */}
      <div className="bg-blue-50 p-3 rounded-lg mb-4">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium">网络:</span>
          <span className="text-sm">🌐 {currentNetwork.name}</span>
        </div>
      </div>

      {/* 交易详情 */}
      <div className="bg-white border border-gray-200 rounded-lg mb-4">
        <div className="p-4 border-b border-gray-200">
          <h3 className="font-medium mb-3">交易详情</h3>

          {/* 发送地址 */}
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm text-gray-600">从</span>
            <div className="text-right">
              <p className="text-sm font-mono">
                {formatAddress(transaction.from)}
              </p>
              <p className="text-xs text-gray-500">
                {currentAccount?.name || '当前账户'}
              </p>
            </div>
          </div>

          {/* 接收地址 */}
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm text-gray-600">到</span>
            <div className="text-right">
              <p className="text-sm font-mono">
                {formatAddress(transaction.to)}
              </p>
              <button
                className="text-xs text-blue-600 hover:text-blue-800"
                onClick={() => navigator.clipboard.writeText(transaction.to)}
              >
                复制地址
              </button>
            </div>
          </div>

          {/* 转账金额 */}
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">金额</span>
            <span className="text-sm font-medium">
              {formatEther(transaction.value)} {currentNetwork.symbol}
            </span>
          </div>
        </div>

        {/* Gas费用 */}
        <div className="p-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-600">预计Gas费用</span>
            <span className="text-sm">
              {formatEther(gasEstimate)} {currentNetwork.symbol}
            </span>
          </div>

          <div className="flex justify-between items-center pt-3 border-t border-gray-200">
            <span className="font-medium">总计</span>
            <span className="font-medium">
              {formatEther(totalCost)} {currentNetwork.symbol}
            </span>
          </div>
        </div>
      </div>

      {/* 交易数据 (如果有) */}
      {transaction.data && transaction.data !== '0x' && (
        <div className="bg-yellow-50 p-3 rounded-lg mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">交易数据</span>
            <button
              className="text-xs text-blue-600 hover:text-blue-800"
              onClick={() => navigator.clipboard.writeText(transaction.data || '')}
            >
              复制数据
            </button>
          </div>
          <div className="text-xs font-mono text-gray-600 max-h-20 overflow-y-auto">
            {transaction.data}
          </div>
        </div>
      )}

      {/* 错误提示 */}
      {error && (
        <div className="bg-red-50 border border-red-200 p-3 rounded-lg mb-4">
          <p className="text-sm text-red-800">
            ❌ {error}
          </p>
        </div>
      )}

      {/* 风险提示 */}
      <div className="bg-orange-50 p-3 rounded-lg mb-6">
        <div className="flex items-start space-x-2">
          <span className="text-orange-500 mt-0.5">⚠️</span>
          <div className="text-xs text-orange-800">
            <p className="font-medium mb-1">安全提醒</p>
            <ul className="space-y-0.5 list-disc list-inside">
              <li>请确认您信任接收地址</li>
              <li>交易一旦发送，无法撤销</li>
              <li>请仔细检查交易金额和Gas费用</li>
            </ul>
          </div>
        </div>
      </div>

      {/* 操作按钮 */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={handleCancel}
          disabled={isProcessing}
          className="bg-gray-100 text-gray-700 px-4 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          拒绝
        </button>
        <button
          onClick={handleConfirm}
          disabled={isProcessing}
          className="bg-blue-600 text-white px-4 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isProcessing ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>处理中...</span>
            </div>
          ) : (
            '确认'
          )}
        </button>
      </div>
    </div>
  )
}

export default TransactionConfirmPage