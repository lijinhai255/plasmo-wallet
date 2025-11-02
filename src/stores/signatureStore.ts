import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { storageManager } from '../lib/storage'

export interface SignatureRequest {
  id: string
  message: string
  origin: string
  timestamp: number
  status: 'pending' | 'approved' | 'rejected' | 'expired'
  result?: string
  error?: string
  favicon?: string
  title?: string
}

interface SignatureStore {
  // 状态
  requests: SignatureRequest[]

  // 动作
  addRequest: (request: Omit<SignatureRequest, 'id' | 'timestamp' | 'status'>) => string
  approveRequest: (id: string, signature: string) => void
  rejectRequest: (id: string, reason?: string) => void
  getRequest: (id: string) => SignatureRequest | undefined
  getPendingRequests: () => SignatureRequest[]
  clearExpiredRequests: () => void
  clearAllRequests: () => void

  // 签名处理回调
  setRequestCallback: (id: string, resolve: (value: string) => void, reject: (reason?: any) => void) => void
  executeRequestCallback: (id: string, approved: boolean, result?: string) => void

  // 测试存储功能
  testStorage: () => Promise<{ success: boolean; testId?: string; totalRequests?: number; error?: string }>

  // 强制同步存储数据
  syncFromStorage: () => Promise<void>
}

// 生成唯一ID
const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
}

// 签名回调存储（不持久化）
const requestCallbacks = new Map<string, { resolve: (value: string) => void, reject: (reason?: any) => void }>()

export const useSignatureStore = create<SignatureStore>()(
  persist(
    (set, get) => ({
      // 初始状态
      requests: [],

      // 添加签名请求
      addRequest: (requestData) => {
        const id = generateId()
        const request: SignatureRequest = {
          ...requestData,
          id,
          timestamp: Date.now(),
          status: 'pending'
        }

        console.log(`📝 SignatureStore: 准备添加请求`, { id, status: request.status, message: request.message })

        set((state) => {
          const newState = {
            requests: [...state.requests, request]
          }
          console.log(`📝 SignatureStore: 更新后的请求列表`, {
            total: newState.requests.length,
            pending: newState.requests.filter(r => r.status === 'pending').length,
            requests: newState.requests.map(r => ({ id: r.id, status: r.status, timestamp: r.timestamp }))
          })
          return newState
        })

        // 立即保存到Chrome storage，确保数据持久化
        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
          chrome.storage.local.get('signature-requests').then(result => {
            const existingData = result['signature-requests'] || { state: { requests: [] }, version: 0 }
            const updatedData = {
              state: {
                requests: [...existingData.state.requests, request]
              },
              version: 0
            }

            chrome.storage.local.set({ 'signature-requests': updatedData }).then(() => {
              console.log(`💾 SignatureStore: 直接保存到Chrome storage成功`, { id, totalRequests: updatedData.state.requests.length })
            }).catch(error => {
              console.error(`❌ SignatureStore: 直接保存到Chrome storage失败`, error)
            })
          })
        }

        console.log(`📝 添加签名请求完成: ${id}`, request)
        return id
      },

      // 批准签名请求
      approveRequest: (id, signature) => {
        set((state) => ({
          requests: state.requests.map(req =>
            req.id === id
              ? { ...req, status: 'approved', result: signature }
              : req
          )
        }))

        // 立即同步到Chrome storage
        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
          chrome.storage.local.get('signature-requests').then(result => {
            const existingData = result['signature-requests'] || { state: { requests: [] }, version: 0 }
            const updatedData = {
              state: {
                requests: existingData.state.requests.map(req =>
                  req.id === id
                    ? { ...req, status: 'approved', result: signature }
                    : req
                )
              },
              version: 0
            }

            chrome.storage.local.set({ 'signature-requests': updatedData }).then(() => {
              console.log(`💾 SignatureStore: 批准状态已同步到Chrome storage`, { id, signature })
            }).catch(error => {
              console.error(`❌ SignatureStore: 批准状态同步失败`, error)
            })
          })
        }

        // 执行回调
        get().executeRequestCallback(id, true, signature)
        console.log(`✅ 签名请求已批准: ${id}`)
      },

      // 拒绝签名请求
      rejectRequest: (id, reason) => {
        set((state) => ({
          requests: state.requests.map(req =>
            req.id === id
              ? { ...req, status: 'rejected', error: reason || '用户拒绝' }
              : req
          )
        }))

        // 立即同步到Chrome storage
        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
          chrome.storage.local.get('signature-requests').then(result => {
            const existingData = result['signature-requests'] || { state: { requests: [] }, version: 0 }
            const updatedData = {
              state: {
                requests: existingData.state.requests.map(req =>
                  req.id === id
                    ? { ...req, status: 'rejected', error: reason || '用户拒绝' }
                    : req
                )
              },
              version: 0
            }

            chrome.storage.local.set({ 'signature-requests': updatedData }).then(() => {
              console.log(`💾 SignatureStore: 拒绝状态已同步到Chrome storage`, { id, reason })
            }).catch(error => {
              console.error(`❌ SignatureStore: 拒绝状态同步失败`, error)
            })
          })
        }

        // 执行回调
        get().executeRequestCallback(id, false)
        console.log(`❌ 签名请求已拒绝: ${id}`)
      },

      // 获取特定请求
      getRequest: (id) => {
        return get().requests.find(req => req.id === id)
      },

      // 获取所有待处理的请求
      getPendingRequests: () => {
        const requests = get().requests.filter(req => req.status === 'pending')
        console.log(`🔍 SignatureStore: getPendingRequests 返回`, {
          total: requests.length,
          requests: requests.map(r => ({ id: r.id, status: r.status, message: r.message }))
        })
        return requests
      },

      // 清理过期请求（5分钟）
      clearExpiredRequests: () => {
        const now = Date.now()
        const expiryTime = 5 * 60 * 1000 // 5分钟

        set((state) => ({
          requests: state.requests.filter(req =>
            now - req.timestamp < expiryTime || req.status !== 'pending'
          )
        }))
      },

      // 清理所有请求
      clearAllRequests: () => {
        set({ requests: [] })
        requestCallbacks.clear()
      },

      // 设置请求回调
      setRequestCallback: (id, resolve, reject) => {
        requestCallbacks.set(id, { resolve, reject })

        // 设置超时自动拒绝
        setTimeout(() => {
          if (requestCallbacks.has(id)) {
            const currentRequest = get().getRequest(id)
            if (currentRequest && currentRequest.status === 'pending') {
              get().rejectRequest(id, '请求超时')
            }
          }
        }, 30000) // 30秒超时
      },

      // 执行请求回调
      executeRequestCallback: (id, approved, result) => {
        const callback = requestCallbacks.get(id)
        if (callback) {
          if (approved && result) {
            callback.resolve(result)
          } else {
            callback.reject(new Error(result || '签名被拒绝'))
          }
          requestCallbacks.delete(id)
        }
      },

      // 测试存储功能
      testStorage: async () => {
        console.log('🧪 SignatureStore: 开始测试存储功能')

        try {
          // 创建测试请求
          const testId = get().addRequest({
            message: 'Test signature store functionality',
            origin: 'test-origin',
            favicon: 'https://test.com/favicon.ico',
            title: 'Test Request'
          })

          console.log('🧪 SignatureStore: 创建测试请求成功:', testId)

          // 等待一下让存储完成
          await new Promise(resolve => setTimeout(resolve, 100))

          // 检查Chrome存储
          if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
            const stored = await chrome.storage.local.get('signature-requests')
            console.log('🧪 SignatureStore: Chrome存储中的数据:', stored)

            if (stored['signature-requests'] && stored['signature-requests'].state) {
              const requests = stored['signature-requests'].state.requests
              console.log('🧪 SignatureStore: 存储的请求数量:', requests.length)

              const testRequest = requests.find(req => req.id === testId)
              if (testRequest) {
                console.log('🧪 SignatureStore: ✅ 测试请求存储成功')
                return { success: true, testId, totalRequests: requests.length }
              } else {
                console.log('🧪 SignatureStore: ❌ 测试请求未找到')
                return { success: false, error: '测试请求未找到' }
              }
            } else {
              console.log('🧪 SignatureStore: ❌ 存储数据格式异常')
              return { success: false, error: '存储数据格式异常' }
            }
          } else {
            console.log('🧪 SignatureStore: ❌ Chrome storage 不可用')
            return { success: false, error: 'Chrome storage 不可用' }
          }
        } catch (error) {
          console.error('🧪 SignatureStore: 测试失败:', error)
          return { success: false, error: error.message }
        }
      },

      // 强制同步存储数据
      syncFromStorage: async () => {
        console.log('🔄 SignatureStore: 开始同步存储数据')

        try {
          if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
            const stored = await chrome.storage.local.get('signature-requests')
            const storageData = stored['signature-requests']

            if (storageData && storageData.state && storageData.state.requests) {
              console.log('🔄 SignatureStore: 从存储加载请求数据:', storageData.state.requests.length)

              set((state) => ({
                ...state,
                requests: storageData.state.requests
              }))

              console.log('✅ SignatureStore: 数据同步完成')
            } else {
              console.log('ℹ️ SignatureStore: 存储中没有数据')
            }
          } else {
            console.log('⚠️ SignatureStore: Chrome storage 不可用')
          }
        } catch (error) {
          console.error('❌ SignatureStore: 同步失败:', error)
        }
      }
    }),
    {
      name: 'signature-requests',
      // 直接使用Chrome storage，避免前缀冲突
      storage: {
        getItem: async (name: string) => {
          console.log('📖 SignatureStore getItem:', name)
          try {
            if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
              const result = await chrome.storage.local.get(name);
              console.log('📖 SignatureStore 从Chrome storage读取:', result[name])
              return result[name] || null;
            }
            return null;
          } catch (error) {
            console.error('❌ SignatureStore 读取失败:', error);
            return null;
          }
        },
        setItem: async (name: string, value: any) => {
          console.log('💾 SignatureStore setItem:', name, value)
          try {
            if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
              await chrome.storage.local.set({ [name]: value });
              console.log('💾 SignatureStore 已保存到Chrome storage')

              // 验证保存
              const verify = await chrome.storage.local.get(name);
              console.log('💾 SignatureStore 保存验证:', verify[name])
            } else {
              console.error('❌ Chrome storage 不可用')
            }
          } catch (error) {
            console.error('❌ SignatureStore 保存失败:', error);
          }
        },
        removeItem: async (name: string) => {
          console.log('🗑️ SignatureStore removeItem:', name)
          try {
            if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
              await chrome.storage.local.remove(name);
              console.log('🗑️ SignatureStore 已从Chrome storage删除')
            }
          } catch (error) {
            console.error('❌ SignatureStore 删除失败:', error);
          }
        }
      },
      partialize: (state) => ({
        requests: state.requests.filter(req =>
          req.status === 'pending' ||
          req.status === 'approved' ||
          req.status === 'rejected' ||
          (Date.now() - req.timestamp < 300000) // 保留所有请求5分钟用于调试
        )
      })
    }
  )
)

// 定期清理过期请求
if (typeof window !== 'undefined') {
  setInterval(() => {
    useSignatureStore.getState().clearExpiredRequests()
  }, 60000) // 每分钟清理一次
}