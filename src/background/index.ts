import { useWalletStore } from '../stores/walletStore';
import { useNetworkStore } from '../stores/networkStore';
import { useSignatureStore } from '../stores/signatureStore';
import injectMyWallet from './injected-helper';
import * as constant from './type_constant';

console.log('background 脚本启动了');

// 初始化钱包状态
const initWallet = () => {
  const walletStore = useWalletStore.getState()
  // TODO 初始化逻辑
  console.log('🔄 初始化钱包状态完成'); 
}

// 注册消息监听器
const setupMessageListener = () => {
  console.log('🔄 监听来自 message-bridge 的消息');
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log("background 收到消息:", message.type, "来自标签页：", sender.tab?.id);
    // 处理连接请求
    if (message.type === constant.WALLET_CONNECT) {
      const walletStore = useWalletStore.getState()
      try {
        walletStore.connect().then(() => {
          const account = walletStore.currentAccount
          sendResponse({
            data: { account }
          })
        }).catch((error) => {
          sendResponse({
            data: { error: error.message },
          })
        })
      } catch (error) {
        sendResponse({
          data: { error: error instanceof Error ? error.message : '连接失败' },
        })
      }
      return true
    }

    // 获取账号请求
    if (message.type === constant.WALLET_GET_ACCOUNT) {
      const walletStore = useWalletStore.getState()
      const account = walletStore.currentAccount
      sendResponse({
        data: { account }
      })
      return true
    }
    // 获取账户余额 - 暂时移除这个功能，因为新的walletStore没有getBalance方法
    // if (message.type === constant.WALLET_GET_BALANCE) {
    //   const walletStore = useWalletStore.getState()
    //   try {
    //     // TODO: 实现余额获取逻辑
    //     sendResponse({
    //       data: { error: '余额获取功能暂未实现' },
    //     })
    //   } catch (error) {
    //     sendResponse({
    //       data: { error: error instanceof Error ? error.message : '获取余额失败' },
    //     })
    //   }
    //   return true
    // }

    // 获取当前网络ChainId请求
    if (message.type === constant.WALLET_GET_CHAIN_ID) {
      const networkStore = useNetworkStore.getState()
      console.log('networkStore:', networkStore);
      const currentNetwork = networkStore.currentNetwork
      const chainId = `0x${currentNetwork.chainId.toString(16)}`
      sendResponse({
        "name": "my-wallet-response",
        data: { chainId }
      })
      return true
    }
    
    // 处理签名
    if (message.type === constant.WALLET_SIGN_MESSAGE) {
      console.log('background 收到签名请求:', message);
      if (!message.data || !message.data.message) {
        sendResponse({
          data: { error: '缺少签名信息' },
        })
        return true
      }
      console.log('background 收到签名请求:', message);

      const signatureStore = useSignatureStore.getState()
      const walletStore = useWalletStore.getState()
      console.log('walletStore in background:', walletStore);
      console.log('signatureStore in background:', signatureStore);

      try {
        console.log('🎯 开始创建签名请求...')
        console.log('📊 SignatureStore状态:', signatureStore)
        console.log('📝 请求数据:', message.data)

        // 获取DApp信息
        const origin = sender.tab?.url || 'unknown'
        const url = new URL(origin)
        const favicon = `https://www.google.com/s2/favicons?domain=${url.hostname}&sz=64`

        console.log('🌐 DApp信息:', { origin, favicon })

        // 添加签名请求到store
        const requestId = signatureStore.addRequest({
          message: message.data.message,
          origin,
          favicon,
          title:"测试"
        })

        console.log(`🔐 创建签名请求: ${requestId}`, {
          message: message.data.message,
          origin
        })

        // 验证请求是否真的被保存了
        const savedRequest = signatureStore.getRequest(requestId)
        console.log('✅ 验证保存的请求:', savedRequest)
        console.log('📊 当前所有请求:', signatureStore.getPendingRequests())

        // 检查Chrome storage中的数据
        chrome.storage.local.get('signature-requests').then(result => {
          console.log('💾 Background - Chrome storage数据:', result['signature-requests'])
        })

        // 返回请求ID，让injected-helper等待结果
        sendResponse({
          data: { requestId, status: 'pending' }
        })

        // 简单设置Badge
        chrome.action.setBadgeText({ text: "1" })
        chrome.action.setBadgeBackgroundColor({ color: "#FF0000" })

        console.log('✅ 设置Badge成功:', requestId)

        // 尝试通知popup（如果打开）
        chrome.runtime.sendMessage({
          type: 'SIGNATURE_REQUEST_CREATED',
          data: { requestId }
        }).catch(() => {
          // Popup可能没有打开，忽略错误
          console.log('📱 Popup未打开，等待用户主动打开')
        })

      } catch (error) {
        sendResponse({
          data: { error: error instanceof Error ? error.message : '创建签名请求失败' },
        })
      }
      return true
    }

    // 检查签名状态
    if (message.type === constant.WALLET_CHECK_SIGNATURE_STATUS) {
      const signatureStore = useSignatureStore.getState()
      console.log('🔍 Background: 检查签名状态, requestId:', message.data?.requestId)

      if (!message.data || !message.data.requestId) {
        console.log('❌ Background: 缺少请求ID')
        sendResponse({
          data: { error: '缺少请求ID' }
        })
        return true
      }

      // 直接从Chrome storage检查最新状态
      chrome.storage.local.get('signature-requests').then(result => {
        const storageData = result['signature-requests']
        console.log('🔍 Background: Chrome存储数据:', storageData)

        if (storageData && storageData.state && storageData.state.requests) {
          const request = storageData.state.requests.find(req => req.id === message.data.requestId)
          console.log('🔍 Background: 找到请求:', request)

          if (!request) {
            console.log('❌ Background: 签名请求不存在或已过期')
            sendResponse({
              data: { error: '签名请求不存在或已过期' }
            })
            return
          }

          console.log('🔍 Background: 请求状态:', request.status, '结果:', request.result)

          if (request.status === 'approved' && request.result) {
            console.log('✅ Background: 签名已批准，返回结果')
            sendResponse({
              data: {
                status: 'completed',
                result: request.result
              }
            })
          } else if (request.status === 'rejected') {
            console.log('❌ Background: 签名被拒绝')
            sendResponse({
              data: {
                status: 'completed',
                error: request.error || '用户拒绝签名'
              }
            })
          } else {
            console.log('⏳ Background: 签名仍在处理中')
            sendResponse({
              data: {
                status: 'pending'
              }
            })
          }

          // 检查是否还有其他待处理的请求，更新Badge
          const remainingRequests = storageData.state.requests.filter(req => req.status === 'pending')
          if (remainingRequests.length === 0) {
            // 清除Badge
            chrome.action.setBadgeText({ text: "" })
            console.log('✅ 清除Badge，所有签名请求已处理')
          } else {
            // 更新Badge数量
            chrome.action.setBadgeText({ text: remainingRequests.length.toString() })
            console.log(`📊 更新Badge数量: ${remainingRequests.length}`)
          }
        } else {
          console.log('❌ Background: 没有找到签名存储数据')
          sendResponse({
            data: { error: '没有找到签名请求' }
          })
        }
      }).catch(error => {
        console.error('❌ Background: 检查Chrome storage失败:', error)
        sendResponse({
          data: { error: error instanceof Error ? error.message : '检查存储失败' }
        })
      })

      return true
    }

    // 处理断开连接
    if (message.type === constant.WALLET_DISCONNECT) {
      const walletStore = useWalletStore.getState()
      walletStore.disconnect()
      sendResponse({
        data: { success: true }
      })
      return true
    }

    // 测试签名存储功能
    if (message.type === 'test_signature_store') {
      const signatureStore = useSignatureStore.getState()
      console.log('🧪 Background: 收到签名存储测试请求')

      signatureStore.testStorage().then(result => {
        console.log('🧪 Background: 签名存储测试结果:', result)
        sendResponse({
          data: result
        })
      }).catch(error => {
        console.error('🧪 Background: 签名存储测试失败:', error)
        sendResponse({
          data: {
            success: false,
            error: error instanceof Error ? error.message : '测试失败'
          }
        })
      })
      return true
    }

    // 未知类型消息
    sendResponse({
      data: { error: '未知消息类型' },
    })
    return true
  })
}

// 注入钱包脚本到页面
const setupScriptInjection = () => {
  // 当页面加载完成时注入
  chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.url && !tab.url.startsWith('chrome://')) {
      console.log("🔄 页面加载完成，开始注入 myWallet:", tab.url)
      chrome.scripting.executeScript({
        target: { tabId },
        world: "MAIN",
        func: injectMyWallet
      }, () => {
        if (chrome.runtime.lastError) {
          console.error("❌ Background script: 注入失败", chrome.runtime.lastError)
        } else {
          console.log("✅ Background script: myWallet 注入完成")
        }
      })
    }
  })

  // 当标签页激活时也注入（备用机制）
  chrome.tabs.onActivated.addListener((e) => {
    chrome.tabs.get(e.tabId, (tab) => {
      if (tab.url && !tab.url.startsWith('chrome://')) {
        console.log("🔄 标签页激活，注入 myWallet:", tab.url)
        chrome.scripting.executeScript({
          target: { tabId: e.tabId },
          world: "MAIN",
          func: injectMyWallet
        }, () => {
          if (chrome.runtime.lastError) {
            console.error("❌ Background script: 注入失败", chrome.runtime.lastError)
          } else {
            console.log("✅ Background script: myWallet 注入完成")
          }
        })  
      }
    })  
  })
}

// 初始化
initWallet()
setupMessageListener()
setupScriptInjection()

// 监听扩展安装事件
chrome.runtime.onInstalled.addListener((details) => {
  console.log('🔄 扩展安装事件:', details.reason);
  if (details.reason === 'install') {
    // 执行安装时的操作
    console.log('🔄 扩展安装完成');
  }
})