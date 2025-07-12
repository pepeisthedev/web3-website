"use client"

import { useState, useEffect } from "react"
import { useAppKit, useAppKitAccount, useAppKitProvider } from "@reown/appkit/react"
import { ethers } from "ethers"
import { Button } from "./ui/button"
import { Minus, Plus } from "lucide-react"
import TransactionModal from "./TransactionModal"
import packContractAbi from "../assets/abi/Bead157Pack.json"

const packContractAddress = import.meta.env.VITE_BEAD157_CARD_PACK_CONTRACT

export default function MintPage() {
    const { open } = useAppKit()
    const { isConnected } = useAppKitAccount()
    const { walletProvider } = useAppKitProvider("eip155")

    const [packPrice, setPackPrice] = useState<string>("0")
    const [quantity, setQuantity] = useState<number>(1)
    const [isLoading, setIsLoading] = useState<boolean>(false)
    const [showModal, setShowModal] = useState<boolean>(false)

    // Fetch pack price from contract
    useEffect(() => {
        fetchPackPrice()
    }, [])

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

    const calculateTotalCost = (): string => {
        const total = Number.parseFloat(packPrice) * quantity
        return total.toFixed(4)
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
    
            const tx = await contract.mintPack(quantity, {
                value: totalCost,
                gasLimit: 300000,
            })
    
           const receipt =  await tx.wait()

        console.log("🎉 Transaction confirmed!")
        console.log("Block number:", receipt.blockNumber)
        console.log("Gas used:", receipt.gasUsed.toString())
        console.log("Transaction receipt:", receipt)
        
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
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 pt-20 px-4">
            <div className="max-w-2xl mx-auto">
                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Mint Bead157 Pack</h1>
                    <p className="text-xl text-gray-300">Mint one or more packs to discover rare collectibles</p>
                </div>

                {/* Main Content */}
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
                    <div className="grid md:grid-cols-2 gap-8 items-center">
                        {/* Image */}
                        <div className="text-center">
                            <img
                                src="/images/pack.png?height=300&width=300"
                                alt="Bead157 Pack"
                                className="w-full max-w-sm mx-auto rounded-lg shadow-2xl"
                            />
                        </div>

                        {/* Mint Controls */}
                        <div className="space-y-6">
                            {/* Price Info */}
                            <div className="text-center md:text-left">
                                <p className="text-gray-400 mb-2">Price per pack</p>
                                <p className="text-3xl font-bold text-white">{packPrice} ETH</p>
                            </div>

                            {/* Quantity Selector */}
                            <div>
                                <label className="block text-gray-300 mb-3 font-medium text-left">Quantity (Max 10)</label>
                                <div className="flex items-center justify-center md:justify-start space-x-4">
                                    <Button
                                        onClick={() => handleQuantityChange(quantity - 1)}
                                        disabled={quantity <= 1}
                                        variant="outline"
                                        size="icon"
                                        className="border-gray-600 text-white hover:bg-gray-800 bg-transparent disabled:opacity-50"
                                    >
                                        <Minus className="h-4 w-4" />
                                    </Button>

                                    <div className="bg-white/10 border border-white/20 rounded-lg px-6 py-3 min-w-[80px] text-center">
                                        <span className="text-2xl font-bold text-white">{quantity}</span>
                                    </div>

                                    <Button
                                        onClick={() => handleQuantityChange(quantity + 1)}
                                        disabled={quantity >= 10}
                                        variant="outline"
                                        size="icon"
                                        className="border-gray-600 text-white hover:bg-gray-800 bg-transparent disabled:opacity-50"
                                    >
                                        <Plus className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>

                            {/* Total Cost */}
                            <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-300">Total Cost:</span>
                                    <span className="text-2xl font-bold text-white">{calculateTotalCost()} ETH</span>
                                </div>
                            </div>

                            {/* Mint Button */}
                            <Button
                                onClick={handleMint}
                                disabled={isLoading}
                                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-4 text-lg font-semibold"
                            >
                                {isConnected ? `Mint ${quantity} Pack${quantity > 1 ? "s" : ""}` : "Connect Wallet"}
                            </Button>

                            {/* Additional Info */}
                            <div className="text-center text-sm text-gray-400 space-y-1">
                                <p>• Each pack contains random collectibles</p>
                                <p>• Maximum 10 packs per transaction</p>
                                <p>• Gas fees apply in addition to pack price</p>
                            </div>
                        </div>
                    </div>
                </div>

                <TransactionModal
                    isOpen={showModal}
                    onClose={() => setShowModal(false)}
                    title="Mint Bead157 Pack"
                    initText={`Confirm transaction to mint ${quantity} pack${quantity > 1 ? "s" : ""} for a total of ${calculateTotalCost()} ETH`}
                    completedText={`Transaction confirmed! You minted ${quantity} pack${quantity > 1 ? "s" : ""}`}
                    initImage="/images/pack.png"
                    completedImage="/images/pack.png"
                    onConfirm={executeMint}
                />
            </div>
        </div>
    )
}
