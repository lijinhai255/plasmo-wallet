import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { type Network, DEFAULT_NETWORKS } from '@/types/wallet';
import { ethers } from 'ethers';

interface NetworkStore {
  // State
  currentNetwork: Network;
  networks: Network[];
  isLoading: boolean;
  connectionStatus: 'connected' | 'disconnected' | 'connecting' | 'error';
  lastError: string | null;

  // Actions
  switchNetwork: (networkId: string) => Promise<void>;
  addNetwork: (network: Network) => Promise<void>;
  removeNetwork: (networkId: string) => void;
  updateNetwork: (networkId: string, updates: Partial<Network>) => void;
  testConnection: (networkId: string) => Promise<boolean>;
  getCurrentProvider: () => ethers.JsonRpcProvider | null;
  validateNetwork: (network: Partial<Network>) => { isValid: boolean; errors: string[] };
  resetToDefaults: () => void;
}

const initialNetwork = DEFAULT_NETWORKS[0]; // 默认使用 Sepolia 测试网

export const useNetworkStore = create<NetworkStore>()(
  persist(
    (set, get) => ({
      // Initial state
      currentNetwork: initialNetwork,
      networks: DEFAULT_NETWORKS,
      isLoading: false,
      connectionStatus: 'disconnected',
      lastError: null,

      // Switch to a different network
      switchNetwork: async (networkId: string) => {
        const { networks } = get();
        const targetNetwork = networks.find(n => n.id === networkId);

        if (!targetNetwork) {
          set({
            lastError: `Network ${networkId} not found`,
            connectionStatus: 'error'
          });
          throw new Error(`Network ${networkId} not found`);
        }

        set({ isLoading: true, connectionStatus: 'connecting', lastError: null });

        try {
          // Test the connection
          const provider = new ethers.JsonRpcProvider(targetNetwork.rpcUrl);
          await provider.getNetwork(); // This will throw if the RPC is invalid

          set({
            currentNetwork: targetNetwork,
            connectionStatus: 'connected',
            lastError: null
          });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          set({
            lastError: `Failed to connect to ${targetNetwork.name}: ${errorMessage}`,
            connectionStatus: 'error'
          });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      // Add a new custom network
      addNetwork: async (network: Network) => {
        const { networks, validateNetwork } = get();

        // Validate network first
        const validation = validateNetwork(network);
        if (!validation.isValid) {
          throw new Error(`Invalid network: ${validation.errors.join(', ')}`);
        }

        // Check for duplicate ID or chainId
        const duplicateId = networks.find(n => n.id === network.id);
        const duplicateChainId = networks.find(n => n.chainId === network.chainId);

        if (duplicateId) {
          throw new Error(`Network with ID "${network.id}" already exists`);
        }

        if (duplicateChainId) {
          throw new Error(`Network with Chain ID "${network.chainId}" already exists`);
        }

        // Test connection before adding
        try {
          const provider = new ethers.JsonRpcProvider(network.rpcUrl);
          await provider.getNetwork();
        } catch (error) {
          throw new Error(`Failed to connect to RPC URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }

        set(state => ({
          networks: [...state.networks, network]
        }));
      },

      // Remove a custom network (can't remove default networks)
      removeNetwork: (networkId: string) => {
        const { networks } = get();
        const isDefaultNetwork = DEFAULT_NETWORKS.some(n => n.id === networkId);

        if (isDefaultNetwork) {
          throw new Error('Cannot remove default network');
        }

        const networkToRemove = networks.find(n => n.id === networkId);
        if (!networkToRemove) {
          throw new Error(`Network ${networkId} not found`);
        }

        const { currentNetwork } = get();
        // If removing current network, switch to default
        if (currentNetwork.id === networkId) {
          set({
            networks: networks.filter(n => n.id !== networkId),
            currentNetwork: DEFAULT_NETWORKS[0]
          });
        } else {
          set({
            networks: networks.filter(n => n.id !== networkId)
          });
        }
      },

      // Update an existing network
      updateNetwork: (networkId: string, updates: Partial<Network>) => {
        const { networks, validateNetwork } = get();
        const networkIndex = networks.findIndex(n => n.id === networkId);

        if (networkIndex === -1) {
          throw new Error(`Network ${networkId} not found`);
        }

        const isDefaultNetwork = DEFAULT_NETWORKS.some(n => n.id === networkId);
        if (isDefaultNetwork) {
          throw new Error('Cannot modify default network');
        }

        const updatedNetwork = { ...networks[networkIndex], ...updates };
        const validation = validateNetwork(updatedNetwork);

        if (!validation.isValid) {
          throw new Error(`Invalid network: ${validation.errors.join(', ')}`);
        }

        set(state => ({
          networks: state.networks.map(n =>
            n.id === networkId ? updatedNetwork : n
          ),
          currentNetwork: state.currentNetwork.id === networkId
            ? updatedNetwork
            : state.currentNetwork
        }));
      },

      // Test connection to a network
      testConnection: async (networkId: string): Promise<boolean> => {
        const { networks } = get();
        const network = networks.find(n => n.id === networkId);

        if (!network) {
          return false;
        }

        try {
          const provider = new ethers.JsonRpcProvider(network.rpcUrl);
          const startTime = Date.now();
          await provider.getNetwork();
          const latency = Date.now() - startTime;

          // Update connection status
          if (networkId === get().currentNetwork.id) {
            set({ connectionStatus: 'connected', lastError: null });
          }

          return true;
        } catch (error) {
          if (networkId === get().currentNetwork.id) {
            set({
              connectionStatus: 'error',
              lastError: error instanceof Error ? error.message : 'Unknown error'
            });
          }
          return false;
        }
      },

      // Get provider for current network
      getCurrentProvider: () => {
        const { currentNetwork } = get();
        try {
          return new ethers.JsonRpcProvider(currentNetwork.rpcUrl);
        } catch (error) {
          console.error('Failed to create provider:', error);
          return null;
        }
      },

      // Validate network configuration
      validateNetwork: (network: Partial<Network>) => {
        const errors: string[] = [];

        if (!network.id || network.id.trim() === '') {
          errors.push('Network ID is required');
        }

        if (!network.name || network.name.trim() === '') {
          errors.push('Network name is required');
        }

        if (!network.rpcUrl || network.rpcUrl.trim() === '') {
          errors.push('RPC URL is required');
        } else {
          try {
            new URL(network.rpcUrl);
          } catch {
            errors.push('Invalid RPC URL format');
          }
        }

        if (network.chainId === undefined || network.chainId <= 0) {
          errors.push('Valid Chain ID is required');
        }

        if (!network.symbol || network.symbol.trim() === '') {
          errors.push('Currency symbol is required');
        }

        return {
          isValid: errors.length === 0,
          errors
        };
      },

      // Reset networks to defaults
      resetToDefaults: () => {
        set({
          networks: DEFAULT_NETWORKS,
          currentNetwork: DEFAULT_NETWORKS[0],
          connectionStatus: 'disconnected',
          lastError: null
        });
      }
    }),
    {
      name: 'network-store',
      // Use Chrome storage for persistence
      storage: {
        getItem: async (name: string) => {
          const result = await chrome.storage.local.get(name);
          return result[name] || null;
        },
        setItem: async (name: string, value: any) => {
          await chrome.storage.local.set({ [name]: value });
        },
        removeItem: async (name: string) => {
          await chrome.storage.local.remove(name);
        }
      },
      // Only persist specific fields
      partialize: (state) => ({
        currentNetwork: state.currentNetwork,
        networks: state.networks
      })
    }
  )
);