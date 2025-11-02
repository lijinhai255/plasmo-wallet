/**
 * DApp测试页面 - 用于测试window.ethereum接口功能
 * 模拟一个简单的DApp，测试各种以太坊提供者方法
 */

import React, { useState, useEffect } from 'react';
import { useWalletStore } from '../store/WalletStore';
import { useChainStore } from '../store/ChainStore';

interface TestResult {
  method: string;
  status: 'pending' | 'success' | 'error';
  result?: any;
  error?: string;
  timestamp: number;
}

function DAppTestPage() {
  const [connected, setConnected] = useState(false);
  const [account, setAccount] = useState<string | null>(null);
  const [chainId, setChainId] = useState<string | null>(null);
  const [balance, setBalance] = useState<string>('0');
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(false);

  const walletStore = useWalletStore();
  const chainStore = useChainStore();

  useEffect(() => {
    // 检查是否有window.ethereum
    checkProvider();
  }, []);

  const checkProvider = () => {
    if (typeof window !== 'undefined' && window.ethereum) {
      console.log('✅ 检测到window.ethereum:', window.ethereum);

      // 监听账户变化
      window.ethereum.on('accountsChanged', (accounts: string[]) => {
        console.log('🔄 账户变化:', accounts);
        setAccount(accounts[0] || null);
        setConnected(accounts.length > 0);
      });

      // 监听链变化
      window.ethereum.on('chainChanged', (chainId: string) => {
        console.log('🔄 链变化:', chainId);
        setChainId(chainId);
      });

      // 监听连接
      window.ethereum.on('connect', (connectInfo: { chainId: string }) => {
        console.log('🔄 钱包已连接:', connectInfo);
        setChainId(connectInfo.chainId);
      });

      // 监听断开
      window.ethereum.on('disconnect', (error: { code: number; message: string }) => {
        console.log('🔄 钱包已断开:', error);
        setConnected(false);
        setAccount(null);
      });

    } else {
      console.log('❌ 未检测到window.ethereum');
    }
  };

  const addTestResult = (method: string, status: 'success' | 'error', result?: any, error?: string) => {
    const newResult: TestResult = {
      method,
      status,
      result,
      error,
      timestamp: Date.now()
    };

    setTestResults(prev => [newResult, ...prev].slice(0, 10)); // 只保留最新10条
  };

  const testMethod = async (method: string, params: any[] = []) => {
    if (!window.ethereum) {
      addTestResult(method, 'error', undefined, 'window.ethereum 不可用');
      return;
    }

    setLoading(true);
    addTestResult(method, 'pending');

    try {
      console.log(`🧪 测试方法: ${method}`, params);

      const result = await window.ethereum.request({
        method,
        params
      });

      console.log(`✅ ${method} 结果:`, result);
      addTestResult(method, 'success', result);

      // 更新状态
      if (method === 'eth_requestAccounts' || method === 'eth_accounts') {
        setAccount(result[0] || null);
        setConnected(result.length > 0);
      } else if (method === 'eth_chainId') {
        setChainId(result);
      } else if (method === 'eth_getBalance' && account) {
        setBalance((parseInt(result, 16) / 1e18).toFixed(6));
      }

    } catch (error) {
      console.error(`❌ ${method} 错误:`, error);
      addTestResult(method, 'error', undefined, error instanceof Error ? error.message : '未知错误');
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    await testMethod('eth_requestAccounts');
  };

  const handleDisconnect = () => {
    setConnected(false);
    setAccount(null);
    setChainId(null);
    setBalance('0');
  };

  const testBasicMethods = async () => {
    await testMethod('eth_accounts');
    await testMethod('eth_chainId');
    if (account) {
      await testMethod('eth_getBalance', [account]);
    }
  };

  const testSignMethods = async () => {
    const message = 'Hello from Plasmo Wallet!';
    await testMethod('personal_sign', [message, account]);

    const typedData = {
      types: {
        EIP712Domain: [
          { name: 'name', type: 'string' },
          { name: 'version', type: 'string' },
          { name: 'chainId', type: 'uint256' },
          { name: 'verifyingContract', type: 'address' }
        ],
        Message: [
          { name: 'content', type: 'string' }
        ]
      },
      domain: {
        name: 'Plasmo Wallet Test',
        version: '1',
        chainId: chainId ? parseInt(chainId, 16) : 11155111,
        verifyingContract: '0x0000000000000000000000000000000000000000'
      },
      message: {
        content: 'Test typed data signature'
      }
    };
    await testMethod('eth_signTypedData_v4', [account, typedData]);
  };

  const testTransactionMethods = async () => {
    // 获取交易数量
    if (account) {
      await testMethod('eth_getTransactionCount', [account]);
    }

    // 获取Gas价格
    await testMethod('eth_gasPrice');

    // 注意：实际交易会消耗真实资金，这里只测试，不实际发送
    const testTx = {
      to: '0x742d35Cc6634C0532925a3b8D4E7E0e0e9e0d8F5',
      value: '0x0', // 0 ETH
      data: '0x'
    };

    // 注释掉实际交易，避免误操作
    // await testMethod('eth_sendTransaction', [testTx]);
  };

  const testChainMethods = async () => {
    // 测试切换链（仅测试，不实际切换）
    console.log('跳过链切换测试，避免影响当前连接');
    // await testMethod('wallet_switchEthereumChain', [{ chainId: '0x1' }]);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'text-green-600';
      case 'error': return 'text-red-600';
      case 'pending': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'pending': return '⏳';
      default: return '❓';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">DApp Provider 测试页面</h1>
          <p className="text-gray-600">测试 window.ethereum 接口的各项功能</p>
        </div>

        {/* Provider Status */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">提供者状态</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600">Provider</div>
              <div className="font-semibold">
                {typeof window !== 'undefined' && window.ethereum ? '✅ 可用' : '❌ 不可用'}
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600">连接状态</div>
              <div className="font-semibold">
                {connected ? '✅ 已连接' : '❌ 未连接'}
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600">账户</div>
              <div className="font-mono text-xs">
                {account ? `${account.slice(0, 6)}...${account.slice(-4)}` : '未连接'}
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600">链ID</div>
              <div className="font-semibold">
                {chainId || '未知'}
              </div>
            </div>
          </div>

          {connected && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <div className="text-sm text-blue-800">
                <div className="font-semibold mb-1">余额</div>
                <div className="text-lg font-bold">{balance} ETH</div>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">操作测试</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Connection */}
            <div className="space-y-2">
              <h3 className="font-semibold text-gray-700">连接</h3>
              <button
                onClick={handleConnect}
                disabled={loading || connected}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? '连接中...' : '连接钱包'}
              </button>
              <button
                onClick={handleDisconnect}
                disabled={!connected}
                className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50"
              >
                断开连接
              </button>
            </div>

            {/* Basic Methods */}
            <div className="space-y-2">
              <h3 className="font-semibold text-gray-700">基础方法</h3>
              <button
                onClick={testBasicMethods}
                disabled={loading || !connected}
                className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                测试基础方法
              </button>
            </div>

            {/* Sign Methods */}
            <div className="space-y-2">
              <h3 className="font-semibold text-gray-700">签名方法</h3>
              <button
                onClick={testSignMethods}
                disabled={loading || !connected}
                className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
              >
                测试签名方法
              </button>
            </div>

            {/* Transaction Methods */}
            <div className="space-y-2">
              <h3 className="font-semibold text-gray-700">交易方法</h3>
              <button
                onClick={testTransactionMethods}
                disabled={loading || !connected}
                className="w-full px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50"
              >
                测试交易方法
              </button>
            </div>

            {/* Chain Methods */}
            <div className="space-y-2">
              <h3 className="font-semibold text-gray-700">链方法</h3>
              <button
                onClick={testChainMethods}
                disabled={loading || !connected}
                className="w-full px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50"
              >
                测试链方法
              </button>
            </div>

            {/* Clear Results */}
            <div className="space-y-2">
              <h3 className="font-semibold text-gray-700">清理</h3>
              <button
                onClick={() => setTestResults([])}
                className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                清理结果
              </button>
            </div>
          </div>
        </div>

        {/* Test Results */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">测试结果</h2>

          {testResults.length === 0 ? (
            <p className="text-gray-500 text-center py-8">暂无测试结果，点击上方按钮开始测试</p>
          ) : (
            <div className="space-y-3">
              {testResults.map((result, index) => (
                <div
                  key={`${result.timestamp}-${index}`}
                  className="border rounded-lg p-4"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className={getStatusColor(result.status)}>
                          {getStatusIcon(result.status)}
                        </span>
                        <span className="font-mono text-sm font-semibold">
                          {result.method}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(result.timestamp).toLocaleTimeString()}
                        </span>
                      </div>

                      {result.status === 'success' && (
                        <div className="mt-2">
                          <div className="text-sm font-medium text-green-700 mb-1">结果:</div>
                          <div className="bg-gray-50 p-2 rounded text-xs font-mono break-all">
                            {typeof result.result === 'object'
                              ? JSON.stringify(result.result, null, 2)
                              : String(result.result)
                            }
                          </div>
                        </div>
                      )}

                      {result.status === 'error' && (
                        <div className="mt-2">
                          <div className="text-sm font-medium text-red-700 mb-1">错误:</div>
                          <div className="bg-red-50 p-2 rounded text-xs text-red-800">
                            {result.error}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default DAppTestPage;