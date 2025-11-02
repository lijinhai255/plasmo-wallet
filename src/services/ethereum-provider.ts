/**
 * Ethereum Provider (EIP-1193) Implementation
 * 实现标准的以太坊提供者接口，确保与MetaMask兼容
 */

import { useWalletStore } from '../../store/WalletStore';
import { useChainStore } from '../../store/ChainStore';

export interface EthereumProvider {
  // 基础属性
  isMetaMask?: boolean
  isConnected(): boolean

  // 事件系统 (EIP-1193)
  on(event: string, listener: (...args: any[]) => void): void
  removeListener(event: string, listener: (...args: any[]) => void): void
  off(event: string, listener: (...args: any[]) => void): void
  once(event: string, listener: (...args: any[]) => void): void
  removeAllListeners(event?: string): void

  // RPC 方法 (EIP-1193)
  request(args: { method: string; params?: any[] }): Promise<any>

  // 兼容性方法
  enable?(): Promise<string[]>
  send?(method: string, params?: any[]): Promise<any>
  sendAsync?(payload: any, callback: (error: any, response: any) => void): void

  // 状态属性 (可读写)
  selectedAddress: string | null
  chainId: string | null
  networkVersion: string | null
}

export interface ProviderMessage {
  type: string
  requestId: string
  method: string
  params?: any[]
  from: string
}

export interface ProviderResponse {
  success: boolean
  data?: any
  error?: string
  requestId: string
  from: string
}

export class PlasmoEthereumProvider implements EthereumProvider {
  public isMetaMask = true // 为了兼容性，声明为MetaMask
  private _chainId: string | null = null
  private _selectedAddress: string | null = null
  private connected = false

  // 事件系统
  private eventListeners = new Map<string, Set<Function>>()

  // 请求ID生成器
  private requestIdCounter = 0

  // Store 状态更新定时器
  private storeUpdateTimer: NodeJS.Timeout | null = null

  constructor() {
    console.log('🔄 PlasmoEthereumProvider 初始化')
    this.setupEventListeners()
    this.updateWalletState()
    this.startStoreMonitoring()
  }

  /**
   * 生成唯一请求ID
   */
  private generateRequestId(): string {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}-${this.requestIdCounter++}`
  }

  /**
   * 更新钱包状态 - 从store中获取最新状态
   */
  private updateWalletState(): void {
    try {
      const walletStore = useWalletStore.getState()
      const chainStore = useChainStore.getState()

      const currentAddress = walletStore.currentWallet?.address || null
      const currentChainId = chainStore.currentChainId || '0xaa36a7' // 默认Sepolia
      const isConnected = !!currentAddress

      // 检查地址变化
      if (this._selectedAddress !== currentAddress) {
        const oldAddress = this._selectedAddress
        this._selectedAddress = currentAddress
        this.connected = isConnected

        // 触发accountsChanged事件
        if (oldAddress !== currentAddress) {
          console.log('🔄 地址变更:', { oldAddress, newAddress: currentAddress })
          this.emit('accountsChanged', currentAddress ? [currentAddress] : [])

          // 如果有地址，触发connect事件
          if (currentAddress && !oldAddress) {
            this.emit('connect', { chainId: currentChainId })
          }

          // 如果地址被清空，触发disconnect事件
          if (!currentAddress && oldAddress) {
            this.emit('disconnect', { code: 1000, message: 'Wallet disconnected' })
          }
        }
      }

      // 检查链ID变化
      if (this._chainId !== currentChainId) {
        const oldChainId = this._chainId
        this._chainId = currentChainId

        // 触发chainChanged事件
        if (oldChainId !== currentChainId) {
          console.log('🔄 链ID变更:', { oldChainId, newChainId: currentChainId })
          this.emit('chainChanged', currentChainId)
        }
      }

    } catch (error) {
      console.error('❌ 更新钱包状态失败:', error)
    }
  }

  /**
   * 开始监听store状态变化
   */
  private startStoreMonitoring(): void {
    // 每500ms检查一次store状态
    this.storeUpdateTimer = setInterval(() => {
      this.updateWalletState()
    }, 500)
  }

  /**
   * 停止监听store状态变化
   */
  private stopStoreMonitoring(): void {
    if (this.storeUpdateTimer) {
      clearInterval(this.storeUpdateTimer)
      this.storeUpdateTimer = null
    }
  }

  /**
   * 设置基础事件监听器
   */
  private setupEventListeners(): void {
    // 监听来自background script的消息
    window.addEventListener('message', this.handleMessage.bind(this))
  }

  /**
   * 处理来自background script的消息
   */
  private handleMessage(event: MessageEvent): void {
    if (event.source !== window || !event.data || event.data.from !== 'background') {
      return
    }

    const { type, data } = event.data

    if (type === 'accountsChanged') {
      this.selectedAddress = data?.[0] || null
      this.emit('accountsChanged', data)
    }

    if (type === 'chainChanged') {
      this.chainId = data
      this.emit('chainChanged', data)
    }

    if (type === 'connect') {
      this.connected = true
      this.emit('connect', { chainId: this.chainId })
    }

    if (type === 'disconnect') {
      this.connected = false
      this.selectedAddress = null
      this.chainId = null
      this.emit('disconnect', { code: 1000, message: 'Provider disconnected' })
    }
  }

  /**
   * 发送请求到background script
   */
  private async sendRequest(method: string, params?: any[]): Promise<any> {
    const requestId = this.generateRequestId()

    return new Promise((resolve, reject) => {
      const message: ProviderMessage = {
        type: 'ETHEREUM_REQUEST',
        requestId,
        method,
        params,
        from: 'ethereum-provider'
      }

      // 发送消息到content script，然后转发到background
      window.postMessage(message, '*')

      // 设置响应超时
      const timeout = setTimeout(() => {
        reject(new Error('Request timeout'))
      }, 30000)

      // 监听响应
      const handleResponse = (event: MessageEvent) => {
        if (event.source !== window || !event.data || event.data.from !== 'background') {
          return
        }

        const response: ProviderResponse = event.data
        if (response.requestId !== requestId) {
          return
        }

        clearTimeout(timeout)
        window.removeEventListener('message', handleResponse)

        if (response.success) {
          resolve(response.data)
        } else {
          reject(new Error(response.error || 'Request failed'))
        }
      }

      window.addEventListener('message', handleResponse)
    })
  }

  // === EIP-1193 标准方法 ===

  /**
   * 检查是否已连接
   */
  isConnected(): boolean {
    return this.connected && !!this.selectedAddress
  }

  /**
   * 通用请求方法
   */
  async request(args: { method: string; params?: any[] }): Promise<any> {
    const { method, params = [] } = args

    console.log(`🔄 EthereumProvider.request: ${method}`, params)

    try {
      switch (method) {
        case 'eth_requestAccounts':
          return await this.handleRequestAccounts(params)

        case 'eth_accounts':
          return await this.handleAccounts(params)

        case 'eth_chainId':
          this.updateWalletState()
          return this._chainId

        case 'eth_getBalance':
          return await this.sendRequest(method, params)

        case 'eth_sendTransaction':
          return await this.handleSendTransaction(params)

        case 'personal_sign':
          return await this.handlePersonalSign(params)

        case 'eth_signTypedData_v4':
          return await this.handleSignTypedData(params)

        case 'wallet_switchEthereumChain':
          return await this.handleSwitchChain(params)

        case 'wallet_addEthereumChain':
          return await this.handleAddChain(params)

        case 'eth_getBlockByNumber':
        case 'eth_call':
        case 'eth_estimateGas':
        case 'eth_gasPrice':
        case 'eth_getTransactionCount':
        case 'eth_getTransactionReceipt':
          return await this.sendRequest(method, params)

        default:
          console.warn(`🔄 未处理的方法: ${method}`)
          return await this.sendRequest(method, params)
      }
    } catch (error) {
      console.error(`❌ EthereumProvider.${method} 错误:`, error)
      throw error
    }
  }

  /**
   * 处理账户请求 (连接钱包)
   */
  private async handleRequestAccounts(params: any[]): Promise<string[]> {
    console.log('🔄 处理 eth_requestAccounts 请求')

    // 首先尝试从store获取当前状态
    this.updateWalletState()

    if (this._selectedAddress) {
      console.log('✅ 已有连接地址:', this._selectedAddress)
      return [this._selectedAddress]
    }

    try {
      // 通过background script请求连接
      const accounts = await this.sendRequest('eth_requestAccounts', params)

      if (accounts && accounts.length > 0) {
        this._selectedAddress = accounts[0]
        this.connected = true

        console.log('✅ 成功连接账户:', this._selectedAddress)

        // 更新状态并触发事件
        if (this.connected) {
          this.emit('connect', { chainId: this._chainId })
        }

        return accounts
      } else {
        return []
      }
    } catch (error) {
      console.error('❌ 请求账户连接失败:', error)
      throw error
    }
  }

  /**
   * 获取当前账户
   */
  private async handleAccounts(params: any[]): Promise<string[]> {
    // 确保状态是最新的
    this.updateWalletState()

    if (!this._selectedAddress) {
      return []
    }
    return [this._selectedAddress]
  }

  /**
   * 处理发送交易
   */
  private async handleSendTransaction(params: any[]): Promise<string> {
    const [transaction] = params

    // 确保有from地址
    if (!transaction.from && this.selectedAddress) {
      transaction.from = this.selectedAddress
    }

    return await this.sendRequest('eth_sendTransaction', [transaction])
  }

  /**
   * 处理个人签名
   */
  private async handlePersonalSign(params: any[]): Promise<string> {
    const [message, address] = params

    if (!this.selectedAddress) {
      throw new Error('Wallet not connected')
    }

    return await this.sendRequest('personal_sign', [message, address || this.selectedAddress])
  }

  /**
   * 处理类型化数据签名
   */
  private async handleSignTypedData(params: any[]): Promise<string> {
    const [address, typedData] = params

    if (!this.selectedAddress) {
      throw new Error('Wallet not connected')
    }

    return await this.sendRequest('eth_signTypedData_v4', [address || this.selectedAddress, typedData])
  }

  /**
   * 处理切换链
   */
  private async handleSwitchChain(params: any[]): Promise<null> {
    const [chainId] = params

    if (this.chainId === chainId) {
      return null
    }

    await this.sendRequest('wallet_switchEthereumChain', params)
    this.chainId = chainId
    this.emit('chainChanged', chainId)

    return null
  }

  /**
   * 处理添加链
   */
  private async handleAddChain(params: any[]): Promise<null> {
    const [chainConfig] = params

    await this.sendRequest('wallet_addEthereumChain', params)

    return null
  }

  // === 事件系统 ===

  /**
   * 添加事件监听器
   */
  on(event: string, listener: (...args: any[]) => void): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set())
    }
    this.eventListeners.get(event)!.add(listener)
  }

  /**
   * 移除事件监听器
   */
  removeListener(event: string, listener: (...args: any[]) => void): void {
    const listeners = this.eventListeners.get(event)
    if (listeners) {
      listeners.delete(listener)
    }
  }

  /**
   * 移除事件监听器 (别名)
   */
  off(event: string, listener: (...args: any[]) => void): void {
    this.removeListener(event, listener)
  }

  /**
   * 添加一次性事件监听器
   */
  once(event: string, listener: (...args: any[]) => void): void {
    const onceListener = (...args: any[]) => {
      listener(...args)
      this.removeListener(event, onceListener)
    }
    this.on(event, onceListener)
  }

  /**
   * 移除所有监听器
   */
  removeAllListeners(event?: string): void {
    if (event) {
      this.eventListeners.delete(event)
    } else {
      this.eventListeners.clear()
    }
  }

  /**
   * 触发事件
   */
  private emit(event: string, ...args: any[]): void {
    const listeners = this.eventListeners.get(event)
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(...args)
        } catch (error) {
          console.error(`❌ 事件监听器错误 (${event}):`, error)
        }
      })
    }
  }

  // === 兼容性方法 (旧版API) ===

  /**
   * 兼容旧版本的enable方法
   */
  async enable(): Promise<string[]> {
    console.warn('🔄 enable() 已弃用，请使用 request({ method: "eth_requestAccounts" })')
    return this.request({ method: 'eth_requestAccounts' })
  }

  /**
   * 兼容旧版本的send方法
   */
  send(method: string, params?: any[]): Promise<any> {
    if (typeof method === 'string') {
      return this.request({ method, params })
    }

    // 处理send({ method, params })格式
    return this.request(method as any)
  }

  /**
   * 兼容旧版本的sendAsync方法
   */
  sendAsync(payload: any, callback: (error: any, response: any) => void): void {
    this.request(payload)
      .then(result => {
        callback(null, { id: payload.id, jsonrpc: '2.0', result })
      })
      .catch(error => {
        callback(error, { id: payload.id, jsonrpc: '2.0', error: { code: -1, message: error.message } })
      })
  }

  // === 公共状态属性 ===

  /**
   * 获取当前链ID (公共属性)
   */
  get chainId(): string | null {
    return this._chainId
  }

  /**
   * 设置链ID (允许外部设置)
   */
  set chainId(value: string | null) {
    this._chainId = value
  }

  /**
   * 获取当前选中地址 (公共属性)
   */
  get selectedAddress(): string | null {
    return this._selectedAddress
  }

  /**
   * 设置选中地址 (允许外部设置)
   */
  set selectedAddress(value: string | null) {
    this._selectedAddress = value
  }

  /**
   * 获取网络版本
   */
  get networkVersion(): string | null {
    if (!this._chainId) return null
    return this._chainId.startsWith('0x') ? parseInt(this._chainId, 16).toString() : this._chainId
  }

  /**
   * 设置网络版本
   */
  set networkVersion(value: string | null) {
    // 网络版本通常从chainId计算而来，这里主要是为了兼容性
    if (value && !value.startsWith('0x')) {
      this._chainId = `0x${parseInt(value).toString(16)}`
    }
  }

  // === 状态更新方法 (供background script调用) ===

  /**
   * 更新账户地址 (向后兼容)
   */
  updateAccounts(accounts: string[]): void {
    console.log('🔄 updateAccounts 调用:', accounts)
    this.updateWalletState()
  }

  /**
   * 更新链ID (向后兼容)
   */
  updateChainId(chainId: string): void {
    console.log('🔄 updateChainId 调用:', chainId)
    this.updateWalletState()
  }

  /**
   * 清理资源
   */
  cleanup(): void {
    console.log('🔄 清理 EthereumProvider 资源')
    this.stopStoreMonitoring()
    this.removeAllListeners()
  }
}

/**
 * 创建Ethereum提供者实例
 */
export function createEthereumProvider(): EthereumProvider {
  console.log('🔄 创建Ethereum提供者')
  return new PlasmoEthereumProvider()
}