/**
 * Chrome存储调试工具
 * 用于监控和调试存储状态
 */

import { storageManager } from './storage'

export class StorageDebugger {
  static async logStorageInfo(): Promise<void> {
    console.group('🔍 Chrome存储调试信息')

    try {
      const storageInfo = await storageManager.getStorageInfo()

      console.log('📊 存储概览:')
      Object.entries(storageInfo).forEach(([key, info]) => {
        const sizeKB = (info.size / 1024).toFixed(2)
        const date = new Date(info.timestamp).toLocaleString()
        console.log(`  ${key}: ${sizeKB}KB, 更新时间: ${date}`)
      })

      // 检查钱包数据
      const walletKeys = ['accounts', 'currentAccount', 'mnemonic', 'password', 'networks', 'tokens', 'currentNetwork', 'isConnected', 'isLocked']

      console.log('\n💼 钱包数据检查:')
      for (const key of walletKeys) {
        const data = await storageManager.get(key)
        const exists = data !== null && data !== undefined
        const type = exists ? typeof data : 'null'
        const isEncrypted = typeof data === 'string' && data.startsWith('U2FsdGVkX1')

        console.log(`  ${key}: ${exists ? '✅' : '❌'} (${type}${isEncrypted ? ', 加密' : ''})`)

        if (key === 'accounts' && Array.isArray(data)) {
          console.log(`    账户数量: ${data.length}`)
        }
        if (key === 'tokens' && Array.isArray(data)) {
          console.log(`    代币数量: ${data.length}`)
        }
        if (key === 'networks' && Array.isArray(data)) {
          console.log(`    网络数量: ${data.length}`)
        }
      }

      // 计算总大小
      const totalSize = Object.values(storageInfo).reduce((sum, info) => sum + info.size, 0)
      const totalSizeKB = (totalSize / 1024).toFixed(2)
      const totalSizeMB = (totalSize / 1024 / 1024).toFixed(2)

      console.log(`\n📏 总存储大小: ${totalSizeKB}KB (${totalSizeMB}MB)`)

      // Chrome存储限制警告
      const chromeLimit = 5 * 1024 * 1024 // 5MB (Chrome 113+)
      const usagePercent = ((totalSize / chromeLimit) * 100).toFixed(1)

      if (totalSize > chromeLimit * 0.8) {
        console.warn(`⚠️ 存储使用率过高: ${usagePercent}% (限制: 5MB)`)
      } else {
        console.log(`✅ 存储使用率: ${usagePercent}% (限制: 5MB)`)
      }

    } catch (error) {
      console.error('❌ 存储调试失败:', error)
    }

    console.groupEnd()
  }

  static async validateDataIntegrity(): Promise<boolean> {
    console.group('🔒 数据完整性验证')

    try {
      const accounts = await storageManager.get('accounts')
      const currentAccount = await storageManager.get('currentAccount')
      const networks = await storageManager.get('networks')
      const currentNetwork = await storageManager.get('currentNetwork')
      const tokens = await storageManager.get('tokens')

      let isValid = true
      const errors: string[] = []

      // 验证账户数据
      if (accounts && Array.isArray(accounts)) {
        if (accounts.length === 0) {
          errors.push('❌ 没有账户数据')
        } else {
          console.log(`✅ 账户数据正常 (${accounts.length}个账户)`)

          // 验证当前账户是否在账户列表中
          if (currentAccount && accounts.some(acc => acc.address === currentAccount.address)) {
            console.log('✅ 当前账户有效')
          } else if (currentAccount) {
            errors.push('❌ 当前账户不在账户列表中')
            isValid = false
          }
        }
      } else {
        errors.push('❌ 账户数据格式无效')
        isValid = false
      }

      // 验证网络数据
      if (networks && Array.isArray(networks) && networks.length > 0) {
        console.log(`✅ 网络数据正常 (${networks.length}个网络)`)

        // 验证当前网络是否在网络列表中
        if (currentNetwork && networks.some(net => net.id === currentNetwork.id)) {
          console.log('✅ 当前网络有效')
        } else if (currentNetwork) {
          errors.push('❌ 当前网络不在网络列表中')
          isValid = false
        }
      } else {
        errors.push('❌ 网络数据格式无效')
        isValid = false
      }

      // 验证代币数据
      if (tokens && Array.isArray(tokens)) {
        console.log(`✅ 代币数据正常 (${tokens.length}个代币)`)
      } else if (tokens) {
        errors.push('❌ 代币数据格式无效')
        isValid = false
      }

      if (errors.length > 0) {
        console.error('发现数据完整性问题:')
        errors.forEach(error => console.error(`  ${error}`))
      } else {
        console.log('✅ 所有数据完整性检查通过')
      }

      console.groupEnd()
      return isValid

    } catch (error) {
      console.error('❌ 数据完整性验证失败:', error)
      console.groupEnd()
      return false
    }
  }

  static async exportData(): Promise<void> {
    console.group('📤 导出存储数据')

    try {
      const walletKeys = ['accounts', 'currentAccount', 'mnemonic', 'password', 'networks', 'tokens', 'currentNetwork', 'isConnected', 'isLocked']
      const exportData: any = {}

      for (const key of walletKeys) {
        const data = await storageManager.get(key)
        if (data) {
          // 对于敏感数据，只导出元数据
          if (key === 'mnemonic' || key === 'password') {
            exportData[key] = {
              exists: true,
              isEncrypted: typeof data === 'string' && data.startsWith('U2FsdGVkX1'),
              length: data.length
            }
          } else {
            exportData[key] = data
          }
        } else {
          exportData[key] = null
        }
      }

      const exportString = JSON.stringify(exportData, null, 2)
      console.log('导出的数据:')
      console.log(exportString)

      // 复制到剪贴板
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(exportString)
        console.log('✅ 数据已复制到剪贴板')
      }

    } catch (error) {
      console.error('❌ 导出数据失败:', error)
    }

    console.groupEnd()
  }

  static async clearAllData(): Promise<void> {
    console.warn('⚠️ 准备清空所有钱包数据...')

    if (typeof window !== 'undefined' && window.confirm('确定要清空所有钱包数据吗？此操作不可恢复！')) {
      try {
        await storageManager.clear()
        console.log('✅ 所有钱包数据已清空')

        // 重新加载页面以清除内存中的状态
        if (typeof window !== 'undefined') {
          window.location.reload()
        }
      } catch (error) {
        console.error('❌ 清空数据失败:', error)
      }
    } else {
      console.log('❌ 用户取消了清空操作')
    }
  }
}

// 暴露到全局以便在控制台中使用
if (typeof window !== 'undefined') {
  (window as any).storageDebug = StorageDebugger
  console.log('💡 存储调试工具已加载，使用 storageDebug 调试')
}