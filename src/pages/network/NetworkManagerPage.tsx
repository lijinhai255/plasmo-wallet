import React, { useState, useEffect } from 'react';
import { useNetworkStore } from '@/stores/networkStore';
import { Network } from '@/types/wallet';

export const NetworkManagerPage: React.FC = () => {
  const {
    currentNetwork,
    networks,
    isLoading,
    connectionStatus,
    lastError,
    switchNetwork,
    addNetwork,
    removeNetwork,
    updateNetwork,
    testConnection,
    validateNetwork
  } = useNetworkStore();

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingNetwork, setEditingNetwork] = useState<Network | null>(null);
  const [testResults, setTestResults] = useState<Record<string, boolean>>({});
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    rpcUrl: '',
    chainId: '',
    symbol: '',
    blockExplorerUrl: ''
  });
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Test all network connections on mount
    testAllConnections();
  }, []);

  const testAllConnections = async () => {
    const results: Record<string, boolean> = {};
    for (const network of networks) {
      results[network.id] = await testConnection(network.id);
    }
    setTestResults(results);
  };

  const validateForm = () => {
    const validation = validateNetwork(formData);
    setValidationErrors(validation.errors);
    return validation.isValid;
  };

  const handleAddNetwork = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      await addNetwork(formData as Network);
      setShowAddForm(false);
      resetForm();
      alert('网络添加成功！');
      // Test the new network
      const result = await testConnection(formData.id);
      setTestResults(prev => ({ ...prev, [formData.id]: result }));
    } catch (error) {
      alert(`添加网络失败: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateNetwork = async () => {
    if (!editingNetwork || !validateForm()) return;

    setIsSubmitting(true);
    try {
      await updateNetwork(editingNetwork.id, formData);
      setEditingNetwork(null);
      resetForm();
      alert('网络更新成功！');
      // Test the updated network
      const result = await testConnection(editingNetwork.id);
      setTestResults(prev => ({ ...prev, [editingNetwork.id]: result }));
    } catch (error) {
      alert(`更新网络失败: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteNetwork = async (networkId: string) => {
    if (!confirm('确定要删除这个网络吗？此操作不可撤销。')) return;

    try {
      await removeNetwork(networkId);
      alert('网络删除成功！');
      setTestResults(prev => {
        const newResults = { ...prev };
        delete newResults[networkId];
        return newResults;
      });
    } catch (error) {
      alert(`删除网络失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  };

  const handleSwitchNetwork = async (networkId: string) => {
    if (isLoading || networkId === currentNetwork.id) return;

    try {
      await switchNetwork(networkId);
      alert(`已切换到 ${networks.find(n => n.id === networkId)?.name}`);
      // Test the connection after switching
      const result = await testConnection(networkId);
      setTestResults(prev => ({ ...prev, [networkId]: result }));
    } catch (error) {
      alert(`切换网络失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  };

  const handleTestConnection = async (networkId: string) => {
    const result = await testConnection(networkId);
    setTestResults(prev => ({ ...prev, [networkId]: result }));
    alert(result ? '连接测试成功！' : '连接测试失败！');
  };

  const startEdit = (network: Network) => {
    setEditingNetwork(network);
    setFormData({
      id: network.id,
      name: network.name,
      rpcUrl: network.rpcUrl,
      chainId: network.chainId.toString(),
      symbol: network.symbol,
      blockExplorerUrl: network.blockExplorerUrl || ''
    });
    setValidationErrors([]);
  };

  const resetForm = () => {
    setFormData({
      id: '',
      name: '',
      rpcUrl: '',
      chainId: '',
      symbol: '',
      blockExplorerUrl: ''
    });
    setValidationErrors([]);
  };

  const isDefaultNetwork = (networkId: string) => {
    return ['ethereum', 'sepolia', 'polygon', 'polygon-amoy'].includes(networkId);
  };

  return (
    <div className="w-full h-full bg-white p-4">
      <div className="max-w-md mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">🌐 网络管理</h1>
            <p className="text-gray-600 text-sm">
              管理您的区块链网络配置
            </p>
          </div>
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 transition-colors font-medium text-sm">
            ➕ 添加网络
          </button>
        </div>

        {/* Current Network Status */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-4 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className="text-2xl">🌐</span>
              <div>
                <div className="text-lg font-bold text-white">{currentNetwork.name}</div>
                <div className="text-white/80 text-sm">
                  Chain ID: {currentNetwork.chainId} • {currentNetwork.symbol}
                </div>
              </div>
            </div>
            <div className={`w-3 h-3 rounded-full ${
              connectionStatus === 'connected'
                ? "bg-green-400"
                : connectionStatus === 'connecting'
                ? "bg-yellow-400"
                : "bg-red-400"
            }`}></div>
          </div>
          {lastError && (
            <div className="mt-2 text-sm text-red-100 bg-red-400/20 rounded p-2">
              ⚠️ {lastError}
            </div>
          )}
        </div>

        {/* Network List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">所有网络</h2>
            <button
              onClick={testAllConnections}
              className="bg-green-600 text-white py-2 px-3 rounded-md hover:bg-green-700 transition-colors font-medium text-xs">
              🔄 测试所有
            </button>
          </div>

          {networks.map((network) => (
            <div
              key={network.id}
              className={`border rounded-lg p-3 ${
                network.id === currentNetwork.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 bg-white'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <span className="text-lg">🌐</span>
                  <div>
                    <div className="font-medium text-gray-900 text-sm">{network.name}</div>
                    <div className="text-xs text-gray-600">
                      {network.symbol} • ID: {network.chainId}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-1">
                  {network.id === currentNetwork.id && (
                    <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-medium">
                      当前
                    </span>
                  )}

                  <div className={`w-2 h-2 rounded-full ${
                    testResults[network.id] === true
                      ? 'bg-green-500'
                      : testResults[network.id] === false
                      ? 'bg-red-500'
                      : 'bg-gray-400'
                  }`}></div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="text-xs text-gray-500 truncate flex-1 mr-2">
                  {network.rpcUrl}
                </div>

                <div className="flex items-center space-x-1">
                  {network.id !== currentNetwork.id && (
                    <button
                      onClick={() => handleSwitchNetwork(network.id)}
                      disabled={isLoading}
                      className="text-green-600 hover:text-green-700 p-1 text-xs disabled:opacity-50"
                      title="切换网络">
                      ⚡
                    </button>
                  )}

                  {!isDefaultNetwork(network.id) && (
                    <>
                      <button
                        onClick={() => startEdit(network)}
                        className="text-yellow-600 hover:text-yellow-700 p-1 text-xs"
                        title="编辑网络">
                        ✏️
                      </button>
                      <button
                        onClick={() => handleDeleteNetwork(network.id)}
                        className="text-red-600 hover:text-red-700 p-1 text-xs"
                        title="删除网络">
                        🗑️
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Block Explorer */}
              {network.blockExplorerUrl && (
                <div className="mt-2 text-xs text-gray-500">
                  浏览器: {new URL(network.blockExplorerUrl).hostname}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Add/Edit Network Form */}
        {(showAddForm || editingNetwork) && (
          <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full max-h-[80vh] flex flex-col">
              <div className="p-4 border-b border-gray-200">
                <h3 className="text-lg font-bold text-gray-900">
                  {editingNetwork ? '编辑网络' : '添加新网络'}
                </h3>
              </div>

              <div className="flex-1 overflow-y-auto p-4">
                {validationErrors.length > 0 && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-600 font-medium mb-1">请修正以下错误:</p>
                    <ul className="text-sm text-red-600 list-disc list-inside">
                      {validationErrors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      网络ID *
                    </label>
                    <input
                      type="text"
                      value={formData.id}
                      onChange={(e) => {
                        setFormData({ ...formData, id: e.target.value });
                        setValidationErrors([]);
                      }}
                      disabled={!!editingNetwork}
                      placeholder="my-custom-network"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                    />
                    {editingNetwork && (
                      <p className="text-xs text-gray-500 mt-1">网络ID不可修改</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      网络名称 *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => {
                        setFormData({ ...formData, name: e.target.value });
                        setValidationErrors([]);
                      }}
                      placeholder="My Custom Network"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      RPC URL *
                    </label>
                    <input
                      type="url"
                      value={formData.rpcUrl}
                      onChange={(e) => {
                        setFormData({ ...formData, rpcUrl: e.target.value });
                        setValidationErrors([]);
                      }}
                      placeholder="https://..."
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Chain ID *
                    </label>
                    <input
                      type="number"
                      value={formData.chainId}
                      onChange={(e) => {
                        setFormData({ ...formData, chainId: e.target.value });
                        setValidationErrors([]);
                      }}
                      placeholder="1"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      代币符号 *
                    </label>
                    <input
                      type="text"
                      value={formData.symbol}
                      onChange={(e) => {
                        setFormData({ ...formData, symbol: e.target.value });
                        setValidationErrors([]);
                      }}
                      placeholder="ETH"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      区块浏览器 (可选)
                    </label>
                    <input
                      type="url"
                      value={formData.blockExplorerUrl}
                      onChange={(e) => {
                        setFormData({ ...formData, blockExplorerUrl: e.target.value });
                        setValidationErrors([]);
                      }}
                      placeholder="https://etherscan.io"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              <div className="p-4 border-t border-gray-200">
                <div className="flex space-x-3">
                  <button
                    onClick={editingNetwork ? handleUpdateNetwork : handleAddNetwork}
                    disabled={isSubmitting}
                    className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm">
                    {isSubmitting ? '处理中...' : (editingNetwork ? '更新网络' : '添加网络')}
                  </button>
                  <button
                    onClick={() => {
                      setShowAddForm(false);
                      setEditingNetwork(null);
                      resetForm();
                    }}
                    className="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors font-medium text-sm">
                    取消
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Statistics */}
        <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600">
          <p>• 已配置 {networks.length} 个网络</p>
          <p>• 连接正常: {Object.values(testResults).filter(r => r === true).length} 个</p>
          <p>• 连接失败: {Object.values(testResults).filter(r => r === false).length} 个</p>
          <p>• 未测试: {networks.length - Object.keys(testResults).length} 个</p>
        </div>
      </div>
    </div>
  );
};

export default NetworkManagerPage