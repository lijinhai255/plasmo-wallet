import React, { useState } from 'react'

export const SettingsPage = () => {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)
  const [darkMode, setDarkMode] = useState(false)
  const [autoConnect, setAutoConnect] = useState(false)

  const handleToggleNotifications = () => {
    setNotificationsEnabled(!notificationsEnabled)
  }

  const handleToggleDarkMode = () => {
    setDarkMode(!darkMode)
  }

  const handleToggleAutoConnect = () => {
    setAutoConnect(!autoConnect)
  }

  const handleExportWallet = () => {
    // 实现导出钱包功能
    console.log('导出钱包')
    alert('导出功能开发中...')
  }

  const handleImportWallet = () => {
    // 实现导入钱包功能
    console.log('导入钱包')
    alert('导入功能开发中...')
  }

  const handleResetSettings = () => {
    console.log('重置设置')
    setNotificationsEnabled(true)
    setDarkMode(false)
    setAutoConnect(false)
    console.log('设置已重置')
  }

  return (
    <div className="plasmo-p-4 plasmo-bg-white plasmo-min-h-screen">
      <div className="plasmo-text-center plasmo-mb-6">
        <h1 className="plasmo-text-2xl plasmo-font-bold plasmo-mb-2">
          ⚙️ 设置
        </h1>
        <p className="plasmo-text-gray-600 plasmo-text-sm">
          管理您的钱包偏好设置
        </p>
      </div>

      <div className="plasmo-space-y-4">
        {/* 常规设置 */}
        <div className="plasmo-bg-gray-50 plasmo-p-4 plasmo-rounded-lg">
          <h2 className="plasmo-text-lg plasmo-font-semibold plasmo-mb-4">常规设置</h2>

          <div className="plasmo-space-y-3">
            <div className="plasmo-flex plasmo-items-center plasmo-justify-between">
              <div>
                <p className="plasmo-font-medium">通知提醒</p>
                <p className="plasmo-text-sm plasmo-text-gray-600">
                  接收交易和余额变化通知
                </p>
              </div>
              <button
                onClick={handleToggleNotifications}
                className={`plasmo-w-12 plasmo-h-6 plasmo-rounded-full plasmo-transition-colors ${
                  notificationsEnabled
                    ? 'plasmo-bg-blue-600'
                    : 'plasmo-bg-gray-300'
                }`}
              >
                <div
                  className={`plasmo-w-5 plasmo-h-5 plasmo-bg-white plasmo-rounded-full plasmo-transition-transform ${
                    notificationsEnabled ? 'plasmo-translate-x-6' : 'plasmo-translate-x-1'
                  }`}
                ></div>
              </button>
            </div>

            <div className="plasmo-flex plasmo-items-center plasmo-justify-between">
              <div>
                <p className="plasmo-font-medium">深色模式</p>
                <p className="plasmo-text-sm plasmo-text-gray-600">
                  切换界面主题
                </p>
              </div>
              <button
                onClick={handleToggleDarkMode}
                className={`plasmo-w-12 plasmo-h-6 plasmo-rounded-full plasmo-transition-colors ${
                  darkMode
                    ? 'plasmo-bg-blue-600'
                    : 'plasmo-bg-gray-300'
                }`}
              >
                <div
                  className={`plasmo-w-5 plasmo-h-5 plasmo-bg-white plasmo-rounded-full plasmo-transition-transform ${
                    darkMode ? 'plasmo-translate-x-6' : 'plasmo-translate-x-1'
                  }`}
                ></div>
              </button>
            </div>

            <div className="plasmo-flex plasmo-items-center plasmo-justify-between">
              <div>
                <p className="plasmo-font-medium">自动连接</p>
                <p className="plasmo-text-sm plasmo-text-gray-600">
                  自动连接到已授权的 DApp
                </p>
              </div>
              <button
                onClick={handleToggleAutoConnect}
                className={`plasmo-w-12 plasmo-h-6 plasmo-rounded-full plasmo-transition-colors ${
                  autoConnect
                    ? 'plasmo-bg-blue-600'
                    : 'plasmo-bg-gray-300'
                }`}
              >
                <div
                  className={`plasmo-w-5 plasmo-h-5 plasmo-bg-white plasmo-rounded-full plasmo-transition-transform ${
                    autoConnect ? 'plasmo-translate-x-6' : 'plasmo-translate-x-1'
                  }`}
                ></div>
              </button>
            </div>
          </div>
        </div>

        {/* 安全设置 */}
        <div className="plasmo-bg-gray-50 plasmo-p-4 plasmo-rounded-lg">
          <h2 className="plasmo-text-lg plasmo-font-semibold plasmo-mb-4">安全设置</h2>

          <div className="plasmo-space-y-3">
            <button
              onClick={handleExportWallet}
              className="plasmo-w-full plasmo-bg-green-600 plasmo-text-white plasmo-px-4 plasmo-py-3 plasmo-rounded-lg plasmo-font-medium hover:plasmo-bg-green-700 plasmo-transition-colors"
            >
              📤 导出钱包
            </button>

            <button
              onClick={handleImportWallet}
              className="plasmo-w-full plasmo-bg-blue-600 plasmo-text-white plasmo-px-4 plasmo-py-3 plasmo-rounded-lg plasmo-font-medium hover:plasmo-bg-blue-700 plasmo-transition-colors"
            >
              📥 导入钱包
            </button>

            <button
              onClick={handleResetSettings}
              className="plasmo-w-full plasmo-bg-red-600 plasmo-text-white plasmo-px-4 plasmo-py-3 plasmo-rounded-lg plasmo-font-medium hover:plasmo-bg-red-700 plasmo-transition-colors"
            >
              🔄 重置设置
            </button>
          </div>
        </div>

        {/* 关于 */}
        <div className="plasmo-bg-gray-50 plasmo-p-4 plasmo-rounded-lg">
          <h2 className="plasmo-text-lg plasmo-font-semibold plasmo-mb-4">关于</h2>

          <div className="plasmo-space-y-2">
            <div className="plasmo-flex plasmo-justify-between">
              <span className="plasmo-text-gray-600">版本</span>
              <span className="plasmo-text-sm">1.0.0</span>
            </div>
            <div className="plasmo-flex plasmo-justify-between">
              <span className="plasmo-text-gray-600">构建时间</span>
              <span className="plasmo-text-sm">2024-11-01</span>
            </div>
            <div className="plasmo-flex plasmo-justify-between">
              <span className="plasmo-text-gray-600">网络</span>
              <span className="plasmo-text-sm">Sepolia Testnet</span>
            </div>
          </div>

          <div className="plasmo-mt-4 plasmo-pt-4 plasmo-border-t plasmo-border-gray-200">
            <p className="plasmo-text-sm plasmo-text-gray-600 plasmo-text-center">
              🚀 Plasmo Wallet - 安全的去中心化钱包
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}