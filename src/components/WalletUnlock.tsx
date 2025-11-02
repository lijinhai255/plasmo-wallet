import React, { useState } from 'react';
import { useWalletStore } from '../stores/walletStore';

export const WalletUnlock = () => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { unlockWallet } = useWalletStore();

  const handleUnlock = async () => {
    if (!password) {
      alert('请输入密码');
      return;
    }

    setIsLoading(true);
    try {
      const success = unlockWallet(password);
      if (!success) {
        alert('密码错误，请检查您的密码');
      }
    } catch (error) {
      alert('解锁失败：发生未知错误');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleUnlock();
    }
  };

  return (
    <div className="w-full h-full bg-white p-6">
      <div className="w-full max-w-md mx-auto">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-2xl">🔒</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">
            欢迎回来
          </h1>
          <p className="text-gray-600 mt-2">
            请输入密码解锁您的钱包
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                密码
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="输入您的钱包密码"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
                />
                <button
                  type="button"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-gray-100"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            <button
              onClick={handleUnlock}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading || !password}
            >
              {isLoading ? "解锁中..." : "解锁钱包"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};