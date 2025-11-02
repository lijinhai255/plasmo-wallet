import { useWalletStore } from '../../store/WalletStore';
import { useChainStore } from '../../store/ChainStore';
import injectPlasmoWallet from './injected-helper';
import * as constant from './type_constant';
import { getRPCService, RPCRequest, RPCResponse } from '../services/rpc-service';

console.log('background 脚本启动了');

// 处理EIP-1193标准请求
const handleEthereumRequest = async (message: any, sender: chrome.runtime.MessageSender, sendResponse: (response: any) => void) => {
  console.log('🔄 处理EIP-1193请求:', message.method, message.params);

  const walletStore = useWalletStore.getState();
  const chainStore = useChainStore.getState();
  const rpcService = getRPCService();

  try {
    // 确保钱包已初始化
    if (!walletStore.isInitialized) {
      walletStore.initializeWallet();
    }

    const { method, params = [], requestId } = message;

    // 构建RPC请求
    const rpcRequest: RPCRequest = {
      method,
      params,
      id: requestId
    };

    // 处理需要用户确认的操作
    if (requiresUserConfirmation(method)) {
      // 显示确认UI（这里简化处理，实际应该弹出确认页面）
      const confirmed = await showConfirmationDialog(method, params, sender.tab?.id);

      if (!confirmed) {
        throw new Error('用户取消了操作');
      }
    }

    // 使用RPC服务处理请求
    const rpcResponse: RPCResponse = await rpcService.handleRequest(rpcRequest);

    if (rpcResponse.error) {
      throw new Error(rpcResponse.error.message);
    }

    const result = rpcResponse.result;

    // 发送成功响应
    sendResponse({
      success: true,
      data: result,
      requestId,
      from: 'background'
    });

    console.log('✅ EIP-1193请求处理成功:', method, result);

  } catch (error) {
    console.error('❌ EIP-1193请求处理失败:', method, error);

    // 发送错误响应
    sendResponse({
      success: false,
      error: error instanceof Error ? error.message : '未知错误',
      requestId,
      from: 'background'
    });
  }

  return true; // 表示异步响应
};

/**
 * 检查是否需要用户确认
 */
function requiresUserConfirmation(method: string): boolean {
  const confirmationRequiredMethods = [
    'eth_sendTransaction',
    'personal_sign',
    'eth_signTypedData_v4',
    'wallet_switchEthereumChain',
    'wallet_addEthereumChain'
  ];

  return confirmationRequiredMethods.includes(method);
}

/**
 * 显示确认对话框（简化版本，实际应该创建确认页面）
 */
async function showConfirmationDialog(method: string, params: any[], tabId?: number): Promise<boolean> {
  console.log(`🔄 需要用户确认: ${method}`, params);

  // 这里应该创建一个确认页面或弹窗
  // 目前简化处理，直接返回true
  // 在实际应用中，你应该：
  // 1. 创建一个确认页面
  // 2. 显示交易/签名详情
  // 3. 等待用户确认或取消
  // 4. 返回用户的决定

  return new Promise((resolve) => {
    // 模拟用户确认（实际应该显示UI）
    setTimeout(() => {
      // 暂时自动确认，用于测试
      console.log('✅ 用户确认操作');
      resolve(true);
    }, 100);
  });
}

// 初始化钱包状态
const initWallet = () => {
  const walletStore = useWalletStore.getState()
  // TODO 初始化逻辑
  console.log('🔄 初始化钱包状态完成');
}

// 注册消息监听器
const setupMessageListener = () => {
  console.log('🔄 监听来自 message-bridge 和 ethereum-provider 的消息');
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log("background 收到消息:", message.type, "来自标签页：", sender.tab?.id);

    const walletStore = useWalletStore.getState()

    // 处理EIP-1193标准请求
    if (message.type === 'ETHEREUM_REQUEST') {
      return handleEthereumRequest(message, sender, sendResponse)
    }

    // 处理连接请求 (向后兼容)
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