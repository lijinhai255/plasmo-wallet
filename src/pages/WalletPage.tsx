import React, { useEffect, useState } from "react"

import { useBalanceStore } from "../../store/BalanceStore"
import { useChainStore } from "../../store/ChainStore"
import { useWalletStore } from "../../store/WalletStore"
import {
  AssetCategoryTabs,
  AssetType,
  PriceTabType,
  type AssetCounts
} from "../components/AssetCategoryTabs"
import { BalanceDisplay } from "../components/BalanceDisplay"
import { useSimpleToastContext } from "../contexts/SimpleToastContext"

export const WalletPage = () => {
  // 使用状态管理
  const walletStore = useWalletStore()
  const chainStore = useChainStore()
  const balanceStore = useBalanceStore()
  const { showSuccess, showError, showInfo } = useSimpleToastContext()

  // 本地状态
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [importMethod, setImportMethod] = useState<"mnemonic" | "privateKey">(
    "mnemonic"
  )
  const [walletName, setWalletName] = useState("")
  const [privateKey, setPrivateKey] = useState("")
  const [mnemonic, setMnemonic] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [localError, setLocalError] = useState("")

  // 资产分类状态
  const [selectedAssetType, setSelectedAssetType] = useState<AssetType>(
    AssetType.ERC20
  )
  const [selectedPriceTab, setSelectedPriceTab] =
    useState<PriceTabType>("price")

  useEffect(() => {
    // 初始化钱包和链
    const initialize = async () => {
      try {
        // 初始化钱包
        await walletStore.initializeWallet()

        // 确保网络已正确设置，默认连接到 Sepolia 测试网
        if (!chainStore.currentChainId) {
          console.log("ChainId为空，设置默认 Sepolia 测试网")
          await chainStore.connectToNetwork("11155111") // Sepolia Testnet
        }

        console.log("初始化完成:", {
          currentChainId: chainStore.currentChainId,
          networkName: chainStore.getNetworkConfig(chainStore.currentChainId)
            ?.chainName,
          isInitialized: walletStore.isInitialized
        })
      } catch (error) {
        console.error("初始化失败:", error)
      }
    }

    initialize()
  }, [])

  // 创建钱包
  const handleCreateWallet = async () => {
    if (!walletName.trim()) {
      setLocalError("请输入钱包名称")
      return
    }

    if (password !== confirmPassword) {
      setLocalError("两次输入的密码不一致")
      return
    }

    try {
      const result = await walletStore.createWallet(walletName, password)

      // 显示助记词给用户
      if (result.mnemonic) {
        console.log("钱包创建成功，助记词:", result.mnemonic)
      }
      setShowCreateModal(false)
      setWalletName("")
      setPassword("")
      setConfirmPassword("")
      setLocalError("")
    } catch (error) {
      console.error("创建钱包失败:", error)
      // 确保在错误情况下也清除表单
      if (!walletStore.error) {
        // 如果 WalletStore 没有设置错误信息，则设置一个通用错误
        console.error("创建钱包过程中发生未知错误")
      }
    }
  }

  // 导入钱包（通过助记词）
  const handleImportWalletByMnemonic = async (mnemonicPhrase: string) => {
    if (!walletName.trim()) {
      setLocalError("请输入钱包名称")
      return
    }

    if (!mnemonicPhrase.trim()) {
      setLocalError("请输入助记词")
      return
    }

    if (password !== confirmPassword) {
      setLocalError("两次输入的密码不一致")
      return
    }

    try {
      await walletStore.importWalletByMnemonic(
        mnemonicPhrase,
        walletName,
        password
      )
      setShowImportModal(false)
      setWalletName("")
      setPrivateKey("")
      setMnemonic("")
      setPassword("")
      setConfirmPassword("")
      setImportMethod("mnemonic")
      setLocalError("")
    } catch (error) {
      console.error("导入钱包失败:", error)
    }
  }

  // 导入钱包（通过私钥）
  const handleImportWalletByPrivateKey = async () => {
    if (!walletName.trim()) {
      setLocalError("请输入钱包名称")
      return
    }

    if (!privateKey.trim()) {
      setLocalError("请输入私钥")
      return
    }

    if (password !== confirmPassword) {
      setLocalError("两次输入的密码不一致")
      return
    }

    try {
      await walletStore.importWalletByPrivateKey(
        privateKey,
        walletName,
        password
      )
      setShowImportModal(false)
      setWalletName("")
      setPrivateKey("")
      setMnemonic("")
      setPassword("")
      setConfirmPassword("")
      setImportMethod("mnemonic")
      setLocalError("")
    } catch (error) {
      console.error("导入钱包失败:", error)
    }
  }

  // 统一的导入钱包处理函数
  const handleImportWallet = async () => {
    if (importMethod === "mnemonic") {
      await handleImportWalletByMnemonic(mnemonic)
    } else {
      await handleImportWalletByPrivateKey()
    }
  }

  // 锁定钱包
  const handleLockWallet = async () => {
    try {
      await walletStore.lockWallet()
    } catch (error) {
      console.error("锁定钱包失败:", error)
    }
  }

  // 解锁钱包
  const handleUnlockWallet = async (unlockPassword: string) => {
    try {
      await walletStore.unlockWallet(unlockPassword)
    } catch (error) {
      console.error("解锁钱包失败:", error)
    }
  }

  // 删除钱包
  const handleDeleteWallet = async (address: string) => {
    try {
      console.log("删除钱包:", address)
      await walletStore.deleteWallet(address)
    } catch (error) {
      console.error("删除钱包失败:", error)
    }
  }

  // 复制地址
  const copyAddress = (address: string) => {
    navigator.clipboard.writeText(address)
    // 可以添加提示
  }

  // 刷新余额
  const refreshBalance = async () => {
    if (walletStore.currentWallet) {
      await walletStore.loadBalance(walletStore.currentWallet.address)
    }
  }

  // 格式化地址
  const formatAddress = (address: string) => {
    return address.slice(0, 6) + "..." + address.slice(-4)
  }

  // 格式化余额
  const formatBalance = (balance: string) => {
    const num = parseFloat(balance)
    if (num >= 1000) {
      return (num / 1000).toFixed(2) + "K"
    }
    return num.toFixed(4)
  }

  // 获取当前网络显示
  const getCurrentNetworkDisplay = () => {
    // 添加调试信息
    console.log("Current ChainId:", chainStore.currentChainId)
    console.log("Available networks:", chainStore.getAllNetworks())

    const network = chainStore.getNetworkConfig(chainStore.currentChainId)
    if (network) {
      return `${network.icon} ${network.chainName}`
    }

    // 如果没有找到网络，尝试使用默认的以太坊网络
    const defaultNetwork = chainStore.getNetworkConfig("1")
    if (defaultNetwork) {
      // 异步设置默认网络
      chainStore.connectToNetwork("1").catch(console.error)
      return `${defaultNetwork.icon} ${defaultNetwork.chainName}`
    }

    return "Unknown Network"
  }

  // 模拟一个会触发错误的函数（用于测试 ErrorBoundary）
  const triggerError = () => {
    throw new Error("这是一个测试错误，用于验证 ErrorBoundary 功能")
  }

  // 如果钱包被锁定，显示解锁界面
  if (!walletStore.isUnlocked && walletStore.isInitialized) {
    return (
      <div className="plasmo-p-4 plasmo-bg-white plasmo-rounded-lg plasmo-shadow-lg">
        <div className="plasmo-text-center plasmo-mb-6">
          <h1 className="plasmo-text-2xl plasmo-font-bold plasmo-mb-2">
            🔐 钱包已锁定
          </h1>
          <p className="plasmo-text-gray-600 plasmo-text-sm">
            请输入密码解锁钱包
          </p>
        </div>

        {walletStore.error && (
          <div className="plasmo-bg-red-50 plasmo-border plasmo-border-red-200 plasmo-p-3 plasmo-rounded-lg plasmo-mb-4">
            <p className="plasmo-text-sm plasmo-text-red-800">
              ❌ {walletStore.error}
            </p>
          </div>
        )}

        <div className="plasmo-space-y-4">
          <div>
            <label className="plasmo-block plasmo-text-sm plasmo-font-medium plasmo-mb-2">
              密码
            </label>
            <input
              type="password"
              placeholder="输入钱包密码"
              className="plasmo-w-full plasmo-border plasmo-border-gray-300 plasmo-rounded-lg plasmo-px-3 plasmo-py-2"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  const target = e.target as HTMLInputElement
                  handleUnlockWallet(target.value)
                }
              }}
            />
          </div>

          <button
            onClick={() => {
              const input = document.querySelector(
                'input[type="password"]'
              ) as HTMLInputElement
              if (input?.value) {
                handleUnlockWallet(input.value)
              }
            }}
            className="plasmo-w-full plasmo-bg-blue-600 plasmo-text-white plasmo-px-4 plasmo-py-3 plasmo-rounded-lg plasmo-font-medium hover:plasmo-bg-blue-700 plasmo-transition-colors">
            解锁钱包
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="plasmo-p-4 plasmo-bg-white plasmo-min-h-screen">
      <div className="plasmo-text-center plasmo-mb-6">
        <h1 className="plasmo-text-2xl plasmo-font-bold plasmo-mb-2">
          💼 我的钱包
        </h1>
        <p className="plasmo-text-gray-600 plasmo-text-sm">管理您的数字资产</p>
      </div>

      {/* Toast 测试按钮 */}
      <div className="plasmo-bg-blue-50 plasmo-p-3 plasmo-rounded-lg plasmo-mb-4">
        <div className="plasmo-text-xs plasmo-font-medium plasmo-text-blue-800 plasmo-mb-2">
          🧪 Toast 测试
        </div>
        <div className="plasmo-flex plasmo-gap-2">
          <button
            onClick={() => showSuccess("成功消息测试")}
            className="plasmo-bg-green-500 plasmo-text-white plasmo-px-2 plasmo-py-1 plasmo-rounded plasmo-text-xs hover:plasmo-bg-green-600">
            成功
          </button>
          <button
            onClick={() => showError("错误消息测试")}
            className="plasmo-bg-red-500 plasmo-text-white plasmo-px-2 plasmo-py-1 plasmo-rounded plasmo-text-xs hover:plasmo-bg-red-600">
            错误
          </button>
          <button
            onClick={() => showInfo("信息消息测试")}
            className="plasmo-bg-blue-500 plasmo-text-white plasmo-px-2 plasmo-py-1 plasmo-rounded plasmo-text-xs hover:plasmo-bg-blue-600">
            信息
          </button>
        </div>
      </div>

      {/* 错误提示 */}
      {walletStore.error && (
        <div className="plasmo-bg-red-50 plasmo-border plasmo-border-red-200 plasmo-p-3 plasmo-rounded-lg plasmo-mb-4">
          <div className="plasmo-flex plasmo-items-center plasmo-justify-between">
            <p className="plasmo-text-sm plasmo-text-red-800">
              ❌ {walletStore.error}
            </p>
            <button
              onClick={() => walletStore.clearError()}
              className="plasmo-text-red-600 hover:plasmo-text-red-800 plasmo-text-sm">
              ✕
            </button>
          </div>
        </div>
      )}

      {/* 网络状态显示 */}
      <div className="plasmo-bg-gray-50 plasmo-p-3 plasmo-rounded-lg plasmo-mb-4">
        <div className="plasmo-flex plasmo-items-center plasmo-justify-between">
          <div className="plasmo-flex plasmo-items-center plasmo-space-x-2">
            <span className="plasmo-text-sm plasmo-font-medium">当前网络:</span>
            <span className="plasmo-text-sm">{getCurrentNetworkDisplay()}</span>
          </div>
          {chainStore.connectionState.isConnected && (
            <div className="plasmo-flex plasmo-items-center plasmo-space-x-1">
              <div className="plasmo-w-2 plasmo-h-2 plasmo-bg-green-500 plasmo-rounded-full"></div>
              <span className="plasmo-text-xs plasmo-text-gray-600">
                {chainStore.connectionState.latency}ms
              </span>
            </div>
          )}
        </div>
      </div>

      {!walletStore.isInitialized ? (
        // 未初始化状态
        <div className="plasmo-text-center plasmo-space-y-4">
          <div className="plasmo-bg-gray-100 plasmo-p-8 plasmo-rounded-lg">
            <div className="plasmo-text-6xl plasmo-mb-4">🔐</div>
            <h3 className="plasmo-text-lg plasmo-font-semibold plasmo-mb-2">
              尚未创建钱包
            </h3>
            <p className="plasmo-text-gray-600 plasmo-text-sm plasmo-mb-4">
              创建或导入您的第一个钱包开始使用
            </p>
          </div>

          <div className="plasmo-grid plasmo-grid-cols-2 plasmo-gap-3">
            <button
              onClick={() => setShowCreateModal(true)}
              className="plasmo-bg-blue-600 plasmo-text-white plasmo-px-4 plasmo-py-3 plasmo-rounded-lg plasmo-font-medium hover:plasmo-bg-blue-700 plasmo-transition-colors">
              创建钱包
            </button>
            <button
              onClick={() => setShowImportModal(true)}
              className="plasmo-bg-green-600 plasmo-text-white plasmo-px-4 plasmo-py-3 plasmo-rounded-lg plasmo-font-medium hover:plasmo-bg-green-700 plasmo-transition-colors">
              导入钱包
            </button>
          </div>
        </div>
      ) : walletStore.currentWallet ? (
        // 有钱包的状态
        <div className="plasmo-space-y-4">
          <div className="plasmo-bg-gradient-to-r plasmo-from-blue-500 plasmo-to-purple-600 plasmo-p-6 plasmo-rounded-lg plasmo-text-white">
            <div className="plasmo-text-center">
              <p className="plasmo-text-sm plasmo-opacity-80 plasmo-mb-2">
                {walletStore.currentWallet.name}
              </p>
              <p className="plasmo-font-mono plasmo-text-lg plasmo-mb-4">
                {formatAddress(walletStore.currentWallet.address)}
              </p>
              <div className="plasmo-text-3xl plasmo-font-bold plasmo-mb-1">
                {formatBalance(walletStore.balance)} ETH
              </div>
              <p className="plasmo-text-sm plasmo-opacity-80">账户余额</p>
            </div>
          </div>

          {/* 余额详情显示 */}
          <BalanceDisplay address={walletStore.currentWallet.address} />
          <div className="plasmo-grid plasmo-grid-cols-2 plasmo-gap-3">
            <button className="plasmo-bg-green-100 plasmo-text-green-700 plasmo-px-4 plasmo-py-3 plasmo-rounded-lg plasmo-text-sm plasmo-font-medium hover:plasmo-bg-green-200 plasmo-transition-colors">
              💸 发送
            </button>
            <button className="plasmo-bg-blue-100 plasmo-text-blue-700 plasmo-px-4 plasmo-py-3 plasmo-rounded-lg plasmo-text-sm plasmo-font-medium hover:plasmo-bg-blue-200 plasmo-transition-colors">
              📥 接收
            </button>
          </div>

          <div className="plasmo-grid plasmo-grid-cols-2 plasmo-gap-3">
            <button
              onClick={handleLockWallet}
              className="plasmo-bg-yellow-100 plasmo-text-yellow-700 plasmo-px-4 plasmo-py-3 plasmo-rounded-lg plasmo-text-sm plasmo-font-medium hover:plasmo-bg-yellow-200 plasmo-transition-colors">
              🔒 锁定钱包
            </button>
            <button
              onClick={() =>
                handleDeleteWallet(walletStore.currentWallet!.address)
              }
              className="plasmo-bg-red-100 plasmo-text-red-700 plasmo-px-4 plasmo-py-3 plasmo-rounded-lg plasmo-text-sm plasmo-font-medium hover:plasmo-bg-red-200 plasmo-transition-colors">
              🗑️ 删除钱包
            </button>
          </div>

          <div className="plasmo-bg-gray-50 plasmo-p-4 plasmo-rounded-lg">
            <h4 className="plasmo-font-medium plasmo-mb-2">快速操作</h4>
            <div className="plasmo-space-y-2">
              <button
                onClick={() => copyAddress(walletStore.currentWallet!.address)}
                className="plasmo-w-full plasmo-text-left plasmo-px-3 plasmo-py-2 plasmo-text-sm plasmo-text-gray-700 hover:plasmo-bg-gray-100 plasmo-rounded">
                📋 复制地址
              </button>
              <button
                onClick={refreshBalance}
                className="plasmo-w-full plasmo-text-left plasmo-px-3 plasmo-py-2 plasmo-text-sm plasmo-text-gray-700 hover:plasmo-bg-gray-100 plasmo-rounded">
                🔄 刷新余额
              </button>
              <button className="plasmo-w-full plasmo-text-left plasmo-px-3 plasmo-py-2 plasmo-text-sm plasmo-text-gray-700 hover:plasmo-bg-gray-100 plasmo-rounded">
                📊 查看交易记录
              </button>
              {/* 开发环境显示的测试按钮 */}
              {process.env.NODE_ENV === "development" && (
                <button
                  onClick={triggerError}
                  className="plasmo-w-full plasmo-text-left plasmo-px-3 plasmo-py-2 plasmo-text-sm plasmo-text-red-600 hover:plasmo-bg-red-50 plasmo-rounded">
                  🧪 测试错误边界
                </button>
              )}
            </div>
          </div>
        </div>
      ) : (
        // 已初始化但没有当前钱包
        <div className="plasmo-text-center plasmo-space-y-4">
          <p className="plasmo-text-gray-600">请选择或创建一个钱包</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="plasmo-bg-blue-600 plasmo-text-white plasmo-px-4 plasmo-py-3 plasmo-rounded-lg plasmo-font-medium hover:plasmo-bg-blue-700 plasmo-transition-colors">
            创建新钱包
          </button>
        </div>
      )}

      {/* 创建钱包模态框 */}
      {showCreateModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 50,
            backgroundColor: "rgba(0, 0, 0, 0.5)"
          }}>
          <div
            style={{
              backgroundColor: "white",
              padding: "24px",
              borderRadius: "8px",
              margin: "16px",
              maxWidth: "400px",
              width: "100%",
              maxHeight: "90vh",
              overflowY: "auto"
            }}>
            <h3 className="plasmo-text-lg plasmo-font-bold plasmo-mb-4">
              创建新钱包
            </h3>

            {/* 本地错误提示 */}
            {localError && (
              <div className="plasmo-bg-red-50 plasmo-border plasmo-border-red-200 plasmo-p-3 plasmo-rounded-lg plasmo-mb-4">
                <div className="plasmo-flex plasmo-items-center plasmo-justify-between">
                  <p className="plasmo-text-sm plasmo-text-red-800">
                    ❌ {localError}
                  </p>
                  <button
                    onClick={() => setLocalError("")}
                    className="plasmo-text-red-600 hover:plasmo-text-red-800 plasmo-text-sm">
                    ✕
                  </button>
                </div>
              </div>
            )}

            <div className="plasmo-space-y-4">
              <div>
                <label className="plasmo-block plasmo-text-sm plasmo-font-medium plasmo-mb-2">
                  钱包名称
                </label>
                <input
                  type="text"
                  value={walletName}
                  onChange={(e) => setWalletName(e.target.value)}
                  placeholder="输入钱包名称"
                  className="plasmo-w-full plasmo-border plasmo-border-gray-300 plasmo-rounded-lg plasmo-px-3 plasmo-py-2"
                />
              </div>

              <div>
                <label className="plasmo-block plasmo-text-sm plasmo-font-medium plasmo-mb-2">
                  密码
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="输入密码"
                  className="plasmo-w-full plasmo-border plasmo-border-gray-300 plasmo-rounded-lg plasmo-px-3 plasmo-py-2"
                />
              </div>

              <div>
                <label className="plasmo-block plasmo-text-sm plasmo-font-medium plasmo-mb-2">
                  确认密码
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="再次输入密码"
                  className="plasmo-w-full plasmo-border plasmo-border-gray-300 plasmo-rounded-lg plasmo-px-3 plasmo-py-2"
                />
              </div>
            </div>

            <div style={{ display: "flex", gap: "12px", marginTop: "24px" }}>
              <button
                onClick={() => {
                  setShowCreateModal(false)
                  setLocalError("")
                }}
                style={{
                  flex: 1,
                  backgroundColor: "#e5e7eb",
                  color: "#374151",
                  padding: "8px 16px",
                  borderRadius: "8px",
                  fontSize: "14px",
                  fontWeight: "500",
                  border: "none",
                  cursor: "pointer"
                }}
                onMouseOver={(e) =>
                  (e.currentTarget.style.backgroundColor = "#d1d5db")
                }
                onMouseOut={(e) =>
                  (e.currentTarget.style.backgroundColor = "#e5e7eb")
                }>
                取消
              </button>
              <button
                onClick={handleCreateWallet}
                disabled={walletStore.isLoading}
                style={{
                  flex: 1,
                  backgroundColor: walletStore.isLoading
                    ? "#9ca3af"
                    : "#2563eb",
                  color: "white",
                  padding: "8px 16px",
                  borderRadius: "8px",
                  fontSize: "14px",
                  fontWeight: "500",
                  border: "none",
                  cursor: walletStore.isLoading ? "not-allowed" : "pointer"
                }}
                onMouseOver={(e) => {
                  if (!walletStore.isLoading)
                    e.currentTarget.style.backgroundColor = "#1d4ed8"
                }}
                onMouseOut={(e) => {
                  if (!walletStore.isLoading)
                    e.currentTarget.style.backgroundColor = "#2563eb"
                }}>
                {walletStore.isLoading ? "创建中..." : "创建"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 导入钱包模态框 */}
      {showImportModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 50,
            backgroundColor: "rgba(0, 0, 0, 0.5)"
          }}>
          <div
            style={{
              backgroundColor: "white",
              padding: "24px",
              borderRadius: "8px",
              margin: "16px",
              maxWidth: "450px",
              width: "100%",
              maxHeight: "90vh",
              overflowY: "auto"
            }}>
            <h3 className="plasmo-text-lg plasmo-font-bold plasmo-mb-4">
              导入钱包
            </h3>

            {/* 本地错误提示 */}
            {localError && (
              <div className="plasmo-bg-red-50 plasmo-border plasmo-border-red-200 plasmo-p-3 plasmo-rounded-lg plasmo-mb-4">
                <div className="plasmo-flex plasmo-items-center plasmo-justify-between">
                  <p className="plasmo-text-sm plasmo-text-red-800">
                    ❌ {localError}
                  </p>
                  <button
                    onClick={() => setLocalError("")}
                    className="plasmo-text-red-600 hover:plasmo-text-red-800 plasmo-text-sm">
                    ✕
                  </button>
                </div>
              </div>
            )}

            {/* 导入方式选择 */}
            <div className="plasmo-flex plasmo-space-x-2 plasmo-mb-4">
              <button
                onClick={() => setImportMethod("mnemonic")}
                className={`plasmo-flex-1 plasmo-px-4 plasmo-py-2 plasmo-rounded-lg plasmo-font-medium ${
                  importMethod === "mnemonic"
                    ? "plasmo-bg-blue-600 plasmo-text-white"
                    : "plasmo-bg-gray-200 plasmo-text-gray-800 hover:plasmo-bg-gray-300"
                }`}>
                助记词
              </button>
              <button
                onClick={() => setImportMethod("privateKey")}
                className={`plasmo-flex-1 plasmo-px-4 plasmo-py-2 plasmo-rounded-lg plasmo-font-medium ${
                  importMethod === "privateKey"
                    ? "plasmo-bg-blue-600 plasmo-text-white"
                    : "plasmo-bg-gray-200 plasmo-text-gray-800 hover:plasmo-bg-gray-300"
                }`}>
                私钥
              </button>
            </div>

            <div className="plasmo-space-y-4">
              <div>
                <label className="plasmo-block plasmo-text-sm plasmo-font-medium plasmo-mb-2">
                  钱包名称
                </label>
                <input
                  type="text"
                  value={walletName}
                  onChange={(e) => setWalletName(e.target.value)}
                  placeholder="输入钱包名称"
                  className="plasmo-w-full plasmo-border plasmo-border-gray-300 plasmo-rounded-lg plasmo-px-3 plasmo-py-2"
                />
              </div>

              {importMethod === "mnemonic" ? (
                <div>
                  <label className="plasmo-block plasmo-text-sm plasmo-font-medium plasmo-mb-2">
                    助记词
                  </label>
                  <textarea
                    value={mnemonic}
                    onChange={(e) => setMnemonic(e.target.value)}
                    placeholder="输入12个单词的助记词，用空格分隔"
                    className="plasmo-w-full plasmo-border plasmo-border-gray-300 plasmo-rounded-lg plasmo-px-3 plasmo-py-2"
                    rows={3}
                  />
                </div>
              ) : (
                <div>
                  <label className="plasmo-block plasmo-text-sm plasmo-font-medium plasmo-mb-2">
                    私钥
                  </label>
                  <textarea
                    value={privateKey}
                    onChange={(e) => setPrivateKey(e.target.value)}
                    placeholder="输入私钥 (0x...)"
                    className="plasmo-w-full plasmo-border plasmo-border-gray-300 plasmo-rounded-lg plasmo-px-3 plasmo-py-2"
                    rows={3}
                  />
                </div>
              )}

              <div>
                <label className="plasmo-block plasmo-text-sm plasmo-font-medium plasmo-mb-2">
                  密码
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="输入密码 (至少8位)"
                  className="plasmo-w-full plasmo-border plasmo-border-gray-300 plasmo-rounded-lg plasmo-px-3 plasmo-py-2"
                />
              </div>

              <div>
                <label className="plasmo-block plasmo-text-sm plasmo-font-medium plasmo-mb-2">
                  确认密码
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="再次输入密码"
                  className="plasmo-w-full plasmo-border plasmo-border-gray-300 plasmo-rounded-lg plasmo-px-3 plasmo-py-2"
                />
              </div>
            </div>

            <div style={{ display: "flex", gap: "12px", marginTop: "24px" }}>
              <button
                onClick={() => {
                  setShowImportModal(false)
                  setWalletName("")
                  setPrivateKey("")
                  setMnemonic("")
                  setPassword("")
                  setConfirmPassword("")
                  setImportMethod("mnemonic")
                  setLocalError("")
                }}
                style={{
                  flex: 1,
                  backgroundColor: "#e5e7eb",
                  color: "#374151",
                  padding: "8px 16px",
                  borderRadius: "8px",
                  fontSize: "14px",
                  fontWeight: "500",
                  border: "none",
                  cursor: "pointer"
                }}
                onMouseOver={(e) =>
                  (e.currentTarget.style.backgroundColor = "#d1d5db")
                }
                onMouseOut={(e) =>
                  (e.currentTarget.style.backgroundColor = "#e5e7eb")
                }>
                取消
              </button>
              <button
                onClick={handleImportWallet}
                disabled={walletStore.isLoading}
                style={{
                  flex: 1,
                  backgroundColor: walletStore.isLoading
                    ? "#9ca3af"
                    : "#16a34a",
                  color: "white",
                  padding: "8px 16px",
                  borderRadius: "8px",
                  fontSize: "14px",
                  fontWeight: "500",
                  border: "none",
                  cursor: walletStore.isLoading ? "not-allowed" : "pointer"
                }}
                onMouseOver={(e) => {
                  if (!walletStore.isLoading)
                    e.currentTarget.style.backgroundColor = "#15803d"
                }}
                onMouseOut={(e) => {
                  if (!walletStore.isLoading)
                    e.currentTarget.style.backgroundColor = "#16a34a"
                }}>
                {walletStore.isLoading ? "导入中..." : "导入"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
