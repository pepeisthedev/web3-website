"use client"

import { useState, useEffect } from "react"
import { useAppKit, useAppKitAccount, useAppKitProvider } from "@reown/appkit/react"
import { ethers } from "ethers"
import { Button } from "./ui/button"
import OpenPackTransactionModal from "./OpenPackTransactionModal"
import packContractAbi from "../assets/abi/Bead151Pack.json"
import cardContractAbi from "../assets/abi/Bead151Card.json"

const packsContractAddress = import.meta.env.VITE_BEAD151_CARD_PACK_CONTRACT
const cardContractAddress = import.meta.env.VITE_BEAD151_CARD_CONTRACT

interface CardData {
    metadata: string
}

export default function OpenPackPage() {
    const { open } = useAppKit()
    const { isConnected, address } = useAppKitAccount()
    const { walletProvider } = useAppKitProvider("eip155")

    const [packCount, setPackCount] = useState<number>(0)
    const [showModal, setShowModal] = useState<boolean>(false)
    const [extractedCards, setExtractedCards] = useState<CardData[]|undefined>([])
    const [isHovering, setIsHovering] = useState<boolean>(false)
    const [packGlow, setPackGlow] = useState<boolean>(false)

    useEffect(() => {
        if (isConnected && address) {
            fetchPackCount()
        }
    }, [isConnected, address])

    // Pack glow effect
    useEffect(() => {
        const interval = setInterval(() => {
            setPackGlow((prev) => !prev)
        }, 2000)
        return () => clearInterval(interval)
    }, [])

    const fetchPackCount = async () => {
        try {
            if (!walletProvider || !address) return

            const ethersProvider = new ethers.BrowserProvider(walletProvider as ethers.Eip1193Provider)
            const contract = new ethers.Contract(packsContractAddress, packContractAbi, ethersProvider)

            const balance = await contract.balanceOf(address, 1)
            setPackCount(Number(balance))
        } catch (error) {
            console.error("Error fetching pack count:", error)
        }
    }

    // Helper to decode base64 data:application/json;base64,...
    function decodeBase64Json(dataUri: string): string {
        if (!dataUri.startsWith('data:application/json;base64,')) return dataUri
        try {
            const base64 = dataUri.replace('data:application/json;base64,', '')
            const json = atob(base64)
            return json
        } catch (e) {
            return dataUri
        }
    }

    const fetchCardData = async (tokenIds: number[], cardIds: number[]): Promise<CardData[] | undefined> => {
        if (!walletProvider) return

        const ethersProvider = new ethers.BrowserProvider(walletProvider as ethers.Eip1193Provider)
        const cardContract = new ethers.Contract(cardContractAddress, cardContractAbi, ethersProvider)
        try {
            // Fetch all SVGs and metadata in a single call
            //console.log("Fetching card data for tokenIds:", tokenIds)
            const metadataArray = await cardContract.tokenURIs(tokenIds)
           // console.log("Fetched metadata:", metadataArray[0])

            // Map the results back to CardData format, decoding base64 JSON if needed
            return metadataArray.map((item: string) => ({
                metadata: decodeBase64Json(item),
            }))
        } catch (error) {
            console.error('Error fetching batch card data:', error)
        }
    }

    const executeOpenPack = async () => {
        if (!walletProvider) {
            throw new Error("No wallet provider available")
        }

        const ethersProvider = new ethers.BrowserProvider(walletProvider as ethers.Eip1193Provider)
        const signer = await ethersProvider.getSigner()
        const packContract = new ethers.Contract(packsContractAddress, packContractAbi, signer)
        const cardContract = new ethers.Contract(cardContractAddress, cardContractAbi, signer)

        const tx = await packContract.openPack()

        const receipt = await tx.wait()

        // Parse events to get card IDs
        let tokenIds: number[] = []
        let cardIds: number[] = []
        receipt.logs.forEach((log: any) => {
            try {
                const parsedLog = cardContract.interface.parseLog(log)
                if (parsedLog?.name === "PackOpened") {
                    tokenIds = parsedLog.args[1].map((id: any) => Number(id))
                    cardIds = parsedLog.args[2].map((id: any) => Number(id))
                }
            } catch (e) {
                console.log("Unparsed log:", log)
            }
        })

        const cardData = await fetchCardData(tokenIds, cardIds)
        setExtractedCards(cardData)
        await fetchPackCount()
    }

    const handleOpenPack = () => {
        if (!isConnected) {
            open()
            return
        }
        if (packCount === 0) return

        setExtractedCards([])
        setShowModal(true)
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-teal-900 via-cyan-800 to-teal-900 pt-20 xl:pt-30 px-4">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl md:text-5xl font-bold text-yellow-300 mb-4 font-mono tracking-wider">
                        BEAD151 PACK OPENER
                    </h1>
                    <p className="text-xl text-cyan-300 font-mono">Open Packs to Collect Cards</p>
                </div>

                {/* Main Content */}
                <div className="bg-teal-800 border-4 border-yellow-300 rounded-lg p-6 mb-8">
                    <div className="grid md:grid-cols-2 gap-8 items-center">
                        {/* Pack Display */}
                        <div className="text-center">
                            <div className="relative inline-block">
                                {/* Pack Image Container */}
                                <div
                                    className={`relative transition-all duration-300 ${isHovering ? "scale-105" : "scale-100"}`}
                                    onMouseEnter={() => setIsHovering(true)}
                                    onMouseLeave={() => setIsHovering(false)}
                                >
                                    {/* Pack Image */}
                                    <div className="relative bg-gray-600 border-4 border-gray-400 rounded-lg p-4 shadow-lg">
                                        <div className="w-48 h-64 mx-auto bg-black border-2 border-gray-400 rounded flex items-center justify-center overflow-hidden">
                                            <img
                                                src="/images/pack.png"
                                                alt="Bead151 Pack"
                                                className="w-full h-full object-cover pixelated"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Pack Count Badge */}
                                <div className="absolute -top-2 -right-2 bg-black border-2 border-yellow-300 text-green-400 rounded w-18 h-18 flex items-center justify-center font-mono">
                                    <div className="text-center">
                                        <div className="text-lg font-bold">{packCount.toString().padStart(2, '0')}</div>
                                        <div className="text-xs">PACKS</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Controls */}
                        <div className="space-y-6">
                            {/* Pack Info */}
                            <div className="bg-black border-2 border-gray-400 rounded p-4">
                                <div className="space-y-3 text-green-400 font-mono">
                                    <div className="flex justify-between text-sm">
                                        <span>AVAILABLE PACKS:</span>
                                        <span className="text-yellow-300">{packCount.toString().padStart(3, '0')}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span>CARDS PER PACK:</span>
                                        <span className="text-yellow-300">005</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span>PACK TYPE:</span>
                                        <span className="text-yellow-300">RANDOM</span>
                                    </div>
                                </div>
                            </div>

                            {/* Open Pack Button */}
                            <div className="text-center">
                                <Button
                                    onClick={handleOpenPack}
                                    disabled={!isConnected || packCount === 0}
                                    className={`
                                        w-full py-4 text-sm sm:text-lg font-bold font-mono border-4 rounded transition-all duration-300
                                        ${packCount > 0 && isConnected
                                            ? 'bg-red-600 hover:bg-red-700 border-red-400 text-white'
                                            : 'bg-gray-600 border-gray-400 text-gray-300 cursor-not-allowed'
                                        }
                                    `}
                                >
                                    {!isConnected ? (
                                        <span className="block sm:hidden">CONNECT</span>
                                    ) : packCount === 0 ? (
                                        <span>
                                            <span className="block sm:hidden">NO PACKS</span>
                                            <span className="hidden sm:block">NO PACKS AVAILABLE</span>
                                        </span>
                                    ) : (
                                        "OPEN PACK"
                                    )}
                                    {!isConnected && (
                                        <span className="hidden sm:block">CONNECT WALLET</span>
                                    )}
                                </Button>
                            </div>

                            {/* Pack Opening Info */}
                            <div className="bg-black border-2 border-gray-400 rounded p-4">
                                <h4 className="text-yellow-300 font-mono font-bold text-sm mb-3 text-center">
                                    PACK INFORMATION
                                </h4>
                                <div className="space-y-2 text-xs text-green-400 font-mono text-left">
                                    <p className="pl-3 -indent-3">* EACH PACK CONTAINS 5 CARDS</p>
                                    <p className="pl-3 -indent-3">* CARDS ARE RANDOMLY GENERATED</p>
                                    <p className="pl-3 -indent-3">* TRANSACTION FEE REQUIRED</p>
                                    <p className="pl-3 -indent-3">* CARDS ADDED TO COLLECTION</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Transaction Modal */}
                <OpenPackTransactionModal
                    isOpen={showModal}
                    onClose={() => setShowModal(false)}
                    title="Open Bead151 Pack"
                    initText="Confirm transaction to open a pack"
                    completedText="Pack opened successfully! Here are your cards:"
                    initImage="/images/pack.png"
                    onConfirm={executeOpenPack}
                    extractedCards={extractedCards}
                    {...(packCount >= 1 && { onOpenAnother: executeOpenPack })}
                />
            </div>

            <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(180deg); }
        }
        
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }


      `}</style>
        </div>
    )
}
