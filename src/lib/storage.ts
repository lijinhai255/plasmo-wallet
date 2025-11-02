/**
 * Chrome Extension 存储管理器
 * 解决嵌套层级过深和数据丢失问题
 */

interface StorageItem {
  data: any
  timestamp: number
  version: string
}

class ChromeStorageManager {
  private static instance: ChromeStorageManager
  private readonly PREFIX = 'wallet_'
  private readonly VERSION = '1.0.0'

  static getInstance(): ChromeStorageManager {
    if (!ChromeStorageManager.instance) {
      ChromeStorageManager.instance = new ChromeStorageManager()
    }
    return ChromeStorageManager.instance
  }

  /**
   * 扁平化存储键名
   */
  private getKey(key: string): string {
    return `${this.PREFIX}${key}`
  }

  /**
   * 创建存储项
   */
  private createStorageItem(data: any): StorageItem {
    return {
      data,
      timestamp: Date.now(),
      version: this.VERSION
    }
  }

  /**
   * 验证存储项
   */
  private validateStorageItem(item: any): boolean {
    return item &&
           typeof item === 'object' &&
           'data' in item &&
           'timestamp' in item &&
           'version' in item
  }

  /**
   * 设置数据 - 扁平化存储
   */
  async set(key: string, data: any): Promise<void> {
    const storageKey = this.getKey(key)
    const storageItem = this.createStorageItem(data)

    try {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        await chrome.storage.local.set({ [storageKey]: storageItem })
        console.log(`✅ ChromeStorageManager: 已保存 ${key}`)
      } else {
        // 降级到localStorage
        localStorage.setItem(storageKey, JSON.stringify(storageItem))
        console.log(`✅ ChromeStorageManager: 已保存 ${key} 到 localStorage`)
      }
    } catch (error) {
      console.error(`❌ ChromeStorageManager: 保存 ${key} 失败:`, error)
      throw new Error(`存储失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  /**
   * 获取数据
   */
  async get<T = any>(key: string, defaultValue?: T): Promise<T | null> {
    const storageKey = this.getKey(key)

    try {
      let result: any = null

      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        const chromeResult = await chrome.storage.local.get(storageKey)
        result = chromeResult[storageKey]
      } else {
        // 降级到localStorage
        const item = localStorage.getItem(storageKey)
        result = item ? JSON.parse(item) : null
      }

      if (!result) {
        return defaultValue || null
      }

      if (!this.validateStorageItem(result)) {
        console.warn(`⚠️ ChromeStorageManager: ${key} 数据格式无效，使用默认值`)
        return defaultValue || null
      }

      console.log(`✅ ChromeStorageManager: 已读取 ${key}`)
      return result.data as T

    } catch (error) {
      console.error(`❌ ChromeStorageManager: 读取 ${key} 失败:`, error)
      return defaultValue || null
    }
  }

  /**
   * 删除数据
   */
  async remove(key: string): Promise<void> {
    const storageKey = this.getKey(key)

    try {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        await chrome.storage.local.remove(storageKey)
        console.log(`✅ ChromeStorageManager: 已删除 ${key}`)
      } else {
        localStorage.removeItem(storageKey)
        console.log(`✅ ChromeStorageManager: 已删除 ${key} 从 localStorage`)
      }
    } catch (error) {
      console.error(`❌ ChromeStorageManager: 删除 ${key} 失败:`, error)
      throw new Error(`删除失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  /**
   * 清空所有钱包相关数据
   */
  async clear(): Promise<void> {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        const items = await chrome.storage.local.get(null)
        const keysToRemove = Object.keys(items).filter(key => key.startsWith(this.PREFIX))

        if (keysToRemove.length > 0) {
          await chrome.storage.local.remove(keysToRemove)
          console.log(`✅ ChromeStorageManager: 已清空 ${keysToRemove.length} 个存储项`)
        }
      } else {
        // localStorage降级处理
        const keysToRemove: string[] = []
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i)
          if (key && key.startsWith(this.PREFIX)) {
            keysToRemove.push(key)
          }
        }

        keysToRemove.forEach(key => localStorage.removeItem(key))
        console.log(`✅ ChromeStorageManager: 已清空 ${keysToRemove.length} 个localStorage存储项`)
      }
    } catch (error) {
      console.error('❌ ChromeStorageManager: 清空存储失败:', error)
      throw new Error(`清空失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  /**
   * 获取存储大小信息
   */
  async getStorageInfo(): Promise<{ [key: string]: { size: number; timestamp: number } }> {
    const info: { [key: string]: { size: number; timestamp: number } } = {}

    try {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        const items = await chrome.storage.local.get(null)

        Object.entries(items).forEach(([key, value]) => {
          if (key.startsWith(this.PREFIX)) {
            const cleanKey = key.replace(this.PREFIX, '')
            const size = JSON.stringify(value).length
            const timestamp = (value as any).timestamp || 0

            info[cleanKey] = { size, timestamp }
          }
        })
      } else {
        // localStorage降级处理
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i)
          if (key && key.startsWith(this.PREFIX)) {
            const cleanKey = key.replace(this.PREFIX, '')
            const value = localStorage.getItem(key)

            if (value) {
              try {
                const parsed = JSON.parse(value)
                const size = value.length
                const timestamp = parsed.timestamp || 0

                info[cleanKey] = { size, timestamp }
              } catch (error) {
                console.warn(`⚠️ ChromeStorageManager: 无法解析 ${key}`)
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('❌ ChromeStorageManager: 获取存储信息失败:', error)
    }

    return info
  }

  /**
   * 数据迁移和版本升级
   */
  async migrate(fromVersion?: string): Promise<void> {
    console.log('🔄 ChromeStorageManager: 开始数据迁移检查')

    // 1. 检查是否有旧的嵌套结构数据需要迁移
    const needsMigration = await this.checkAndMigrateNestedStorage()
    if (needsMigration) {
      console.log('✅ ChromeStorageManager: 嵌套数据迁移完成')
      return
    }

    // 2. 检查是否有标记的旧版数据需要迁移
    const oldData = await this.get('legacy_wallet_data')
    if (oldData) {
      console.log('🔄 ChromeStorageManager: 发现旧版数据，开始迁移')

      // 将旧数据拆分存储
      if (oldData.accounts) await this.set('accounts', oldData.accounts)
      if (oldData.currentAccount) await this.set('currentAccount', oldData.currentAccount)
      if (oldData.mnemonic) await this.set('mnemonic', oldData.mnemonic)
      if (oldData.password) await this.set('password', oldData.password)
      if (oldData.networks) await this.set('networks', oldData.networks)
      if (oldData.tokens) await this.set('tokens', oldData.tokens)

      // 删除旧数据
      await this.remove('legacy_wallet_data')
      console.log('✅ ChromeStorageManager: 数据迁移完成')
    }
  }

  /**
   * 检查并迁移旧的嵌套存储结构
   */
  private async checkAndMigrateNestedStorage(): Promise<boolean> {
    try {
      let nestedData: any = null

      // 检查Chrome storage中的嵌套数据
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        const result = await chrome.storage.local.get('wallet-store')
        nestedData = result['wallet-store']
      } else {
        // 检查localStorage中的嵌套数据
        const item = localStorage.getItem('wallet-store')
        nestedData = item ? JSON.parse(item) : null
      }

      if (nestedData && nestedData.state) {
        console.log('🔄 ChromeStorageManager: 发现嵌套存储结构，开始迁移')

        const { state } = nestedData

        // 迁移数据到扁平化存储
        await Promise.all([
          state.accounts ? this.set('accounts', state.accounts) : Promise.resolve(),
          state.currentAccount ? this.set('currentAccount', state.currentAccount) : Promise.resolve(),
          state.mnemonic ? this.set('mnemonic', state.mnemonic) : Promise.resolve(),
          state.password ? this.set('password', state.password) : Promise.resolve(),
          state.networks ? this.set('networks', state.networks) : Promise.resolve(),
          state.tokens ? this.set('tokens', state.tokens) : Promise.resolve(),
          state.currentNetwork ? this.set('currentNetwork', state.currentNetwork) : Promise.resolve(),
          this.set('isConnected', state.isConnected || false),
          this.set('isLocked', state.isLocked !== undefined ? state.isLocked : true)
        ])

        // 删除旧的嵌套数据
        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
          await chrome.storage.local.remove('wallet-store')
        } else {
          localStorage.removeItem('wallet-store')
        }

        console.log('✅ ChromeStorageManager: 嵌套存储迁移完成')
        return true
      }

      return false
    } catch (error) {
      console.error('❌ ChromeStorageManager: 嵌套存储迁移失败:', error)
      return false
    }
  }
}

// 导出单例实例
export const storageManager = ChromeStorageManager.getInstance()
export default storageManager