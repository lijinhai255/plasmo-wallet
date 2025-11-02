/**
 * Plasmo 消息传递类型定义
 * 用于钱包注入和通信的类型安全消息传递
 */

// 钱包连接请求/响应类型
export interface WalletConnectRequest {
  type: 'wallet-connect'
  requestId: string
}

export interface WalletConnectResponse {
  success: boolean
  data?: {
    address: string
    account: string
  }
  error?: string
}

// 获取账户请求/响应类型
export interface WalletGetAccountRequest {
  type: 'wallet-get-account'
  requestId: string
}

export interface WalletGetAccountResponse {
  success: boolean
  data?: {
    address: string
    account: string
  }
  error?: string
}

// 签名消息请求/响应类型
export interface WalletSignMessageRequest {
  type: 'wallet-sign-message'
  requestId: string
  data: {
    message: string
  }
}

export interface WalletSignMessageResponse {
  success: boolean
  data?: {
    signedMessage: string
  }
  error?: string
}

// 断开连接请求/响应类型
export interface WalletDisconnectRequest {
  type: 'wallet-disconnect'
  requestId: string
}

export interface WalletDisconnectResponse {
  success: boolean
  data?: {
    message: string
  }
  error?: string
}

// 通用请求类型（联合类型）
export type WalletRequest =
  | WalletConnectRequest
  | WalletGetAccountRequest
  | WalletSignMessageRequest
  | WalletDisconnectRequest

// 通用响应类型（联合类型）
export type WalletResponse =
  | WalletConnectResponse
  | WalletGetAccountResponse
  | WalletSignMessageResponse
  | WalletDisconnectResponse

// Plasmo 消息传递类型
export type PlasmoWalletRequestBody = WalletRequest & {
  name: string
}

export type PlasmoWalletResponseBody = WalletResponse