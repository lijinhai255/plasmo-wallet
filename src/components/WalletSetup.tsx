import React, { useState } from 'react';
import { useWalletStore } from '../stores/walletStore';

export const WalletSetup = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [mnemonic, setMnemonic] = useState('');
  const [privateKey, setPrivateKey] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showMnemonic, setShowMnemonic] = useState(false);
  const [copiedMnemonic, setCopiedMnemonic] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'create' | 'import' | 'privatekey'>('create');

  const { createWallet, importWallet, importPrivateKey } = useWalletStore();

  const handleCreateWallet = async () => {
    if (password !== confirmPassword) {
      alert('密码不匹配，请确保两次输入的密码相同');
      return;
    }

    if (password.length < 8) {
      alert('密码长度至少需要8位');
      return;
    }

    setIsLoading(true);
    try {
      const { mnemonic: newMnemonic } = await createWallet(password);
      setMnemonic(newMnemonic);
      alert('钱包创建成功！请务必备份您的助记词');
    } catch (error) {
      console.log(error);
      alert('创建失败：钱包创建过程中出现错误');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImportWallet = async () => {
    if (!mnemonic.trim()) {
      alert('请输入助记词');
      return;
    }

    if (password.length < 8) {
      alert('密码长度至少需要8位');
      return;
    }

    setIsLoading(true);
    try {
      await importWallet(mnemonic.trim(), password);
      alert('钱包导入成功！');
    } catch (error) {
      alert('导入失败：助记词无效或其他错误');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImportPrivateKey = async () => {
    if (!privateKey.trim()) {
      alert('请输入私钥');
      return;
    }

    if (password.length < 8) {
      alert('密码长度至少需要8位');
      return;
    }

    setIsLoading(true);
    try {
      await importPrivateKey(privateKey.trim(), password);
      alert('私钥导入成功！');
    } catch (error) {
      alert('导入失败：私钥无效或其他错误');
    } finally {
      setIsLoading(false);
    }
  };

  const copyMnemonic = async () => {
    if (mnemonic) {
      await navigator.clipboard.writeText(mnemonic);
      setCopiedMnemonic(true);
      setTimeout(() => setCopiedMnemonic(false), 2000);
      alert('助记词已复制，请安全保存');
    }
  };

  return (
    <div className="w-full h-full bg-white p-6">
      <div className="w-full max-w-md mx-auto">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-2xl font-bold">W</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">
            MyWallet
          </h1>
          <p className="text-gray-600 mt-2">
            安全的以太坊钱包
          </p>
        </div>

        <div className="w-full">
          <div className="flex w-full border-b border-gray-200 mb-6">
            <button
              className={`flex-1 pb-2 text-center ${
                activeTab === 'create'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('create')}
            >
              创建钱包
            </button>
            <button
              className={`flex-1 pb-2 text-center ${
                activeTab === 'import'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('import')}
            >
              导入助记词
            </button>
            <button
              className={`flex-1 pb-2 text-center ${
                activeTab === 'privatekey'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('privatekey')}
            >
              导入私钥
            </button>
          </div>

          {activeTab === 'create' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  设置密码
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="输入密码 (至少8位)"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  确认密码
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="再次输入密码"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {mnemonic && (
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    助记词 (请安全保存)
                  </label>
                  <div className="relative">
                    <textarea
                      value={showMnemonic ? mnemonic : mnemonic.split(' ').map(() => '●●●●').join(' ')}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 rounded-md min-h-[100px] font-mono text-sm"
                    />
                    <div className="absolute top-2 right-2 flex gap-1">
                      <button
                        type="button"
                        className="p-1 hover:bg-gray-100 rounded"
                        onClick={() => setShowMnemonic(!showMnemonic)}
                      >
                        {showMnemonic ? '🙈' : '👁️'}
                      </button>
                      <button
                        type="button"
                        className="p-1 hover:bg-gray-100 rounded"
                        onClick={copyMnemonic}
                      >
                        {copiedMnemonic ? '✅' : '📋'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <button
                onClick={handleCreateWallet}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isLoading || !password || !confirmPassword}
              >
                {isLoading ? "创建中..." : "创建钱包"}
              </button>
            </div>
          )}

          {activeTab === 'import' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  助记词
                </label>
                <textarea
                  value={mnemonic}
                  onChange={(e) => setMnemonic(e.target.value)}
                  placeholder="输入12或24个助记词，用空格分隔"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md min-h-[100px] focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  设置密码
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="输入密码 (至少8位)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <button
                onClick={handleImportWallet}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isLoading || !mnemonic || !password}
              >
                {isLoading ? "导入中..." : "导入钱包"}
              </button>
            </div>
          )}

          {activeTab === 'privatekey' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  私钥
                </label>
                <input
                  type="password"
                  value={privateKey}
                  onChange={(e) => setPrivateKey(e.target.value)}
                  placeholder="输入私钥 (0x开头的64位十六进制字符)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  设置密码
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="输入密码 (至少8位)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <button
                onClick={handleImportPrivateKey}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isLoading || !privateKey || !password}
              >
                {isLoading ? "导入中..." : "导入私钥"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};