// MintButton.jsx
import React, { useState } from 'react';
import { useAppKit, useAppKitAccount, useAppKitProvider } from '@reown/appkit/react';
import { ethers } from 'ethers';

// You'll need to define these for your specific contract
const contractAddress = "YOUR_CONTRACT_ADDRESS_HERE";
const contractABI = [
  // Your contract ABI here
  // Example mint function ABI:
  // {
  //   "inputs": [],
  //   "name": "mint",
  //   "outputs": [],
  //   "stateMutability": "payable",
  //   "type": "function"
  // }
];

export default function MintButton() {
  
  const { open } = useAppKit();
  const { isConnected } = useAppKitAccount();
  const { walletProvider } = useAppKitProvider('eip155');
  const [status, setStatus] = useState('');

  const handleMint = async () => {
    if (!isConnected) {
      // Not connected: open the Reown modal to let user select a wallet
      open();
    } else {
      try {
        setStatus('Minting...');

        if (!walletProvider) {
          throw new Error('No wallet provider available');
        }

        // Create ethers provider from wallet provider
        const ethersProvider = new ethers.BrowserProvider(walletProvider);
        const signer = await ethersProvider.getSigner();

        // Create contract instance
        const contract = new ethers.Contract(contractAddress, contractABI, signer);
        const tx = await contract.mint(/* mint parameters */);
        await tx.wait();  // wait for transaction confirmation

        setStatus('✅ Mint successful!');
      } catch (err) {
        console.error(err);
        setStatus('❌ Mint failed: ' + (err.message || 'Unknown error'));
      }
    }
  };

  return (
    <div>
      <button onClick={handleMint}>
        {isConnected ? 'Mint Now' : 'Connect Wallet'}
      </button>
      {status && <p>{status}</p>}
    </div>
  );
}