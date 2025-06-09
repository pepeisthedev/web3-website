import { useState } from 'react'

import './App.css'
import { MintButton } from './components/MintButton'
import { chainId, chainName, rpcHost } from './config.js';
import {createWeb3Modal, defaultConfig} from "@web3modal/ethers/react";

const projectId = "YOUR_PROJECT_ID";

const mainnet = {
    chainId: chainId,
    name: chainName,
    currency: "ETH",
    explorerUrl: "https://basescan.org",
    rpcUrl: rpcHost,
};

const metadata = {
    name: "Beadpunks",
    description: "Punks",
    url: "https://beadpunks.com",
    icons: ["https://avatars.mywebsite.com/"],
};

const ethersConfig = defaultConfig({
    metadata,
});

createWeb3Modal({
    ethersConfig,
    chains: [mainnet],
    projectId,
    enableAnalytics: true,
});

function App() {


  return (
    <>
      <MintButton />
    </>
  )
}


export default App
