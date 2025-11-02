import React, { useState } from 'react'

export const PasswordPage = () => {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleChangePassword = async () => {
    // 验证表单
    if (!currentPassword) {
      setMessage('请输入当前密码')
      return
    }

    if (!newPassword) {
      setMessage('请输入新密码')
      return
    }

    if (newPassword.length < 8) {
      setMessage('密码长度至少8位')
      return
    }

    if (newPassword !== confirmPassword) {
      setMessage('两次输入的密码不一致')
      return
    }

    setIsLoading(true)
    setMessage('')

    try {
      // 这里应该调用钱包的密码更改方法
      console.log('更改密码:', { currentPassword, newPassword })

      // 模拟异步操作
      await new Promise(resolve => setTimeout(resolve, 1000))

      setMessage('✅ 密码修改成功')

      // 清空表单
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setShowCurrentPassword(false)
      setShowNewPassword(false)
      setShowConfirmPassword(false)

    } catch (error) {
      console.error('修改密码失败:', error)
      setMessage('❌ 修改密码失败，请重试')
    } finally {
      setIsLoading(false)
    }
  }

  const generateSecurePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*'
    let password = ''
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setNewPassword(password)
    setConfirmPassword(password)
  }

  const clearForm = () => {
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
    setShowCurrentPassword(false)
    setShowNewPassword(false)
    setShowConfirmPassword(false)
    setMessage('')
  }

  return (
    <div className="plasmo-p-4 plasmo-bg-white plasmo-min-h-screen">
      <div className="plasmo-text-center plasmo-mb-6">
        <h1 className="plasmo-text-2xl plasmo-font-bold plasmo-mb-2">
          🔐 密码管理
        </h1>
        <p className="plasmo-text-gray-600 plasmo-text-sm">
          修改您的钱包密码
        </p>
      </div>

      {/* 错误或成功消息 */}
      {message && (
        <div
          className={`plasmo-p-3 plasmo-rounded-lg plasmo-mb-4 ${
            message.includes('✅')
              ? 'plasmo-bg-green-50 plasmo-text-green-800'
              : 'plasmo-bg-red-50 plasmo-text-red-800'
          }`}
        >
          <p className="plasmo-text-sm">{message}</p>
        </div>
      )}

      {/* 密码修改表单 */}
      <div className="plasmo-bg-gray-50 plasmo-p-6 plasmo-rounded-lg">
        <div className="plasmo-space-y-4">
          {/* 当前密码 */}
          <div>
            <label className="plasmo-block plasmo-text-sm plasmo-font-medium plasmo-mb-2">
              当前密码
            </label>
            <div className="plasmo-relative">
              <input
                type={showCurrentPassword ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="输入当前密码"
                className="plasmo-w-full plasmo-border plasmo-border-gray-300 plasmo-rounded-lg plasmo-px-3 plasmo-py-2 plasmo-pr-10"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="plasmo-absolute plasmo-right-2 plasmo-top-2 plasmo-text-gray-500 hover:plasmo-text-gray-700"
              >
                {showCurrentPassword ? '👁️' : '👁️‍♂️'}
              </button>
            </div>
          </div>

          {/* 新密码 */}
          <div>
            <label className="plasmo-block plasmo-text-sm plasmo-font-medium plasmo-mb-2">
              新密码
            </label>
            <div className="plasmo-relative">
              <input
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="输入新密码（至少8位）"
                className="plasmo-w-full plasmo-border plasmo-border-gray-300 plasmo-rounded-lg plasmo-px-3 plasmo-py-2 plasmo-pr-10"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="plasmo-absolute plasmo-right-2 plasmo-top-2 plasmo-text-gray-500 hover:plasmo-text-gray-700"
              >
                {showNewPassword ? '👁️' : '👁️‍♂️'}
              </button>
            </div>
            {newPassword && (
              <div className="plasmo-mt-1">
                <div className="plasmo-text-xs plasmo-text-gray-600">
                  强度: {newPassword.length < 8 ? '⚠️ 弱' : newPassword.length < 12 ? '🔒 中' : '🔒🔒 强'}
                </div>
              </div>
            )}
          </div>

          {/* 确认密码 */}
          <div>
            <label className="plasmo-block plasmo-text-sm plasmo-font-medium plasmo-mb-2">
              确认新密码
            </label>
            <div className="plasmo-relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="再次输入新密码"
                className="plasmo-w-full plasmo-border plasmo-border-gray-300 plasmo-rounded-lg plasmo-px-3 plasmo-py-2 plasmo-pr-10"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="plasmo-absolute plasmo-right-2 plasmo-top-2 plasmo-text-gray-500 hover:plasmo-text-gray-700"
              >
                {showConfirmPassword ? '👁️' : '👁️‍♂️'}
              </button>
            </div>
            {confirmPassword && newPassword && (
              <div className="plasmo-mt-1">
                <div className={`plasmo-text-xs ${
                  newPassword === confirmPassword
                    ? 'plasmo-text-green-600'
                    : 'plasmo-text-red-600'
                }`}>
                  {newPassword === confirmPassword ? '✅ 密码匹配' : '❌ 密码不匹配'}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="plasmo-grid plasmo-grid-cols-2 plasmo-gap-3 plasmo-mt-6">
          <button
            onClick={clearForm}
            className="plasmo-w-full plasmo-bg-gray-200 plasmo-text-gray-800 plasmo-px-4 plasmo-py-2 plasmo-rounded-lg plasmo-font-medium hover:plasmo-bg-gray-300 plasmo-transition-colors"
            disabled={isLoading}
          >
            清空
          </button>

          <button
            onClick={generateSecurePassword}
            className="plasmo-w-full plasmo-bg-blue-200 plasmo-text-blue-800 plasmo-px-4 plasmo-py-2 plasmo-rounded-lg plasmo-font-medium hover:plasmo-bg-blue-300 plasmo-transition-colors"
            disabled={isLoading}
          >
            🔒 生成
          </button>
        </div>

        <button
          onClick={handleChangePassword}
          className="plasmo-w-full plasmo-bg-blue-600 plasmo-text-white plasmo-px-4 plasmo-py-3 plasmo-rounded-lg plasmo-font-medium hover:plasmo-bg-blue-700 plasmo-transition-colors disabled:plasmo-bg-gray-400"
          disabled={isLoading || !currentPassword || !newPassword || !confirmPassword || newPassword !== confirmPassword}
        >
          {isLoading ? '修改中...' : '🔐 修改密码'}
        </button>
      </div>

      {/* 安全提示 */}
      <div className="plasmo-mt-6 plasmo-bg-yellow-50 plasmo-border plasmo-border-yellow-200 plasmo-p-4 plasmo-rounded-lg">
        <h3 className="plasmo-text-sm plasmo-font-semibold plasmo-text-yellow-800 plasmo-mb-2">
          🔒 安全提示
        </h3>
        <ul className="plasmo-text-xs plasmo-text-yellow-700 plasmo-space-y-1 plasmo-list-disc plasmo-list-inside">
          <li>请使用强密码（包含大小写字母、数字和特殊字符）</li>
          <li>不要在多个地方使用相同的密码</li>
          <li>定期更换密码以提高安全性</li>
          <li>请妥善保管您的密码，不要分享给他人</li>
          <li>建议使用密码管理器生成和存储复杂密码</li>
        </ul>
      </div>
    </div>
  )
}