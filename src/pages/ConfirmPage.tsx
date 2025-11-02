/**
 * 交易确认页面
 * 用于显示交易、签名等需要用户确认的操作
 */

import React, { useState, useEffect } from 'react';
import { useWalletStore } from '../store/WalletStore';
import { useChainStore } from '../store/ChainStore';

interface ConfirmationData {
  type: 'transaction' | 'sign' | 'signTypedData' | 'switchChain' | 'addChain';
  method: string;
  params: any[];
  origin?: string;
  requestId?: string;
}

function ConfirmPage() {
  const [confirmationData, setConfirmationData] = useState<ConfirmationData | null>(null);
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const walletStore = useWalletStore();
  const chainStore = useChainStore();

  useEffect(() => {
    // 从URL参数获取确认数据
    const urlParams = new URLSearchParams(window.location.search);
    const dataParam = urlParams.get('data');

    if (dataParam) {
      try {
        const data = JSON.parse(decodeURIComponent(dataParam)) as ConfirmationData;
        setConfirmationData(data);
      } catch (error) {
        console.error('❌ 解析确认数据失败:', error);
      }
    }
  }, []);

  const handleConfirm = async () => {
    if (!confirmationData) return;

    setLoading(true);

    try {
      // 发送确认响应到background script
      const response = await chrome.runtime.sendMessage({
        type: 'CONFIRMATION_RESPONSE',
        action: 'confirm',
        requestId: confirmationData.requestId,
        data: confirmationData
      });

      console.log('✅ 用户确认操作:', response);

      // 关闭确认页面
      window.close();

    } catch (error) {
      console.error('❌ 确认操作失败:', error);
      alert('确认操作失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!confirmationData) return;

    try {
      // 发送取消响应到background script
      await chrome.runtime.sendMessage({
        type: 'CONFIRMATION_RESPONSE',
        action: 'cancel',
        requestId: confirmationData.requestId,
        data: confirmationData
      });

      console.log('❌ 用户取消操作');

      // 关闭确认页面
      window.close();

    } catch (error) {
      console.error('❌ 取消操作失败:', error);
    }
  };

  const renderTransactionDetails = () => {
    if (!confirmationData || confirmationData.type !== 'transaction') return null;

    const [transaction] = confirmationData.params;

    return (
      <div className="bg-gray-50 p-4 rounded-lg mb-4">
        <h4 className="font-semibold mb-2">交易详情</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">从:</span>
            <span className="font-mono text-xs break-all">
              {transaction.from || walletStore.currentWallet?.address}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">到:</span>
            <span className="font-mono text-xs break-all">
              {transaction.to || '新合约部署'}
            </span>
          </div>
          {transaction.value && (
            <div className="flex justify-between">
              <span className="text-gray-600">金额:</span>
              <span>
                {(parseInt(transaction.value, 16) / 1e18).toFixed(6)} ETH
              </span>
            </div>
          )}
          {transaction.gas && (
            <div className="flex justify-between">
              <span className="text-gray-600">Gas限制:</span>
              <span>{parseInt(transaction.gas, 16).toLocaleString()}</span>
            </div>
          )}
          {transaction.gasPrice && (
            <div className="flex justify-between">
              <span className="text-gray-600">Gas价格:</span>
              <span>
                {(parseInt(transaction.gasPrice, 16) / 1e9).toFixed(2)} Gwei
              </span>
            </div>
          )}
          {transaction.data && (
            <div className="mt-3">
              <div className="text-gray-600 mb-1">数据:</div>
              <div className="font-mono text-xs bg-gray-100 p-2 rounded break-all">
                {transaction.data}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderSignDetails = () => {
    if (!confirmationData || (confirmationData.type !== 'sign' && confirmationData.type !== 'signTypedData')) {
      return null;
    }

    const [message] = confirmationData.params;

    return (
      <div className="bg-gray-50 p-4 rounded-lg mb-4">
        <h4 className="font-semibold mb-2">签名详情</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">账户:</span>
            <span className="font-mono text-xs break-all">
              {walletStore.currentWallet?.address}
            </span>
          </div>
          <div className="mt-3">
            <div className="text-gray-600 mb-1">消息:</div>
            <div className="font-mono text-xs bg-gray-100 p-2 rounded break-all max-h-32 overflow-y-auto">
              {confirmationData.type === 'signTypedData'
                ? JSON.stringify(message, null, 2)
                : message
              }
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderChainDetails = () => {
    if (!confirmationData || (confirmationData.type !== 'switchChain' && confirmationData.type !== 'addChain')) {
      return null;
    }

    const [chainConfig] = confirmationData.params;

    return (
      <div className="bg-gray-50 p-4 rounded-lg mb-4">
        <h4 className="font-semibold mb-2">
          {confirmationData.type === 'switchChain' ? '切换网络' : '添加网络'}
        </h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">链ID:</span>
            <span>{chainConfig.chainId}</span>
          </div>
          {chainConfig.chainName && (
            <div className="flex justify-between">
              <span className="text-gray-600">网络名称:</span>
              <span>{chainConfig.chainName}</span>
            </div>
          )}
          {chainConfig.rpcUrls && (
            <div className="mt-3">
              <div className="text-gray-600 mb-1">RPC地址:</div>
              <div className="font-mono text-xs bg-gray-100 p-2 rounded">
                {chainConfig.rpcUrls.join(', ')}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (!confirmationData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">加载确认信息...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="border-b border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900">确认操作</h2>
          {confirmationData.origin && (
            <p className="text-sm text-gray-600 mt-1">
              来源: {new URL(confirmationData.origin).hostname}
            </p>
          )}
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="mb-6">
            <h3 className="font-semibold text-gray-900 mb-2">
              {confirmationData.type === 'transaction' && '发送交易'}
              {confirmationData.type === 'sign' && '签名消息'}
              {confirmationData.type === 'signTypedData' && '签名类型化数据'}
              {confirmationData.type === 'switchChain' && '切换网络'}
              {confirmationData.type === 'addChain' && '添加网络'}
            </h3>

            {renderTransactionDetails()}
            {renderSignDetails()}
            {renderChainDetails()}
          </div>

          {/* Warning */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-6">
            <p className="text-sm text-yellow-800">
              ⚠️ 请仔细检查以上信息，此操作不可撤销
            </p>
          </div>

          {/* Password Input (if needed) */}
          {walletStore.isLocked && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                钱包密码
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="请输入钱包密码"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? '隐藏' : '显示'}
                </button>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <button
              onClick={handleCancel}
              disabled={loading}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              取消
            </button>
            <button
              onClick={handleConfirm}
              disabled={loading || (walletStore.isLocked && !password)}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '处理中...' : '确认'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ConfirmPage;