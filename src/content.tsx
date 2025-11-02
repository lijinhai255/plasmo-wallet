/**
 * Content Script for Ethereum Provider Injection
 * 在每个页面中注入window.ethereum提供者
 */

console.log('🔄 Content Script 开始执行')

// 等待页面加载完成
function injectProvider() {
  console.log('🔄 开始注入以太坊提供者')

  // 检查是否已经有提供者
  if (window.ethereum) {
    console.log('⚠️ 检测到已存在的 window.ethereum')
    return
  }

  // 创建提供者实例 - 使用注入的PlasmoEthereumProvider类
  if (!(window as any).PlasmoEthereumProvider) {
    console.log('❌ PlasmoEthereumProvider 类未注入')
    return
  }

  const provider = new (window as any).PlasmoEthereumProvider()

  // 注入到window对象
  window.ethereum = provider

  console.log('✅ 以太坊提供者注入成功')

  // 触发提供者初始化事件
  window.dispatchEvent(new CustomEvent('ethereumProvider#initialized', {
    detail: { provider: window.ethereum }
  }))
}

// 在页面完全加载后注入
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', injectProvider)
} else {
  injectProvider()
}

// 监听页面变化（用于SPA应用）
let lastUrl = location.href
new MutationObserver(() => {
  const url = location.href
  if (url !== lastUrl) {
    lastUrl = url
    console.log('🔄 检测到页面变化，重新检查提供者注入')
    setTimeout(injectProvider, 100)
  }
}).observe(document, { subtree: true, childList: true })

console.log('✅ Content Script 设置完成')