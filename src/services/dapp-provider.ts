// DApp Provider Service - 实现EIP-1193标准
// 基于参考项目模式重构

import { PlasmoEthereumProvider, createEthereumProvider } from './ethereum-provider';

interface DappRequest {
  id: string;
  method: string;
  params: any[];
  origin: string;
}

interface PlasmoWalletProvider {
  isPlasmo: boolean;
  request: (request: { method: string; params?: any[] }) => Promise<any>;
  on: (event: string, handler: Function) => void;
  removeListener: (event: string, handler: Function) => void;
  selectedAddress: string | null;
  chainId: string | null;
  networkVersion: string | null;
  isConnected(): boolean;
}

class PlasmoWalletDAppProvider implements PlasmoWalletProvider {
  public isPlasmo = true;
  public selectedAddress: string | null = null;
  public chainId: string | null = null;
  public networkVersion: string | null = null;

  private eventListeners: Map<string, Function[]> = new Map();
  private connectedAccounts: string[] = [];
  private ethereumProvider: PlasmoEthereumProvider;

  constructor() {
    // 创建底层的以太坊提供者
    this.ethereumProvider = createEthereumProvider() as PlasmoEthereumProvider;

    // 监听底层提供者的事件
    this.setupEventListeners();

    // 初始化状态
    this.updateWalletState();
  }

  private setupEventListeners() {
    // 监听来自底层提供者的事件
    this.ethereumProvider.on('accountsChanged', (accounts: string[]) => {
      const oldAddress = this.selectedAddress;
      this.selectedAddress = accounts[0] || null;

      // 触发本地事件
      this.emit('accountsChanged', accounts);

      console.log('🔄 DApp Provider: accountsChanged', { oldAddress, newAddress: this.selectedAddress });
    });

    this.ethereumProvider.on('chainChanged', (chainId: string) => {
      const oldChainId = this.chainId;
      this.chainId = chainId;
      this.networkVersion = chainId ? parseInt(chainId, 16).toString() : null;

      // 触发本地事件
      this.emit('chainChanged', chainId);

      console.log('🔄 DApp Provider: chainChanged', { oldChainId, newChainId: chainId });
    });

    this.ethereumProvider.on('connect', (connectInfo: { chainId: string }) => {
      // 触发本地事件
      this.emit('connect', connectInfo);

      console.log('🔄 DApp Provider: connect', connectInfo);
    });

    this.ethereumProvider.on('disconnect', (error: { code: number; message: string }) => {
      // 触发本地事件
      this.emit('disconnect', error);

      console.log('🔄 DApp Provider: disconnect', error);
    });
  }

  private emit(event: string, ...args: any[]) {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(...args);
        } catch (error) {
          console.error(`❌ DApp Provider 事件监听器错误 (${event}):`, error);
        }
      });
    }
  }

  private updateWalletState() {
    // 通过底层提供者获取最新状态
    this.selectedAddress = this.ethereumProvider.selectedAddress;
    this.chainId = this.ethereumProvider.chainId;
    this.networkVersion = this.ethereumProvider.networkVersion;

    console.log('🔄 DApp Provider 状态更新:', {
      selectedAddress: this.selectedAddress,
      chainId: this.chainId,
      networkVersion: this.networkVersion
    });
  }

  isConnected(): boolean {
    return this.ethereumProvider.isConnected();
  }

  async request(request: { method: string; params?: any[] }): Promise<any> {
    const { method, params = [] } = request;

    console.log('🔄 DApp Provider 收到请求:', { method, params });

    try {
      // 委托给底层以太坊提供者处理
      const result = await this.ethereumProvider.request({ method, params });

      // 更新状态
      this.updateWalletState();

      console.log('✅ DApp Provider 请求成功:', { method, result });
      return result;

    } catch (error) {
      console.error('❌ DApp Provider 请求失败:', { method, error });
      throw error;
    }
  }

  on(event: string, handler: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(handler);
    console.log('📡 DApp Provider 添加事件监听:', event);
  }

  removeListener(event: string, handler: Function): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(handler);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
    console.log('📡 DApp Provider 移除事件监听:', event);
  }

  // 兼容性方法
  removeAllListeners(event?: string): void {
    if (event) {
      this.eventListeners.delete(event);
    } else {
      this.eventListeners.clear();
    }
  }

  once(event: string, handler: Function): void {
    const onceHandler = (...args: any[]) => {
      handler(...args);
      this.removeListener(event, onceHandler);
    };
    this.on(event, onceHandler);
  }

  off(event: string, handler: Function): void {
    this.removeListener(event, handler);
  }
}

/**
 * 创建DApp提供者实例
 */
export function createDAppProvider(): PlasmoWalletProvider {
  console.log('🔄 创建 DApp Provider 实例');
  return new PlasmoWalletDAppProvider();
}

/**
 * 获取全局DApp提供者实例（单例模式）
 */
let globalDAppProvider: PlasmoWalletProvider | null = null;

export function getDAppProvider(): PlasmoWalletProvider {
  if (!globalDAppProvider) {
    globalDAppProvider = createDAppProvider();
    console.log('🎯 初始化全局 DApp Provider');
  }
  return globalDAppProvider;
}

export { PlasmoWalletDAppProvider, PlasmoEthereumProvider };