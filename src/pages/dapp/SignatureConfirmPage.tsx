import React, { useState, useEffect } from 'react'
import { useWalletStore } from '../../stores/walletStore'
import { useNetworkStore } from '../../stores/networkStore'
import { useSignatureStore, type SignatureRequest } from '../../stores/signatureStore'

interface SignatureConfirmProps {
  requestId?: string
  onConfirm: (approved: boolean, signature?: string) => void
  onCancel: () => void
}

export const SignatureConfirmPage: React.FC<SignatureConfirmProps> = ({
  requestId,
  onConfirm,
  onCancel
}) => {
  const { currentAccount } = useWalletStore()
  const { currentNetwork } = useNetworkStore()
  const { getRequest, approveRequest, rejectRequest } = useSignatureStore()

  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string>('')
  const [request, setRequest] = useState<SignatureRequest | null>(null)

  // 获取请求信息
  useEffect(() => {
    const fetchRequest = async () => {
      if (requestId) {
        const signatureRequest = getRequest(requestId)
        if (signatureRequest) {
          setRequest(signatureRequest)
        } else {
          setError('签名请求不存在或已过期')
        }
      } else {
        // 如果没有指定requestId，先尝试从store获取待处理的请求
        let pendingRequests = useSignatureStore.getState().getPendingRequests()

        // 如果store中没有，直接从Chrome storage获取
        if (pendingRequests.length === 0) {
          try {
            if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
              const result = await chrome.storage.local.get('signature-requests')
              const storageData = result['signature-requests']

              if (storageData && storageData.state && storageData.state.requests) {
                pendingRequests = storageData.state.requests.filter((req: any) => req.status === 'pending')
                console.log('🔍 从Chrome storage找到待处理请求:', pendingRequests)
              }
            }
          } catch (error) {
            console.error('读取Chrome storage失败:', error)
          }
        }

        if (pendingRequests.length > 0) {
          setRequest(pendingRequests[0])
          console.log('✅ 找到待处理请求:', pendingRequests[0])
        } else {
          setError('没有待处理的签名请求')
          console.log('❌ 确实没有待处理的签名请求')
        }
      }
    }

    fetchRequest()
  }, [requestId, getRequest])

  const formatAddress = (address: string) => {
    return address.slice(0, 6) + '...' + address.slice(-4)
  }

  const formatMessage = (message: string) => {
    // 尝试解析十六进制消息
    try {
      if (message.startsWith('0x')) {
        const decoded = new TextDecoder().decode(
          new Uint8Array(message.slice(2).match(/.{2}/g)?.map(byte => parseInt(byte, 16)) || [])
        )
        return decoded
      }
    } catch {
      // 如果解码失败，返回原始消息
    }

    // 检查是否是JSON
    try {
      const parsed = JSON.parse(message)
      return JSON.stringify(parsed, null, 2)
    } catch {
      // 如果不是JSON，返回原始消息
    }

    return message
  }

  const handleConfirm = async () => {
    if (!request || !currentAccount) return

    setIsProcessing(true)
    setError('')

    try {
      console.log('🔐 确认签名:', request.id)
      // 直接批准请求（先不进行真实签名）
      approveRequest(request.id, 'mock_signature_' + request.id)

      onConfirm(true, 'mock_signature_' + request.id)
    } catch (err) {
      console.error('签名失败:', err)
      setError(err instanceof Error ? err.message : '签名失败')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleCancel = () => {
    if (request) {
      rejectRequest(request.id, '用户拒绝')
    }
    onCancel()
  }

  if (!request) {
    return (
      <div className="w-full h-full bg-white p-4">
        <div className="flex flex-col items-center justify-center h-full">
          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <span className="text-2xl">📝</span>
          </div>
          <h2 className="text-lg font-medium mb-2">
            {error || '签名请求不存在'}
          </h2>
          <button
            onClick={onCancel}
            className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-200 transition-colors"
          >
            关闭
          </button>
        </div>
      </div>
    )
  }

  const formattedMessage = formatMessage(request.message)

  return (
    <div className="w-full h-full bg-white p-4">
      {/* 签名确认标题 */}
      <div className="text-center mb-6">
        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
          <span className="text-2xl">🔐</span>
        </div>
        <h1 className="text-xl font-bold mb-2">
          签名确认
        </h1>
        <p className="text-gray-600 text-sm">
          请仔细检查要签名的消息内容
        </p>
      </div>

      {/* DApp信息 */}
      {request.origin && (
        <div className="bg-gray-50 p-3 rounded-lg mb-4">
          <div className="flex items-center space-x-3">
            {request.favicon && (
              <img
                src={request.favicon}
                alt=""
                className="w-6 h-6 rounded"
                onError={(e) => {
                  e.currentTarget.style.display = 'none'
                }}
              />
            )}
            <div className="flex-1">
              <p className="text-sm font-medium">
                {request.title || request.origin}
              </p>
              <p className="text-xs text-gray-500">
                请求签名验证
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

      {/* 签名账户信息 */}
      <div className="bg-white border border-gray-200 rounded-lg mb-4">
        <div className="p-4">
          <h3 className="font-medium mb-3">签名账户</h3>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">账户地址</span>
            <div className="text-right">
              <p className="text-sm font-mono">
                {formatAddress(currentAccount?.address || '')}
              </p>
              <p className="text-xs text-gray-500">
                {currentAccount?.name || '当前账户'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 消息内容 */}
      <div className="bg-white border border-gray-200 rounded-lg mb-4">
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium">消息内容</h3>
            <button
              className="text-xs text-blue-600 hover:text-blue-800"
              onClick={() => navigator.clipboard.writeText(request.message)}
            >
              复制消息
            </button>
          </div>
          <div className="bg-gray-50 p-3 rounded text-xs font-mono text-gray-700 max-h-32 overflow-y-auto">
            <pre className="whitespace-pre-wrap break-all">
              {formattedMessage}
            </pre>
          </div>
          {formattedMessage !== request.message && (
            <div className="mt-2 text-xs text-gray-500">
              原始消息 (十六进制):
              <div className="bg-gray-100 p-2 rounded mt-1 font-mono">
                {request.message}
              </div>
            </div>
          )}
        </div>
      </div>

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
              <li>请确认您信任请求签名的网站</li>
              <li>仔细检查消息内容是否正确</li>
              <li>签名不会消耗Gas费用，但可能用于验证您的身份</li>
              <li>不要签名您不理解的消息内容</li>
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
              <span>签名中...</span>
            </div>
          ) : (
            '确认签名'
          )}
        </button>
      </div>
    </div>
  )
}

export default SignatureConfirmPage