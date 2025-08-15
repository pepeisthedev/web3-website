"use client"

import { useState, useEffect } from "react"
import { useAppKitAccount, useAppKitProvider } from "@reown/appkit/react"
import { ethers } from "ethers"
import { Loader2, Eye, EyeOff } from "lucide-react"
import { Button } from "./ui/button"
import { Checkbox } from "./ui/checkbox"
import Card from "./Card"
import { fetchAllUserCards, CardData } from "../lib/fetchAllUserCards"
import { generateBeadSvgFromIndex, generateFakeCardMetadataFromCardId } from "../lib/combineCompleteCard"
import characterStatsContractABI from "../assets/abi/Bead151CharacterStats.json"

const characterStatsContractAddress = import.meta.env.VITE_BEAD151_CHARACTER_STATS_CONTRACT

interface DexEntry {
    cardId: number
    imageUrl: string
    owned: boolean
    cardName?: string
}

export default function Dex() {
    const { address, isConnected } = useAppKitAccount()
    const { walletProvider } = useAppKitProvider("eip155")
    const [selectedCardData, setSelectedCardData] = useState<CardData | null>(null)
    const [dexEntries, setDexEntries] = useState<DexEntry[]>([])
    const [ownedCards, setOwnedCards] = useState<Set<number>>(new Set())
    const [ownedCardsWithMetadata, setOwnedCardsWithMetadata] = useState<Map<number, CardData>>(new Map())
    const [isLoading, setIsLoading] = useState<boolean>(false)
    const [hideNotOwned, setHideNotOwned] = useState<boolean>(false)
    const [selectedCard, setSelectedCard] = useState<DexEntry | null>(null)
    const [isDexLoading, setIsDexLoading] = useState<boolean>(true)
    const [loadingProgress, setLoadingProgress] = useState<number>(0)
    const [isGeneratingCardData, setIsGeneratingCardData] = useState<boolean>(false)

    // Initialize DEX with all 151 cards
    useEffect(() => {
        const loadDex = async () => {
            await initializeDex()
        }
        loadDex()
    }, [])

    // Fetch user's collection when connected AND after DEX is loaded
    useEffect(() => {
        if (isConnected && address && !isDexLoading) {
            fetchUserCollection()
        } else {
            setOwnedCards(new Set())
        }
    }, [isConnected, address, isDexLoading])

    const initializeDex = async () => {
        setIsDexLoading(true)
        setLoadingProgress(0)
        
        const entries: DexEntry[] = []
        const totalCards = 151
        
        for (let i = 1; i <= totalCards; i++) {
            try {
                // Generate SVG from index using the new function
                const svgDataUri = await generateBeadSvgFromIndex(i)
                entries.push({
                    cardId: i,
                    imageUrl: svgDataUri,
                    owned: false
                })
            } catch (error) {
                console.error(`Failed to generate SVG for card ${i}:`, error)
                // Fallback to placeholder
                entries.push({
                    cardId: i,
                    imageUrl: '/placeholder.svg',
                    owned: false
                })
            }
            
            // Update progress
            const progress = Math.round((i / totalCards) * 100)
            setLoadingProgress(progress)
            
            // Add a small delay to make the progress visible and avoid blocking the UI
            if (i % 10 === 0) {
                await new Promise(resolve => setTimeout(resolve, 50))
            }
        }
        
        setDexEntries(entries)
        setIsDexLoading(false)
    }

    const fetchUserCollection = async () => {
        if (!address) return

        setIsLoading(true)
        try {
            const cards = await fetchAllUserCards(address, walletProvider)
            console.log("Fetched cards:", cards)
            const ownedCardIds = new Set(cards.map(card => card.cardId))
            console.log("Owned card IDs:", ownedCardIds);
            setOwnedCards(ownedCardIds)

            // Populate ownedCardsWithMetadata Map
            const cardMetadataMap = new Map<number, CardData>()
            cards.forEach(card => {
                cardMetadataMap.set(card.cardId, card)
            })
            setOwnedCardsWithMetadata(cardMetadataMap)

            // Update dex entries with ownership info and card details
            setDexEntries(prevEntries => {
                console.log("Previous entries length:", prevEntries.length)
                return prevEntries.map(entry => {
                    const isOwned = ownedCardIds.has(entry.cardId)
                    console.log(`Card ${entry.cardId}: owned = ${isOwned}`)
                    let cardName = `Card #${entry.cardId}`

                    return {
                        ...entry,
                        owned: isOwned,
                        cardName,
                    }
                })
            })
        } catch (error) {
            console.error("Error fetching collection:", error)
        }
        setIsLoading(false)
    }

    const filteredEntries = hideNotOwned
        ? dexEntries.filter(entry => entry.owned)
        : dexEntries

    const ownedCount = ownedCards.size
    const completionPercentage = Math.round((ownedCount / 151) * 100)


    const handleCardClick = async (entry: DexEntry) => {
        setSelectedCard(entry)

        // Load the full card data for the Card component
        let cardData: CardData
        
        if (entry.owned && ownedCardsWithMetadata.has(entry.cardId)) {
            // Use real metadata for owned cards
            cardData = ownedCardsWithMetadata.get(entry.cardId)!
        } else {
            // Generate fake metadata for unowned cards
            const ethersProvider = new ethers.BrowserProvider(walletProvider as ethers.Eip1193Provider)
            const characterStatsContract = new ethers.Contract(
                characterStatsContractAddress,
                characterStatsContractABI,
                ethersProvider
            )
            
            const fakeMetadata = await generateFakeCardMetadataFromCardId(entry.cardId, characterStatsContract)
          
            cardData = {
                tokenId: 0, // Not applicable for fake cards
                cardId: entry.cardId,
                metadata: fakeMetadata // Already a JSON string, don't stringify again
            }
        }
        
        setSelectedCardData(cardData)
    }


    return (
        <div className="min-h-screen bg-gradient-to-b from-teal-900 via-cyan-800 to-teal-900 pt-20 xl:pt-30 px-4 font-mono">
            <div className="max-w-7xl mx-auto">
                {/* Loading Screen */}
                {isDexLoading && (
                    <div className="fixed inset-0 bg-gradient-to-b from-teal-900 via-cyan-800 to-teal-900 flex flex-col items-center justify-center z-50">
                        <div className="max-w-2xl mx-auto text-center px-4">
                            {/* Loading Header */}
                            <div className="mb-12">
                                <h1 className="text-5xl md:text-6xl font-bold text-yellow-300 mb-4 font-mono tracking-wider animate-pulse">
                                    BEAD151 DEX
                                </h1>
                                <p className="text-xl md:text-2xl text-cyan-300 font-mono">
                                    INITIALIZING DATABASE...
                                </p>
                            </div>

                            {/* Progress Section */}
                            <div className="bg-black border-4 border-yellow-300 rounded-lg p-8 mb-8">
                                <div className="text-center mb-6">
                                    <div className="text-3xl md:text-4xl font-bold text-green-400 mb-2 font-mono">
                                        {loadingProgress}%
                                    </div>
                                    <div className="text-sm md:text-base text-cyan-300 font-mono">
                                        GENERATING CARD {Math.ceil((loadingProgress / 100) * 151)}/151
                                    </div>
                                </div>

                                {/* Progress Bar */}
                                <div className="w-full bg-gray-600 border-4 border-gray-400 rounded-lg h-8 overflow-hidden mb-4">
                                    <div
                                        className="bg-gradient-to-r from-green-400 to-cyan-400 h-full transition-all duration-300 ease-out"
                                        style={{ width: `${loadingProgress}%` }}
                                    />
                                </div>

                                {/* Loading Animation */}
                                <div className="flex justify-center items-center space-x-2">
                                    <div className="w-3 h-3 bg-yellow-300 rounded-full animate-bounce"></div>
                                    <div className="w-3 h-3 bg-cyan-300 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                    <div className="w-3 h-3 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                </div>
                            </div>

                            {/* Loading Message */}
                            <div className="text-center">
                                <p className="text-lg text-yellow-300 font-mono mb-2">
                                    PLEASE WAIT...
                                </p>
                      
                            </div>
                        </div>
                    </div>
                )}

                {/* Main Content - Only show when not loading */}
                {!isDexLoading && (
                    <>
                        {/* Header */}
                        <div className="text-center mb-8">
                            <h1 className="text-4xl md:text-5xl font-bold text-yellow-300 mb-4 font-mono tracking-wider">BEAD151 DEX</h1>
                            <p className="text-xl text-cyan-300 font-mono">COMPLETE CARD DATABASE</p>

                            {isConnected && (
                                <div className="mt-6 bg-black border-4 border-yellow-300 rounded-lg p-4 max-w-md mx-auto">
                                    <div className="text-2xl font-bold text-green-400 mb-2 font-mono">
                                        {ownedCount.toString().padStart(3, '0')}/151 {completionPercentage}%
                                    </div>
                                    <div className="w-full bg-gray-600 border-2 border-gray-400 rounded h-6 overflow-hidden">
                                        <div
                                            className="bg-green-400 h-full transition-all duration-500"
                                            style={{ width: `${completionPercentage}%` }}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Controls */}
                        <div className="flex justify-center mb-8">
                            <div className="bg-black border-4 border-gray-400 rounded-lg p-4">
                                <div className="flex items-center gap-6">
                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id="hideNotOwned"
                                            checked={hideNotOwned}
                                            onCheckedChange={(checked) => setHideNotOwned(checked as boolean)}
                                            className="border-2 border-gray-400 data-[state=checked]:bg-green-400 data-[state=checked]:border-green-400"
                                        />
                                        <label htmlFor="hideNotOwned" className="text-cyan-300 cursor-pointer flex items-center gap-2 font-mono text-sm">
                                            {hideNotOwned ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                            HIDE NOT OWNED
                                        </label>
                                    </div>

                                    {!isConnected && (
                                        <p className="text-green-400 text-sm font-mono">CONNECT WALLET TO VIEW COLLECTION</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Loading State */}
                        {isLoading && (
                            <div className="flex items-center justify-center py-12">
                                <div className="bg-black border-2 border-gray-400 rounded p-4 flex items-center">
                                    <Loader2 className="h-6 w-6 text-green-400 animate-spin mr-3" />
                                    <span className="text-cyan-300 font-mono">LOADING COLLECTION...</span>
                                </div>
                            </div>
                        )}

                        {/* DEX Grid */}
                        <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 xl:grid-cols-15 gap-2 pb-8">
                    {filteredEntries.map((entry) => (
                        <div
                            key={entry.cardId}
                            onClick={() => handleCardClick(entry)}
                            className={`
                                relative aspect-square rounded border-2 overflow-hidden transition-all duration-300 hover:scale-105 cursor-pointer 
                                ${entry.owned
                                    ? 'bg-black border-yellow-300 shadow-lg hover:border-cyan-300'
                                    : 'bg-gray-600 border-gray-400'
                                }
                            `}
                        >
                            {/* Card Number */}
                            <div className="absolute top-1 left-1 z-10">
                                <span className={`text-xs font-bold px-1 py-0.5 border rounded font-mono ${entry.owned
                                        ? 'bg-green-400 text-black border-green-400'
                                        : 'bg-gray-500 text-gray-300 border-gray-500'
                                    }`}>
                                    {entry.cardId.toString().padStart(3, '0')}
                                </span>
                            </div>

                            {/* Card Image */}
                            <div className="w-full h-full flex items-center justify-center p-1">
                                <img
                                    src={entry.imageUrl}
                                    alt={entry.cardName || `Card ${entry.cardId}`}
                                    className={`
                                        max-w-full max-h-full object-contain transition-all duration-300 pixelated
                                        ${entry.owned ? '' : 'grayscale opacity-30'}
                                    `}
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).src = '/placeholder.svg'
                                    }}
                                />
                            </div>
                        </div>
                    ))}
                </div>

                {/* Empty State */}
                {hideNotOwned && filteredEntries.length === 0 && (
                    <div className="text-center py-12">
                        <div className="bg-black border-4 border-gray-400 rounded-lg p-8 max-w-md mx-auto">
                            <p className="text-xl text-yellow-300 mb-4 font-mono">NO CARDS OWNED</p>
                            <p className="text-cyan-300 font-mono text-sm">START COLLECTING TO BUILD YOUR DEX!</p>
                        </div>
                    </div>
                )}
                    </>
                )}
            </div>

            {/* Card Detail Modal */}
            {selectedCard && (
                <div
                    className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
                    onClick={() => {
                        setSelectedCard(null)
                        setSelectedCardData(null)
                    }}
                >
                    {/* Card Component */}
                    {selectedCardData ? (
                        <div className="flex flex-col items-center space-y-6" onClick={(e) => e.stopPropagation()}>
                            <Card 
                                cardData={selectedCardData} 
                                customClasses="w-48 h-64 sm:w-56 sm:h-72 md:w-64 md:h-80"
                            />
                        </div>
                    ) : (
                        <div className="flex flex-col items-center space-y-4">
                            <Loader2 className="h-8 w-8 text-green-400 animate-spin" />
                            <p className="text-cyan-300 font-mono">LOADING CARD DATA...</p>
                        </div>
                    )}
                </div>
            )}

            {/* Custom CSS for responsive grid */}
            <style>{`
                @media (min-width: 1280px) {
                    .xl\\:grid-cols-15 {
                        grid-template-columns: repeat(15, minmax(0, 1fr));
                    }
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