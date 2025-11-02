import React, { useState } from 'react';
import { useWalletStore } from '../stores/walletStore';

export const WalletDashboard = () => {
  const [showBalance, setShowBalance] = useState(true);
  const [copiedAddress, setCopiedAddress] = useState(false);

  const { currentAccount, currentNetwork, lockWallet } = useWalletStore();
  console.log(currentAccount);
  console.log(currentNetwork);

  const copyAddress = async () => {
    if (currentAccount?.address) {
      await navigator.clipboard.writeText(currentAccount.address);
      setCopiedAddress(true);
      setTimeout(() => setCopiedAddress(false), 2000);
      alert('地址已复制到剪贴板');
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (!currentAccount) {
    return (
      <div className="w-full h-full bg-white p-6 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500">没有找到账户信息</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-white p-4">
      <div className="max-w-md mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold">W</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                MyWallet
              </h1>
              <p className="text-sm text-gray-600">
                {currentAccount.name}
              </p>
            </div>
          </div>
          <button
            onClick={lockWallet}
            className="text-gray-500 hover:text-gray-700 p-2"
          >
            🚪
          </button>
        </div>

        {/* Account Info Card */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="text-white/80 text-sm">当前账户</div>
            <div className="bg-white/20 px-2 py-1 rounded text-sm">
              {currentNetwork.name}
            </div>
          </div>

          <div className="flex items-center gap-3 mb-4">
            <div className="text-lg font-bold text-white">
              {currentAccount.name}
            </div>
            <button
              onClick={copyAddress}
              className="text-white/80 hover:text-white p-1"
            >
              {copiedAddress ? '✅' : '📋'}
            </button>
          </div>

          <div className="text-white/60 text-sm font-mono">
            {formatAddress(currentAccount.address)}
          </div>
        </div>

        {/* Balance Card */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-900">
              钱包余额
            </h3>
            <button
              onClick={() => setShowBalance(!showBalance)}
              className="text-gray-500 hover:text-gray-700 p-1"
            >
              {showBalance ? '🙈' : '👁️'}
            </button>
          </div>
          <div className="text-lg font-bold">
            {showBalance ? `0.0000 ${currentNetwork.symbol}` : '••••••'}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          <button className="bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700">
            ➤ 转账
          </button>
          <button className="border border-gray-300 py-3 px-4 rounded-md hover:bg-gray-50">
            ➕ 添加代币
          </button>
        </div>
      </div>
    </div>
  );
};