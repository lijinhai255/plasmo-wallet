import React from "react"
import { WalletPage } from "../pages/WalletPage"
import { AssetsPage } from "../pages/AssetsPage"
import { SettingsPage } from "../pages/SettingsPage"
import { PasswordPage } from "../pages/PasswordPage"
import { ErrorTestPage } from "../pages/ErrorTestPage"
import { TokenManager } from "../components/TokenManager"
import { WalletStatus } from "../components/WalletStatus"
import { TransactionConfirmPage } from "../pages/dapp/TransactionConfirmPage"
import { ConnectionRequestsPage } from "../pages/dapp/ConnectionRequestsPage"
import { PermissionsPage } from "../pages/dapp/PermissionsPage"
import { NetworkManagerPage } from "../pages/network/NetworkManagerPage"

// 创建网络页面组件
const NetworkPage = () => {
  // 动态导入避免循环依赖
  const [NetworkSelector, setNetworkSelector] = React.useState<React.ComponentType | null>(null)

  React.useEffect(() => {
    import("../components/NetworkSelector").then(m => {
      setNetworkSelector(() => m.NetworkSelector)
    })
  }, [])

  if (!NetworkSelector) {
    return React.createElement('div', {style: {padding: '16px', textAlign: 'center'}}, '加载中...')
  }

  return React.createElement(NetworkSelector)
}

// 创建代币管理页面组件
const TokenManagerPage = () => {
  // 动态导入避免循环依赖
  const [TokenManagerComponent, setTokenManagerComponent] = React.useState<React.ComponentType | null>(null)

  React.useEffect(() => {
    import("../components/TokenManager").then(m => {
      setTokenManagerComponent(() => m.TokenManager)
    })
  }, [])

  if (!TokenManagerComponent) {
    return React.createElement('div', {style: {padding: '16px', textAlign: 'center'}}, '加载中...')
  }

  return React.createElement(TokenManagerComponent)
}

// 创建钱包状态页面组件
const WalletStatusPage = () => {
  // 动态导入避免循环依赖
  const [WalletStatusComponent, setWalletStatusComponent] = React.useState<React.ComponentType | null>(null)

  React.useEffect(() => {
    import("../components/WalletStatus").then(m => {
      setWalletStatusComponent(() => m.WalletStatus)
    })
  }, [])

  if (!WalletStatusComponent) {
    return React.createElement('div', {style: {padding: '16px', textAlign: 'center'}}, '加载中...')
  }

  return React.createElement(WalletStatusComponent)
}

export interface RouteConfig {
  path: string
  component: React.ComponentType
  label: string
  icon?: string
  developmentOnly?: boolean // 仅在开发环境显示
}

export const routes: RouteConfig[] = [
  {
    path: "/",
    component: WalletPage,
    label: "钱包",
    icon: "💼"
  },
  {
    path: "/assets",
    component: AssetsPage,
    label: "资产",
    icon: "💰"
  },
  {
    path: "/tokens",
    component: TokenManagerPage,
    label: "代币",
    icon: "🪙"
  },
  {
    path: "/network-manager",
    component: NetworkManagerPage,
    label: "网络管理",
    icon: "🌐"
  },
  // {
  //   path: "/connections",
  //   component: ConnectionRequestsPage,
  //   label: "DApp连接",
  //   icon: "🔗"
  // },
  // {
  //   path: "/permissions",
  //   component: PermissionsPage,
  //   label: "权限管理",
  //   icon: "🛡️"
  // },
  {
    path: "/network",
    component: NetworkPage,
    label: "网络选择",
    icon: "🌐"
  },
  // {
  //   path: "/wallet-status",
  //   component: WalletStatusPage,
  //   label: "钱包状态",
  //   icon: "📊"
  // },
  // {
  //   path: "/settings",
  //   component: SettingsPage,
  //   label: "设置",
  //   icon: "⚙️"
  // },
  // {
  //   path: "/password",
  //   component: PasswordPage,
  //   label: "密码",
  //   icon: "🔐"
  // },
  // {
  //   path: "/error-test",
  //   component: ErrorTestPage,
  //   label: "错误测试",
  //   icon: "🧪",
  //   developmentOnly: true
  // },
  // {
  //   path: "/transaction-confirm",
  //   component: TransactionConfirmPage,
  //   label: "交易确认",
  //   icon: "✅",
  //   developmentOnly: true // 通常这个页面通过模态框调用，不在导航中显示
  // }
]

export const getVisibleRoutes = () => {
  if (process.env.NODE_ENV === 'development') {
    return routes
  }
  return routes.filter(route => !route.developmentOnly)
}

export const getDefaultRoute = () => routes[0]
export const getRouteByPath = (path: string) => routes.find(route => route.path === path)