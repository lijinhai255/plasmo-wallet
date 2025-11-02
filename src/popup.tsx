import React from "react"
import { useWalletStore } from "./stores/walletStore";
import { WalletSetup } from "./components/WalletSetup";
import { WalletUnlock } from "./components/WalletUnlock";
import { WalletDashboard } from "./components/WalletDashboard";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "./style.css";

const queryClient = new QueryClient({})

export default function popup() {
  const { accounts, isLocked } = useWalletStore()
  console.log(accounts);

  // 如果没有账户，显示设置页面
  if (accounts.length === 0) {
    return (
      <QueryClientProvider client={queryClient}>
        <div className="w-[400px] min-h-[600px] bg-white">
          <WalletSetup />
        </div>
      </QueryClientProvider>
    )
  }

  // 如果钱包被锁定，显示解锁页面
  if (isLocked) {
    return (
      <QueryClientProvider client={queryClient}>
        <div className="w-[400px] min-h-[600px] bg-white">
          <WalletUnlock />
        </div>
      </QueryClientProvider>
    )
  }

  // 显示钱包主界面
  return (
    <QueryClientProvider client={queryClient}>
      <div className="w-[400px] min-h-[600px] bg-white">
        <WalletDashboard />
      </div>
    </QueryClientProvider>
  )
}