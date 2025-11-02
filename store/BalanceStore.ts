import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { ethers } from 'ethers'
import { Storage } from "@plasmohq/storage"
import { useChainStore } from './ChainStore'

// 代币余额接口
export interface TokenBalance {
  contractAddress: string
  symbol: string
  name: string
  decimals: number
  balance: string
  formattedBalance: string
  type: 'ERC20' | 'ERC721' | 'ERC1155'
  tokenId?: string // For ERC721 and ERC1155
  tokenURI?: string // For ERC721 and ERC1155
  metadata?: any // For ERC721 and ERC1155
  image?: string // For ERC721 and ERC1155
}

// 账户余额接口
export interface AccountBalance {
  address: string
  ethBalance: string
  formattedEthBalance: string
  tokens: TokenBalance[]
  lastUpdated: number
}

// 余额存储状态接口
export interface BalanceStoreState {
  balances: Record<string, AccountBalance>
  selectedAccount: string | null
  isLoading: boolean
  error: string

  // 操作方法
  updateSelectedAccount: (address: string) => void
  fetchEthBalance: (address: string) => Promise<void>
  fetchTokenBalance: (address: string, tokenAddress: string) => Promise<void>
  fetchAllBalances: (address: string, tokenAddresses?: string[]) => Promise<void>
  clearBalances: () => void
  refreshBalance: (address: string) => Promise<void>
  getBalanceByAddress: (address: string) => AccountBalance | null

  // 新增：过滤方法
  getTokensByType: (address: string, type: 'ERC20' | 'ERC721' | 'ERC1155') => TokenBalance[]
  getTokenStats: (address: string) => {
    erc20: number
    erc721: number
    erc1155: number
    totalValue: number
  }
}

// ERC165 ABI (用于检测接口)
const ERC165_ABI = [
  'function supportsInterface(bytes4 interfaceId) external view returns (bool)'
]

// ERC20 ABI (完整版)
const ERC20_ABI = [
  // 基本信息方法
  'function name() external view returns (string memory)',
  'function symbol() external view returns (string memory)',
  'function decimals() external view returns (uint8)',
  'function balanceOf(address account) external view returns (uint256)',

  // 其他常用方法
  'function totalSupply() external view returns (uint256)',
  'function transfer(address to, uint256 amount) external returns (bool)',
  'function allowance(address owner, address spender) external view returns (uint256)',
  'function approve(address spender, uint256 amount) external returns (bool)',
  'function transferFrom(address from, address to, uint256 amount) external returns (bool)'
]

// 代币接口ID常量
const INTERFACE_IDS = {
  ERC20: '0x36372b07', // ERC20 接口ID
  ERC721: '0x80ac58cd', // ERC721 接口ID
  ERC1155: '0xd9b67a26' // ERC1155 接口ID
}

// 检测代币类型的简单函数
const detectTokenType = async (contractAddress: string, provider: ethers.JsonRpcProvider): Promise<'ERC20' | 'ERC721' | 'ERC1155'> => {
  console.log(`🔍 开始检测代币类型: ${contractAddress}`)

  try {
    // 创建 ERC165 合约实例
    const erc165Contract = new ethers.Contract(contractAddress, ERC165_ABI, provider)

    // 按照优先级检测：ERC721 -> ERC1155 -> ERC20
    console.log(`🎨 检测 ERC721 接口 (0x80ac58cd)...`)
    try {
      const isERC721 = await erc165Contract.supportsInterface(INTERFACE_IDS.ERC721)
      console.log(`ERC721 检测结果:`, isERC721)
      if (isERC721) {
        console.log(`✅ 检测到 ERC721 代币: ${contractAddress}`)
        return 'ERC721'
      }
    } catch (e) {
      console.log(`❌ ERC721 检测失败:`, e.message)
    }

    console.log(`🎮 检测 ERC1155 接口 (0xd9b67a26)...`)
    try {
      const isERC1155 = await erc165Contract.supportsInterface(INTERFACE_IDS.ERC1155)
      console.log(`ERC1155 检测结果:`, isERC1155)
      if (isERC1155) {
        console.log(`✅ 检测到 ERC1155 代币: ${contractAddress}`)
        return 'ERC1155'
      }
    } catch (e) {
      console.log(`❌ ERC1155 检测失败:`, e.message)
    }

    console.log(`🪙 检测 ERC20 接口 (0x36372b07)...`)
    try {
      const isERC20 = await erc165Contract.supportsInterface(INTERFACE_IDS.ERC20)
      console.log(`ERC20 检测结果:`, isERC20)
      if (isERC20) {
        console.log(`✅ 检测到 ERC20 代币: ${contractAddress}`)
        return 'ERC20'
      }
    } catch (e) {
      console.log(`❌ ERC20 检测失败:`, e.message)
    }

    // 如果不支持 ERC165，尝试调用 ERC20 的 decimals 方法（大部分 ERC20 都有这个方法）
    console.log(`🔧 尝试通过 decimals 方法检测 ERC20...`)
    try {
      const erc20Contract = new ethers.Contract(contractAddress, ['function decimals() view returns (uint8)'], provider)
      const decimals = await erc20Contract.decimals()
      console.log(`✅ 通过 decimals 方法检测到 ERC20 代币: ${contractAddress}, decimals: ${decimals}`)
      return 'ERC20'
    } catch (e) {
      console.log(`❌ decimals 方法检测失败:`, e.message)
      // 默认返回 ERC20
      console.log(`❓ 无法检测代币类型，默认为 ERC20: ${contractAddress}`)
      return 'ERC20'
    }
  } catch (error) {
    console.error(`💥 代币类型检测完全失败: ${contractAddress}`, error)
    return 'ERC20' // 默认返回 ERC20
  }
}

// 初始状态
const initialState = {
  balances: {},
  selectedAccount: null,
  isLoading: false,
  error: ""
}

export const useBalanceStore = create<BalanceStoreState>()(
  persist(
    (set, get) => ({
      ...initialState,

      updateSelectedAccount: (address: string) => {
        set({ selectedAccount: address })
      },

      // 获取 ETH 余额
      fetchEthBalance: async (address: string) => {
        try {
          set({ isLoading: true, error: "" })

          console.log(`💰 开始获取 ETH 余额: ${address}`)

          // 获取当前网络配置
          const chainStore = useChainStore.getState()
          const networkConfig = chainStore.getNetworkConfig(chainStore.currentChainId)

          if (!networkConfig || !networkConfig.rpcUrls || networkConfig.rpcUrls.length === 0) {
            throw new Error('当前网络没有配置 RPC URL')
          }

          // 创建 provider
          const provider = new ethers.JsonRpcProvider(networkConfig.rpcUrls[0])

          // 获取余额
          const balance = await provider.getBalance(address)
          const formattedBalance = ethers.formatEther(balance)

          console.log(`✅ ETH 余额查询完成: ${formattedBalance} ETH`)

          // 更新余额状态
          const currentBalances = get().balances
          const existingBalance = currentBalances[address] || {
            address,
            ethBalance: '0',
            formattedEthBalance: '0',
            tokens: [],
            lastUpdated: 0
          }

          const updatedBalance: AccountBalance = {
            ...existingBalance,
            ethBalance: balance.toString(),
            formattedEthBalance: formattedBalance,
            lastUpdated: Date.now()
          }

          set(state => ({
            balances: {
              ...state.balances,
              [address]: updatedBalance
            }
          }))

          set({ isLoading: false })

        } catch (error) {
          console.error("获取 ETH 余额失败:", error)
          set({
            error: error instanceof Error ? error.message : "获取余额失败",
            isLoading: false
          })
        }
      },

      // 检测代币类型
      detectTokenType: async (tokenAddress: string, provider?: ethers.JsonRpcProvider) => {
        if (!provider) {
          const chainStore = useChainStore.getState()
          const networkConfig = chainStore.getNetworkConfig(chainStore.currentChainId)
          if (!networkConfig || !networkConfig.rpcUrls || networkConfig.rpcUrls.length === 0) {
            throw new Error('当前网络没有配置 RPC URL')
          }
          provider = new ethers.JsonRpcProvider(networkConfig.rpcUrls[0])
        }
        return await detectTokenType(tokenAddress, provider)
      },

      // 获取代币余额
      fetchTokenBalance: async (address: string, tokenAddress: string, tokenType?: 'ERC20' | 'ERC721' | 'ERC1155') => {
        try {
          set({ isLoading: true, error: "" })

          // 如果没有指定类型，自动检测
          if (!tokenType) {
            const chainStore = useChainStore.getState()
            const networkConfig = chainStore.getNetworkConfig(chainStore.currentChainId)
            if (!networkConfig || !networkConfig.rpcUrls || networkConfig.rpcUrls.length === 0) {
              throw new Error('当前网络没有配置 RPC URL')
            }
            const provider = new ethers.JsonRpcProvider(networkConfig.rpcUrls[0])
            tokenType = await detectTokenType(tokenAddress, provider)
          }

          console.log(`🪙 开始获取${tokenType}代币余额: ${tokenAddress}`)

          // 获取当前网络配置
          const chainStore = useChainStore.getState()
          const networkConfig = chainStore.getNetworkConfig(chainStore.currentChainId)

          if (!networkConfig || !networkConfig.rpcUrls || networkConfig.rpcUrls.length === 0) {
            throw new Error('当前网络没有配置 RPC URL')
          }

          // 创建 provider
          const provider = new ethers.JsonRpcProvider(networkConfig.rpcUrls[0])

          // 根据代币类型使用不同的 ABI
          let abi: string[]
          let tokenData: Partial<TokenBalance> = {
            contractAddress: tokenAddress,
            type: tokenType,
            decimals: 18,
            balance: '0',
            formattedBalance: '0',
            name: 'Unknown Token',
            symbol: 'UNKNOWN'
          }

          if (tokenType === 'ERC20') {
            abi = ERC20_ABI
          } else if (tokenType === 'ERC721') {
            // ERC721 ABI
            abi = [
              'function name() external view returns (string memory)',
              'function symbol() external view returns (string memory)',
              'function balanceOf(address owner) external view returns (uint256)',
              'function ownerOf(uint256 tokenId) external view returns (address)'
            ]
          } else if (tokenType === 'ERC1155') {
            // ERC1155 ABI
            abi = [
              'function name() external view returns (string memory)',
              'function symbol() external view returns (string memory)',
              'function balanceOf(address account, uint256 id) external view returns (uint256)',
              'function balanceOfBatch(address[] accounts, uint256[] ids) external view returns (uint256[])',
              'function uri(uint256 id) external view returns (string)'
            ]
          }

          // 创建合约实例
          const contract = new ethers.Contract(tokenAddress, abi, provider)

          // 获取基本信息
          try {
            tokenData.name = await contract.name()
          } catch (e) {
            console.warn(`无法获取代币名称: ${e.message}`)
          }

          try {
            tokenData.symbol = await contract.symbol()
          } catch (e) {
            console.warn(`无法获取代币符号: ${e.message}`)
          }

          try {
            if (tokenType === 'ERC20') {
              const decimalsResult = await contract.decimals()
              tokenData.decimals = Number(decimalsResult)
            }
          } catch (e) {
            console.warn(`无法获取代币小数位数，使用默认值: ${e.message}`)
          }

          // 获取余额
          let balance: any
          let formattedBalance: string

          if (tokenType === 'ERC20') {
            balance = await contract.balanceOf(address)
            formattedBalance = ethers.formatUnits(balance, tokenData.decimals || 18)
          } else if (tokenType === 'ERC721') {
            balance = await contract.balanceOf(address)
            formattedBalance = balance.toString() // ERC721 余额是数量
          } else if (tokenType === 'ERC1155') {
            // ERC1155: 查询 tokenId=0 的余额作为示例
            balance = await contract.balanceOf(address, 0)
            formattedBalance = balance.toString()
          }

          const tokenBalance: TokenBalance = {
            contractAddress: tokenAddress,
            symbol: tokenData.symbol || 'UNKNOWN',
            name: tokenData.name || 'Unknown Token',
            decimals: tokenData.decimals || 18,
            balance: balance.toString(),
            formattedBalance: formattedBalance,
            type: tokenType,
            tokenId: tokenType !== 'ERC20' ? '1' : undefined,
            tokenURI: undefined,
            metadata: undefined,
            image: undefined
          }

          console.log(`✅ ${tokenType}代币余额查询完成: ${tokenBalance.symbol} - ${tokenBalance.formattedBalance}`)

          // 更新代币余额
          const currentBalances = get().balances
          const accountBalance = currentBalances[address]

          if (accountBalance) {
            const updatedTokens = [...accountBalance.tokens]
            const existingTokenIndex = updatedTokens.findIndex(
              token => token.contractAddress === tokenAddress
            )

            if (existingTokenIndex >= 0) {
              updatedTokens[existingTokenIndex] = tokenBalance
            } else {
              updatedTokens.push(tokenBalance)
            }

            set(state => ({
              balances: {
                ...state.balances,
                [address]: {
                  ...accountBalance,
                  tokens: updatedTokens,
                  lastUpdated: Date.now()
                }
              }
            }))
          }

          set({ isLoading: false })

        } catch (error) {
          console.error("获取代币余额失败:", error)
          set({
            error: error instanceof Error ? error.message : "获取代币余额失败",
            isLoading: false
          })
        }
      },

      // 获取所有余额
      fetchAllBalances: async (address: string, tokenAddresses?: string[]) => {
        try {
          set({ isLoading: true, error: "" })

          console.log(`💰 开始获取所有余额: ${address}`)

          // 先获取 ETH 余额
          await get().fetchEthBalance(address)

          // 如果有代币地址，获取代币余额
          if (tokenAddresses && tokenAddresses.length > 0) {
            for (const tokenAddress of tokenAddresses) {
              await get().fetchTokenBalance(address, tokenAddress)
            }
          }

          set({ isLoading: false })

        } catch (error) {
          console.error("获取所有余额失败:", error)
          set({
            error: error instanceof Error ? error.message : "获取余额失败",
            isLoading: false
          })
        }
      },

      // 清除余额数据
      clearBalances: () => {
        set({
          balances: {},
          error: ""
        })
      },

      // 刷新余额
      refreshBalance: async (address: string) => {
        const currentBalance = get().balances[address]
        if (currentBalance) {
          const tokenAddresses = currentBalance.tokens.map(token => token.contractAddress)
          await get().fetchAllBalances(address, tokenAddresses)
        }
      },

      // 根据地址获取余额
      getBalanceByAddress: (address: string) => {
        return get().balances[address] || null
      },

      // 根据类型过滤代币
      getTokensByType: (address: string, type: 'ERC20' | 'ERC721' | 'ERC1155') => {
        const accountBalance = get().balances[address]
        if (!accountBalance) return []

        return accountBalance.tokens.filter(token => token.type === type)
      },

      // 获取代币统计信息
      getTokenStats: (address: string) => {
        const accountBalance = get().balances[address]
        if (!accountBalance) {
          return { erc20: 0, erc721: 0, erc1155: 0, totalValue: 0 }
        }

        const stats = {
          erc20: 0,
          erc721: 0,
          erc1155: 0,
          totalValue: 0
        }

        accountBalance.tokens.forEach(token => {
          switch (token.type) {
            case 'ERC20':
              stats.erc20++
              // 简单计算 ERC20 代币价值 (假设价格为1美元，实际应该从API获取)
              stats.totalValue += parseFloat(token.formattedBalance) * 1
              break
            case 'ERC721':
              stats.erc721++
              // 假设每个NFT价值100美元
              stats.totalValue += 100
              break
            case 'ERC1155':
              stats.erc1155++
              // ERC1155 价值计算较为复杂，这里简化处理
              stats.totalValue += parseFloat(token.formattedBalance) * 10
              break
          }
        })

        return stats
      }
    }),
    {
      name: 'plasmo-balance-data',
      // 🌟 使用 Chrome Storage API 而不是默认的 localStorage
      storage: {
        getItem: async (name: string) => {
          const storage = new Storage()
          const result = await storage.get(name)
          return JSON.stringify(result) || null
        },
        setItem: async (name: string, value: any) => {
          const storage = new Storage()
          await storage.set(name, typeof value === 'string' ? JSON.parse(value) : value)
        },
        removeItem: async (name: string) => {
          const storage = new Storage()
          await storage.remove(name)
        }
      },
      partialize: (state) => ({
        balances: state.balances,
        selectedAccount: state.selectedAccount
      })
    }
  )
)

// 工具函数
export const formatAddress = (address: string, startChars = 6, endChars = 4): string => {
  if (!address) return ''
  if (address.length <= startChars + endChars) return address
  return `${address.slice(0, startChars)}...${address.slice(-endChars)}`
}

export const formatUSD = (value: string | number, decimals = 2): string => {
  const num = typeof value === 'string' ? parseFloat(value) : value
  if (isNaN(num)) return '0.00'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(num)
}