// MintButton.tsx
import React, { useState } from 'react';
import { useAppKit, useAppKitAccount, useAppKitProvider } from '@reown/appkit/react';
import { ethers } from 'ethers';
import contractABI from '../assets/abi/mintpassAbi.json'; // Import your contract ABI

// Contract configuration
const contractAddress: string = "0xDf7308E43DDE34a593A97382d5540d87da29deC5";

// Status type for better type safety
type MintStatus = '' | 'Minting...' | 'Mint successful!' | string;

interface MintError extends Error {
  message: string;
}

export default function MintButton(): React.JSX.Element {
  
  const { open } = useAppKit();
  const { isConnected } = useAppKitAccount();
  const { walletProvider } = useAppKitProvider('eip155');
  const [status, setStatus] = useState<MintStatus>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleMint = async (): Promise<void> => {
    if (!isConnected) {
      // Not connected: open the Reown modal to let user select a wallet
      open();
      return;
    }
    
    try {
      setIsLoading(true);
      setStatus('Minting...');

      if (!walletProvider) {
        throw new Error('No wallet provider available');
      }

      // Create ethers provider from wallet provider
      if (typeof (walletProvider as ethers.Eip1193Provider).request !== 'function') {
        throw new Error('walletProvider does not implement EIP-1193');
      }
      const ethersProvider = new ethers.BrowserProvider(walletProvider as ethers.Eip1193Provider);
      const signer = await ethersProvider.getSigner();

      // Create contract instance
      const contract = new ethers.Contract(contractAddress, contractABI, signer);
      
      // Execute mint transaction
      const tx = await contract.mintPunk(1, {
        gasLimit: 300000,
      });
      
      // Wait for transaction confirmation
      await tx.wait();

      setStatus('✅ Mint successful!');
    } catch (err) {
      console.error('Mint error:', err);
      const error = err as MintError;
      setStatus('❌ Mint failed: ' + (error.message || 'Unknown error'));
    } finally {
      setIsLoading(false);
    }
  };

  const getButtonText = (): string => {
    if (isLoading) return 'Minting...';
    return isConnected ? 'Mint Punk NFT' : 'Connect Wallet';
  };

  const getStatusColor = (): string => {
    if (status.includes('✅')) return 'text-green-600 bg-green-50 border-green-200';
    if (status.includes('❌')) return 'text-red-600 bg-red-50 border-red-200';
    if (status.includes('Minting')) return 'text-blue-600 bg-blue-50 border-blue-200';
    return 'text-gray-600 bg-gray-50 border-gray-200';
  };

  return (
    <div className="flex flex-col items-center space-y-4 p-6 max-w-md mx-auto">
      {/* Main Mint Button */}
      <button 
        onClick={handleMint}
        disabled={isLoading}
        className={`
          relative px-8 py-4 text-lg font-semibold rounded-xl
          transition-all duration-200 ease-in-out
          transform hover:scale-105 active:scale-95
          shadow-lg hover:shadow-xl
          focus:outline-none focus:ring-4 focus:ring-opacity-50
          ${isLoading 
            ? 'bg-gray-400 cursor-not-allowed text-white' 
            : isConnected
              ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white focus:ring-purple-300 cursor-pointer'
              : 'bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white focus:ring-green-300 cursor-pointer'
          }
          disabled:transform-none disabled:hover:scale-100
        `}
      >
        {/* Loading spinner */}
        {isLoading && (
          <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
          </div>
        )}
        
        <span className={isLoading ? 'ml-6' : ''}>
          {getButtonText()}
        </span>
      </button>

      {/* Status Message */}
      {status && (
        <div className={`
          px-4 py-3 rounded-lg border text-sm font-medium
          transition-all duration-300 ease-in-out
          animate-fade-in w-full text-center
          ${getStatusColor()}
        `}>
          {status}
        </div>
      )}

      {/* Connection Status Indicator */}
      <div className="flex items-center space-x-2 text-sm text-gray-600">
        <div className={`
          w-3 h-3 rounded-full transition-colors duration-200
          ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}
        `}></div>
        <span>
          {isConnected ? 'Wallet Connected' : 'Wallet Disconnected'}
        </span>
      </div>

      {/* Additional Info */}
      {isConnected && (
        <div className="text-xs text-gray-500 text-center max-w-xs">
          <p>Contract: {contractAddress.slice(0, 6)}...{contractAddress.slice(-4)}</p>
          <p className="mt-1">Gas Limit: 300,000</p>
        </div>
      )}
    </div>
  );
}