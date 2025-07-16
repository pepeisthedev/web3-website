"use client"

import { useState, useEffect, useRef } from "react"
import { useAppKitAccount, useAppKitProvider } from "@reown/appkit/react"
import { ethers } from "ethers"
import { Button } from "./ui/button"
import { Loader2, Timer, Sparkles } from "lucide-react"

// Contract addresses and ABIs
import eggContractABI from "../assets/abi/Bead151Egg.json"

const eggContractAddress = import.meta.env.VITE_BEAD151_EGG_CONTRACT

interface EggData {
    tokenId: number
    amount: number
    incubating: boolean
    hatchable: boolean
    timeLeft: number
    metadata?: {
        name: string
        description: string
        image: string
        attributes: Array<{
            trait_type: string
            value: any
        }>
    }
}

export default function Eggs() {
    const { address, isConnected } = useAppKitAccount()
    const { walletProvider } = useAppKitProvider("eip155")

    const [eggs, setEggs] = useState<EggData[]>([])
    const [selectedEgg, setSelectedEgg] = useState<EggData | null>(null)
    const [hatchableEgg, setHatchableEgg] = useState<EggData | null>(null)
    const [isLoading, setIsLoading] = useState<boolean>(false)
    const [isIncubating, setIsIncubating] = useState<boolean>(false)
    const [timeToHatch, setTimeToHatch] = useState<number>(0)
    const [showHatchModal, setShowHatchModal] = useState<boolean>(false)
    const [showIncubateModal, setShowIncubateModal] = useState<boolean>(false)
    const [dotCount, setDotCount] = useState<number>(0)
    const [incubationPeriod, setIncubationPeriod] = useState<number>(86400) // Default 24 hours
    
    const timerRef = useRef<NodeJS.Timeout | null>(null)
    const dotTimerRef = useRef<NodeJS.Timeout | null>(null)

    useEffect(() => {
        if (isConnected && address) {
            fetchUserEggs()
        }
    }, [isConnected, address])

    useEffect(() => {
        // Start timer if any egg is incubating
        const incubatingEgg = eggs.find(egg => egg.incubating)
        if (incubatingEgg && incubatingEgg.timeLeft > 0) {
            setIsIncubating(true)
            setTimeToHatch(incubatingEgg.timeLeft)
            startTimer()
            startDotAnimation()
        } else {
            setIsIncubating(false)
            setTimeToHatch(0)
            if (timerRef.current) {
                clearInterval(timerRef.current)
            }
            if (dotTimerRef.current) {
                clearInterval(dotTimerRef.current)
            }
        }

        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current)
            }
            if (dotTimerRef.current) {
                clearInterval(dotTimerRef.current)
            }
        }
    }, [eggs])

    const startDotAnimation = () => {
        if (dotTimerRef.current) {
            clearInterval(dotTimerRef.current)
        }
        
        dotTimerRef.current = setInterval(() => {
            setDotCount(prev => (prev + 1) % 4) // Cycle from 0 to 3
        }, 500) // Change every 500ms
    }

    const startTimer = () => {
        if (timerRef.current) {
            clearInterval(timerRef.current)
        }
        
        timerRef.current = setInterval(() => {
            setTimeToHatch(prev => {
                if (prev <= 1) {
                    clearInterval(timerRef.current!)
                    fetchUserEggs() // Refresh to check if hatchable
                    return 0
                }
                return prev - 1
            })
        }, 1000)
    }

    const fetchUserEggs = async () => {
        if (!address || !walletProvider) return

        setIsLoading(true)
        try {
            const ethersProvider = new ethers.BrowserProvider(walletProvider as ethers.Eip1193Provider)
            const contract = new ethers.Contract(eggContractAddress, eggContractABI, ethersProvider)

            // Get incubation period from contract
            try {
                const period = await contract.incubationPeriod()
                setIncubationPeriod(Number(period))
                console.log("Incubation period:", Number(period))
            } catch (error) {
                console.error("Error fetching incubation period:", error)
            }

            // Get all egg URIs for the user
            const eggURIs = await contract.getAllEggURIs(address)
            console.log("Fetched egg URIs:", eggURIs)

            // Check if eggURIs is empty or not an array
            if (!eggURIs || !Array.isArray(eggURIs) || eggURIs.length === 0) {
                console.log("No eggs found for user")
                setEggs([])
                setIsLoading(false)
                return
            }

            // Extract token IDs and URIs from the result structure
            // eggURIs[0] contains token IDs, eggURIs[1] contains URI strings
            const tokenIds = eggURIs[0] || []
            const uriStrings = eggURIs[1] || []

            console.log("Token IDs:", tokenIds)
            console.log("URI Strings:", uriStrings)

            if (tokenIds.length === 0 || uriStrings.length === 0) {
                console.log("No token IDs or URIs found")
                setEggs([])
                setIsLoading(false)
                return
            }

            const eggPromises = tokenIds.map(async (tokenId: any, index: number) => {
                try {
                    const uri = uriStrings[index]
                    
                    // Check if uri is a string
                    if (typeof uri !== 'string') {
                        console.log(`URI at index ${index} is not a string:`, uri)
                        return null
                    }

                    // Parse the base64 encoded JSON from the URI
                    const base64Data = uri.split(',')[1] // Remove data:application/json;base64, prefix
                    const jsonString = atob(base64Data)
                    const metadata = JSON.parse(jsonString)

                    // Use the token ID from the contract result
                    const tokenIdNumber = Number(tokenId)

                    // Extract attributes
                    const isIncubating = metadata.attributes.find((attr: any) => attr.trait_type === "IsIncubating")?.value === "true"
                    const isHatchable = metadata.attributes.find((attr: any) => attr.trait_type === "Hatchable")?.value === "true"

                    // Get time remaining for incubating eggs (not just hatchable ones)
                    let timeLeft = 0
                    if (isIncubating) {
                        try {
                            timeLeft = Number(await contract.getTimeRemaining(tokenIdNumber))
                            console.log(`Time remaining for egg ${tokenIdNumber}:`, timeLeft)
                        } catch (error) {
                            console.error(`Error getting time remaining for egg ${tokenIdNumber}:`, error)
                        }
                    }

                    // Get balance for this token
                    const balance = await contract.balanceOf(address, tokenIdNumber)

                    return {
                        tokenId: tokenIdNumber,
                        amount: Number(balance),
                        incubating: isIncubating,
                        hatchable: isHatchable,
                        timeLeft,
                        metadata
                    }
                } catch (error) {
                    console.error(`Error parsing egg URI ${index}:`, error)
                    return null
                }
            })

            const eggsData = (await Promise.all(eggPromises)).filter(egg => egg !== null) as EggData[]
            setEggs(eggsData)

            // Find hatchable egg
            const hatchableEgg = eggsData.find(egg => egg.hatchable)
            if (hatchableEgg) {
                setHatchableEgg(hatchableEgg)
            }

        } catch (error) {
            console.error("Error fetching eggs:", error)
        }
        setIsLoading(false)
    }

    const handleIncubate = async () => {
        if (!selectedEgg || !walletProvider) return

        try {
            const ethersProvider = new ethers.BrowserProvider(walletProvider as ethers.Eip1193Provider)
            const signer = await ethersProvider.getSigner()
            const contract = new ethers.Contract(eggContractAddress, eggContractABI, signer)

            const tx = await contract.incubate(selectedEgg.tokenId)
            await tx.wait()

            // Refresh eggs and close modal
            await fetchUserEggs()
            setSelectedEgg(null)
            setShowIncubateModal(false)
        } catch (error) {
            console.error("Error incubating egg:", error)
        }
    }

    const handleHatch = async () => {
        if (!hatchableEgg || !walletProvider) return

        try {
            const ethersProvider = new ethers.BrowserProvider(walletProvider as ethers.Eip1193Provider)
            const signer = await ethersProvider.getSigner()
            const contract = new ethers.Contract(eggContractAddress, eggContractABI, signer)

            const tx = await contract.hatch(hatchableEgg.tokenId)
            await tx.wait()

            // Refresh eggs and close modal
            await fetchUserEggs()
            setShowHatchModal(false)
            setHatchableEgg(null)
        } catch (error) {
            console.error("Error hatching egg:", error)
        }
    }

    const formatTime = (seconds: number): string => {
        const days = Math.floor(seconds / 86400) // 86400 seconds in a day
        const hours = Math.floor((seconds % 86400) / 3600)
        const minutes = Math.floor((seconds % 3600) / 60)
        const secs = seconds % 60
        
        if (days > 0) {
            return `${days}d ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
        }
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }

    const canIncubate = !isIncubating && selectedEgg && !selectedEgg.incubating && !selectedEgg.hatchable

    if (!isConnected) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-green-900 via-green-800 to-green-900 pt-20 px-4">
                <div className="max-w-4xl mx-auto text-center">
                    <h1 className="text-4xl font-bold text-yellow-300 mb-8 font-mono">EGG INCUBATOR</h1>
                    <div className="bg-green-800 border-4 border-yellow-300 rounded-lg p-8">
                        <p className="text-yellow-300 text-xl font-mono">Connect your wallet to access the incubator</p>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-green-900 via-green-800 to-green-900 pt-20 px-4">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl md:text-5xl font-bold text-yellow-300 mb-4 font-mono tracking-wider">
                        EGG INCUBATOR
                    </h1>
                    <div className="text-green-300 font-mono text-lg">
                        ◄ PROFESSOR OAK'S LAB ►
                    </div>
                </div>

                {/* Incubator Section */}
                <div className="bg-green-800 border-4 border-yellow-300 rounded-lg p-6 mb-8">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                        {/* Incubator Image */}
                        <div className="flex-1 flex justify-center">
                            <div className="relative">
                                <img
                                    src={isIncubating ? "/images/IncubatorWithEgg.webp" : "/images/Incubator.png"}
                                    alt="Incubator"
                                    className="w-48 h-48 object-contain pixelated rounded-lg"
                                    style={{ imageRendering: 'pixelated' }}
                                />
                                {isIncubating && (
                                    <div className="absolute inset-0 bg-blue-400/20 rounded-full animate-pulse" />
                                )}
                            </div>
                        </div>

                        {/* Controls */}
                        <div className="flex-1 space-y-4">
                            {/* Timer */}
                            <div className="bg-black border-2 border-gray-400 rounded p-4">
                                <div className="text-green-400 font-mono text-center">
                                    <div className="text-sm mb-2">
                                        {isIncubating ? 'TIME TO HATCH' : 'INCUBATION TIME'}
                                    </div>
                                    <div className="text-2xl font-bold tracking-widest">
                                        {formatTime(isIncubating ? timeToHatch : incubationPeriod)}
                                    </div>
                                </div>
                            </div>

                            {/* Incubate Button */}
                            <Button
                                onClick={() => {
                                    if (selectedEgg && canIncubate) {
                                        setShowIncubateModal(true)
                                    }
                                }}
                                disabled={!canIncubate}
                                className={`w-full py-4 font-mono text-lg font-bold border-4 ${
                                    canIncubate
                                        ? 'bg-blue-600 hover:bg-blue-700 border-blue-400 text-white'
                                        : 'bg-gray-600 border-gray-400 text-gray-300 cursor-not-allowed'
                                }`}
                            >
                                {isIncubating ? 'INCUBATING...' : 'INCUBATE'}
                            </Button>

                        </div>
                    </div>
                </div>

                {/* Loading State */}
                {isLoading && (
                    <div className="text-center py-8">
                        <Loader2 className="h-8 w-8 text-yellow-300 animate-spin mx-auto mb-4" />
                        <p className="text-yellow-300 font-mono">Loading eggs...</p>
                    </div>
                )}

                {/* Eggs Grid */}
                {!isLoading && eggs.length > 0 && (
                    <div className="bg-green-800 border-4 border-yellow-300 rounded-lg p-6">
                        <h2 className="text-2xl font-bold text-yellow-300 mb-6 font-mono text-center">
                            YOUR EGGS
                        </h2>
                        
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {eggs.map((egg) => (
                                <div
                                    key={egg.tokenId}
                                    onClick={() => {
                                        if (egg.hatchable) {
                                            setHatchableEgg(egg)
                                            setShowHatchModal(true)
                                        } else {
                                            setSelectedEgg(egg)
                                        }
                                    }}
                                    className={`
                                        relative bg-green-700 border-2 rounded-lg p-4 cursor-pointer transition-all duration-300
                                        ${selectedEgg?.tokenId === egg.tokenId 
                                            ? 'border-yellow-300 bg-green-600' 
                                            : 'border-green-600 hover:border-yellow-400'
                                        }
                                        ${egg.hatchable 
                                            ? 'border-yellow-300 bg-yellow-900/30 animate-pulse shadow-lg shadow-yellow-300/50' 
                                            : ''
                                        }
                                    `}
                                >
                                    {/* Hatchable Glow Effect */}
                                    {egg.hatchable && (
                                        <div className="absolute inset-0 bg-yellow-300/20 rounded-lg animate-pulse" />
                                    )}

                              

                                    {/* Egg Image */}
                                    <div className="relative z-10">
                                        <img
                                            src={egg.metadata?.image || "/images/egg-default.png"}
                                            alt={egg.metadata?.name || `Egg #${egg.tokenId}`}
                                            className="w-full h-24 object-contain pixelated mb-2 rounded-lg"
                                            style={{ imageRendering: 'pixelated' }}
                                        />

                                        {/* Egg Info */}
                                        <div className="text-center">
                                            <h3 className="font-mono font-bold text-yellow-300 text-sm mb-1">
                                                {egg.metadata?.name || `EGG #${egg.tokenId}`}
                                            </h3>
                                            
                                            <div className="space-y-1 text-xs font-mono">
                                                {egg.hatchable ? (
                                                    <div className="text-yellow-300 font-bold animate-pulse">
                                                        ✨ CLICK TO HATCH!
                                                    </div>
                                                ) : (
                                                    <div className={`${egg.incubating ? 'text-blue-300' : 'text-gray-300'}`}>
                                                        {egg.incubating ? (
                                                            <span>
                                                                INCUBATING
                                                                <span className="inline-block w-6 text-left">
                                                                    {'.'.repeat(dotCount)}
                                                                </span>
                                                            </span>
                                                        ) : (
                                                            // Show "INCUBATION LOCKED" if any egg is incubating, otherwise "READY TO INCUBATE"
                                                            isIncubating ? 'INCUBATION LOCKED' : 'READY TO INCUBATE'
                                                        )}
                                                    </div>
                                                )}
                                                
                                              
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Empty State */}
                {!isLoading && eggs.length === 0 && (
                    <div className="text-center py-12">
                        <div className="bg-green-800 border-4 border-yellow-300 rounded-lg p-8">
                            <p className="text-yellow-300 text-xl font-mono mb-4">No eggs found</p>
                            <p className="text-green-300 font-mono">Get some eggs to start incubating!</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Incubate Confirmation Modal */}
            {showIncubateModal && selectedEgg && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                    <div className="bg-green-800 border-4 border-yellow-300 rounded-lg p-8 max-w-md w-full">
                        <div className="text-center space-y-6">
                            <h2 className="text-2xl font-bold text-yellow-300 font-mono">
                                CONFIRM INCUBATION
                            </h2>
                            
                            <div className="relative">
                                <img
                                    src={selectedEgg.metadata?.image || "/images/egg-default.png"}
                                    alt="Selected Egg"
                                    className="w-32 h-32 mx-auto object-contain pixelated rounded-lg"
                                    style={{ imageRendering: 'pixelated' }}
                                />
                            </div>

                            <div className="text-green-300 font-mono space-y-2">
                                <p className="text-lg">
                                    Confirm transaction to incubate {selectedEgg.metadata?.name || `Egg #${selectedEgg.tokenId}`}
                                </p>
                                <p className="text-sm">
                                    Incubation time: <span className="text-yellow-300">{formatTime(incubationPeriod)}</span>
                                </p>
                                <p className="text-xs text-orange-300">
                                    ⚠️ If the egg is transferred to another wallet, the incubation time will reset.
                                </p>
                            </div>

                            <div className="flex gap-4">
                                <Button
                                    onClick={handleIncubate}
                                    className="flex-1 bg-blue-600 hover:bg-blue-700 border-4 border-blue-400 text-white font-mono font-bold py-3"
                                >
                                    CONFIRM
                                </Button>
                                <Button
                                    onClick={() => setShowIncubateModal(false)}
                                    className="flex-1 bg-gray-600 hover:bg-gray-700 border-4 border-gray-400 text-white font-mono font-bold py-3"
                                >
                                    CANCEL
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Hatch Modal */}
            {showHatchModal && hatchableEgg && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                    <div className="bg-green-800 border-4 border-yellow-300 rounded-lg p-8 max-w-md w-full">
                        <div className="text-center space-y-6">
                            <h2 className="text-2xl font-bold text-yellow-300 font-mono">
                                EGG READY TO HATCH!
                            </h2>
                            
                            <div className="relative">
                                <img
                                    src={hatchableEgg.metadata?.image || "/images/egg-glowing.png"}
                                    alt="Glowing Egg"
                                    className="w-32 h-32 mx-auto object-contain pixelated animate-pulse rounded-lg"
                                    style={{ imageRendering: 'pixelated' }}
                                />
                                <div className="absolute inset-0 bg-yellow-300/30 rounded-full animate-ping" />
                            </div>

                            <p className="text-green-300 font-mono">
                                {hatchableEgg.metadata?.name || `Egg #${hatchableEgg.tokenId}`}
                            </p>

                            <div className="flex gap-4">
                                <Button
                                    onClick={handleHatch}
                                    className="flex-1 bg-yellow-600 hover:bg-yellow-700 border-4 border-yellow-400 text-black font-mono font-bold py-3"
                                >
                                    HATCH!
                                </Button>
                                <Button
                                    onClick={() => setShowHatchModal(false)}
                                    className="flex-1 bg-gray-600 hover:bg-gray-700 border-4 border-gray-400 text-white font-mono font-bold py-3"
                                >
                                    CANCEL
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Retro Styling */}
            <style>{`
                .pixelated {
                    image-rendering: -moz-crisp-edges;
                    image-rendering: -webkit-crisp-edges;
                    image-rendering: pixelated;
                    image-rendering: crisp-edges;
                }
                
                @font-face {
                    font-family: 'GameBoy';
                    src: url('/fonts/gameboy.woff2') format('woff2');
                }
                
                .font-mono {
                    font-family: 'GameBoy', monospace;
                }
            `}</style>
        </div>
    )
}