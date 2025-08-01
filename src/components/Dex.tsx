"use client"

import { useState, useEffect } from "react"
import { useAppKitAccount, useAppKitProvider } from "@reown/appkit/react"
import { ethers } from "ethers"
import { Loader2, Eye, EyeOff } from "lucide-react"
import { Button } from "./ui/button"
import { Checkbox } from "./ui/checkbox"
import Card from "./Card"
import cardContractABI from "../assets/abi/Bead151Card.json"

const cardContractAddress = import.meta.env.VITE_BEAD151_CARD_CONTRACT

interface CardData {
    tokenId: number
    cardId: number
    svg: string
}

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

    async function fetchAllUserCards(
        userAddress: string,
        walletProvider: any,
    ): Promise<CardData[]> {
        console.log("🔍 Fetching user collection for address:", userAddress)

        if (!walletProvider || !userAddress) {
            console.log("❌ No wallet provider or address")
            return []
        }

        const ethersProvider = new ethers.BrowserProvider(walletProvider as ethers.Eip1193Provider)
        const cardContract = new ethers.Contract(cardContractAddress, cardContractABI, ethersProvider)

        try {
            console.log("📋 Getting user cards from contract...")
            const [tokenIds, cardIds] = await cardContract.getUserCards(userAddress)

            if (cardIds.length === 0) {
                console.log("📭 User has no cards")
                return []
            }

            const cardIdsArray = Array.from(cardIds).map((id: any) => Number(id))
            const tokenIdsArray = Array.from(tokenIds).map((id: any) => Number(id))


            const allCardData: CardData[] = cardIdsArray.map((cardId: number, index: number) => {
                return {
                tokenId: tokenIdsArray[index],
                cardId: cardId,
                svg: `/images/dex/svgs/card-${cardId.toString().padStart(3, '0')}.svg`,
                }
            })

            
            console.log("✅ Card data loaded from contract metadata")
            console.log("🎯 Collection processed:", allCardData.length, "cards")
            return allCardData
        } catch (error) {
            console.error('❌ Error fetching all user cards:', error)
            return []
        }
    }

    const fetchUserCollection = async () => {
        if (!address) return

        setIsLoading(true)
        try {
            const cards = await fetchAllUserCards(address, walletProvider)
            const ownedCardIds = new Set(cards.map(card => card.cardId))
            setOwnedCards(ownedCardIds)

            // Update dex entries with ownership info and card details
            setDexEntries(prevEntries =>
                prevEntries.map(entry => {
                    let cardName = `Card #${entry.cardId}`

                    return {
                        ...entry,
                        owned: ownedCardIds.has(entry.cardId),
                        cardName,
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
       // const cardData = await loadAllCardImages(entry.cardId)
       // setSelectedCardData(cardData)
    }


    return (
        <div className="min-h-screen bg-gradient-to-b from-teal-900 via-cyan-800 to-teal-900 pt-20 xl:pt-30 px-4 font-mono">
            <div className="max-w-7xl mx-auto">
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
                <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 xl:grid-cols-15 gap-2 mb-8">
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
                    {selectedCard ? (
                        <div className="flex flex-col items-center space-y-6">
                            <div className="transform scale-[2] sm:scale-[2] md:scale-150">
                                <img
                                    src={selectedCard.imageUrl.startsWith('<svg')
                                        ? `data:image/svg+xml,${encodeURIComponent(selectedCard.imageUrl)}`
                                        : selectedCard.imageUrl}
                                    alt={`Card ${selectedCard.cardId}`}
                                    className="w-48 h-64 object-contain pixelated border-4 border-grey-700 bg-black rounded-lg"
                                    onError={e => {
                                        (e.target as HTMLImageElement).src = '/placeholder.svg'
                                    }}
                                />
                            </div>
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