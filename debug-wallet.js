// 在浏览器控制台中运行此脚本来调试钱包存储问题

// 首先打开扩展的popup或选项页面，然后在开发者工具控制台中运行：

async function debugWalletStorage() {
  console.log("🔍 开始调试钱包存储...")

  try {
    // 访问Plasmo Storage
    const storage = new chrome.storage.local()

    // 获取所有存储的数据
    const allData = await storage.get(null)
    console.log("📋 所有Chrome Storage数据:", allData)

    // 检查钱包相关数据
    const walletKeys = Object.keys(allData).filter(key =>
      key.includes('wallet') || key.includes('plasmo')
    )
    console.log("💼 钱包相关存储键:", walletKeys)

    // 详细检查每个钱包相关数据
    for (const key of walletKeys) {
      console.log(`📁 ${key}:`, allData[key])
    }

    // 尝试访问扩展的store
    if (window.walletStore) {
      console.log("🎯 钱包Store状态:", {
        wallets: window.walletStore.wallets,
        currentWallet: window.walletStore.currentWallet,
        isInitialized: window.walletStore.isInitialized,
        isUnlocked: window.walletStore.isUnlocked
      })

      // 调用debugStorage方法
      if (window.walletStore.debugStorage) {
        await window.walletStore.debugStorage()
      }
    } else {
      console.log("⚠️ 无法访问钱包Store，请确保在popup或options页面中运行")
    }

  } catch (error) {
    console.error("🚨 调试失败:", error)
  }
}

// 运行调试
debugWalletStorage()

// 也可以手动检查特定数据
async function checkSpecificData() {
  const storage = new chrome.storage.local()

  const walletData = await storage.get('plasmo-wallet-data')
  console.log("💼 plasmo-wallet-data:", walletData)

  const persistData = await storage.get('persist:plasmo-wallet-data')
  console.log("📝 persist:plasmo-wallet-data:", persistData)
}

// 🆕 专门检查 undefined 值的函数
async function checkUndefinedValues() {
  console.log("🔍 检查存储中的 undefined 值...")

  const storage = new chrome.storage.local()
  const allData = await storage.get(null)

  for (const [key, value] of Object.entries(allData)) {
    if (key.includes('wallet') || key.includes('plasmo')) {
      console.log(`📁 检查 ${key}:`, value)

      // 检查是否有 undefined 值
      const findUndefined = (obj, path = '') => {
        for (const [k, v] of Object.entries(obj || {})) {
          const currentPath = path ? `${path}.${k}` : k
          if (v === undefined) {
            console.log(`❌ 发现 undefined 值: ${currentPath}`)
          } else if (typeof v === 'object' && v !== null) {
            findUndefined(v, currentPath)
          }
        }
      }

      findUndefined(value)
    }
  }
}

// 🆕 清理 undefined 值的函数
async function cleanUndefinedValues() {
  console.log("🧹 清理存储中的 undefined 值...")

  const storage = new chrome.storage.local()
  const allData = await storage.get(null)
  const dataToClean = {}

  for (const [key, value] of Object.entries(allData)) {
    if (key.includes('wallet') || key.includes('plasmo')) {
      const cleanValue = JSON.parse(JSON.stringify(value, (k, v) => v === undefined ? undefined : v))

      // 移除 undefined 值
      const removeUndefined = (obj) => {
        if (Array.isArray(obj)) {
          return obj.filter(item => item !== undefined).map(removeUndefined)
        } else if (typeof obj === 'object' && obj !== null) {
          const cleaned = {}
          for (const [k, v] of Object.entries(obj)) {
            if (v !== undefined) {
              cleaned[k] = removeUndefined(v)
            }
          }
          return cleaned
        }
        return obj
      }

      dataToClean[key] = removeUndefined(cleanValue)
      console.log(`✅ 清理后的 ${key}:`, dataToClean[key])
    }
  }

  await storage.set(dataToClean)
  console.log("🎉 undefined 值清理完成!")
}

console.log("✅ 调试脚本已加载")
console.log("💡 可用命令:")
console.log("  - checkSpecificData() - 查看具体数据")
console.log("  - checkUndefinedValues() - 检查 undefined 值")
console.log("  - cleanUndefinedValues() - 清理 undefined 值")