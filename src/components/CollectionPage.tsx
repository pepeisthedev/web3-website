"use client"

import { useState, useEffect } from "react"
import { useAppKitAccount, useAppKitProvider } from "@reown/appkit/react"
import { ethers } from "ethers"
import Card from "./Card"
import { Loader2, Search, Grid, List } from "lucide-react"
import { Button } from "./ui/button"
import { Input } from "./ui/input"

// Contract addresses and ABIs - adjust these imports as needed
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

interface CollectionCard extends CardData {
    count: number
}

export default function CollectionPage() {
    const { address, isConnected } = useAppKitAccount()
    const { walletProvider } = useAppKitProvider("eip155")

    const [allCards, setAllCards] = useState<CardData[]>([])
    const [collectionCards, setCollectionCards] = useState<CollectionCard[]>([])
    const [isLoading, setIsLoading] = useState<boolean>(false)
    const [searchTerm, setSearchTerm] = useState<string>("")
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

    useEffect(() => {
        if (isConnected && address) {
            fetchUserCollection()
        }
    }, [isConnected, address])

    
    const fetchAllUserCards = async (userAddress: string): Promise<CardData[]> => {
        console.log("🔍 Fetching user collection for address:", userAddress)
        
        if (!walletProvider || !userAddress) {
            console.log("❌ No wallet provider or address")
            return []
        }
    
        const ethersProvider = new ethers.BrowserProvider(walletProvider as ethers.Eip1193Provider)
        const cardContract = new ethers.Contract(cardContractAddress, cardContractABI, ethersProvider)
        const routerContract = new ethers.Contract(routerContractAddress, routerContractABI, ethersProvider)
        
        try {
            console.log("📋 Getting user cards from contract...")
            // Step 1: Get all user's tokenIds and cardIds in one call
            const [tokenIds, cardIds] = await cardContract.getUserCards(userAddress)
            console.log("✅ User cards fetched:", { tokenIds: tokenIds, cardIds: cardIds })
            
            if (cardIds.length === 0) {
                console.log("📭 User has no cards")
                return [] // User has no cards
            }
    
            // Convert BigInt arrays to regular number arrays
            const cardIdsArray = Array.from(cardIds).map(id => Number(id))
            const tokenIdsArray = Array.from(tokenIds).map(id => Number(id))
            
            console.log("🔄 Converted arrays:", { tokenIdsArray, cardIdsArray })
    
            console.log("🎴 Fetching SVGs and metadata in batch...")
            // Step 2: Use router to fetch all SVGs and metadata in one batch call
            const [svgs, metadata] = await routerContract.renderAndMetaBatch(cardIdsArray)
            console.log("✅ Batch data fetched successfully")
    
            // Step 3: Combine everything into CardData array
            const allCardData: CardData[] = cardIdsArray.map((cardId: number, index: number) => ({
                tokenId: tokenIdsArray[index],
                cardId: cardId,
                svg: svgs[index] || "",
                description: metadata[index] || `Card #${cardId}`,
            }))
    
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
            const cards = await fetchAllUserCards(address)
            setAllCards(cards)
            processCollectionCards(cards)
        } catch (error) {
            console.error("Error fetching collection:", error)
        }
        setIsLoading(false)
    }

    const processCollectionCards = (cards: CardData[]) => {
        console.log("🔄 Processing collection cards for duplicates...")
        
        // Group cards by cardId and count duplicates
        const cardMap = new Map<number, CollectionCard>()
        
        cards.forEach(card => {
            if (cardMap.has(card.cardId)) {
                const existing = cardMap.get(card.cardId)!
                existing.count += 1
            } else {
                cardMap.set(card.cardId, {
                    ...card,
                    count: 1
                })
            }
        })

        const uniqueCards = Array.from(cardMap.values())
        console.log("✅ Processed collection:", uniqueCards.length, "unique cards")
        setCollectionCards(uniqueCards)
    }

    const filteredCards = collectionCards.filter(card => {
        if (!searchTerm) return true
        
        try {
            const traits = JSON.parse(card.description)
            const cardTrait = traits.find((trait: any) => trait.trait_type === "Card")
            const cardTitle = cardTrait ? cardTrait.value : `Card #${card.cardId}`
            const rarityTrait = traits.find((trait: any) => trait.trait_type === "Rarity")
            const rarity = rarityTrait ? rarityTrait.value : ""
            
            return cardTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
                   rarity.toLowerCase().includes(searchTerm.toLowerCase()) ||
                   card.cardId.toString().includes(searchTerm)
        } catch {
            return card.cardId.toString().includes(searchTerm)
        }
    })

    const totalCards = allCards.length
    const uniqueCards = collectionCards.length

    if (!isConnected) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 pt-20 px-4">
                <div className="max-w-6xl mx-auto text-center">
                    <h1 className="text-4xl md:text-5xl font-bold text-white mb-8">Bead151 DEX</h1>
                    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
                        <p className="text-xl text-gray-300 mb-6">Connect your wallet to view your card collection</p>
                        <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white">
                            Connect Wallet
                        </Button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 pt-20 px-4">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Bead151 DEX</h1>
                    <p className="text-xl text-gray-300">Your Card Collection</p>
                </div>

                {/* Stats and Controls */}
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 mb-8">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                        {/* Stats */}
                        <div className="flex gap-8 text-center">
                            <div>
                                <p className="text-2xl font-bold text-white">{totalCards}</p>
                                <p className="text-gray-400">Total Cards</p>
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-white">{uniqueCards}</p>
                                <p className="text-gray-400">Unique Cards</p>
                            </div>
                        </div>

                        {/* Search and View Controls */}
                        <div className="flex gap-4 items-center">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                                <Input
                                    type="text"
                                    placeholder="Search cards..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10 bg-white/10 border-white/20 text-white placeholder-gray-400 w-64"
                                />
                            </div>
                            
                            <div className="flex border border-white/20 rounded-lg overflow-hidden">
                                <Button
                                    onClick={() => setViewMode('grid')}
                                    variant={viewMode === 'grid' ? 'default' : 'outline'}
                                    size="sm"
                                    className={`${viewMode === 'grid' ? 'bg-purple-600' : 'bg-transparent border-0'} text-white`}
                                >
                                    <Grid className="h-4 w-4" />
                                </Button>
                                <Button
                                    onClick={() => setViewMode('list')}
                                    variant={viewMode === 'list' ? 'default' : 'outline'}
                                    size="sm"
                                    className={`${viewMode === 'list' ? 'bg-purple-600' : 'bg-transparent border-0'} text-white`}
                                >
                                    <List className="h-4 w-4" />
                                </Button>
                            </div>
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

                {/* Empty State */}
                {!isLoading && collectionCards.length === 0 && (
                    <div className="text-center py-12">
                        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
                            <p className="text-xl text-gray-300 mb-4">No cards found in your collection</p>
                            <p className="text-gray-400">Open some packs to start collecting!</p>
                        </div>
                    </div>
                )}

                {/* Card Grid */}
                {!isLoading && filteredCards.length > 0 && (
                    <div className={`${viewMode === 'grid' 
                        ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4' 
                        : 'space-y-4'
                    }`}>
                        {filteredCards.map((card) => (
                            <div key={`${card.cardId}-${card.tokenId}`} className="relative">
                                <Card cardData={card} showBackDefault={false} />
                                {/* Card Count Badge */}
                                {card.count > 1 && (
                                    <div className="absolute -top-2 -right-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center border-2 border-white shadow-lg z-10">
                                        {card.count}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* Search Results */}
                {!isLoading && searchTerm && filteredCards.length === 0 && collectionCards.length > 0 && (
                    <div className="text-center py-12">
                        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
                            <p className="text-xl text-gray-300 mb-2">No cards match your search</p>
                            <p className="text-gray-400">Try searching for a different card name or rarity</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}