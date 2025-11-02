import React, { useState, useEffect } from 'react'
import { useWalletStore } from '../../../store/WalletStore'
import { useChainStore } from '../../../store/ChainStore'

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
  const walletStore = useWalletStore()
  const chainStore = useChainStore()
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

  const getCurrentNetwork = () => {
    const network = chainStore.getNetworkConfig(chainStore.currentChainId)
    return network || { chainName: 'Unknown Network', icon: '🌐' }
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

  const network = getCurrentNetwork()

  return (
    <div className="plasmo-p-4 plasmo-bg-white plasmo-min-h-screen">
      {/* 交易确认标题 */}
      <div className="plasmo-text-center plasmo-mb-6">
        <div className="plasmo-w-12 plasmo-h-12 plasmo-bg-orange-100 plasmo-rounded-full plasmo-flex plasmo-items-center plasmo-justify-center plasmo-mx-auto plasmo-mb-3">
          <span className="plasmo-text-2xl">🔄</span>
        </div>
        <h1 className="plasmo-text-xl plasmo-font-bold plasmo-mb-2">
          确认交易
        </h1>
        <p className="plasmo-text-gray-600 plasmo-text-sm">
          请仔细检查交易详情
        </p>
      </div>

      {/* DApp信息 */}
      {transaction.origin && (
        <div className="plasmo-bg-gray-50 plasmo-p-3 plasmo-rounded-lg plasmo-mb-4">
          <div className="plasmo-flex plasmo-items-center plasmo-space-x-3">
            {transaction.favicon && (
              <img
                src={transaction.favicon}
                alt=""
                className="plasmo-w-6 plasmo-h-6 plasmo-rounded"
              />
            )}
            <div className="plasmo-flex-1">
              <p className="plasmo-text-sm plasmo-font-medium">
                {transaction.title || transaction.origin}
              </p>
              <p className="plasmo-text-xs plasmo-text-gray-500">
                请求交易签名
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 网络信息 */}
      <div className="plasmo-bg-blue-50 plasmo-p-3 plasmo-rounded-lg plasmo-mb-4">
        <div className="plasmo-flex plasmo-items-center plasmo-space-x-2">
          <span className="plasmo-text-sm plasmo-font-medium">网络:</span>
          <span className="plasmo-text-sm">{network.icon} {network.chainName}</span>
        </div>
      </div>

      {/* 交易详情 */}
      <div className="plasmo-bg-white plasmo-border plasmo-border-gray-200 plasmo-rounded-lg plasmo-mb-4">
        <div className="plasmo-p-4 plasmo-border-b plasmo-border-gray-200">
          <h3 className="plasmo-font-medium plasmo-mb-3">交易详情</h3>

          {/* 发送地址 */}
          <div className="plasmo-flex plasmo-justify-between plasmo-items-center plasmo-mb-3">
            <span className="plasmo-text-sm plasmo-text-gray-600">从</span>
            <div className="plasmo-text-right">
              <p className="plasmo-text-sm plasmo-font-mono">
                {formatAddress(transaction.from)}
              </p>
              <p className="plasmo-text-xs plasmo-text-gray-500">
                {walletStore.currentWallet?.name || '当前账户'}
              </p>
            </div>
          </div>

          {/* 接收地址 */}
          <div className="plasmo-flex plasmo-justify-between plasmo-items-center plasmo-mb-3">
            <span className="plasmo-text-sm plasmo-text-gray-600">到</span>
            <div className="plasmo-text-right">
              <p className="plasmo-text-sm plasmo-font-mono">
                {formatAddress(transaction.to)}
              </p>
              <button
                className="plasmo-text-xs plasmo-text-blue-600 hover:plasmo-text-blue-800"
                onClick={() => navigator.clipboard.writeText(transaction.to)}
              >
                复制地址
              </button>
            </div>
          </div>

          {/* 转账金额 */}
          <div className="plasmo-flex plasmo-justify-between plasmo-items-center">
            <span className="plasmo-text-sm plasmo-text-gray-600">金额</span>
            <span className="plasmo-text-sm plasmo-font-medium">
              {formatEther(transaction.value)} ETH
            </span>
          </div>
        </div>

        {/* Gas费用 */}
        <div className="plasmo-p-4">
          <div className="plasmo-flex plasmo-justify-between plasmo-items-center plasmo-mb-2">
            <span className="plasmo-text-sm plasmo-text-gray-600">预计Gas费用</span>
            <span className="plasmo-text-sm">
              {formatEther(gasEstimate)} ETH
            </span>
          </div>

          <div className="plasmo-flex plasmo-justify-between plasmo-items-center plasmo-pt-3 plasmo-border-t plasmo-border-gray-200">
            <span className="plasmo-font-medium">总计</span>
            <span className="plasmo-font-medium">
              {formatEther(totalCost)} ETH
            </span>
          </div>
        </div>
      </div>

      {/* 交易数据 (如果有) */}
      {transaction.data && transaction.data !== '0x' && (
        <div className="plasmo-bg-yellow-50 plasmo-p-3 plasmo-rounded-lg plasmo-mb-4">
          <div className="plasmo-flex plasmo-items-center plasmo-justify-between plasmo-mb-2">
            <span className="plasmo-text-sm plasmo-font-medium">交易数据</span>
            <button
              className="plasmo-text-xs plasmo-text-blue-600 hover:plasmo-text-blue-800"
              onClick={() => navigator.clipboard.writeText(transaction.data || '')}
            >
              复制数据
            </button>
          </div>
          <div className="plasmo-text-xs plasmo-font-mono plasmo-text-gray-600 plasmo-max-h-20 plasmo-overflow-y-auto">
            {transaction.data}
          </div>
        </div>
      )}

      {/* 错误提示 */}
      {error && (
        <div className="plasmo-bg-red-50 plasmo-border plasmo-border-red-200 plasmo-p-3 plasmo-rounded-lg plasmo-mb-4">
          <p className="plasmo-text-sm plasmo-text-red-800">
            ❌ {error}
          </p>
        </div>
      )}

      {/* 风险提示 */}
      <div className="plasmo-bg-orange-50 plasmo-p-3 plasmo-rounded-lg plasmo-mb-6">
        <div className="plasmo-flex plasmo-items-start plasmo-space-x-2">
          <span className="plasmo-text-orange-500 plasmo-mt-0.5">⚠️</span>
          <div className="plasmo-text-xs plasmo-text-orange-800">
            <p className="plasmo-font-medium plasmo-mb-1">安全提醒</p>
            <ul className="plasmo-space-y-0.5 plasmo-list-disc plasmo-list-inside">
              <li>请确认您信任接收地址</li>
              <li>交易一旦发送，无法撤销</li>
              <li>请仔细检查交易金额和Gas费用</li>
            </ul>
          </div>
        </div>
      </div>

      {/* 操作按钮 */}
      <div className="plasmo-grid plasmo-grid-cols-2 plasmo-gap-3">
        <button
          onClick={handleCancel}
          disabled={isProcessing}
          className="plasmo-bg-gray-100 plasmo-text-gray-700 plasmo-px-4 plasmo-py-3 plasmo-rounded-lg plasmo-font-medium hover:plasmo-bg-gray-200 plasmo-transition-colors disabled:plasmo-opacity-50 disabled:plasmo-cursor-not-allowed">
          拒绝
        </button>
        <button
          onClick={handleConfirm}
          disabled={isProcessing}
          className="plasmo-bg-blue-600 plasmo-text-white plasmo-px-4 plasmo-py-3 plasmo-rounded-lg plasmo-font-medium hover:plasmo-bg-blue-700 plasmo-transition-colors disabled:plasmo-opacity-50 disabled:plasmo-cursor-not-allowed">
          {isProcessing ? (
            <div className="plasmo-flex plasmo-items-center plasmo-justify-center plasmo-space-x-2">
              <div className="plasmo-w-4 plasmo-h-4 plasmo-border-2 plasmo-border-white plasmo-border-t-transparent plasmo-rounded-full plasmo-animate-spin"></div>
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