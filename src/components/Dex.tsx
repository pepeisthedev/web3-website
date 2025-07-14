"use client"

import { useState, useEffect } from "react"
import { useAppKitAccount, useAppKitProvider } from "@reown/appkit/react"
import { ethers } from "ethers"
import { Loader2, Eye, EyeOff } from "lucide-react"
import { Button } from "./ui/button"
import { Checkbox } from "./ui/checkbox"
import Card from "./Card" 

// Contract addresses and ABIs
import cardContractABI from "../assets/abi/Bead151Card.json"
import routerContractABI from "../assets/abi/Bead151ArtRouter.json"

const cardContractAddress = import.meta.env.VITE_BEAD151_CARD_CONTRACT
const routerContractAddress = import.meta.env.VITE_BEAD151_CARD_ART_CONTRACT

interface CardData {
    tokenId: number
    cardId: number
    svg: string
    description: string
}

interface DexEntry {
    cardId: number
    imageUrl: string
    owned: boolean
    cardName?: string
    rarity?: string
}

export default function Dex() {
    const { address, isConnected } = useAppKitAccount()
    const { walletProvider } = useAppKitProvider("eip155")
 const [selectedCardData, setSelectedCardData] = useState<CardData | null>(null)
    const [dexEntries, setDexEntries] = useState<DexEntry[]>([])
    const [ownedCards, setOwnedCards] = useState<Set<number>>(new Set())
    const [isLoading, setIsLoading] = useState<boolean>(false)
    const [hideNotOwned, setHideNotOwned] = useState<boolean>(false)
    const [selectedCard, setSelectedCard] = useState<DexEntry | null>(null)

    // Initialize DEX with all 151 cards
    useEffect(() => {
        initializeDex()
    }, [])

    // Fetch user's collection when connected
    useEffect(() => {
        if (isConnected && address) {
            fetchUserCollection()
        } else {
            setOwnedCards(new Set())
        }
    }, [isConnected, address])

    const initializeDex = () => {
        const entries: DexEntry[] = []
        for (let i = 1; i <= 151; i++) {
            entries.push({
                cardId: i,
                imageUrl: `/images/dex/svgs/card-${i.toString().padStart(3, '0')}.svg`,
                owned: false
            })
        }
        setDexEntries(entries)
    }

    const loadCardMetadata = async (cardId: number): Promise<CardData | null> => {
        try {
            const response = await fetch(`/metadata/dex/card-${cardId.toString().padStart(3, '0')}.json`)
            if (!response.ok) {
                throw new Error(`Failed to load metadata for card ${cardId}`)
            }
            
            const metadata = await response.json()
            console.log(`Loaded metadata for card ${cardId}:`, metadata)
            
            // Create CardData object
            const cardData: CardData = {
                tokenId: 0, // Not applicable for DEX view
                cardId: cardId,
                svg: `/images/dex/svgs/card-${cardId.toString().padStart(3, '0')}.svg`,
                description: JSON.stringify(metadata)
            }
            
            return cardData
        } catch (error) {
            console.error(`Error loading metadata for card ${cardId}:`, error)
            return null
        }
    }


    const fetchAllUserCards = async (userAddress: string): Promise<CardData[]> => {
        if (!walletProvider || !userAddress) return []

        const ethersProvider = new ethers.BrowserProvider(walletProvider as ethers.Eip1193Provider)
        const cardContract = new ethers.Contract(cardContractAddress, cardContractABI, ethersProvider)
        const routerContract = new ethers.Contract(routerContractAddress, routerContractABI, ethersProvider)
        
        try {
            const [tokenIds, cardIds] = await cardContract.getUserCards(userAddress)
            
            if (cardIds.length === 0) return []

            const cardIdsArray = Array.from(cardIds).map(id => Number(id))
            const tokenIdsArray = Array.from(tokenIds).map(id => Number(id))
            
            const [svgs, metadata] = await routerContract.renderAndMetaBatch(cardIdsArray)

            const allCardData: CardData[] = cardIdsArray.map((cardId: number, index: number) => ({
                tokenId: tokenIdsArray[index],
                cardId: cardId,
                svg: svgs[index] || "",
                description: metadata[index] || `Card #${cardId}`,
            }))

            return allCardData
        } catch (error) {
            console.error('Error fetching user cards:', error)
            return []
        }
    }

    const fetchUserCollection = async () => {
        if (!address) return
        
        setIsLoading(true)
        try {
            const cards = await fetchAllUserCards(address)
            const ownedCardIds = new Set(cards.map(card => card.cardId))
            setOwnedCards(ownedCardIds)
            
            // Update dex entries with ownership info and card details
            setDexEntries(prevEntries => 
                prevEntries.map(entry => {
                    const userCard = cards.find(card => card.cardId === entry.cardId)
                    let cardName = `Card #${entry.cardId}`
                    let rarity = "Unknown"
                    
                    if (userCard) {
                        try {
                            const traits = JSON.parse(userCard.description)
                            const cardTrait = traits.find((trait: any) => trait.trait_type === "Card")
                            const rarityTrait = traits.find((trait: any) => trait.trait_type === "Rarity")
                            
                            if (cardTrait) cardName = cardTrait.value
                            if (rarityTrait) rarity = rarityTrait.value
                        } catch (error) {
                            console.error("Error parsing card description:", error)
                        }
                    }
                    
                    return {
                        ...entry,
                        owned: ownedCardIds.has(entry.cardId),
                        cardName,
                        rarity: ownedCardIds.has(entry.cardId) ? rarity : undefined
                    }
                })
            )
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
        const cardData = await loadCardMetadata(entry.cardId)
        setSelectedCardData(cardData)
    }

    const getRarityColor = (rarity?: string) => {
        switch (rarity?.toLowerCase()) {
            case 'common': return 'text-gray-400'
            case 'uncommon': return 'text-green-400'
            case 'rare': return 'text-blue-400'
            case 'epic': return 'text-purple-400'
            case 'legendary': return 'text-yellow-400'
            default: return 'text-gray-400'
        }
    }

    return (
        <div className="min-h-screen bg-black pt-20 px-4">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Bead151 DEX</h1>
                    <p className="text-xl text-gray-300">Complete Card Database</p>
                    
                    {isConnected && (
                        <div className="mt-4 space-y-2">
                            <div className="text-2xl font-bold text-white">
                                {ownedCount}/151 ({completionPercentage}%)
                            </div>
                            <div className="w-full max-w-md mx-auto bg-gray-800 rounded-full h-4">
                                <div 
                                    className="bg-gradient-to-r from-blue-500 to-purple-500 h-4 rounded-full transition-all duration-500"
                                    style={{ width: `${completionPercentage}%` }}
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Controls */}
                <div className="flex justify-center mb-8">
                    <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-4">
                        <div className="flex items-center gap-6">
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="hideNotOwned"
                                    checked={hideNotOwned}
                                    onCheckedChange={(checked) => setHideNotOwned(checked as boolean)}
                                    className="border-gray-600 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                                />
                                <label htmlFor="hideNotOwned" className="text-white cursor-pointer flex items-center gap-2">
                                    {hideNotOwned ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    Hide Not Owned
                                </label>
                            </div>
                            
                            {!isConnected && (
                                <p className="text-gray-400 text-sm">Connect wallet to see your collection</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Loading State */}
                {isLoading && (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-8 w-8 text-blue-400 animate-spin mr-2" />
                        <span className="text-white">Loading your collection...</span>
                    </div>
                )}

                {/* DEX Grid */}
                <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 xl:grid-cols-15 gap-2 mb-8">
                    {filteredEntries.map((entry) => (
                        <div
                            key={entry.cardId}
                            onClick={() => handleCardClick(entry)}
                            className={`
                                relative aspect-square rounded-lg overflow-hidden transition-all duration-300 hover:scale-105 cursor-pointer 
                             
                                ${entry.owned ? 'shadow-lg hover:shadow-blue-500/25' : ''}
                            `}
                        >
                            {/* Card Number */}
                            <div className="absolute top-1 left-1 z-10">
                                <span className={`text-xs font-bold px-1 py-0.5 rounded ${
                                    entry.owned ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-400'
                                }`}>
                                    {entry.cardId.toString().padStart(3, '0')}
                                </span>
                            </div>

                            {/* Card Image */}
                            <div className="w-full h-full flex items-center justify-center p-1 ">
                                <img
                                    src={entry.imageUrl}
                                    alt={entry.cardName || `Card ${entry.cardId}`}
                                    className={`
                                        max-w-full max-h-full object-contain transition-all duration-300 rounded-lg
                                        ${entry.owned ? '' : 'grayscale opacity-30'}
                                    `}
                                    onError={(e) => {
                            
                                        // Fallback if image doesn't exist
                                      //  console.warn(`Image not found for card ${entry.cardId}: ${entry.imageUrl}`)
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
                        <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-8">
                            <p className="text-xl text-gray-300 mb-4">No cards owned yet</p>
                            <p className="text-gray-400">Start collecting to build your DEX!</p>
                        </div>
                    </div>
                )}
            </div>

            
            
            {/* Card Detail Modal */}
            {selectedCard && (
                <div 
                    className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
                    onClick={() => {
                        // Close modal when clicking the backdrop
                        setSelectedCard(null)
                        setSelectedCardData(null)
                    }}
                >
                    <div 
                        className="relative bg-transparent rounded-2xl p-6 max-w-lg w-full"
                        onClick={(e) => {
                            // Prevent modal from closing when clicking inside the card area
                            e.stopPropagation()
                        }}
                    >
                        {/* Card Component */}
                        {selectedCardData ? (
                            <div className="flex flex-col items-center space-y-6">
                                {/* Responsive scale - larger on mobile */}
                                <div className="transform scale-[2.5] sm:scale-[2] md:scale-150 mb-12 sm:mb-8">
                                    <Card 
                                        cardData={selectedCardData}
                                        showBackDefault={false}
                                        disableFlip={false}  // Enable flip when clicking the card
                                        forceShowFront={false}
                                        scaleIfHover={false}
                                    />
                                </div>
                            
                            </div>
                        ) : (
                            // Loading state while metadata loads
                            <div className="flex flex-col items-center space-y-4">
                                <Loader2 className="h-8 w-8 text-blue-400 animate-spin" />
                                <p className="text-white">Loading card details...</p>
                            </div>
                        )}
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
            `}</style>
        </div>
    )
}