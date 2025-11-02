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
    <div className="w-full h-full bg-white p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">网络管理</h1>
            <p className="text-gray-600 mt-1">管理您的区块链网络配置</p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={testAllConnections}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors">
              🔄 测试所有连接
            </button>
            <button
              onClick={() => setShowAddForm(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
              ➕ 添加网络
            </button>
          </div>
        </div>

        {/* Current Network Status */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white mb-6">
          <h2 className="text-lg font-semibold mb-4">当前网络</h2>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xl font-bold">{currentNetwork.name}</div>
              <div className="text-white/80">
                Chain ID: {currentNetwork.chainId} • {currentNetwork.symbol}
              </div>
              <div className="text-white/60 text-sm mt-1">
                {currentNetwork.rpcUrl}
              </div>
            </div>
            <div className="text-right">
              <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${
                connectionStatus === 'connected'
                  ? 'bg-green-500 text-white'
                  : connectionStatus === 'connecting'
                  ? 'bg-yellow-500 text-white'
                  : 'bg-red-500 text-white'
              }`}>
                {connectionStatus === 'connected' && '✓ 已连接'}
                {connectionStatus === 'connecting' && '⟳ 连接中'}
                {connectionStatus === 'error' && '✗ 连接失败'}
                {connectionStatus === 'disconnected' && '○ 未连接'}
              </div>
              {lastError && (
                <div className="text-red-200 text-sm mt-2 max-w-xs">
                  {lastError}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Network List */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">所有网络</h2>

          {networks.map((network) => (
            <div
              key={network.id}
              className={`border rounded-lg p-4 ${
                network.id === currentNetwork.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 bg-white'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">🌐</span>
                    <div>
                      <div className="font-medium text-gray-900">{network.name}</div>
                      <div className="text-sm text-gray-600">
                        {network.symbol} • Chain ID: {network.chainId}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {network.rpcUrl}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {/* Connection Status */}
                  <div className={`flex items-center space-x-1 px-2 py-1 rounded text-xs ${
                    testResults[network.id] === true
                      ? 'bg-green-100 text-green-700'
                      : testResults[network.id] === false
                      ? 'bg-red-100 text-red-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}>
                    <div className={`w-2 h-2 rounded-full ${
                      testResults[network.id] === true
                        ? 'bg-green-500'
                        : testResults[network.id] === false
                        ? 'bg-red-500'
                        : 'bg-gray-400'
                    }`}></div>
                    <span>
                      {testResults[network.id] === true && '连接正常'}
                      {testResults[network.id] === false && '连接失败'}
                      {testResults[network.id] === undefined && '未测试'}
                    </span>
                  </div>

                  {/* Current Network Badge */}
                  {network.id === currentNetwork.id && (
                    <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-medium">
                      当前
                    </span>
                  )}

                  {/* Default Network Badge */}
                  {isDefaultNetwork(network.id) && (
                    <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                      默认
                    </span>
                  )}

                  {/* Action Buttons */}
                  <div className="flex space-x-1">
                    <button
                      onClick={() => handleTestConnection(network.id)}
                      className="text-blue-600 hover:text-blue-700 p-1 text-sm"
                      title="测试连接">
                      🔄
                    </button>

                    {network.id !== currentNetwork.id && (
                      <button
                        onClick={() => handleSwitchNetwork(network.id)}
                        disabled={isLoading}
                        className="text-green-600 hover:text-green-700 p-1 text-sm disabled:opacity-50"
                        title="切换网络">
                        ⚡
                      </button>
                    )}

                    {!isDefaultNetwork(network.id) && (
                      <>
                        <button
                          onClick={() => startEdit(network)}
                          className="text-yellow-600 hover:text-yellow-700 p-1 text-sm"
                          title="编辑网络">
                          ✏️
                        </button>
                        <button
                          onClick={() => handleDeleteNetwork(network.id)}
                          className="text-red-600 hover:text-red-700 p-1 text-sm"
                          title="删除网络">
                          🗑️
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Block Explorer */}
              {network.blockExplorerUrl && (
                <div className="mt-3 text-xs text-gray-500">
                  区块浏览器: {new URL(network.blockExplorerUrl).hostname}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Add/Edit Network Form */}
        {(showAddForm || editingNetwork) && (
          <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
            <div className="bg-white rounded-lg p-6 m-4 max-w-lg w-full max-h-[90vh] overflow-y-auto">
              <h3 className="text-lg font-bold mb-4">
                {editingNetwork ? '编辑网络' : '添加新网络'}
              </h3>

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

              <div className="space-y-4">
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
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
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
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    onClick={editingNetwork ? handleUpdateNetwork : handleAddNetwork}
                    disabled={isSubmitting}
                    className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                    {isSubmitting ? '处理中...' : (editingNetwork ? '更新网络' : '添加网络')}
                  </button>
                  <button
                    onClick={() => {
                      setShowAddForm(false);
                      setEditingNetwork(null);
                      resetForm();
                    }}
                    className="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors">
                    取消
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Statistics */}
        <div className="mt-8 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-sm font-medium text-gray-700 mb-2">网络统计</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-600">总网络数:</span>
              <span className="ml-2 font-medium">{networks.length}</span>
            </div>
            <div>
              <span className="text-gray-600">连接正常:</span>
              <span className="ml-2 font-medium text-green-600">
                {Object.values(testResults).filter(r => r === true).length}
              </span>
            </div>
            <div>
              <span className="text-gray-600">连接失败:</span>
              <span className="ml-2 font-medium text-red-600">
                {Object.values(testResults).filter(r => r === false).length}
              </span>
            </div>
            <div>
              <span className="text-gray-600">未测试:</span>
              <span className="ml-2 font-medium text-gray-600">
                {networks.length - Object.keys(testResults).length}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NetworkManagerPage