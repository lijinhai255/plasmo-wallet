/**
 * RPC Service - 处理以太坊RPC调用
 * 提供与区块链交互的底层服务
 */

import { ethers } from 'ethers';
import { useWalletStore } from '../../store/WalletStore';
import { useChainStore } from '../../store/ChainStore';

export interface RPCRequest {
  method: string;
  params: any[];
  id?: string | number;
}

export interface RPCResponse {
  jsonrpc: string;
  id?: string | number;
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
}

export class RPCService {
  private walletStore = useWalletStore.getState();
  private chainStore = useChainStore.getState();
  private providers: Map<string, ethers.JsonRpcProvider> = new Map();

  constructor() {
    console.log('🔄 初始化 RPC Service');
    this.initializeProviders();
  }

  /**
   * 初始化不同链的提供者
   */
  private initializeProviders() {
    // Sepolia测试网
    this.providers.set('0xaa36a7', new ethers.JsonRpcProvider('https://sepolia.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161'));

    // 主网
    this.providers.set('0x1', new ethers.JsonRpcProvider('https://mainnet.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161'));

    // 其他测试网
    this.providers.set('0x13881', new ethers.JsonRpcProvider('https://polygon-mumbai.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161'));
    this.providers.set('0x5', new ethers.JsonRpcProvider('https://goerli.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161'));
  }

  /**
   * 获取当前链的提供者
   */
  private getCurrentProvider(): ethers.JsonRpcProvider {
    const chainId = this.chainStore.currentChainId || '0xaa36a7';
    const provider = this.providers.get(chainId);

    if (!provider) {
      throw new Error(`不支持的链ID: ${chainId}`);
    }

    return provider;
  }

  /**
   * 获取钱包实例
   */
  private getWallet(): ethers.Wallet {
    const privateKey = this.walletStore.currentWallet?.privateKey;

    if (!privateKey) {
      throw new Error('钱包未解锁');
    }

    const provider = this.getCurrentProvider();
    return new ethers.Wallet(privateKey, provider);
  }

  /**
   * 处理RPC请求
   */
  async handleRequest(request: RPCRequest): Promise<RPCResponse> {
    const { method, params, id } = request;

    console.log(`🔄 RPC Service 处理请求: ${method}`, params);

    try {
      let result: any;

      switch (method) {
        // 账户相关
        case 'eth_requestAccounts':
        case 'eth_accounts':
          result = await this.handleGetAccounts();
          break;

        // 链相关
        case 'eth_chainId':
          result = this.chainStore.currentChainId || '0xaa36a7';
          break;

        // 余额相关
        case 'eth_getBalance':
          result = await this.handleGetBalance(params);
          break;

        // 交易相关
        case 'eth_sendTransaction':
          result = await this.handleSendTransaction(params);
          break;

        case 'eth_getTransactionCount':
          result = await this.handleGetTransactionCount(params);
          break;

        case 'eth_getTransactionReceipt':
          result = await this.handleGetTransactionReceipt(params);
          break;

        // 签名相关
        case 'personal_sign':
          result = await this.handlePersonalSign(params);
          break;

        case 'eth_signTypedData_v4':
          result = await this.handleSignTypedData(params);
          break;

        // 区块相关
        case 'eth_getBlockByNumber':
          result = await this.handleGetBlockByNumber(params);
          break;

        // Gas相关
        case 'eth_gasPrice':
          result = await this.handleGetGasPrice();
          break;

        case 'eth_estimateGas':
          result = await this.handleEstimateGas(params);
          break;

        // 调用相关
        case 'eth_call':
          result = await this.handleCall(params);
          break;

        // 链切换
        case 'wallet_switchEthereumChain':
          result = await this.handleSwitchChain(params);
          break;

        case 'wallet_addEthereumChain':
          result = await this.handleAddChain(params);
          break;

        default:
          throw new Error(`不支持的RPC方法: ${method}`);
      }

      console.log(`✅ RPC 请求处理成功: ${method}`, result);

      return {
        jsonrpc: '2.0',
        id,
        result
      };

    } catch (error) {
      console.error(`❌ RPC 请求处理失败: ${method}`, error);

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
   * 获取账户列表
   */
  private async handleGetAccounts(): Promise<string[]> {
    const wallet = this.walletStore.currentWallet;
    return wallet?.address ? [wallet.address] : [];
  }

  /**
   * 获取余额
   */
  private async handleGetBalance(params: any[]): Promise<string> {
    const [address, blockTag = 'latest'] = params;

    if (!address) {
      throw new Error('地址参数缺失');
    }

    const provider = this.getCurrentProvider();
    const balance = await provider.getBalance(address, blockTag);

    return balance.toString();
  }

  /**
   * 发送交易
   */
  private async handleSendTransaction(params: any[]): Promise<string> {
    const [transaction] = params;

    if (!transaction) {
      throw new Error('交易参数缺失');
    }

    console.log('🔄 准备发送交易:', transaction);

    // 获取钱包实例
    const wallet = this.getWallet();

    // 确保from地址正确
    if (!transaction.from) {
      transaction.from = wallet.address;
    }

    try {
      // 构建交易对象
      const tx: ethers.TransactionRequest = {
        to: transaction.to,
        value: transaction.value || '0',
        data: transaction.data || '0x',
        gasLimit: transaction.gas || undefined,
        gasPrice: transaction.gasPrice || undefined,
        nonce: transaction.nonce ? parseInt(transaction.nonce) : undefined
      };

      // 发送交易
      const txResponse = await wallet.sendTransaction(tx);
      console.log('✅ 交易已发送:', txResponse.hash);

      // 等待交易确认
      const receipt = await txResponse.wait();
      console.log('✅ 交易已确认:', receipt?.hash);

      return txResponse.hash;

    } catch (error) {
      console.error('❌ 交易发送失败:', error);
      throw new Error(`交易失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  /**
   * 获取交易数量（nonce）
   */
  private async handleGetTransactionCount(params: any[]): Promise<string> {
    const [address, blockTag = 'latest'] = params;

    if (!address) {
      throw new Error('地址参数缺失');
    }

    const provider = this.getCurrentProvider();
    const nonce = await provider.getTransactionCount(address, blockTag);

    return ethers.toBeHex(nonce);
  }

  /**
   * 获取交易收据
   */
  private async handleGetTransactionReceipt(params: any[]): Promise<any> {
    const [txHash] = params;

    if (!txHash) {
      throw new Error('交易哈希参数缺失');
    }

    const provider = this.getCurrentProvider();
    const receipt = await provider.getTransactionReceipt(txHash);

    return receipt;
  }

  /**
   * 个人签名
   */
  private async handlePersonalSign(params: any[]): Promise<string> {
    const [message, address] = params;

    if (!message) {
      throw new Error('消息参数缺失');
    }

    // 获取钱包实例
    const wallet = this.getWallet();

    // 确保地址匹配
    if (address && address.toLowerCase() !== wallet.address.toLowerCase()) {
      throw new Error('地址不匹配');
    }

    try {
      // 将消息转换为字节
      const messageBytes = ethers.toUtf8Bytes(message.startsWith('0x') ? message : `0x${Buffer.from(message).toString('hex')}`);

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
   * 类型化数据签名 (EIP-712)
   */
  private async handleSignTypedData(params: any[]): Promise<string> {
    const [address, typedData] = params;

    if (!typedData) {
      throw new Error('类型化数据参数缺失');
    }

    // 获取钱包实例
    const wallet = this.getWallet();

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
   * 获取区块信息
   */
  private async handleGetBlockByNumber(params: any[]): Promise<any> {
    const [blockTag, includeTransactions = false] = params;

    const provider = this.getCurrentProvider();
    const block = await provider.getBlock(blockTag, includeTransactions);

    return block;
  }

  /**
   * 获取Gas价格
   */
  private async handleGetGasPrice(): Promise<string> {
    const provider = this.getCurrentProvider();
    const gasPrice = await provider.getFeeData();

    return gasPrice.gasPrice?.toString() || '0x0';
  }

  /**
   * 估算Gas
   */
  private async handleEstimateGas(params: any[]): Promise<string> {
    const [transaction] = params;

    if (!transaction) {
      throw new Error('交易参数缺失');
    }

    const provider = this.getCurrentProvider();
    const gasEstimate = await provider.estimateGas(transaction);

    return ethers.toBeHex(gasEstimate);
  }

  /**
   * 以太坊调用
   */
  private async handleCall(params: any[]): Promise<string> {
    const [transaction, blockTag = 'latest'] = params;

    if (!transaction) {
      throw new Error('交易参数缺失');
    }

    const provider = this.getCurrentProvider();
    const result = await provider.call(transaction, blockTag);

    return result;
  }

  /**
   * 切换链
   */
  private async handleSwitchChain(params: any[]): Promise<null> {
    const [{ chainId }] = params;

    if (!chainId) {
      throw new Error('链ID参数缺失');
    }

    // 检查是否支持该链
    if (!this.providers.has(chainId)) {
      throw new Error(`不支持的链: ${chainId}`);
    }

    // 更新当前链ID
    this.chainStore.setCurrentChainId(chainId);

    console.log(`✅ 已切换到链: ${chainId}`);
    return null;
  }

  /**
   * 添加链
   */
  private async handleAddChain(params: any[]): Promise<null> {
    const [chainConfig] = params;

    if (!chainConfig) {
      throw new Error('链配置参数缺失');
    }

    const { chainId, rpcUrls } = chainConfig;

    if (!chainId || !rpcUrls || rpcUrls.length === 0) {
      throw new Error('链配置不完整');
    }

    // 添加新的提供者
    const provider = new ethers.JsonRpcProvider(rpcUrls[0]);
    this.providers.set(chainId, provider);

    console.log(`✅ 已添加链: ${chainId}`);
    return null;
  }

  /**
   * 清理资源
   */
  cleanup() {
    console.log('🔄 清理 RPC Service 资源');
    this.providers.clear();
  }
}

// 创建全局RPC服务实例
let globalRPCService: RPCService | null = null;

export function getRPCService(): RPCService {
  if (!globalRPCService) {
    globalRPCService = new RPCService();
    console.log('🎯 初始化全局 RPC Service');
  }
  return globalRPCService;
}

export default RPCService;