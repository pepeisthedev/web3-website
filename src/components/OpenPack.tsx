"use client"

import { useState, useEffect } from "react"
import { useAppKit, useAppKitAccount, useAppKitProvider } from "@reown/appkit/react"
import { ethers } from "ethers"
import { Button } from "./ui/button"
import TransactionModal from "./TransactionModal"
import packContractAbi from "../assets/abi/Bead157Pack.json"
import cardContractAbi from "../assets/abi/Bead157Card.json"
import cardArtSvgContractABI from "../assets/abi/Bead157CardArt.json"

const packsContractAddress = import.meta.env.VITE_BEAD157_CARD_PACK_CONTRACT
const svgContractAddress = import.meta.env.VITE_BEAD157_CARD_ART_CONTRACT
const cardContractAddress = import.meta.env.VITE_BEAD157_CARD_CONTRACT


interface CardData {
  svg: string
  description: string
}

export default function OpenPackPage() {
  const { open } = useAppKit()
  const { isConnected, address } = useAppKitAccount()
  const { walletProvider } = useAppKitProvider("eip155")

  const [packCount, setPackCount] = useState<number>(0)
  const [showModal, setShowModal] = useState<boolean>(false)
  const [extractedCards, setExtractedCards] = useState<CardData[]>([])

  useEffect(() => {
    if (isConnected && address) {
      fetchPackCount()
    }
  }, [isConnected, address])

  const fetchPackCount = async () => {
    try {
      if (!walletProvider || !address) return

      const ethersProvider = new ethers.BrowserProvider(walletProvider as ethers.Eip1193Provider)
      const contract = new ethers.Contract(packsContractAddress, packContractAbi, ethersProvider)

      const balance = await contract.balanceOf(address, 1) 
    //  console.log("Pack count fetched:", balance.toString())
      setPackCount(Number(balance))
    } catch (error) {
      console.error("Error fetching pack count:", error)
    }
  }



const fetchCardData = async (cardIds: number[]): Promise<CardData[]> => {
  console.log("🎴 Fetching card data for IDs:", cardIds)
  
  if (!walletProvider) {
    console.log("❌ No wallet provider for card data fetch")
    return []
  }

  const ethersProvider = new ethers.BrowserProvider(walletProvider as ethers.Eip1193Provider)
  const svgContract = new ethers.Contract(svgContractAddress, cardArtSvgContractABI, ethersProvider)
 //console.log("📋 SVG Contract initialized:", svgContractAddress)

  const cardDataPromises = cardIds.map(async (cardId) => {
    try {
      console.log(`🔍 Fetching data for card ${cardId}...`)
      const [svg, meta] = await Promise.all([
        svgContract.render(cardId),
        svgContract.meta(cardId)
      ])
      
      console.log(`✅ Card ${cardId} data fetched:`, { svg: svg, meta })
      return {
        svg,
        description: meta
      }
    } catch (error) {
      console.error(`❌ Error fetching card ${cardId}:`, error)
      return {
        svg: "",
        description: `Card #${cardId}`
      }
    }
  })

  const results = await Promise.all(cardDataPromises)
  console.log("🎯 All card data fetched:", results.length)
  return results
}

const executeOpenPack = async () => {
  try {
    console.log("📦 Starting pack opening...")
    
    if (!walletProvider) {
      console.log("❌ No wallet provider available")
      throw new Error("No wallet provider available")
    }

   // console.log("📡 Setting up provider and signer...")
    const ethersProvider = new ethers.BrowserProvider(walletProvider as ethers.Eip1193Provider)
    const signer = await ethersProvider.getSigner()
    const packContract = new ethers.Contract(packsContractAddress, packContractAbi, signer)
    const cardContract = new ethers.Contract(cardContractAddress, cardContractAbi, signer)

   // console.log("📝 Submitting open pack transaction...")
    const tx = await packContract.openPack({
      gasLimit: 500000,
    })

    const receipt = await tx.wait()

    // Parse events to get card IDs
    let cardIds: number[] = []
    
    receipt.logs.forEach((log: any, index: number) => {
      try {
        const parsedLog = cardContract.interface.parseLog(log)
        
        if (parsedLog?.name === "PackOpened") {
          cardIds = parsedLog.args[2].map((id: any) => Number(id))
          console.log("🎴 Extracted card IDs:", cardIds)
        }
      } catch (e) {
        console.log(`⚠️ Could not parse log ${index + 1}:`, log)
      }
    })

    if (cardIds.length === 0) {
      console.log("⚠️ No card IDs found in transaction logs!")
    }

    const cardData = await fetchCardData(cardIds)
    setExtractedCards(cardData)
    await fetchPackCount()
    
  } catch (error: any) {
    console.log("❌ Pack opening failed!")
    console.error("Error details:", error)
    
    if (error.code === "ACTION_REJECTED") {
      console.log("🚫 User rejected the transaction")
    } else if (error.message?.includes("insufficient funds")) {
      console.log("💸 Insufficient funds")
    } else if (error.message?.includes("gas")) {
      console.log("⛽ Gas-related error")
    }
    
    throw error
  }
}

  const handleOpenPack = () => {
    if (!isConnected) {
      open()
      return
    }
    if (packCount === 0) return
    
    setExtractedCards([]) // Reset cards
    setShowModal(true)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 pt-20 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Open Bead157 Pack</h1>
          <p className="text-xl text-gray-300">Open your packs to reveal rare collectible cards</p>
        </div>

        {/* Main Content */}
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 text-center">
          {/* Pack Count */}
          <div className="mb-8">
            <p className="text-gray-400 mb-2">Packs Available</p>
            <p className="text-5xl font-bold text-white">{packCount}</p>
          </div>

          {/* Open Pack Button */}
        <Button
          onClick={handleOpenPack}
          disabled={!isConnected || packCount === 0}
          className={`
            w-64 mx-auto py-3 text-base font-semibold
            ${packCount > 0 && isConnected
              ? "bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white"
              : "bg-gray-600 text-gray-400 cursor-not-allowed"
            }
          `}
        >
          {!isConnected ? "Connect Wallet" : packCount === 0 ? "No Packs Available" : "Open Pack"}
        </Button>

          {/* Info */}
          <div className="mt-6 text-sm text-gray-400 space-y-1">
            <p>• Each pack contains 5 random cards</p>
            <p>• Cards are revealed after opening</p>
            <p>• Gas fees apply for opening packs</p>
          </div>
        </div>

        {/* Transaction Modal */}
        <TransactionModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title="Open Bead157 Pack"
          initText="Confirm transaction to open 1 pack"
          completedText="Pack opened successfully! Here are your cards:"
          initImage="/images/pack.png"
          completedImage=""
          onConfirm={executeOpenPack}
          extractedCards={extractedCards}
        />
      </div>
    </div>
  )
}