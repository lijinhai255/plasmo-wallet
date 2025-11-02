/**
 * DApp Provider Service - 内部钱包功能实现
 * 直接与 store 交互，提供完整的钱包功能
 * 学习参考项目的模式
 */

import { useWalletStore } from '../../store/WalletStore';
import { useChainStore } from '../../store/ChainStore';

interface WalletProvider {
  isPlasmoWallet?: boolean;
  isMetaMask?: boolean;
  request: (request: { method: string; params?: any[] }) => Promise<any>;
  on: (event: string, handler: Function) => void;
  removeListener: (event: string, handler: Function) => void;
  once: (event: string, handler: Function) => void;
  removeAllListeners?: (event?: string) => void;
  selectedAddress: string | null;
  chainId: string | null;
  networkVersion: string | null;
  isConnected(): boolean;
}

class PlasmoWalletProvider implements WalletProvider {
  public isPlasmoWallet = true;
  public isMetaMask = true; // 为了兼容性
  public selectedAddress: string | null = null;
  public chainId: string | null = null;
  public networkVersion: string | null = null;

  private eventListeners: Map<string, Function[]> = new Map();
  private connectedAccounts: string[] = [];

  constructor() {
    this.updateWalletState();
  }

  private updateWalletState() {
    try {
      const walletStore = useWalletStore.getState();
      const chainStore = useChainStore.getState();

      const currentAddress = walletStore.currentWallet?.address || null;
      const currentChainId = chainStore.currentChainId || '0xaa36a7'; // 默认Sepolia
      const isConnected = !!currentAddress;

      // 检查地址变化
      if (this.selectedAddress !== currentAddress) {
        const oldAddress = this.selectedAddress;
        this.selectedAddress = currentAddress;

        if (oldAddress !== currentAddress) {
          console.log('🔄 地址变更:', { oldAddress, newAddress: currentAddress });
          this.emit('accountsChanged', currentAddress ? [currentAddress] : []);

          if (currentAddress && !oldAddress) {
            this.emit('connect', { chainId: currentChainId });
          }

          if (!currentAddress && oldAddress) {
            this.emit('disconnect', { code: 1000, message: 'Wallet disconnected' });
          }
        }
      }

      // 检查链ID变化
      if (this.chainId !== currentChainId) {
        const oldChainId = this.chainId;
        this.chainId = currentChainId;

        if (oldChainId !== currentChainId) {
          console.log('🔄 链ID变更:', { oldChainId, newChainId: currentChainId });
          this.emit('chainChanged', currentChainId);
        }
      }

      // 更新networkVersion
      if (this.chainId) {
        this.networkVersion = this.chainId.startsWith('0x')
          ? parseInt(this.chainId, 16).toString()
          : this.chainId;
      }

    } catch (error) {
      console.error('❌ 更新钱包状态失败:', error);
    }
  }

  async request(request: { method: string; params?: any[] }): Promise<any> {
    const { method, params = [] } = request;
    console.log(`🔄 DApp Provider 请求: ${method}`, params);

    const walletStore = useWalletStore.getState();
    const chainStore = useChainStore.getState();

    try {
      switch (method) {
        case 'eth_requestAccounts':
          return await this.handleRequestAccounts();

        case 'eth_accounts':
          return this.connectedAccounts;

        case 'eth_chainId':
          this.updateWalletState();
          return this.chainId;

        case 'net_version':
          this.updateWalletState();
          return this.networkVersion;

        case 'wallet_switchEthereumChain':
          return await this.handleSwitchChain(params);

        case 'wallet_addEthereumChain':
          return await this.handleAddChain(params);

        case 'wallet_watchAsset':
          return await this.handleWatchAsset(params);

        case 'personal_sign':
          return await this.handlePersonalSign(params);

        case 'eth_signTypedData_v4':
          return await this.handleSignTypedData(params);

        case 'eth_sendTransaction':
          return await this.handleSendTransaction(params);

        default:
          // 对于其他方法，抛出错误让DApp自己处理RPC调用
          throw new Error(`方法 ${method} 应该由DApp通过自己的RPC节点处理`);
      }
    } catch (error) {
      console.error(`❌ 处理 ${method} 失败:`, error);
      throw error;
    }
  }

  private async handleRequestAccounts(): Promise<string[]> {
    console.log('🚀 PlasmoWallet 处理账户连接请求');
    console.log('💼 当前钱包状态:', {
      isInitialized: useWalletStore.getState().isInitialized,
      currentAddress: useWalletStore.getState().currentWallet?.address,
      selectedAddress: this.selectedAddress
    });

    const walletStore = useWalletStore.getState();

    if (!walletStore.isInitialized) {
      console.log('🔄 初始化钱包...');
      walletStore.initializeWallet();
    }

    const currentWallet = walletStore.currentWallet;

    if (!currentWallet?.address) {
      console.error('❌ 钱包未初始化或未解锁');
      throw new Error('钱包未初始化或未解锁');
    }

    this.connectedAccounts = [currentWallet.address];
    this.selectedAddress = currentWallet.address;

    console.log('✅ PlasmoWallet 账户连接成功:', {
      address: currentWallet.address,
      accounts: this.connectedAccounts
    });

    return [currentWallet.address];
  }

  private async handleSwitchChain(params: any[]): Promise<null> {
    const [{ chainId }] = params;

    if (!chainId) {
      throw new Error('链ID参数缺失');
    }

    const chainStore = useChainStore.getState();
    chainStore.setCurrentChainId(chainId);

    console.log(`✅ 已切换到链: ${chainId}`);
    return null;
  }

  private async handleAddChain(params: any[]): Promise<null> {
    const [chainConfig] = params;

    if (!chainConfig) {
      throw new Error('链配置参数缺失');
    }

    console.log('✅ 已添加链配置:', chainConfig);
    return null;
  }

  private async handleWatchAsset(params: any[]): Promise<boolean> {
    const [asset] = params;

    if (!asset) {
      throw new Error('资产参数缺失');
    }

    console.log('✅ 观察资产:', asset);
    return true;
  }

  private async handlePersonalSign(params: any[]): Promise<string> {
    const [message, address] = params;

    if (!message) {
      throw new Error('消息参数缺失');
    }

    const walletStore = useWalletStore.getState();

    try {
      const signedMessage = await walletStore.signMessage(message);
      console.log('✅ 消息签名成功');
      return signedMessage;

    } catch (error) {
      console.error('❌ 签名失败:', error);
      throw new Error(`签名失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  private async handleSignTypedData(params: any[]): Promise<string> {
    const [address, typedData] = params;

    if (!typedData) {
      throw new Error('类型化数据参数缺失');
    }

    console.log('✅ 类型化数据签名:', typedData);
    throw new Error('类型化数据签名暂未实现');
  }

  private async handleSendTransaction(params: any[]): Promise<string> {
    const [transaction] = params;

    if (!transaction) {
      throw new Error('交易参数缺失');
    }

    console.log('✅ 交易处理:', transaction);
    throw new Error('交易发送暂未实现，请使用钱包界面操作');
  }

  isConnected(): boolean {
    return !!this.selectedAddress;
  }

  on(event: string, handler: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(handler);
  }

  removeListener(event: string, handler: Function): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(handler);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  once(event: string, handler: Function): void {
    const onceHandler = (...args: any[]) => {
      handler(...args);
      this.removeListener(event, onceHandler);
    };
    this.on(event, onceHandler);
  }

  removeAllListeners(event?: string): void {
    if (event) {
      this.eventListeners.delete(event);
    } else {
      this.eventListeners.clear();
    }
  }

  private emit(event: string, data?: any): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(data);
        } catch (error) {
          console.error(`❌ 事件监听器错误 (${event}):`, error);
        }
      });
    }
  }
}

// 创建provider实例
export const dappProvider = new PlasmoWalletProvider();

// 注入到window对象（内部使用）
export const injectDAppProvider = () => {
  if (typeof window !== 'undefined') {
    // 检测其他钱包的存在
    const existingEthereum = window.ethereum;
    let walletConflict = false;

    if (existingEthereum && !existingEthereum.isPlasmoWallet) {
      walletConflict = true;
      console.log('🚨 检测到其他钱包已注入 window.ethereum');
    }

    // 注入 PlasmoWallet
    (window as any).ethereum = dappProvider;
    (window as any).ethereum.isPlasmoWallet = true;
    (window as any).ethereum.walletName = 'PlasmoWallet';
    (window as any).ethereum.walletVersion = '1.0.0';

    // 额外的独立接口
    (window as any).plasmoEthereum = dappProvider;
    (window as any).myPlasmoWallet = dappProvider;
    (window as any).plasmoWallet = dappProvider;

    // 触发注入事件
    window.dispatchEvent(new Event('ethereum#initialized'));
    window.dispatchEvent(new Event('plasmoWallet#initialized'));

    if (walletConflict) {
      console.log('🎯 PlasmoWallet 注入成功！已覆盖其他钱包');
    } else {
      console.log('✅ PlasmoWallet 注入成功');
    }
  }
};

// 在MAIN world中自动注入（当直接加载时）
if (typeof window !== 'undefined') {
  injectDAppProvider();
}