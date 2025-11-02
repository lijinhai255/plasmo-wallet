import React, { useEffect, useState } from "react"
import { useChainStore } from "../../store/ChainStore"
import { useBalanceStore } from "../../store/BalanceStore"
import { BalanceDisplay } from "../components/BalanceDisplay"

export const TestPage = () => {
  const chainStore = useChainStore()
  const balanceStore = useBalanceStore()

  const [testAddress, setTestAddress] = useState("")
  const [customTokenAddress, setCustomTokenAddress] = useState("")
  const [testResults, setTestResults] = useState<string[]>([])
  const [isRunningTests, setIsRunningTests] = useState(false)

  // 添加测试结果
  const addTestResult = (message: string, success: boolean = true) => {
    const timestamp = new Date().toLocaleTimeString()
    const result = `[${timestamp}] ${success ? '✅' : '❌'} ${message}`
    setTestResults(prev => [...prev, result])
  }

  // 清除测试结果
  const clearResults = () => {
    setTestResults([])
  }

  // 测试网络连接
  const testNetworkConnection = async () => {
    try {
      addTestResult("开始测试网络连接...")

      // 检查当前网络
      const currentNetwork = chainStore.getNetworkConfig(chainStore.currentChainId)
      if (!currentNetwork) {
        addTestResult("未找到当前网络配置", false)
        return
      }

      addTestResult(`当前网络: ${currentNetwork.chainName} (${currentNetwork.chainId})`)

      // 测试连接状态
      if (!chainStore.connectionState.isConnected) {
        addTestResult("网络未连接", false)
        return
      }

      addTestResult(`网络已连接，延迟: ${chainStore.connectionState.latency}ms`)
      addTestResult(`当前区块: ${chainStore.connectionState.blockNumber}`)

      // 测试 RPC 连接
      addTestResult("测试 RPC 连接...")
      const isConnected = await chainStore.checkConnection()
      if (isConnected) {
        addTestResult("RPC 连接测试成功")
      } else {
        addTestResult("RPC 连接测试失败", false)
      }

    } catch (error) {
      addTestResult(`网络连接测试失败: ${error}`, false)
    }
  }

  // 测试 ETH 余额查询
  const testEthBalance = async (address: string) => {
    try {
      addTestResult(`测试 ETH 余额查询: ${address}`)
      await balanceStore.fetchEthBalance(address)

      const balance = balanceStore.getBalanceByAddress(address)
      if (balance) {
        addTestResult(`ETH 余额查询成功: ${balance.formattedEthBalance} ETH`)
      } else {
        addTestResult("未找到余额数据", false)
      }
    } catch (error) {
      addTestResult(`ETH 余额查询失败: ${error}`, false)
    }
  }

  // 测试代币余额查询
  const testTokenBalance = async (userAddress: string, tokenAddress: string) => {
    try {
      addTestResult(`测试代币余额查询: ${tokenAddress}`)
      await balanceStore.fetchTokenBalance(userAddress, tokenAddress)

      const balance = balanceStore.getBalanceByAddress(userAddress)
      if (balance && balance.tokens.length > 0) {
        const token = balance.tokens.find(t =>
          t.contractAddress.toLowerCase() === tokenAddress.toLowerCase()
        )
        if (token) {
          addTestResult(`代币余额查询成功: ${token.formattedBalance} ${token.symbol}`)
        } else {
          addTestResult("代币余额为0或查询失败", false)
        }
      } else {
        addTestResult("未找到代币余额数据", false)
      }
    } catch (error) {
      addTestResult(`代币余额查询失败: ${error}`, false)
    }
  }

  // 运行所有测试
  const runAllTests = async () => {
    setIsRunningTests(true)
    clearResults()

    try {
      addTestResult("🚀 开始运行 Sepolia 测试网功能测试")
      addTestResult("=====================================")

      // 1. 测试网络连接
      await testNetworkConnection()

      // 2. 测试网络切换
      addTestResult("\n测试网络切换...")
      await chainStore.connectToNetwork("11155111") // Sepolia
      addTestResult("已切换到 Sepolia 测试网")

      // 3. 测试 ETH 余额查询 (使用 Vitalik 的地址作为示例)
      const vitalikAddress = "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045"
      await testEthBalance(vitalikAddress)

      // 4. 测试代币余额查询 (如果提供了代币地址)
      if (customTokenAddress) {
        await testTokenBalance(vitalikAddress, customTokenAddress)
      }

      addTestResult("\n=====================================")
      addTestResult("✅ 所有测试完成")

    } catch (error) {
      addTestResult(`测试过程中发生错误: ${error}`, false)
    } finally {
      setIsRunningTests(false)
    }
  }

  // 测试自定义地址
  const testCustomAddress = async () => {
    if (!testAddress.trim()) {
      addTestResult("请输入测试地址", false)
      return
    }

    await testEthBalance(testAddress.trim())
  }

  // 测试自定义代币
  const testCustomToken = async () => {
    if (!testAddress.trim()) {
      addTestResult("请先输入测试地址", false)
      return
    }

    if (!customTokenAddress.trim()) {
      addTestResult("请输入代币合约地址", false)
      return
    }

    await testTokenBalance(testAddress.trim(), customTokenAddress.trim())
  }

  useEffect(() => {
    // 初始化时检查网络状态
    const checkInitialStatus = async () => {
      try {
        await chainStore.initializeChain()
        const network = chainStore.getNetworkConfig(chainStore.currentChainId)
        if (network) {
          addTestResult(`初始网络: ${network.chainName}`)
        }
      } catch (error) {
        addTestResult(`初始化失败: ${error}`, false)
      }
    }

    checkInitialStatus()
  }, [])

  return (
    <div className="plasmo-p-4 plasmo-bg-white plasmo-rounded-lg plasmo-shadow-lg">
      <div className="plasmo-text-center plasmo-mb-6">
        <h1 className="plasmo-text-2xl plasmo-font-bold plasmo-mb-2">
          🧪 Sepolia 测试网功能测试
        </h1>
        <p className="plasmo-text-gray-600 plasmo-text-sm">
          测试余额查询和网络连接功能
        </p>
      </div>

      {/* 网络状态 */}
      <div className="plasmo-bg-blue-50 plasmo-p-4 plasmo-rounded-lg plasmo-mb-4">
        <h3 className="plasmo-font-medium plasmo-mb-2">📡 网络状态</h3>
        <div className="plasmo-text-sm plasmo-space-y-1">
          <p>当前网络: {chainStore.getNetworkConfig(chainStore.currentChainId)?.chainName || "未知"}</p>
          <p>连接状态: {chainStore.connectionState.isConnected ? "✅ 已连接" : "❌ 未连接"}</p>
          <p>区块高度: {chainStore.connectionState.blockNumber || "未知"}</p>
          <p>网络延迟: {chainStore.connectionState.latency || "未知"}ms</p>
        </div>
      </div>

      {/* 测试控制 */}
      <div className="plasmo-space-y-4 plasmo-mb-6">
        <div className="plasmo-grid plasmo-grid-cols-1 plasmo-gap-3">
          <button
            onClick={runAllTests}
            disabled={isRunningTests}
            className="plasmo-w-full plasmo-bg-green-600 plasmo-text-white plasmo-px-4 plasmo-py-3 plasmo-rounded-lg plasmo-font-medium hover:plasmo-bg-green-700 disabled:plasmo-bg-gray-400 plasmo-transition-colors">
            {isRunningTests ? "🔄 测试中..." : "🚀 运行所有测试"}
          </button>

          <button
            onClick={testNetworkConnection}
            className="plasmo-w-full plasmo-bg-blue-600 plasmo-text-white plasmo-px-4 plasmo-py-3 plasmo-rounded-lg plasmo-font-medium hover:plasmo-bg-blue-700 plasmo-transition-colors">
            🌐 测试网络连接
          </button>
        </div>

        {/* 自定义测试 */}
        <div className="plasmo-bg-gray-50 plasmo-p-4 plasmo-rounded-lg">
          <h3 className="plasmo-font-medium plasmo-mb-3">🎯 自定义测试</h3>

          <div className="plasmo-space-y-3">
            <div>
              <label className="plasmo-block plasmo-text-sm plasmo-font-medium plasmo-mb-1">
                测试地址
              </label>
              <input
                type="text"
                value={testAddress}
                onChange={(e) => setTestAddress(e.target.value)}
                placeholder="输入以太坊地址 (0x...)"
                className="plasmo-w-full plasmo-border plasmo-border-gray-300 plasmo-rounded-lg plasmo-px-3 plasmo-py-2 plasmo-text-sm"
              />
            </div>

            <div>
              <label className="plasmo-block plasmo-text-sm plasmo-font-medium plasmo-mb-1">
                代币合约地址 (可选)
              </label>
              <input
                type="text"
                value={customTokenAddress}
                onChange={(e) => setCustomTokenAddress(e.target.value)}
                placeholder="输入 ERC20 代币合约地址"
                className="plasmo-w-full plasmo-border plasmo-border-gray-300 plasmo-rounded-lg plasmo-px-3 plasmo-py-2 plasmo-text-sm"
              />
            </div>

            <div className="plasmo-grid plasmo-grid-cols-2 plasmo-gap-2">
              <button
                onClick={testCustomAddress}
                className="plasmo-bg-purple-600 plasmo-text-white plasmo-px-3 plasmo-py-2 plasmo-rounded-lg plasmo-text-sm plasmo-font-medium hover:plasmo-bg-purple-700 plasmo-transition-colors">
                💰 测试 ETH 余额
              </button>

              <button
                onClick={testCustomToken}
                className="plasmo-bg-indigo-600 plasmo-text-white plasmo-px-3 plasmo-py-2 plasmo-rounded-lg plasmo-text-sm plasmo-font-medium hover:plasmo-bg-indigo-700 plasmo-transition-colors">
                🪙 测试代币余额
              </button>
            </div>
          </div>
        </div>

        <button
          onClick={clearResults}
          className="plasmo-w-full plasmo-bg-gray-200 plasmo-text-gray-800 plasmo-px-4 plasmo-py-2 plasmo-rounded-lg plasmo-text-sm plasmo-font-medium hover:plasmo-bg-gray-300 plasmo-transition-colors">
          🗑️ 清除测试结果
        </button>
      </div>

      {/* 测试结果 */}
      {testResults.length > 0 && (
        <div className="plasmo-bg-gray-900 plasmo-p-4 plasmo-rounded-lg">
          <h3 className="plasmo-font-medium plasmo-mb-3 plasmo-text-white">📋 测试结果</h3>
          <div className="plasmo-max-h-64 plasmo-overflow-y-auto">
            <pre className="plasmo-text-xs plasmo-text-green-400 plasmo-font-mono plasmo-whitespace-pre-wrap">
              {testResults.join('\n')}
            </pre>
          </div>
        </div>
      )}

      {/* 余额显示 */}
      {testAddress && balanceStore.getBalanceByAddress(testAddress) && (
        <div className="plasmo-mt-6">
          <h3 className="plasmo-font-medium plasmo-mb-3">💰 余额详情</h3>
          <BalanceDisplay address={testAddress} />
        </div>
      )}

      {/* 使用说明 */}
      <div className="plasmo-mt-6 plasmo-bg-yellow-50 plasmo-p-4 plasmo-rounded-lg">
        <h4 className="plasmo-font-medium plasmo-mb-2">📖 使用说明</h4>
        <ul className="plasmo-text-sm plasmo-text-gray-700 plasmo-space-y-1">
          <li>• <strong>运行所有测试</strong>: 自动执行完整的测试流程</li>
          <li>• <strong>测试网络连接</strong>: 验证与 Sepolia 测试网的连接</li>
          <li>• <strong>自定义测试</strong>: 测试指定地址的余额</li>
          <li>• <strong>Sepolia 水龙头</strong>: <a href="https://sepoliafaucet.com/" target="_blank" rel="noopener noreferrer" className="plasmo-text-blue-600 hover:plasmo-underline">获取测试 ETH</a></li>
          <li>• <strong>测试代币</strong>: 可以测试 Sepolia 上的任意 ERC20 代币</li>
        </ul>
      </div>
    </div>
  )
}