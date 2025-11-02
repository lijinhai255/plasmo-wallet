import { useWalletStore } from '../../store/WalletStore';
import injectPlasmoWallet from './injected-helper';
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

    const walletStore = useWalletStore.getState()

    // 处理连接请求
    if (message.type === constant.WALLET_CONNECT) {
      try {
        // 确保钱包已初始化
        if (!walletStore.isInitialized) {
          walletStore.initializeWallet()
        }

        const currentWallet = walletStore.currentWallet
        sendResponse({
          data: { account: currentWallet?.address || null }
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
      const currentWallet = walletStore.currentWallet
      sendResponse({
        data: { account: currentWallet?.address || null }
      })
      return true
    }

    // 处理签名
    if (message.type === constant.WALLET_SIGN_MESSAGE) {
      if (!message.data || !message.data.message) {
        sendResponse({
          data: { error: '缺少签名信息' },
        })
        return true
      }

      try {
        // TODO: 实现签名功能
        const privateKey = walletStore.currentWallet?.privateKey
        if (!privateKey) {
          throw new Error('钱包未解锁')
        }

        // 这里应该实现真实的签名逻辑
        const signedMessage = `signed_${message.data.message}`

        sendResponse({
          data: { signedMessage }
        })
      } catch (error) {
        sendResponse({
          data: { error: error instanceof Error ? error.message : '签名失败' },
        })
      }
      return true
    }

    // 处理断开连接
    if (message.type === constant.WALLET_DISCONNECT) {
      // 锁定钱包
      walletStore.lockWallet()
      sendResponse({
        data: { success: true }
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
      console.log("🔄 页面加载完成，开始注入 plasmoWallet:", tab.url)
      chrome.scripting.executeScript({
        target: { tabId },
        world: "MAIN",
        func: injectPlasmoWallet
      }, () => {
        if (chrome.runtime.lastError) {
          console.error("❌ Background script: 注入失败", chrome.runtime.lastError)
        } else {
          console.log("✅ Background script: plasmoWallet 注入完成")
        }
      })
    }
  })

  // 当标签页激活时也注入（备用机制）
  chrome.tabs.onActivated.addListener((e) => {
    chrome.tabs.get(e.tabId, (tab) => {
      if (tab.url && !tab.url.startsWith('chrome://')) {
        console.log("🔄 标签页激活，注入 plasmoWallet:", tab.url)
        chrome.scripting.executeScript({
          target: { tabId: e.tabId },
          world: "MAIN",
          func: injectPlasmoWallet
        }, () => {
          if (chrome.runtime.lastError) {
            console.error("❌ Background script: 注入失败", chrome.runtime.lastError)
          } else {
            console.log("✅ Background script: plasmoWallet 注入完成")
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