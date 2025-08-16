"use client"

import { useState, useEffect } from "react"

import { useAppKitAccount, useAppKitProvider } from "@reown/appkit/react"
import { ethers } from "ethers"
import { Loader2, Eye, EyeOff, RotateCcw } from "lucide-react"
import { Sword, Shield, Heart, Zap, Hash, Sparkles } from "lucide-react"
import { ChevronLeft, ChevronRight } from "lucide-react"
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
    const [showMetadataModal, setShowMetadataModal] = useState(false)
    const [metadataModalData, setMetadataModalData] = useState<CardData | null>(null)
    const { address, isConnected } = useAppKitAccount()
    const { walletProvider } = useAppKitProvider("eip155")
    const [selectedCardData, setSelectedCardData] = useState<CardData | null>(null)
    const [dexEntries, setDexEntries] = useState<DexEntry[]>([])
    const [ownedCards, setOwnedCards] = useState<Set<number>>(new Set())
    const [ownedCardsWithMetadata, setOwnedCardsWithMetadata] = useState<Map<number, CardData[]>>(new Map())
    const [selectedCardIndex, setSelectedCardIndex] = useState<number>(0) // Track which card in the array we're viewing

    const [isLoading, setIsLoading] = useState<boolean>(false)
    const [hideNotOwned, setHideNotOwned] = useState<boolean>(false)
    const [selectedCard, setSelectedCard] = useState<DexEntry | null>(null)
    const [isDexLoading, setIsDexLoading] = useState<boolean>(true)
    const [loadingProgress, setLoadingProgress] = useState<number>(0)

    // Function to clear DEX cache and reload
    const refreshDexCache = async () => {
        // Clear localStorage
        localStorage.removeItem('bead151-dex-cache')
        localStorage.removeItem('bead151-dex-cache-version')
        console.log('DEX cache cleared. Regenerating...')

        // Reinitialize the DEX
        await initializeDex()

        // If user is connected, also refresh their collection
        if (isConnected && address) {
            await fetchUserCollection()
        }
    }

    // Function to clear DEX cache (useful for debugging)
    const clearDexCache = () => {
        localStorage.removeItem('bead151-dex-cache')
        localStorage.removeItem('bead151-dex-cache-version')
        console.log('DEX cache cleared. Refresh the page to regenerate.')
    }

    // Make clearDexCache available globally for debugging
    useEffect(() => {
        ; (window as any).clearDexCache = clearDexCache
        return () => {
            delete (window as any).clearDexCache
        }
    }, [])

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

        // Check if we have cached DEX data
        const cachedDexData = localStorage.getItem('bead151-dex-cache')
        const cacheVersion = localStorage.getItem('bead151-dex-cache-version')
        const currentVersion = '1.0' // Increment this when SVG generation logic changes

        if (cachedDexData && cacheVersion === currentVersion) {
            try {
                const cachedEntries = JSON.parse(cachedDexData)
                console.log('Loading DEX from cache...')
                setDexEntries(cachedEntries)
                setLoadingProgress(100)
                setIsDexLoading(false)
                return
            } catch (error) {
                console.warn('Failed to parse cached DEX data, regenerating...', error)
            }
        }

        console.log('Generating fresh DEX data...')
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

        // Cache the generated entries for future use
        try {
            localStorage.setItem('bead151-dex-cache', JSON.stringify(entries))
            localStorage.setItem('bead151-dex-cache-version', '1.0')
            console.log('DEX data cached successfully')
        } catch (error) {
            console.warn('Failed to cache DEX data:', error)
        }

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

            // Populate ownedCardsWithMetadata Map with arrays of cards
            const cardMetadataMap = new Map<number, CardData[]>()
            cards.forEach(card => {
                if (!cardMetadataMap.has(card.cardId)) {
                    cardMetadataMap.set(card.cardId, [])
                }
                cardMetadataMap.get(card.cardId)!.push(card)
            })
            setOwnedCardsWithMetadata(cardMetadataMap)

            // Update dex entries with ownership info and card details
            setDexEntries(prevEntries => {
                console.log("Previous entries length:", prevEntries.length)
                return prevEntries.map(entry => {
                    const isOwned = ownedCardIds.has(entry.cardId)
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
        setSelectedCardIndex(0) // Reset to first card when opening modal

        // Load the full card data for the Card component
        let cardData: CardData

        if (entry.owned && ownedCardsWithMetadata.has(entry.cardId)) {
            // Use real metadata for owned cards - get first card in array
            const cardsArray = ownedCardsWithMetadata.get(entry.cardId)!
            cardData = cardsArray[0] // Start with first card
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

    const navigateToNextCard = () => {
        if (!selectedCard || !ownedCardsWithMetadata.has(selectedCard.cardId)) return

        const cardsArray = ownedCardsWithMetadata.get(selectedCard.cardId)!
        const nextIndex = (selectedCardIndex + 1) % cardsArray.length
        setSelectedCardIndex(nextIndex)
        setSelectedCardData(cardsArray[nextIndex])
    }

    const navigateToPrevCard = () => {
        if (!selectedCard || !ownedCardsWithMetadata.has(selectedCard.cardId)) return

        const cardsArray = ownedCardsWithMetadata.get(selectedCard.cardId)!
        const prevIndex = selectedCardIndex === 0 ? cardsArray.length - 1 : selectedCardIndex - 1
        setSelectedCardIndex(prevIndex)
        setSelectedCardData(cardsArray[prevIndex])
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
                                <div className="mt-6 bg-black border-4 border-yellow-300 rounded-lg p-4 max-w-md mx-auto relative">
                                    {/* Refresh Button */}
                                    <Button
                                        onClick={refreshDexCache}
                                        disabled={isDexLoading}
                                        className="absolute -top-4 -right-4 w-16 h-16 p-0 hover:scale-145 text-yellow-300  rounded-full transition-colors duration-200"
                                        title="Refresh DEX Cache"
                                    >
                                        <RotateCcw className={`h-4 w-4 ${isDexLoading ? 'animate-spin' : ''}`} />
                                    </Button>

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
                        setSelectedCardIndex(0)
                    }}
                >
                    {/* Card Component */}
                    {selectedCardData ? (
                        <div className="flex flex-col items-center space-y-6" onClick={e => e.stopPropagation()}>
                            {/* Navigation Header (only show if multiple cards) */}
                            {selectedCard.owned && ownedCardsWithMetadata.has(selectedCard.cardId) && (
                                <div className="flex items-center space-x-4 bg-black border-2 border-yellow-300 rounded-lg px-6 py-3">

                                    {ownedCardsWithMetadata.get(selectedCard.cardId)!.length > 1 && (
                                        <button
                                            onClick={navigateToPrevCard}
                                            className="text-yellow-300 hover:text-yellow-400 transition-colors p-2 hover:bg-gray-800 rounded"
                                            title="Previous card"
                                        >
                                            <ChevronLeft className="h-6 w-6" />
                                        </button>
                                    )}


                                    <div className="text-center">
                                        <div className="text-yellow-300 font-mono text-lg font-bold">
                                            Dex Id #{selectedCard.cardId}
                                        </div>
                                        <div className="text-cyan-300 font-mono text-sm">
                                            Token ID: {selectedCardData.tokenId}
                                        </div>
                                    </div>

                                    {ownedCardsWithMetadata.get(selectedCard.cardId)!.length > 1 && (
                                        <button
                                            onClick={navigateToNextCard}
                                            className="text-yellow-300 hover:text-yellow-400 transition-colors p-2 hover:bg-gray-800 rounded"
                                            title="Next card"
                                        >
                                            <ChevronRight className="h-6 w-6" />
                                        </button>
                                    )}
                                </div>
                            )}

                            <Card
                                cardData={selectedCardData}
                                customClasses="w-48 h-64 sm:w-56 sm:h-72 md:w-64 md:h-80"
                            />

                            {selectedCard.owned && (
                                <div className="flex flex-col items-center space-y-2">
                                    <button
                                        className="cursor-pointer px-4 py-2 bg-yellow-300 text-black font-mono font-bold rounded shadow hover:bg-yellow-400 transition mt-6"
                                        onClick={() => {
                                            setMetadataModalData(selectedCardData)
                                            setShowMetadataModal(true)
                                        }}
                                    >
                                        View metadata
                                    </button>

                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center space-y-4">
                            <Loader2 className="h-8 w-8 text-green-400 animate-spin" />
                            <p className="text-cyan-300 font-mono">LOADING CARD DATA...</p>
                        </div>
                    )}
                </div>
            )}

            {/* Metadata Modal */}
            {showMetadataModal && metadataModalData && (
                <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4" onClick={() => setShowMetadataModal(false)}>
                    <div className="bg-gray-900 border-4 border-yellow-300 rounded-lg p-8 max-w-lg w-full max-h-[90vh] relative overflow-y-auto" onClick={e => e.stopPropagation()}>
                        <button className="absolute top-2 right-2 text-yellow-300 hover:text-yellow-400 font-bold text-2xl" onClick={() => setShowMetadataModal(false)}>&times;</button>
                        <div className="flex flex-col items-center space-y-6">
                            <Card cardData={metadataModalData} customClasses="w-45 h-58 sm:w-45 sm:h-58 pb-4" />
                            <MetadataTable metadata={metadataModalData.metadata} />
                        </div>
                    </div>
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

    // --- Place this at the very end of the file, after the Dex component ---
    function MetadataTable({ metadata }: { metadata: string }) {
        let parsed = null;
        try {
            if (metadata.startsWith('data:application/json;base64,')) {
                const base64 = metadata.replace('data:application/json;base64,', '');
                parsed = JSON.parse(atob(base64));
            } else if (/^[A-Za-z0-9+/=]+$/.test(metadata)) {
                // If it's just base64
                parsed = JSON.parse(atob(metadata));
            } else {
                parsed = JSON.parse(metadata);
            }
        } catch (e) {
            return <div className="text-red-400 font-mono">Error parsing metadata</div>;
        }
        if (!parsed) return null;
        console.log(parsed);
        const tokenId = parsed.name.replace('Beads151 #', '');
        const attributes = parsed.attributes || [];
        const getAttr = (trait: string) => attributes.find((a: any) => a.trait_type === trait)?.value || '';

        return (
            <div className="w-full bg-black border-2 border-gray-600 rounded-lg p-4">
                <div className="grid grid-cols-1 gap-3">
                    {/* Token ID */}
                    <div className="flex items-center justify-between p-2 bg-gray-800 border border-gray-600 rounded">
                        <div className="flex items-center space-x-2">
                            <Hash className="h-4 w-4 text-cyan-400" />
                            <span className="text-cyan-300 font-mono text-sm">Token ID</span>
                        </div>
                        <span className="text-yellow-300 font-mono font-bold">{tokenId}</span>
                    </div>

                    {/* Card ID */}
                    <div className="flex items-center justify-between p-2 bg-gray-800 border border-gray-600 rounded">
                        <div className="flex items-center space-x-2">
                            <Sparkles className="h-4 w-4 text-purple-400" />
                            <span className="text-cyan-300 font-mono text-sm">Dex ID</span>
                        </div>
                        <span className="text-yellow-300 font-mono font-bold">{getAttr('Dex ID') || getAttr('Card') || '-'}</span>
                    </div>

                    {/* Stats Row */}
                    <div className="grid grid-cols-3 gap-2">
                        {/* Attack */}
                        <div className="flex flex-col items-center p-3 bg-red-900/30 border border-red-500/50 rounded">
                            <Sword className="h-5 w-5 text-red-400 mb-1" />
                            <span className="text-red-300 font-mono text-xs">ATK</span>
                            <span className="text-yellow-300 font-mono font-bold text-lg">{getAttr('Attack')}</span>
                        </div>

                        {/* HP */}
                        <div className="flex flex-col items-center p-3 bg-green-900/30 border border-green-500/50 rounded">
                            <Heart className="h-5 w-5 text-green-400 mb-1" />
                            <span className="text-green-300 font-mono text-xs">HP</span>
                            <span className="text-yellow-300 font-mono font-bold text-lg">{getAttr('HP')}</span>
                        </div>

                        {/* Defense */}
                        <div className="flex flex-col items-center p-3 bg-blue-900/30 border border-blue-500/50 rounded">
                            <Shield className="h-5 w-5 text-blue-400 mb-1" />
                            <span className="text-blue-300 font-mono text-xs">DEF</span>
                            <span className="text-yellow-300 font-mono font-bold text-lg">{getAttr('Defense')}</span>
                        </div>
                    </div>

                    {/* Element Type */}
                    <div className="flex items-center justify-between p-2 bg-gray-800 border border-gray-600 rounded">
                        <div className="flex items-center space-x-2">
                            <Zap className="h-4 w-4 text-yellow-400" />
                            <span className="text-sm text-cyan-300 font-mono text-sm">Type</span>
                        </div>
                        <span className="text-sm text-yellow-300 font-mono font-bold">{getAttr('Element') || '-'}</span>
                    </div>
                </div>
            </div>
        );
    }
}