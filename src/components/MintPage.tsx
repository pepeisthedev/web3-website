"use client"

import { useState, useEffect } from "react"
import { useAppKit, useAppKitAccount, useAppKitProvider } from "@reown/appkit/react"
import { ethers } from "ethers"
import { Button } from "./ui/button"
import { Minus, Plus } from "lucide-react"
import TransactionModal from "./TransactionModal"
import packContractAbi from "../assets/abi/Bead151Pack.json"

const packContractAddress = import.meta.env.VITE_BEAD151_CARD_PACK_CONTRACT

export default function MintPage() {
    const { open } = useAppKit()
    const { isConnected } = useAppKitAccount()
    const { walletProvider } = useAppKitProvider("eip155")

    const [packPrice, setPackPrice] = useState<string>("0")
    const [quantity, setQuantity] = useState<number>(1)
    const [isLoading, setIsLoading] = useState<boolean>(false)
    const [showModal, setShowModal] = useState<boolean>(false)
    const [freeMints, setFreeMints] = useState<number>(0)

    // Fetch pack price from contract
    useEffect(() => {
        fetchPackPrice()
        if (isConnected) {
            fetchFreeMints()
        }
    }, [isConnected])

    const fetchPackPrice = async () => {
        try {
            if (!walletProvider) return
            const ethersProvider = new ethers.BrowserProvider(walletProvider as ethers.Eip1193Provider)
            const contract = new ethers.Contract(packContractAddress, packContractAbi, ethersProvider)

            const price = await contract.packPrice()
            //console.log("Pack price fetched:", price.toString())
            setPackPrice(ethers.formatEther(price))
        } catch (error) {
            console.error("Error fetching pack price:", error)
            // Fallback price for demo
            setPackPrice("0.0441")
        }
    }

    const fetchFreeMints = async () => {
        try {
            if (!walletProvider) return
            const ethersProvider = new ethers.BrowserProvider(walletProvider as ethers.Eip1193Provider)
            const signer = await ethersProvider.getSigner()
            const address = await signer.getAddress()
            const contract = new ethers.Contract(packContractAddress, packContractAbi, ethersProvider)

            const freeMintsAvailable = await contract.getFreeMints(address)
            console.log("Free mints fetched:", freeMintsAvailable.toString())
            setFreeMints(Number(freeMintsAvailable))
        } catch (error) {
            console.error("Error fetching free mints:", error)
            setFreeMints(0)
        }
    }

    const calculateTotalCost = (): string => {
        const paidPacks = Math.max(0, quantity - freeMints)
        const total = Number.parseFloat(packPrice) * paidPacks
        return total.toFixed(4)
    }

    const getPackBreakdown = () => {
        const freePacks = Math.min(quantity, freeMints)
        const paidPacks = Math.max(0, quantity - freeMints)
        return { freePacks, paidPacks }
    }

    const handleQuantityChange = (newQuantity: number) => {
        if (newQuantity >= 1 && newQuantity <= 10) {
            setQuantity(newQuantity)
        }
    }

    const handleMint = async () => {
        if (!isConnected) {
            open()
            return
        }
        setShowModal(true)
    }

    
    const executeMint = async () => {
        try {
            if (!walletProvider) {
                throw new Error("No wallet provider available")
            }
    
            const ethersProvider = new ethers.BrowserProvider(walletProvider as ethers.Eip1193Provider)
            const signer = await ethersProvider.getSigner()
            const contract = new ethers.Contract(packContractAddress, packContractAbi, signer)
    
            const totalCost = ethers.parseEther(calculateTotalCost())
    
            console.log(`Minting ${quantity} packs for ${calculateTotalCost()} ETH`)
            const tx = await contract.mintPack(quantity, {
                value: totalCost,
                gasLimit: 300000 * quantity,
            })
    
            await tx.wait()
            console.log("🎉 Transaction confirmed!")
            
            // Refresh free mints count after transaction
            await fetchFreeMints()
        
        } catch (error: any) {
            // Handle different types of errors
            let errorMessage = "Transaction failed. Please try again."
      
            if (error.code === "ACTION_REJECTED") {
                errorMessage = "Transaction was rejected by user."
            } else if (error.message?.includes("insufficient funds")) {
                errorMessage = "Insufficient funds to complete transaction."
            } else if (error.message?.includes("gas")) {
                errorMessage = "Transaction failed due to gas issues."
            } else if (error.reason) {
                errorMessage = error.reason
            }
            
            console.error("Mint error:", error)
            throw new Error(errorMessage)
        }
    }
    

    return (
        <div className="min-h-screen bg-gradient-to-b from-teal-900 via-cyan-800 to-teal-900 px-4 font-mono pt-20 xl:pt-40">
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="text-center mb-6">
                    <h1 className="text-3xl md:text-4xl font-bold text-yellow-300 mb-2 font-mono tracking-wider">MINT BEAD151 PACK</h1>
                    <p className="text-lg text-cyan-300 font-mono">MINT PACKS TO DISCOVER RARE COLLECTIBLES</p>
                </div>

                {/* Main Content */}
                <div className="bg-teal-800 border-4 border-yellow-300 p-4 md:p-6">
                    <div className="grid md:grid-cols-2 gap-6 items-center">
                        {/* Image */}
                        <div className="text-center">
                            <div className="bg-gray-600 border-4 border-gray-400 p-3 inline-block">
                                <div className="bg-black border-2 border-gray-400 p-2">
                                    <img
                                        src="/images/pack.png?height=300&width=300"
                                        alt="Bead151 Pack"
                                        className="w-full max-w-xs mx-auto pixelated"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Mint Controls */}
                        <div className="space-y-4">
                            {/* Price Info */}
                            <div className="text-center md:text-left bg-black border-2 border-gray-400 rounded p-3">
                                <p className="text-green-400 mb-1 font-mono text-xs">PRICE PER PACK:</p>
                                <p className="text-2xl font-bold text-yellow-300 font-mono">{packPrice} ETH</p>
                            </div>

                            {/* Free Mints Counter */}
                            {freeMints > 0 && (
                                <div className="text-center md:text-left bg-black border-2 border-green-400 rounded p-3">
                                    <p className="text-green-400 mb-1 font-mono text-xs">FREE MINTS AVAILABLE:</p>
                                    <p className="text-2xl font-bold text-green-300 font-mono">{freeMints.toString().padStart(2, '0')}</p>
                                </div>
                            )}

                            {/* Quantity Selector */}
                            <div>
                                <label className="block text-cyan-300 mb-2 font-bold text-left font-mono text-xs">QUANTITY (MAX 10):</label>
                                <div className="flex items-center justify-center md:justify-start space-x-3">
                                    <Button
                                        onClick={() => handleQuantityChange(quantity - 1)}
                                        disabled={quantity <= 1}
                                        className="bg-gray-600 border-2 border-gray-400 text-white hover:bg-gray-700 disabled:opacity-50 font-mono p-2"
                                    >
                                        <Minus className="h-4 w-4" />
                                    </Button>

                                    <div className="bg-black border-2 border-yellow-300 rounded px-4 py-2 min-w-[60px] text-center">
                                        <span className="text-xl font-bold text-green-400 font-mono">{quantity.toString().padStart(2, '0')}</span>
                                    </div>

                                    <Button
                                        onClick={() => handleQuantityChange(quantity + 1)}
                                        disabled={quantity >= 10}
                                        className="bg-gray-600 border-2 border-gray-400 text-white hover:bg-gray-700 disabled:opacity-50 font-mono p-2"
                                    >
                                        <Plus className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>

                            {/* Total Cost */}
                            <div className="bg-black border-2 border-gray-400 rounded p-3 space-y-1">
                                {(() => {
                                    const { freePacks, paidPacks } = getPackBreakdown()
                                    return (
                                        <>
                                            {freePacks > 0 && (
                                                <div className="flex justify-between items-center">
                                                    <span className="text-green-400 font-mono font-bold text-sm">FREE PACKS:</span>
                                                    <span className="text-base font-bold text-green-300 font-mono">{freePacks}</span>
                                                </div>
                                            )}
                                            {paidPacks > 0 && (
                                                <div className="flex justify-between items-center">
                                                    <span className="text-green-400 font-mono font-bold text-sm">PAID PACKS:</span>
                                                    <span className="text-base font-bold text-yellow-300 font-mono">{paidPacks}</span>
                                                </div>
                                            )}
                                            <div className="border-t border-gray-400 pt-1">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-green-400 font-mono font-bold text-sm">TOTAL COST:</span>
                                                    <span className="text-xl font-bold text-yellow-300 font-mono">{calculateTotalCost()} ETH</span>
                                                </div>
                                            </div>
                                        </>
                                    )
                                })()}
                            </div>

                            {/* Mint Button */}
                            <Button
                                onClick={handleMint}
                                disabled={isLoading}
                                className="w-full bg-red-600 hover:bg-red-700 border-4 border-red-400 text-white py-3 text-base font-bold font-mono"
                            >
                                {isConnected ? `MINT ${quantity} PACK${quantity > 1 ? "S" : ""}` : "CONNECT WALLET"}
                            </Button>

                            {/* Additional Info */}
                            <div className="bg-black border-2 border-gray-400 rounded p-3">
                                <div className="text-xs text-green-400 font-mono space-y-0.5 text-left">
                                    <p className="pl-2 -indent-2">* EACH PACK CONTAINS RANDOM COLLECTIBLES</p>
                                    <p className="pl-2 -indent-2">* MAXIMUM 10 PACKS PER TRANSACTION</p>
                                    <p className="pl-2 -indent-2">* GAS FEES APPLY IN ADDITION TO PACK PRICE</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <TransactionModal
                    isOpen={showModal}
                    onClose={() => setShowModal(false)}
                    title="Mint Bead151 Pack"
                    initText={`Confirm transaction to mint ${quantity} pack${quantity > 1 ? "s" : ""} for a total of ${calculateTotalCost()} ETH`}
                    completedText={`Transaction confirmed! You minted ${quantity} pack${quantity > 1 ? "s" : ""}`}
                    initImage="/images/pack.png"
                    completedImage="/images/pack.png"
                    onConfirm={executeMint}
                />
            </div>

            <style>{`
                @font-face {
                    font-family: 'PokemonGB';
                    src: url('/fonts/PokemonGb-RAeo.ttf') format('truetype');
                }
                
                .font-mono {
                    font-family: 'PokemonGB', monospace;
                }

                .pixelated {
                    image-rendering: pixelated;
                    image-rendering: -moz-crisp-edges;
                    image-rendering: crisp-edges;
                }
            `}</style>
        </div>
    )
}
