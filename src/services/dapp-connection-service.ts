/**
 * DApp Connection Service - 管理DApp连接状态
 * 跟踪连接的DApp、权限和会话状态
 */

interface DAppConnection {
  origin: string;
  name: string;
  icon?: string;
  connectedAccounts: string[];
  chainId: string;
  permissions: string[];
  connectedAt: number;
  lastUsedAt: number;
}

interface ConnectionRequest {
  origin: string;
  name: string;
  icon?: string;
  requestId: string;
}

interface Permission {
  name: string;
  description: string;
  required: boolean;
}

export class DAppConnectionService {
  private connections: Map<string, DAppConnection> = new Map();
  private pendingRequests: Map<string, ConnectionRequest> = new Map();

  constructor() {
    console.log('🔄 初始化 DApp Connection Service');
    this.loadConnections();
  }

  /**
   * 检查DApp是否已连接
   */
  isConnected(origin: string): boolean {
    return this.connections.has(origin);
  }

  /**
   * 获取DApp连接信息
   */
  getConnection(origin: string): DAppConnection | null {
    return this.connections.get(origin) || null;
  }

  /**
   * 获取所有连接的DApp
   */
  getAllConnections(): DAppConnection[] {
    return Array.from(this.connections.values());
  }

  /**
   * 请求连接新的DApp
   */
  async requestConnection(request: ConnectionRequest): Promise<boolean> {
    console.log('🔄 DApp请求连接:', request);

    // 检查是否已连接
    if (this.connections.has(request.origin)) {
      console.log('✅ DApp已连接:', request.origin);
      return true;
    }

    // 保存待处理请求
    this.pendingRequests.set(request.requestId, request);

    try {
      // 显示连接请求UI（简化处理）
      const approved = await this.showConnectionRequest(request);

      if (approved) {
        // 创建连接
        const connection: DAppConnection = {
          origin: request.origin,
          name: request.name,
          icon: request.icon,
          connectedAccounts: [], // 将在确认时填充
          chainId: '0xaa36a7', // 默认Sepolia
          permissions: ['eth_accounts'], // 基础权限
          connectedAt: Date.now(),
          lastUsedAt: Date.now()
        };

        this.connections.set(request.origin, connection);
        this.saveConnections();

        console.log('✅ DApp连接成功:', request.origin);
        return true;
      } else {
        console.log('❌ 用户拒绝了DApp连接请求:', request.origin);
        return false;
      }

    } finally {
      // 清理待处理请求
      this.pendingRequests.delete(request.requestId);
    }
  }

  /**
   * 断开DApp连接
   */
  disconnect(origin: string): boolean {
    const connection = this.connections.get(origin);

    if (!connection) {
      return false;
    }

    this.connections.delete(origin);
    this.saveConnections();

    console.log('✅ DApp已断开连接:', origin);
    return true;
  }

  /**
   * 更新DApp连接状态
   */
  updateConnection(origin: string, updates: Partial<DAppConnection>): void {
    const connection = this.connections.get(origin);

    if (!connection) {
      return;
    }

    Object.assign(connection, updates, {
      lastUsedAt: Date.now()
    });

    this.connections.set(origin, connection);
    this.saveConnections();
  }

  /**
   * 检查DApp权限
   */
  hasPermission(origin: string, permission: string): boolean {
    const connection = this.connections.get(origin);
    return connection ? connection.permissions.includes(permission) : false;
  }

  /**
   * 授予DApp权限
   */
  grantPermission(origin: string, permission: string): void {
    const connection = this.connections.get(origin);

    if (!connection) {
      return;
    }

    if (!connection.permissions.includes(permission)) {
      connection.permissions.push(permission);
      this.connections.set(origin, connection);
      this.saveConnections();
    }
  }

  /**
   * 撤销DApp权限
   */
  revokePermission(origin: string, permission: string): void {
    const connection = this.connections.get(origin);

    if (!connection) {
      return;
    }

    const index = connection.permissions.indexOf(permission);
    if (index > -1) {
      connection.permissions.splice(index, 1);
      this.connections.set(origin, connection);
      this.saveConnections();
    }
  }

  /**
   * 获取连接的DApp数量
   */
  getConnectionCount(): number {
    return this.connections.size;
  }

  /**
   * 清理长时间未使用的连接
   */
  cleanupInactiveConnections(maxInactiveTime: number = 30 * 24 * 60 * 60 * 1000): void {
    const now = Date.now();
    const inactiveOrigins: string[] = [];

    for (const [origin, connection] of this.connections) {
      if (now - connection.lastUsedAt > maxInactiveTime) {
        inactiveOrigins.push(origin);
      }
    }

    inactiveOrigins.forEach(origin => {
      this.connections.delete(origin);
      console.log('🧹 清理非活跃连接:', origin);
    });

    if (inactiveOrigins.length > 0) {
      this.saveConnections();
    }
  }

  /**
   * 显示连接请求UI（简化版本）
   */
  private async showConnectionRequest(request: ConnectionRequest): Promise<boolean> {
    console.log('🔄 显示DApp连接请求:', request);

    return new Promise((resolve) => {
      // 创建确认页面URL
      const confirmUrl = chrome.runtime.getURL(`confirm.html?type=connect&requestId=${request.requestId}&data=${encodeURIComponent(JSON.stringify(request))}`);

      // 打开确认页面
      chrome.windows.create({
        url: confirmUrl,
        type: 'popup',
        width: 420,
        height: 500,
        focused: true
      }, (window) => {
        if (chrome.runtime.lastError) {
          console.error('❌ 打开确认页面失败:', chrome.runtime.lastError);
          resolve(false);
          return;
        }

        console.log('✅ 已打开DApp连接确认页面');

        // 设置超时处理
        const timeout = setTimeout(() => {
          if (window.id) {
            chrome.windows.remove(window.id);
          }
          resolve(false);
        }, 5 * 60 * 1000); // 5分钟超时

        // 监听窗口关闭
        const windowRemovedListener = (closedWindowId: number) => {
          if (closedWindowId === window.id) {
            clearTimeout(timeout);
            chrome.windows.onRemoved.removeListener(windowRemovedListener);
            // 默认拒绝，因为用户没有明确确认
            resolve(false);
          }
        };

        chrome.windows.onRemoved.addListener(windowRemovedListener);

        // 监听确认响应
        const messageListener = (message: any) => {
          if (message.type === 'CONFIRMATION_RESPONSE' && message.requestId === request.requestId) {
            clearTimeout(timeout);
            chrome.runtime.onMessage.removeListener(messageListener);

            if (window.id) {
              chrome.windows.remove(window.id);
            }

            resolve(message.action === 'confirm');
          }
        };

        chrome.runtime.onMessage.addListener(messageListener);
      });
    });
  }

  /**
   * 从存储加载连接数据
   */
  private loadConnections(): void {
    chrome.storage.local.get(['dappConnections'], (result) => {
      if (result.dappConnections) {
        try {
          const connections = JSON.parse(result.dappConnections);
          this.connections = new Map(Object.entries(connections));
          console.log('📁 已加载DApp连接数据:', this.connections.size, '个连接');
        } catch (error) {
          console.error('❌ 加载DApp连接数据失败:', error);
          this.connections.clear();
        }
      }
    });
  }

  /**
   * 保存连接数据到存储
   */
  private saveConnections(): void {
    const connectionsObj = Object.fromEntries(this.connections);
    chrome.storage.local.set({
      dappConnections: JSON.stringify(connectionsObj)
    }, () => {
      if (chrome.runtime.lastError) {
        console.error('❌ 保存DApp连接数据失败:', chrome.runtime.lastError);
      } else {
        console.log('💾 已保存DApp连接数据');
      }
    });
  }

  /**
   * 清理所有连接数据
   */
  clearAllConnections(): void {
    this.connections.clear();
    this.pendingRequests.clear();
    chrome.storage.local.remove(['dappConnections']);
    console.log('🧹 已清理所有DApp连接数据');
  }

  /**
   * 获取待处理的连接请求
   */
  getPendingRequest(requestId: string): ConnectionRequest | null {
    return this.pendingRequests.get(requestId) || null;
  }

  /**
   * 导出连接数据
   */
  exportConnections(): string {
    const exportData = {
      connections: Object.fromEntries(this.connections),
      exportedAt: Date.now(),
      version: '1.0'
    };
    return JSON.stringify(exportData, null, 2);
  }

  /**
   * 导入连接数据
   */
  importConnections(data: string): boolean {
    try {
      const importData = JSON.parse(data);

      if (!importData.connections || typeof importData.connections !== 'object') {
        throw new Error('无效的连接数据格式');
      }

      // 合并导入的连接
      Object.entries(importData.connections).forEach(([origin, connection]: [string, any]) => {
        this.connections.set(origin, connection);
      });

      this.saveConnections();
      console.log('✅ 已导入DApp连接数据');
      return true;

    } catch (error) {
      console.error('❌ 导入DApp连接数据失败:', error);
      return false;
    }
  }
}

// 常用权限定义
export const DAPP_PERMISSIONS = {
  ACCOUNTS: 'eth_accounts',
  BALANCE: 'eth_getBalance',
  TRANSACTION: 'eth_sendTransaction',
  SIGN: 'personal_sign',
  SIGN_TYPED_DATA: 'eth_signTypedData_v4',
  CHAIN: 'wallet_switchEthereumChain',
  ADD_CHAIN: 'wallet_addEthereumChain'
} as const;

// 创建全局DApp连接服务实例
let globalDAppConnectionService: DAppConnectionService | null = null;

export function getDAppConnectionService(): DAppConnectionService {
  if (!globalDAppConnectionService) {
    globalDAppConnectionService = new DAppConnectionService();
    console.log('🎯 初始化全局 DApp Connection Service');
  }
  return globalDAppConnectionService;
}

export default DAppConnectionService;