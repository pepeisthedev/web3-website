"use client"

import { useState, useEffect } from "react"
import { useAppKit, useAppKitAccount, useAppKitProvider } from "@reown/appkit/react"
import { ethers } from "ethers"
import { Button } from "./ui/button"
import { Sparkles, Star, Zap } from "lucide-react"
import OpenPackTransactionModal from "./OpenPackTransactionModal"
import packContractAbi from "../assets/abi/Bead151Pack.json"
import cardContractAbi from "../assets/abi/Bead151Card.json"
import cardArtSvgRouterContractABI from "../assets/abi/Bead151ArtRouter.json"

const packsContractAddress = import.meta.env.VITE_BEAD151_CARD_PACK_CONTRACT
const svgContractAddress = import.meta.env.VITE_BEAD151_CARD_ART_CONTRACT
const cardContractAddress = import.meta.env.VITE_BEAD151_CARD_CONTRACT

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

    const fetchCardData = async (cardIds: number[]): Promise<CardData[]> => {
        if (!walletProvider) return []

        const ethersProvider = new ethers.BrowserProvider(walletProvider as ethers.Eip1193Provider)
        const svgContract = new ethers.Contract(svgContractAddress, cardArtSvgRouterContractABI, ethersProvider)
        try {
            // Fetch all SVGs and metadata in a single call
            const [svgs, metadataArray] = await svgContract.renderAndMetaBatch(cardIds)

            // Map the results back to CardData format
            return cardIds.map((cardId, index) => ({
                svg: svgs[index] || "",
                description: metadataArray[index] || `Card #${cardId}`,
            }))
        } catch (error) {
            console.error('Error fetching batch card data:', error)

            // Fallback to individual calls if batch fails
            const cardDataPromises = cardIds.map(async (cardId) => {
                try {
                    const [svg, meta] = await Promise.all([
                        svgContract.render(cardId),
                        svgContract.meta(cardId)
                    ])
                    return { svg, description: meta }
                } catch (error) {
                    console.error(`Error fetching card ${cardId}:`, error)
                    return { svg: "", description: `Card #${cardId}` }
                }
            })

            return Promise.all(cardDataPromises)
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

        const tx = await packContract.openPack({
            gasLimit: 500000,
        })

        const receipt = await tx.wait()

        // Parse events to get card IDs
        let cardIds: number[] = []
        receipt.logs.forEach((log: any) => {
            try {
                const parsedLog = cardContract.interface.parseLog(log)
                if (parsedLog?.name === "PackOpened") {
                    cardIds = parsedLog.args[2].map((id: any) => Number(id))
                }
            } catch (e) {
                console.log("Unparsed log:", log)
            }
        })

        const cardData = await fetchCardData(cardIds)
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
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 pt-20 px-4 relative overflow-hidden">
            {/* Animated Background Elements */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
                <div
                    className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse"
                    style={{ animationDelay: "1s" }}
                />
                <div
                    className="absolute top-1/2 left-1/2 w-64 h-64 bg-pink-500/10 rounded-full blur-3xl animate-pulse"
                    style={{ animationDelay: "2s" }}
                />
            </div>

            {/* Floating Particles */}
            <div className="absolute inset-0 pointer-events-none">
                {[...Array(20)].map((_, i) => (
                    <div
                        key={i}
                        className="absolute animate-float"
                        style={{
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                            animationDelay: `${Math.random() * 3}s`,
                            animationDuration: `${3 + Math.random() * 2}s`,
                        }}
                    >
                        <Star className="w-4 h-4 text-yellow-400/30" />
                    </div>
                ))}
            </div>

            <div className="max-w-4xl mx-auto relative z-10">
                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 animate-pulse">✨ Pack Opening Chamber ✨</h1>
                    <p className="text-xl text-gray-300">Discover legendary cards hidden within Bead151 packs</p>
                </div>

                {/* Main Content */}
                <div className="grid md:grid-cols-2 gap-8 items-center">
                    {/* Pack Display */}
                    <div className="text-center">
                        <div className="relative inline-block">
                            {/* Pack Image Container */}
                            <div
                                className={`relative transition-all duration-500 ${isHovering ? "scale-110" : "scale-100"}`}
                                onMouseEnter={() => setIsHovering(true)}
                                onMouseLeave={() => setIsHovering(false)}
                            >
                                {/* Glow Effects */}
                                <div
                                    className={`absolute inset-0 rounded-2xl transition-all duration-1000 ${packGlow ? "bg-gradient-to-r from-yellow-400/30 to-orange-500/30 blur-xl scale-110" : "bg-gradient-to-r from-blue-400/20 to-purple-500/20 blur-lg scale-105"}`}
                                />

                                {/* Pack Image */}
                                <div className="relative bg-gradient-to-br from-amber-400 via-orange-500 to-red-600 p-8 rounded-2xl border-4 border-yellow-400/50 shadow-2xl">
                                    <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-2xl" />

                                    {/* Pack Art */}
                                    <div className="relative z-10">
                                        <div className="w-48 h-64 mx-auto bg-gradient-to-br from-yellow-200 to-orange-300 rounded-xl border-2 border-yellow-500 flex items-center justify-center shadow-inner overflow-hidden">
                                            <img
                                                src="/images/pack.png"
                                                alt="Bead151 Pack"
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                    </div>

                                    {/* Sparkle Effects */}
                                    {isHovering && (
                                        <div className="absolute inset-0 pointer-events-none">
                                            {[...Array(8)].map((_, i) => (
                                                <div
                                                    key={i}
                                                    className="absolute animate-ping"
                                                    style={{
                                                        left: `${20 + Math.random() * 60}%`,
                                                        top: `${20 + Math.random() * 60}%`,
                                                        animationDelay: `${Math.random() * 2}s`,
                                                    }}
                                                >
                                                    <Sparkles className="w-6 h-6 text-yellow-300" />
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Pack Count Badge */}
                            <div className="absolute -top-4 -right-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full w-16 h-16 flex items-center justify-center border-4 border-white shadow-lg animate-bounce">
                                <div className="text-center">
                                    <div className="text-2xl font-bold">{packCount}</div>
                                    <div className="text-xs">PACKS</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Controls */}
                    <div className="space-y-8">
                        {/* Pack Info */}
                        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6">

                            <div className="space-y-3 text-gray-300">
                                <div className="font-bold flex justify-between">
                                    <span>Available Packs:</span>
                                    <span className="font-bold text-yellow-400 ">{packCount}</span>
                                </div>
                                <div className="font-bold flex justify-between">
                                    <span>Cards per Pack:</span>
                                    <span className="font-bold text-yellow-400 mb-5">5 Random Cards</span>
                                </div>

                            </div>
                            <div className="text-center">
                                <Button
                                    onClick={handleOpenPack}
                                    disabled={!isConnected || packCount === 0}
                                    className={`
                  relative w-full py-4 text-lg font-bold rounded-2xl transition-all duration-300
                  ${packCount > 0 && isConnected
                                            ? "bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 hover:from-yellow-400 hover:via-orange-400 hover:to-red-400 text-white shadow-2xl hover:shadow-yellow-500/25 hover:scale-105 animate-pulse"
                                            : "bg-gray-600 text-gray-400 cursor-not-allowed"
                                        }
                `}
                                >
                                    {!isConnected ? (
                                        "🔗 Connect Wallet"
                                    ) : packCount === 0 ? (
                                        "📦 No Packs Available"
                                    ) : (
                                        <span className="flex items-center justify-center">
                                            <Sparkles className="w-4 h-4 mr-2 animate-spin" />OPEN Bead151 PACK
                                            <Sparkles className="w-4 h-4 ml-2 animate-spin" />
                                        </span>
                                    )}
                                </Button>

                            </div>
                        </div>

                        {/* Open Pack Button */}


                        {/* Pack Opening Tips */}
                        <div className="bg-gradient-to-r from-purple-900/50 to-blue-900/50 backdrop-blur-sm border border-purple-500/30 rounded-2xl p-6 mb-4">
                            <h4 className="text-lg font-bold text-white mb-3 flex items-center">
                                <Star className="w-5 h-5 mr-2 text-yellow-400" />
                                Pack Information
                            </h4>
                            <div className="space-y-2 text-sm text-gray-300 text-left">
                                <p>🌟 Each pack contains 5 random cards</p>
                                <p>⚡ Gas fees required for blockchain transaction</p>
                                <p>🎯 Cards are randomly generated on-chain</p>
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
