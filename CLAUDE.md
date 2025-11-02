# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a browser extension wallet built with Plasmo Framework, React, and TypeScript. The wallet provides Ethereum functionality with DApp integration capabilities through a custom `window.myWallet` provider that mimics MetaMask's API.

## Development Commands

```bash
# Development mode with hot reload
pnpm dev

# Build the extension for production
pnpm build

# Package the extension (creates ZIP file)
pnpm package

# Run tests (currently uses dev mode with verbose output)
pnpm test
```

## Architecture Overview

### Core Architecture Pattern
The wallet follows a three-layer communication pattern:
1. **Injected Helper** (`src/background/injected-helper.ts`) - Injected into web pages, provides `window.myWallet` API
2. **Message Bridge** (`src/contents/message-bridge.ts`) - Content script that forwards messages between injected helper and background
3. **Background Script** (`src/background/index.ts`) - Handles wallet operations and storage

### State Management
- **Zustand Store** (`src/stores/walletStore.ts`) - Centralized wallet state with Chrome storage persistence
- Uses AES encryption for private keys and mnemonic storage
- Supports multiple accounts, networks, and tokens

### Key Components Structure
- **Popup UI** (`src/popup.tsx`) - Main extension popup with three states: setup, unlock, dashboard
- **Wallet Components** (`src/components/`) - Reusable UI components including WalletSetup, WalletUnlock, WalletDashboard
- **Page Components** (`src/pages/`) - Full-page components for different wallet features
- **UI Library** (`src/components/ui/`) - Radix UI components with custom theming

### DApp Integration
The wallet implements a custom Ethereum provider that's injected into web pages:
- Connects via `window.myWallet.connect()`
- Supports standard wallet operations: getAccount, signMessage, disconnect
- Uses message passing with unique request IDs for async operations
- Background script handles actual wallet operations and account management

## Important File Locations

### Core Wallet Logic
- `src/stores/walletStore.ts` - Wallet state and operations
- `src/background/index.ts` - Background script and message handling
- `src/background/injected-helper.ts` - In-page wallet provider
- `src/contents/message-bridge.ts` - Message forwarding bridge

### UI Components
- `src/popup.tsx` - Extension popup entry point
- `src/components/Wallet*.tsx` - Main wallet UI components
- `src/pages/` - Full-screen pages for different features
- `src/components/ui/` - Reusable UI components (shadcn/ui)

### Configuration
- `package.json` - Dependencies and scripts (uses pnpm package manager)
- `tsconfig.json` - TypeScript configuration with path aliases (`@/*` → `./src/*`)
- `tailwind.config.ts` - Tailwind CSS with custom wallet theme and animations
- Manifest permissions: `tabs`, `scripting`, `storage`, `host_permissions: ["<all_urls>"]`

## Development Guidelines

### State Management
- All wallet state is managed through Zustand store with Chrome storage persistence
- Private keys and mnemonics are encrypted with AES using user password
- Use the store methods for all wallet operations (createWallet, importWallet, etc.)

### DApp Communication
- All DApp communication must go through the message bridge pattern
- Each request must include a unique requestId for async handling
- Follow the existing message types in `src/background/type_constant.ts`

### UI Development
- Use Radix UI components from `src/components/ui/`
- Follow the existing Tailwind CSS theming system
- Wallet uses custom CSS variables defined in tailwind.config.ts
- All popup UI should be contained in 400px width, 600px min-height

### Security Considerations
- Private keys are never stored in plain text - always encrypted
- Password validation uses SHA256 hashing
- Background script handles all sensitive operations
- Content scripts act only as message forwarders

### TypeScript Configuration
- Uses path aliases: `@/*` maps to `./src/*`
- Strict TypeScript configuration inherited from Plasmo base config
- Type definitions located in `src/types/` directory

## Key Dependencies
- **plasmo**: Browser extension framework
- **ethers**: Ethereum library for wallet operations
- **zustand**: State management with persistence
- **radix-ui**: Component library for UI
- **bip39**: Mnemonic phrase generation/validation
- **crypto-js**: Encryption for sensitive data
- **tailwindcss**: Styling framework with custom theme