/**
 * Background Service Worker
 * 这个文件会被Plasmo自动识别为background script
 */

console.log('🚀 Background Service Worker 已启动')

// 全局钱包状态
const walletState = {
  isConnected: false,
  address: null,
  account: null
}

// 导出钱包状态供其他模块使用
export { walletState }

// 扩展安装/更新时的处理
chrome.runtime.onInstalled.addListener(() => {
  console.log('✅ Plasmo 钱包扩展已安装')
})

// 监听来自content script的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('📨 Background收到消息:', message)

  // 处理钱包注入请求
  if (message.action === 'wallet-inject') {
    handleWalletInject(sender.tab?.id).then(sendResponse)
    return true // 保持消息通道开放
  }

  // 处理钱包连接请求
  if (message.action === 'wallet-connect') {
    handleWalletConnect().then(sendResponse)
    return true
  }

  // 处理获取账户请求
  if (message.action === 'wallet-get-account') {
    handleGetAccount().then(sendResponse)
    return true
  }

  // 处理签名请求
  if (message.action === 'wallet-sign-message') {
    handleSignMessage(message.data).then(sendResponse)
    return true
  }

  // 处理断开连接请求
  if (message.action === 'wallet-disconnect') {
    handleDisconnect().then(sendResponse)
    return true
  }
})

// 钱包注入处理
async function handleWalletInject(tabId?: number) {
  try {
    console.log('🚀 开始钱包注入到标签页:', tabId)

    if (!tabId) {
      throw new Error('No tab ID available')
    }

    // 创建钱包注入函数
    function createWalletFunction() {
      console.log('🚀 主世界钱包脚本开始执行')

      // 工具函数：生成请求ID
      function generateRequestId() {
        return Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
      }

      // 发送消息到桥接器并等待响应
      function sendToBridge(action, data) {
        return new Promise((resolve, reject) => {
          const requestId = generateRequestId()

          // 设置超时
          const timeout = setTimeout(() => {
            reject(new Error('Request timeout'))
          }, 10000) // 10秒超时

          // 监听响应
          const responseHandler = (event) => {
            if (event.source !== window) return

            const { type, requestId: responseId, success, data: responseData, error } = event.data

            if (type === 'PLASMO_WALLET_RESPONSE' && responseId === requestId) {
              clearTimeout(timeout)
              window.removeEventListener('message', responseHandler)

              if (success) {
                resolve(responseData)
              } else {
                reject(new Error(error))
              }
            }
          }

          window.addEventListener('message', responseHandler)

          // 发送请求
          window.postMessage({
            type: 'PLASMO_WALLET_REQUEST',
            requestId,
            action,
            data
          }, '*')
        })
      }

      // 创建钱包对象
      const plasmoWallet = {
        isPlasmoWallet: true,
        version: '2.2.0',

        // 连接钱包
        async connect() {
          console.log('🔗 PlasmoWallet.connect() 被调用')
          try {
            const response = await sendToBridge('connect')

            if (response?.success) {
              console.log('✅ 钱包连接成功:', response.data)
              return {
                address: response.data.address,
                account: response.data.account
              }
            } else {
              console.error('❌ 钱包连接失败:', response?.error)
              throw new Error(response?.error || '连接失败')
            }
          } catch (error) {
            console.error('❌ 钱包连接异常:', error)
            throw error
          }
        },

        // 获取账户
        async getAccount() {
          console.log('👤 PlasmoWallet.getAccount() 被调用')
          try {
            const response = await sendToBridge('get-account')

            if (response?.success) {
              console.log('✅ 获取账户成功:', response.data)
              return response.data.address
            } else {
              console.error('❌ 获取账户失败:', response?.error)
              throw new Error(response?.error || '获取账户失败')
            }
          } catch (error) {
            console.error('❌ 获取账户异常:', error)
            throw error
          }
        },

        // 签名消息
        async signMessage(message) {
          console.log('🔏 PlasmoWallet.signMessage() 被调用:', message)
          try {
            const response = await sendToBridge('sign-message', { message })

            if (response?.success) {
              console.log('✅ 消息签名成功:', response.data)
              return response.data.signedMessage
            } else {
              console.error('❌ 消息签名失败:', response?.error)
              throw new Error(response?.error || '签名失败')
            }
          } catch (error) {
            console.error('❌ 消息签名异常:', error)
            throw error
          }
        },

        // 断开连接
        async disconnect() {
          console.log('🔌 PlasmoWallet.disconnect() 被调用')
          try {
            const response = await sendToBridge('disconnect')

            if (response?.success) {
              console.log('✅ 钱包断开连接成功:', response.data)
              return
            } else {
              console.error('❌ 钱包断开连接失败:', response?.error)
              throw new Error(response?.error || '断开连接失败')
            }
          } catch (error) {
            console.error('❌ 钱包断开连接异常:', error)
            throw error
          }
        }
      }

      // 将钱包对象注入到 window
      Object.defineProperty(window, 'plasmoWallet', {
        value: plasmoWallet,
        writable: false,
        configurable: true
      })

      console.log('✅ window.plasmoWallet 在主世界注入完成!')
      console.log('🎯 可用方法:', Object.keys(plasmoWallet).filter(key => typeof plasmoWallet[key] === 'function'))

      // 发送注入完成事件
      window.dispatchEvent(new CustomEvent('plasmoWalletInjected', {
        detail: {
          version: plasmoWallet.version,
          methods: Object.keys(plasmoWallet).filter(key => typeof plasmoWallet[key] === 'function'),
          timestamp: Date.now(),
          framework: 'Plasmo Background Script Injection'
        }
      }))

      console.log('🎉 主世界钱包注入完成! (使用 Background Script + chrome.scripting)')
    }

    // 使用 chrome.scripting API 注入到 MAIN world
    await chrome.scripting.executeScript({
      target: { tabId },
      world: 'MAIN',
      func: createWalletFunction
    })

    console.log('✅ 钱包脚本通过 background script 成功注入')

    return {
      success: true,
      message: 'Wallet injected successfully via background script'
    }

  } catch (error) {
    console.error('❌ Background script 注入失败:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown injection error'
    }
  }
}

// 钱包连接处理
async function handleWalletConnect() {
  try {
    console.log('🔗 Background: 处理钱包连接请求')

    // 模拟钱包连接逻辑
    const mockAddress = "0x1234567890123456789012345678901234567890"
    walletState.isConnected = true
    walletState.address = mockAddress
    walletState.account = mockAddress

    console.log('✅ Background: 钱包连接成功', walletState)

    return {
      success: true,
      data: {
        address: mockAddress,
        account: mockAddress
      }
    }
  } catch (error) {
    console.error('❌ Background: 钱包连接失败', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '连接失败'
    }
  }
}

// 获取账户处理
async function handleGetAccount() {
  try {
    console.log('👤 Background: 处理获取账户请求')

    if (!walletState.isConnected) {
      throw new Error('钱包未连接')
    }

    return {
      success: true,
      data: {
        address: walletState.address
      }
    }
  } catch (error) {
    console.error('❌ Background: 获取账户失败', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '获取账户失败'
    }
  }
}

// 消息签名处理
async function handleSignMessage(data: { message: string }) {
  try {
    console.log('🔏 Background: 处理签名请求', data)

    if (!walletState.isConnected) {
      throw new Error('钱包未连接')
    }

    // 模拟签名过程
    const signedMessage = `0x${Buffer.from(`Signed: ${data.message} by ${walletState.address}`).toString('hex')}`

    return {
      success: true,
      data: {
        signedMessage
      }
    }
  } catch (error) {
    console.error('❌ Background: 消息签名失败', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '签名失败'
    }
  }
}

// 断开连接处理
async function handleDisconnect() {
  try {
    console.log('🔌 Background: 处理断开连接请求')

    walletState.isConnected = false
    walletState.address = null
    walletState.account = null

    return {
      success: true,
      data: {}
    }
  } catch (error) {
    console.error('❌ Background: 断开连接失败', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '断开连接失败'
    }
  }
}