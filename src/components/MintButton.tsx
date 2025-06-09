import React from "react";

import {
  useWeb3Modal,
  useWeb3ModalProvider,
  useWeb3ModalAccount,
} from "@web3modal/ethers/react";

export const MintButton: React.FC = () => {

  const { open } = useWeb3Modal();
  const { address, isConnected } = useWeb3ModalAccount();
  const { walletProvider } = useWeb3ModalProvider();

  return (
    <div>
      <h1>HEHU</h1>
      {!isConnected ? (
        <button
          onClick={() => open()}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded cursor-pointer transition-colors"
        >
          Connect Wallet
        </button>
      ) : (
        <button className="mint-button bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
          Mint
        </button>
      )}
    </div>
  );
};