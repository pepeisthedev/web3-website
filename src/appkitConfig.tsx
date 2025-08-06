import { createAppKit } from '@reown/appkit/react'
import { base, baseSepolia, hardhat } from '@reown/appkit/networks'
import { EthersAdapter } from '@reown/appkit-adapter-ethers'
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient(); 

const metadata = { // optional app metadata
  name: 'My DApp',
  description: 'My DApp using Reown AppKit',
  url: 'http://localhost:5173', // Update to your DApp URL
  icons: [] // e.g. an array of icon URLs
};

const projectId = import.meta.env.VITE_REOWN_PROJECT_ID; //Reown project ID

// Initialize Reown AppKit (modal instance)
export const modal = createAppKit({
  adapters: [new EthersAdapter()],       // use Ethers for EVM wallets
  networks: [baseSepolia, hardhat],    // supported EVM chains (Base, Ethereum, Polygon as examples)
  metadata,                              // app metadata (for wallet UIs)
  projectId,                             // your Reown/WalletConnect project ID
  features: {
    analytics: true                     // enable Reown analytics (optional)
  }
});