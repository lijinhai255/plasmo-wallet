import React, { useState } from 'react'

export const ErrorTestPage = () => {
  const [throwError, setThrowError] = useState(false)
  const [asyncError, setAsyncError] = useState(false)
  const [nullError, setNullError] = useState(false)

  // 同步错误触发器
  const triggerSyncError = () => {
    setThrowError(true)
    throw new Error('这是一个测试同步错误')
  }

  // 异步错误触发器
  const triggerAsyncError = async () => {
    setAsyncError(true)
    await new Promise((_, reject) => {
      setTimeout(() => reject(new Error('这是一个测试异步错误')), 100)
    })
  }

  // 空指针错误触发器
  const triggerNullError = () => {
    setNullError(true)
    const obj: any = null
    obj.someProperty = '触发错误'
  }

  // 类型错误触发器
  const triggerTypeError = () => {
    const str: any = 'hello'
    str.someMethod()
  }

  // 引用错误触发器
  const triggerReferenceError = () => {
    console.log(undefinedVariable.someProperty)
  }

  return (
    <div className="plasmo-p-4 plasmo-bg-white plasmo-min-h-screen">
      <div className="plasmo-text-center plasmo-mb-6">
        <h1 className="plasmo-text-2xl plasmo-font-bold plasmo-mb-2">
          🧪 错误边界测试
        </h1>
        <p className="plasmo-text-gray-600 plasmo-text-sm">
          测试各种类型的错误处理
        </p>
      </div>

      {/* 错误状态显示 */}
      {(throwError || asyncError || nullError) && (
        <div className="plasmo-bg-red-50 plasmo-border plasmo-border-red-200 plasmo-p-4 plasmo-rounded-lg plasmo-mb-4">
          <p className="plasmo-text-red-800 plasmo-font-medium">
            ⚠️ 错误状态:
            {throwError && '同步错误'}
            {asyncError && '异步错误'}
            {nullError && '空指针错误'}
          </p>
        </div>
      )}

      {/* 测试按钮 */}
      <div className="plasmo-grid plasmo-grid-cols-2 plasmo-gap-3">
        <button
          onClick={triggerSyncError}
          className="plasmo-bg-red-600 plasmo-text-white plasmo-px-4 plasmo-py-3 plasmo-rounded-lg hover:plasmo-bg-red-700 plasmo-transition-colors"
        >
          ⚡ 同步错误
        </button>

        <button
          onClick={triggerAsyncError}
          className="plasmo-bg-orange-600 plasmo-text-white plasmo-px-4 plasmo-py-3 plasmo-rounded-lg hover:plasmo-bg-orange-700 plasmo-transition-colors"
        >
          ⏳ 异步错误
        </button>

        <button
          onClick={triggerNullError}
          className="plasmo-bg-purple-600 plasmo-text-white plasmo-px-4 plasmo-py-3 plasmo-rounded-lg hover:plasmo-bg-purple-700 plasmo-transition-colors"
        >
          👆 空指针错误
        </button>

        <button
          onClick={triggerTypeError}
          className="plasmo-bg-pink-600 plasmo-text-white plasmo-px-4 plasmo-py-3 plasmo-rounded-lg hover:plasmo-bg-pink-700 plasmo-transition-colors"
        >
          🔤 类型错误
        </button>

        <button
          onClick={triggerReferenceError}
          className="plasmo-bg-indigo-600 plasmo-text-white plasmo-px-4 plasmo-py-3 plasmo-rounded-lg hover:plasmo-bg-indigo-700 plasmo-transition-colors"
        >
          🔗 引用错误
        </button>
      </div>

      {/* 错误信息说明 */}
      <div className="plasmo-mt-8 plasmo-bg-gray-50 plasmo-p-4 plasmo-rounded-lg">
        <h2 className="plasmo-text-lg plasmo-font-semibold plasmo-mb-3">
          📝 错误类型说明
        </h2>
        <div className="plasmo-space-y-2 plasmo-text-sm">
          <div>
            <span className="plasmo-font-medium">⚡ 同步错误:</span>
            <p className="plasmo-text-gray-600">立即抛出的错误，会阻止当前执行</p>
          </div>
          <div>
            <span className="plasmo-font-medium">⏳ 异步错误:</span>
            <p className="plasmo-text-gray-600">在异步操作中抛出的错误</p>
          </div>
          <div>
            <span className="plasmo-font-medium">👆 空指针错误:</span>
            <p className="plasmo-text-gray-600">尝试访问 null 或 undefined 的属性</p>
          </div>
          <div>
            <span className="plasmo-font-medium">🔤 类型错误:</span>
            <p className="plasmo-text-gray-600">类型不匹配或方法不存在</p>
          </div>
          <div>
            <span className="plasmo-font-medium">🔗 引用错误:</span>
            <p className="plasmo-text-gray-600">尝试访问未定义的变量</p>
          </div>
        </div>
      </div>

      {/* 开发工具提示 */}
      <div className="plasmo-mt-4 plasmo-bg-blue-50 plasmo-border plasmo-border-blue-200 plasmo-p-4 plasmo-rounded-lg">
        <h3 className="plasmo-text-sm plasmo-font-semibold plasmo-text-blue-800 plasmo-mb-2">
          💡 开发提示
        </h3>
        <p className="plasmo-text-xs plasmo-text-blue-700">
          • 错误边界(Error Boundaries)会捕获组件树中的错误<br/>
          • 生产环境中应将错误信息记录到监控系统<br/>
          • 友好处理用户输入验证和API调用错误<br/>
          • 使用 try-catch 包装可能出错的代码块
        </p>
      </div>
    </div>
  )
}