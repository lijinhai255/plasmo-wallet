import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Storage } from "@plasmohq/storage"
import * as bip39 from 'bip39'
import { AES, SHA256 } from 'crypto-js'
import { ethers } from 'ethers'

// 钱包账户接口
export interface WalletAccount {
  address: string
  privateKey: string
  name: string
  index: number
}

// 钱包状态接口
export interface WalletState {
  isInitialized: boolean
  isUnlocked: boolean
  currentWallet: WalletAccount | null
  wallets: WalletAccount[]
  balance: string
  error: string | null
  isLoading: boolean
  // 🆕 记住解锁状态选项
  rememberUnlock: boolean
  autoUnlockDuration: number // 自动解锁持续时间（分钟）
  lastUnlockTime: number // 最后解锁时间
}

// 钱包存储接口
interface WalletStore extends WalletState {
  // 钱包管理
  initializeWallet: () => Promise<void>
  createWallet: (walletName: string, password: string) => Promise<{ mnemonic: string; address: string }>
  importWalletByMnemonic: (mnemonic: string, walletName: string, password: string) => Promise<void>
  importWalletByPrivateKey: (privateKey: string, walletName: string, password: string) => Promise<void>
  deleteWallet: (address: string) => Promise<void>
  lockWallet: () => Promise<void>
  unlockWallet: (password: string) => Promise<void>
  selectWallet: (password?: string) => Promise<string>

  // 账户管理
  switchWallet: (address: string) => void
  updateWalletName: (address: string, name: string) => void

  // 余额管理
  loadBalance: (address: string) => Promise<void>
  clearBalance: () => void

  // 工具方法
  clearError: () => void
  getProvider: () => ethers.JsonRpcProvider | null

  // 🆕 调试方法
  debugStorage: () => Promise<void>

  // 🆕 智能解锁相关方法
  checkAutoUnlock: () => Promise<boolean>
  setRememberUnlock: (remember: boolean, duration?: number) => void
  updateLastUnlockTime: () => void

  // 钱包检测和注入
  detectWallet: () => boolean
  checkWalletConnection: () => Promise<boolean>
  connectToWallet: () => Promise<WalletAccount | null>
  disconnectWallet: () => void

  // 🆕 从 Chrome Storage 加载持久化状态
  loadPersistedState: () => Promise<void>
  saveToStorage: () => Promise<void>
  getChromeStorageState: () => Promise<any>
}

// 初始状态
const initialState: WalletState = {
  isInitialized: false,
  isUnlocked: true, // 🆕 简化为默认解锁状态
  currentWallet: null,
  wallets: [],
  balance: "0",
  error: null,
  isLoading: false,
  rememberUnlock: false,
  autoUnlockDuration: 30, // 默认30分钟
  lastUnlockTime: 0
}

// 创建 Zustand store
export const useWalletStore = create<WalletStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      // 初始化钱包
      initializeWallet: async () => {
        try {
          set({ isLoading: true, error: null })

          // 🆕 先加载Chrome Storage中的持久化数据
          await get().loadPersistedState()

          // 等待数据加载
          await new Promise(resolve => setTimeout(resolve, 100))

          const state = get()
          console.log("🔍 检查存储的钱包数量:", state.wallets.length)

          if (state.wallets.length > 0) {
            // 有钱包：直接展示第一个钱包
            if (!state.currentWallet && state.wallets.length > 0) {
              const firstWallet = state.wallets[0]
              set({
                currentWallet: {
                  address: firstWallet.address,
                  privateKey: firstWallet.privateKey,
                  name: firstWallet.name,
                  index: firstWallet.index
                }
              })
              console.log("✅ 找到已存储钱包:", firstWallet.address)
            }

            set({
              isInitialized: true,
              isLoading: false
            })
            console.log("🎉 钱包就绪，已显示账户信息")
          } else {
            // 没有钱包：设置为已初始化，等用户创建
            set({
              isInitialized: true,
              isLoading: false
            })
            console.log("📝 没有钱包，等待用户创建")
          }

        } catch (error) {
          console.error("钱包初始化失败:", error)
          set({
            error: error instanceof Error ? error.message : "钱包初始化失败",
            isLoading: false
          })
        }
      },

      // 创建钱包
      createWallet: async (walletName: string, password: string) => {
        try {
          set({ isLoading: true, error: null })

          // 生成助记词
          const mnemonic = bip39.generateMnemonic()

          // 生成种子
          const seedBuffer = await bip39.mnemonicToSeed(mnemonic)
          const seed = new Uint8Array(seedBuffer)

          // 生成 HD 钱包
          const hdNode = ethers.HDNodeWallet.fromSeed(seed)

          // 生成第一个账户
          const wallet = hdNode.derivePath("m/44'/60'/0'/0/0")

          const walletAccount: WalletAccount = {
            address: wallet.address,
            privateKey: wallet.privateKey,
            name: walletName || `Wallet ${Date.now()}`,
            index: 0
          }

          // 加密敏感数据
          const encryptedMnemonic = AES.encrypt(mnemonic, password).toString()
          const encryptedPrivateKey = AES.encrypt(wallet.privateKey, password).toString()
          const hashedPassword = SHA256(password).toString()

          // 存储加密的钱包数据
          const encryptedWallet = {
            ...walletAccount,
            privateKey: encryptedPrivateKey,
            mnemonic: encryptedMnemonic
          }

          set(state => ({
            wallets: [...state.wallets, encryptedWallet],
            currentWallet: walletAccount,
            isInitialized: true,
            isUnlocked: true,
            isLoading: false
          }))

          // 🆕 立即保存到Chrome Storage
          await get().saveToStorage()

          console.log("✅ 钱包创建成功:", walletAccount.address)

          return {
            mnemonic,
            address: walletAccount.address
          }

        } catch (error) {
          console.error("创建钱包失败:", error)
          set({
            error: error instanceof Error ? error.message : "创建钱包失败",
            isLoading: false
          })
          throw error
        }
      },

      // 通过助记词导入钱包
      importWalletByMnemonic: async (mnemonic: string, walletName: string, password: string) => {
        try {
          set({ isLoading: true, error: null })

          // 验证助记词
          if (!bip39.validateMnemonic(mnemonic)) {
            throw new Error("助记词格式不正确")
          }

          // 生成种子
          const seedBuffer = await bip39.mnemonicToSeed(mnemonic)
          const seed = new Uint8Array(seedBuffer)

          // 生成 HD 钱包
          const hdNode = ethers.HDNodeWallet.fromSeed(seed)

          // 生成第一个账户
          const wallet = hdNode.derivePath("m/44'/60'/0'/0/0")

          const walletAccount: WalletAccount = {
            address: wallet.address,
            privateKey: wallet.privateKey,
            name: walletName || `Imported Wallet ${Date.now()}`,
            index: 0
          }

          // 检查是否已存在相同地址的钱包
          const state = get()
          const existingWallet = state.wallets.find(w =>
            w.address.toLowerCase() === walletAccount.address.toLowerCase()
          )

          if (existingWallet) {
            throw new Error("该钱包已存在")
          }

          // 加密敏感数据
          const encryptedMnemonic = AES.encrypt(mnemonic, password).toString()
          const encryptedPrivateKey = AES.encrypt(wallet.privateKey, password).toString()
          const hashedPassword = SHA256(password).toString()

          // 存储加密的钱包数据
          const encryptedWallet = {
            ...walletAccount,
            privateKey: encryptedPrivateKey,
            mnemonic: encryptedMnemonic,
            password: hashedPassword
          }

          set(state => ({
            wallets: [...state.wallets, encryptedWallet],
            currentWallet: walletAccount,
            isInitialized: true,
            isUnlocked: true,
            isLoading: false
          }))

          // 🆕 立即保存到Chrome Storage
          await get().saveToStorage()

          console.log("✅ 钱包导入成功:", walletAccount.address)

        } catch (error) {
          console.error("导入钱包失败:", error)
          set({
            error: error instanceof Error ? error.message : "导入钱包失败",
            isLoading: false
          })
          throw error
        }
      },

      // 通过私钥导入钱包
      importWalletByPrivateKey: async (privateKey: string, walletName: string, password: string) => {
        try {
          set({ isLoading: true, error: null })

          // 验证私钥
          let wallet: ethers.Wallet
          try {
            wallet = new ethers.Wallet(privateKey)
          } catch (error) {
            throw new Error("私钥格式不正确")
          }

          const walletAccount: WalletAccount = {
            address: wallet.address,
            privateKey: wallet.privateKey,
            name: walletName || `Imported Wallet ${Date.now()}`,
            index: 0
          }

          // 检查是否已存在相同地址的钱包
          const state = get()
          const existingWallet = state.wallets.find(w =>
            w.address.toLowerCase() === walletAccount.address.toLowerCase()
          )

          if (existingWallet) {
            throw new Error("该钱包已存在")
          }

          // 加密私钥
          const encryptedPrivateKey = AES.encrypt(wallet.privateKey, password).toString()
          const hashedPassword = SHA256(password).toString()

          // 存储加密的钱包数据
          const encryptedWallet = {
            ...walletAccount,
            privateKey: encryptedPrivateKey,
            password: hashedPassword
          }

          set(state => ({
            wallets: [...state.wallets, encryptedWallet],
            currentWallet: walletAccount,
            isInitialized: true,
            isUnlocked: true,
            isLoading: false
          }))

          console.log("✅ 私钥导入成功:", walletAccount.address)

        } catch (error) {
          console.error("私钥导入失败:", error)
          set({
            error: error instanceof Error ? error.message : "私钥导入失败",
            isLoading: false
          })
          throw error
        }
      },

      // 删除钱包
      deleteWallet: async (address: string) => {
        try {
          const state = get()
          const updatedWallets = state.wallets.filter(w => w.address !== address)

          set(state => ({
            wallets: updatedWallets,
            currentWallet: state.currentWallet?.address === address ? null : state.currentWallet,
            isInitialized: updatedWallets.length > 0
          }))

          // 🆕 删除钱包后保存状态
          await get().saveToStorage()

          console.log("✅ 钱包删除成功:", address)

        } catch (error) {
          console.error("删除钱包失败:", error)
          set({
            error: error instanceof Error ? error.message : "删除钱包失败"
          })
          throw error
        }
      },

      // 锁定钱包
      lockWallet: async () => {
        set({
          isUnlocked: false,
          currentWallet: null,
          balance: "0",
          error: null
        })

        // 🆕 锁定钱包后保存状态
        await get().saveToStorage()

        console.log("🔒 钱包已锁定")
      },

      // 🆕 简化版：选择钱包（不再需要密码解锁）
      selectWallet: async (password?: string) => {
        try {
          const state = get()
          console.log("🔓 选择钱包 - 钱包数量:", state.wallets.length)

          if (state.wallets.length === 0) {
            throw new Error("没有找到钱包")
          }

          // 选择第一个钱包
          const firstWallet = state.wallets[0]

          set({
            currentWallet: {
              address: firstWallet.address,
              privateKey: firstWallet.privateKey,
              name: firstWallet.name,
              index: firstWallet.index
            },
            error: null
          })

          console.log("🔓 钱包选择成功:", firstWallet.address)
          return firstWallet.address

        } catch (error) {
          console.error("选择钱包失败:", error)
          set({
            error: error instanceof Error ? error.message : "选择钱包失败"
          })
          throw error
        }
      },

      // 保留原来的 unlockWallet 方法（简化版）
      unlockWallet: async (password: string) => {
        // 直接调用 selectWallet
        return get().selectWallet(password)
      },

      // 切换钱包
      switchWallet: (address: string) => {
        const state = get()
        const wallet = state.wallets.find(w => w.address === address)

        if (wallet) {
          set({
            currentWallet: {
              address: wallet.address,
              privateKey: wallet.privateKey,
              name: wallet.name,
              index: wallet.index
            }
          })
          console.log("🔄 钱包切换成功:", address)
        }
      },

      // 更新钱包名称
      updateWalletName: (address: string, name: string) => {
        set(state => ({
          wallets: state.wallets.map(w =>
            w.address === address ? { ...w, name } : w
          ),
          currentWallet: state.currentWallet?.address === address
            ? { ...state.currentWallet, name }
            : state.currentWallet
        }))
      },

      // 加载余额
      loadBalance: async (address: string) => {
        try {
          // 这里简化处理，实际应该通过 ChainStore 获取余额
          set({ balance: "0" })
        } catch (error) {
          console.error("加载余额失败:", error)
        }
      },

      // 清除余额
      clearBalance: () => {
        set({ balance: "0" })
      },

      // 清除错误
      clearError: () => {
        set({ error: null })
      },

      // 获取 Provider
      getProvider: () => {
        // 这里应该从 ChainStore 获取 provider
        // 简化版本返回 null
        return null
      },

      // 检测钱包注入状态
      detectWallet: (): boolean => {
        // 检查是否在扩展环境
        if (typeof window !== 'undefined' && window.chrome && window.chrome.runtime) {
          console.log("✅ 检测到浏览器扩展环境")
          return true
        }

        // 检查是否有注入的钱包对象
        if (typeof window !== 'undefined' && (window as any).plasmoWallet) {
          console.log("✅ 检测到注入的钱包对象")
          return true
        }

        console.log("⚠️ 未检测到钱包注入")
        return false
      },

      // 检查钱包连接状态
      checkWalletConnection: async (): Promise<boolean> => {
        try {
          if (typeof window === 'undefined') {
            return false
          }

          const plasmoWallet = (window as any).plasmoWallet
          if (!plasmoWallet) {
            return false
          }

          // 尝试获取当前账户
          const account = await plasmoWallet.getAccount()
          return !!account

        } catch (error) {
          console.warn("检查钱包连接状态失败:", error)
          return false
        }
      },

      // 连接到钱包
      connectToWallet: async (): Promise<WalletAccount | null> => {
        try {
          if (typeof window === 'undefined') {
            throw new Error("不在浏览器环境中")
          }

          const plasmoWallet = (window as any).plasmoWallet
          if (!plasmoWallet) {
            throw new Error("钱包对象未注入")
          }

          console.log("🔗 正在连接到钱包...")

          // 调用钱包的连接方法
          const account = await plasmoWallet.connect()

          if (!account) {
            throw new Error("连接钱包失败")
          }

          const walletAccount: WalletAccount = {
            address: account.address || account,
            privateKey: '', // 私钥不暴露给前端
            name: account.name || 'Connected Wallet',
            index: 0
          }

          set({
            currentWallet: walletAccount,
            isUnlocked: true,
            error: null
          })

          console.log("✅ 钱包连接成功:", walletAccount.address)
          return walletAccount

        } catch (error) {
          console.error("连接钱包失败:", error)
          set({
            error: error instanceof Error ? error.message : "连接钱包失败"
          })
          throw error
        }
      },

      // 断开钱包连接
      disconnectWallet: () => {
        set({
          currentWallet: null,
          isUnlocked: false,
          error: null
        })

        if (typeof window !== 'undefined' && (window as any).plasmoWallet) {
          try {
            (window as any).plasmoWallet.disconnect()
          } catch (error) {
            console.warn("断开钱包连接失败:", error)
          }
        }

        console.log("🔌 钱包连接已断开")
      },

      // 🆕 从 Chrome Storage 加载持久化状态
      loadPersistedState: async () => {
        try {
          console.log("🔄 开始加载钱包持久化状态...")
          const storage = new Storage()

          // 直接检查 plasmo-wallet-data 键
          const data = await storage.get('plasmo-wallet-data')
          console.log("📋 plasmo-wallet-data 原始数据:", data)

          if (data && typeof data === 'object' && data.wallets && Array.isArray(data.wallets)) {
            console.log(`✅ 找到钱包数据，钱包数量: ${data.wallets.length}`)

            // 直接设置状态
            const stateToSet: Partial<WalletState> = {
              wallets: data.wallets || [],
              currentWallet: data.currentWallet || null,
              isInitialized: data.isInitialized ?? true,
              isUnlocked: data.isUnlocked ?? true,
              error: data.error ?? null,
              rememberUnlock: data.rememberUnlock ?? false,
              autoUnlockDuration: data.autoUnlockDuration ?? 30,
              lastUnlockTime: data.lastUnlockTime ?? 0,
              balance: data.balance || "0",
              isLoading: false
            }

            console.log("🔄 正在更新状态...")
            set(stateToSet)

            // 验证设置结果
            const currentState = get()
            console.log("✅ 钱包状态加载完成:")
            console.log("  - 钱包数量:", currentState.wallets.length)
            console.log("  - 当前钱包:", currentState.currentWallet?.address || 'null')
            console.log("  - 已初始化:", currentState.isInitialized)
            console.log("  - 已解锁:", currentState.isUnlocked)

          } else {
            console.log("📝 没有找到钱包数据，使用默认状态")
          }

        } catch (error) {
          console.error("❌ 加载持久化状态失败:", error)
        }
      },

      // 🆕 手动触发存储保存（用于调试）
      saveToStorage: async () => {
        try {
          // Zustand persist 会自动保存，这里只是触发调试日志
          const state = get()
          console.log("🔄 手动触发存储保存，当前钱包数量:", state.wallets.length)
        } catch (error) {
          console.error("手动保存失败:", error)
        }
      },

      // 🆕 获取 Chrome Storage 中的状态
      getChromeStorageState: async () => {
        try {
          const storage = new Storage()
          const result = await storage.get('plasmo-wallet-data')
          return result || null
        } catch (error) {
          console.error("获取 Chrome Storage 状态失败:", error)
          return null
        }
      },

      // 🆕 调试Chrome Storage中的数据
      debugStorage: async () => {
        try {
          const storage = new Storage()

          console.log("🔍 === Chrome Storage 调试信息 ===")

          // 检查所有存储的键
          const allKeys = await storage.getAll()
          console.log("📋 所有存储键:", Object.keys(allKeys))

          // 检查所有键的值
          console.log("📋 存储键值详情:")
          for (const key of Object.keys(allKeys)) {
            const value = allKeys[key]
            console.log(`  ${key}:`, value)
          }

          // 🔍 专门检查钱包相关数据
          console.log("\n💼 === 钱包相关数据检查 ===")
          const walletData = await storage.get('plasmo-wallet-data')
          const persistData = await storage.get('persist:plasmo-wallet-data')
          const balanceData = await storage.get('plasmo-balance-data')
          const chainData = await storage.get('plasmo-chain-config')

          console.log("💼 plasmo-wallet-data:", walletData)
          console.log("📝 persist:plasmo-wallet-data:", persistData)
          console.log("💰 plasmo-balance-data:", balanceData)
          console.log("⛓️ plasmo-chain-config:", chainData)

          // 🔍 尝试解析和显示钱包数据
          if (walletData) {
            console.log("\n📝 === 钱包数据解析 ===")
            try {
              let parsed = walletData
              if (typeof walletData === 'string') {
                parsed = JSON.parse(walletData)
              }
              console.log("✅ 解析后的钱包数据:", parsed)

              if (parsed.wallets) {
                console.log(`📍 找到 ${parsed.wallets.length} 个钱包:`)
                parsed.wallets.forEach((wallet: any, index: number) => {
                  console.log(`  ${index + 1}. ${wallet.name} (${wallet.address})`)
                })
              }

              if (parsed.state) {
                console.log("💾 状态信息:", parsed.state)
                if (parsed.state.wallets) {
                  console.log(`📍 找到 ${parsed.state.wallets.length} 个钱包:`)
                  parsed.state.wallets.forEach((wallet: any, index: number) => {
                    console.log(`  ${index + 1}. ${wallet.name} (${wallet.address})`)
                  })
                }
              }
            } catch (e) {
              console.warn("❌ 钱包数据解析失败:", e)
            }
          }

          // 获取当前store状态
          const currentState = get()
          console.log("\n🎯 === 当前 Store 状态 ===")
          console.log("📊 钱包数量:", currentState.wallets.length)
          console.log("📍 当前钱包:", currentState.currentWallet?.address || "无")
          console.log("✅ 已初始化:", currentState.isInitialized)
          console.log("🔓 已解锁:", currentState.isUnlocked)

          console.log("\n📋 === 详细信息 ===")
          console.log("所有钱包:", currentState.wallets)
          console.log("当前钱包:", currentState.currentWallet)

          console.log("🔍 === 调试信息结束 ===")

        } catch (error) {
          console.error("🚨 调试Storage失败:", error)
        }
      },

      // 🆕 检查是否应该自动解锁
      checkAutoUnlock: async () => {
        try {
          const state = get()

          // 如果用户没有选择记住解锁状态，返回false
          if (!state.rememberUnlock) {
            console.log("🔒 用户未选择记住解锁状态")
            return false
          }

          // 如果没有钱包，返回false
          if (state.wallets.length === 0) {
            console.log("🔒 没有钱包数据")
            return false
          }

          // 检查自动解锁时间是否过期
          const currentTime = Date.now()
          const lastUnlockTime = state.lastUnlockTime
          const durationMs = state.autoUnlockDuration * 60 * 1000 // 转换为毫秒

          const timeSinceLastUnlock = currentTime - lastUnlockTime
          const isWithinDuration = timeSinceLastUnlock < durationMs

          console.log("⏰ 自动解锁检查:", {
            currentTime,
            lastUnlockTime,
            durationMs,
            timeSinceLastUnlock,
            isWithinDuration,
            autoUnlockDuration: state.autoUnlockDuration
          })

          if (isWithinDuration && state.currentWallet) {
            // 在自动解锁时间内，自动解锁
            set({ isUnlocked: true })
            console.log("✅ 自动解锁成功")
            return true
          } else {
            // 超时，需要重新解锁
            set({ isUnlocked: false })
            console.log("⏰ 自动解锁已过期，需要重新解锁")
            return false
          }

        } catch (error) {
          console.error("检查自动解锁失败:", error)
          return false
        }
      },

      // 🆕 设置记住解锁状态
      setRememberUnlock: (remember: boolean, duration?: number) => {
        set({
          rememberUnlock: remember,
          autoUnlockDuration: duration || 30
        })

        // 立即保存到Chrome Storage
        get().saveToStorage()

        console.log("💾 设置记住解锁状态:", { remember, duration: duration || 30 })
      },

      // 🆕 更新最后解锁时间
      updateLastUnlockTime: () => {
        const currentTime = Date.now()
        set({ lastUnlockTime: currentTime })

        console.log("⏰ 更新最后解锁时间:", new Date(currentTime).toLocaleString())
      }
    }),
    {
      name: 'plasmo-wallet-data'
    }
  )
)

// 导出类型
export type WalletStoreType = ReturnType<typeof useWalletStore>

// 工具函数
export const formatAddress = (address: string, length: number = 6): string => {
  if (!address || address.length < 10) return address
  return `${address.substring(0, length)}...${address.substring(address.length - 4)}`
}

export const validatePrivateKey = (privateKey: string): boolean => {
  try {
    return ethers.isHexString(privateKey, 32)
  } catch {
    return false
  }
}

export const validateMnemonic = (mnemonic: string): boolean => {
  return bip39.validateMnemonic(mnemonic.trim())
}