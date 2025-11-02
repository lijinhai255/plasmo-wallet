import { useEffect, useState } from 'react'
import { useSignatureStore } from '../stores/signatureStore'

export const useSignatureRequests = () => {
  const { getPendingRequests } = useSignatureStore()
  const [hasPendingRequests, setHasPendingRequests] = useState(false)

  // 直接从Chrome storage检查签名请求
  const checkPendingRequestsFromStorage = async () => {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        const result = await chrome.storage.local.get('signature-requests')
        const storageData = result['signature-requests']

        if (storageData && storageData.state && storageData.state.requests) {
          const pendingRequests = storageData.state.requests.filter(req => req.status === 'pending')
          const hasRequests = pendingRequests.length > 0

          return { pendingRequests, hasRequests }
        }
      }
    } catch (error) {
      // Silent error handling
    }

    return { pendingRequests: [], hasRequests: false }
  }

  // 检查是否有待处理的签名请求
  const checkPendingRequests = async () => {
    // 先尝试从store获取
    const storeRequests = getPendingRequests()
    const hasStoreRequests = storeRequests.length > 0

    console.log('🔍 Store中的待处理请求:', storeRequests.length)

    // 如果store中有数据，直接使用
    if (hasStoreRequests) {
      setHasPendingRequests(true)
      return storeRequests
    }

    // 如果store中没有，从Chrome storage检查
    try {
      const { pendingRequests, hasRequests } = await checkPendingRequestsFromStorage()
      console.log('🔍 Chrome storage中的待处理请求:', pendingRequests.length, hasRequests)

      if (hasRequests) {
        setHasPendingRequests(true)
        return pendingRequests
      }
    } catch (error) {
      console.error('检查Chrome storage失败:', error)
    }

    setHasPendingRequests(false)
    return storeRequests
  }

  // 监听来自background的消息
  useEffect(() => {
    const handleMessage = (message: any) => {
      if (message.type === 'SIGNATURE_REQUEST_CREATED') {
        console.log('📨 收到新的签名请求通知')
        checkPendingRequests()
      }
    }

    // 监听runtime消息
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      chrome.runtime.onMessage.addListener(handleMessage)

      return () => {
        chrome.runtime.onMessage.removeListener(handleMessage)
      }
    }
  }, [])

  // 组件挂载时检查是否有待处理的请求
  useEffect(() => {
    const checkRequests = async () => {
      console.log('🚀 useSignatureRequests 挂载时检查请求')
      await checkPendingRequests()
    }

    checkRequests()
  }, [])

  
  return {
    hasPendingRequests,
    pendingRequests: getPendingRequests(),
    checkPendingRequests
  }
}