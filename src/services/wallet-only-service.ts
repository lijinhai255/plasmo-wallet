/**
 * Wallet-Only Service - 标准钱包服务
 * 只处理钱包相关的操作，不提供RPC服务
 * DApp应该自己连接RPC节点，钱包只负责账户和签名
 */

import { ethers } from 'ethers';
import { useWalletStore } from '../../store/WalletStore';
import { useChainStore } from '../../store/ChainStore';

export interface WalletRequest {
  method: string;
  params: any[];
  id?: string | number;
}

export interface WalletResponse {
  jsonrpc: string;
  id?: string | number;
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
}

/**
 * 钱包服务 - 只处理钱包核心功能
 * 不提供完整的RPC，只处理账户和签名相关操作
 */
export class WalletOnlyService {
  private walletStore = useWalletStore.getState();
  private chainStore = useChainStore.getState();

  constructor() {
    console.log('🔄 初始化 Wallet-Only Service');
  }

  /**
   * 处理钱包请求
   * 只处理钱包相关的操作，其他操作返回错误让DApp自己处理
   */
  async handleWalletRequest(request: WalletRequest): Promise<WalletResponse> {
    const { method, params, id } = request;

    console.log(`🔄 Wallet Service 处理请求: ${method}`, params);

    try {
      let result: any;

      switch (method) {
        // === 钱包核心功能 ===
        case 'eth_requestAccounts':
          result = await this.handleRequestAccounts();
          break;

        case 'eth_accounts':
          result = await this.handleGetAccounts();
          break;

        case 'eth_chainId':
          result = this.chainStore.currentChainId || '0xaa36a7';
          break;

        // === 签名相关（钱包的核心职责）===
        case 'personal_sign':
          result = await this.handlePersonalSign(params);
          break;

        case 'eth_signTypedData_v4':
          result = await this.handleSignTypedData(params);
          break;

        // === 交易相关（需要用户确认和签名）===
        case 'eth_sendTransaction':
          result = await this.handleSendTransaction(params);
          break;

        // === 链管理（钱包设置）===
        case 'wallet_switchEthereumChain':
          result = await this.handleSwitchChain(params);
          break;

        case 'wallet_addEthereumChain':
          result = await this.handleAddChain(params);
          break;

        // === 以下操作DApp应该自己处理 ===
        case 'eth_getBalance':
        case 'eth_call':
        case 'eth_estimateGas':
        case 'eth_gasPrice':
        case 'eth_getTransactionCount':
        case 'eth_getTransactionReceipt':
        case 'eth_getBlockByNumber':
        case 'eth_getCode':
        case 'eth_getStorageAt':
          throw new Error(`方法 ${method} 应该由DApp通过自己的RPC节点处理`);

        default:
          throw new Error(`不支持的钱包方法: ${method}`);
      }

      console.log(`✅ Wallet 请求处理成功: ${method}`, result);

      return {
        jsonrpc: '2.0',
        id,
        result
      };

    } catch (error) {
      console.error(`❌ Wallet 请求处理失败: ${method}`, error);

      const errorMessage = error instanceof Error ? error.message : '未知错误';

      return {
        jsonrpc: '2.0',
        id,
        error: {
          code: -32603,
          message: errorMessage,
          data: { method, params }
        }
      };
    }
  }

  /**
   * 处理账户连接请求
   */
  private async handleRequestAccounts(): Promise<string[]> {
    console.log('🔄 处理账户连接请求');

    const currentWallet = this.walletStore.currentWallet;

    if (!currentWallet?.address) {
      throw new Error('钱包未初始化或未解锁');
    }

    return [currentWallet.address];
  }

  /**
   * 获取当前账户
   */
  private async handleGetAccounts(): Promise<string[]> {
    const wallet = this.walletStore.currentWallet;
    return wallet?.address ? [wallet.address] : [];
  }

  /**
   * 处理个人签名
   */
  private async handlePersonalSign(params: any[]): Promise<string> {
    const [message, address] = params;

    if (!message) {
      throw new Error('消息参数缺失');
    }

    const privateKey = this.walletStore.currentWallet?.privateKey;

    if (!privateKey) {
      throw new Error('钱包未解锁');
    }

    const wallet = new ethers.Wallet(privateKey);

    // 确保地址匹配
    if (address && address.toLowerCase() !== wallet.address.toLowerCase()) {
      throw new Error('地址不匹配');
    }

    try {
      // 将消息转换为字节
      const messageBytes = ethers.toUtf8Bytes(
        message.startsWith('0x') ? message : `0x${Buffer.from(message).toString('hex')}`
      );

      // 签名
      const signature = await wallet.signMessage(messageBytes);

      console.log('✅ 消息签名成功');
      return signature;

    } catch (error) {
      console.error('❌ 签名失败:', error);
      throw new Error(`签名失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  /**
   * 处理类型化数据签名 (EIP-712)
   */
  private async handleSignTypedData(params: any[]): Promise<string> {
    const [address, typedData] = params;

    if (!typedData) {
      throw new Error('类型化数据参数缺失');
    }

    const privateKey = this.walletStore.currentWallet?.privateKey;

    if (!privateKey) {
      throw new Error('钱包未解锁');
    }

    const wallet = new ethers.Wallet(privateKey);

    // 确保地址匹配
    if (address && address.toLowerCase() !== wallet.address.toLowerCase()) {
      throw new Error('地址不匹配');
    }

    try {
      // 签名类型化数据
      const signature = await wallet.signTypedData(
        typedData.domain,
        typedData.types,
        typedData.message
      );

      console.log('✅ 类型化数据签名成功');
      return signature;

    } catch (error) {
      console.error('❌ 类型化数据签名失败:', error);
      throw new Error(`签名失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  /**
   * 处理发送交易（仅签名，实际发送由DApp处理）
   */
  private async handleSendTransaction(params: any[]): Promise<string> {
    const [transaction] = params;

    if (!transaction) {
      throw new Error('交易参数缺失');
    }

    const privateKey = this.walletStore.currentWallet?.privateKey;

    if (!privateKey) {
      throw new Error('钱包未解锁');
    }

    const wallet = new ethers.Wallet(privateKey);

    // 确保from地址正确
    if (!transaction.from) {
      transaction.from = wallet.address;
    }

    try {
      // 签名交易
      const signedTransaction = await wallet.signTransaction(transaction);

      console.log('✅ 交易签名成功');
      return signedTransaction;

    } catch (error) {
      console.error('❌ 交易签名失败:', error);
      throw new Error(`交易签名失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  /**
   * 处理切换链（钱包设置）
   */
  private async handleSwitchChain(params: any[]): Promise<null> {
    const [{ chainId }] = params;

    if (!chainId) {
      throw new Error('链ID参数缺失');
    }

    // 更新当前链ID
    this.chainStore.setCurrentChainId(chainId);

    console.log(`✅ 已切换到链: ${chainId}`);
    return null;
  }

  /**
   * 处理添加链（钱包设置）
   */
  private async handleAddChain(params: any[]): Promise<null> {
    const [chainConfig] = params;

    if (!chainConfig) {
      throw new Error('链配置参数缺失');
    }

    console.log(`✅ 已添加链配置:`, chainConfig);
    // 这里可以保存链配置到钱包设置中

    return null;
  }
}

/**
 * 创建钱包服务实例
 */
let globalWalletService: WalletOnlyService | null = null;

export function getWalletService(): WalletOnlyService {
  if (!globalWalletService) {
    globalWalletService = new WalletOnlyService();
    console.log('🎯 初始化全局 Wallet Service');
  }
  return globalWalletService;
}

export default WalletOnlyService;