"use client"

import { useState, useEffect } from "react"
import { useAppKitAccount, useAppKitProvider } from "@reown/appkit/react"
import { ethers } from "ethers"
import PopoutCard from "./PopoutCard"
import { Loader2, Search, Grid, List, ChevronDown, Grid3X3, LayoutGrid } from "lucide-react"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Checkbox } from "./ui/checkbox"

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

type SortOption = 'cardId-asc' | 'cardId-desc' | 'rarity-asc' | 'rarity-desc'
type ViewMode = 'large-grid' | 'small-grid' | 'list'

export default function CollectionPage() {
    const { address, isConnected } = useAppKitAccount()
    const { walletProvider } = useAppKitProvider("eip155")

    const [allCards, setAllCards] = useState<CardData[]>([])
    const [collectionCards, setCollectionCards] = useState<CollectionCard[]>([])
    const [isLoading, setIsLoading] = useState<boolean>(false)
    const [searchTerm, setSearchTerm] = useState<string>("")
    const [viewMode, setViewMode] = useState<ViewMode>('large-grid')
    const [sortBy, setSortBy] = useState<SortOption>('cardId-asc')
    const [hideDuplicates, setHideDuplicates] = useState<boolean>(false)

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
            const [tokenIds, cardIds] = await cardContract.getUserCards(userAddress)
            console.log("✅ User cards fetched:", { tokenIds: tokenIds, cardIds: cardIds })
            
            if (cardIds.length === 0) {
                console.log("📭 User has no cards")
                return []
            }

            const cardIdsArray = Array.from(cardIds).map(id => Number(id))
            const tokenIdsArray = Array.from(tokenIds).map(id => Number(id))
            
            console.log("🔄 Converted arrays:", { tokenIdsArray, cardIdsArray })

            console.log("🎴 Fetching SVGs and metadata in batch...")
            const [svgs, metadata] = await routerContract.renderAndMetaBatch(cardIdsArray)
            console.log("✅ Batch data fetched successfully")

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
        console.log("🔄 Processing collection cards...")
        
        // For showing duplicates: create an array with all cards but mark duplicates
        const cardMap = new Map<number, number>() // cardId -> count
        cards.forEach(card => {
            cardMap.set(card.cardId, (cardMap.get(card.cardId) || 0) + 1)
        })

        const allCardsWithCount: CollectionCard[] = cards.map(card => ({
            ...card,
            count: cardMap.get(card.cardId) || 1
        }))

        console.log("✅ Processed collection:", allCardsWithCount.length, "total cards")
        setCollectionCards(allCardsWithCount)
    }

    const getRarityValue = (description: string): string => {
        try {
            const traits = JSON.parse(description)
            const rarityTrait = traits.find((trait: any) => trait.trait_type === "Rarity")
            return rarityTrait ? rarityTrait.value : "Unknown"
        } catch {
            return "Unknown"
        }
    }

    const getCardTitle = (description: string, cardId: number): string => {
        try {
            const traits = JSON.parse(description)
            const cardTrait = traits.find((trait: any) => trait.trait_type === "Card")
            return cardTrait ? cardTrait.value : `Card #${cardId}`
        } catch {
            return `Card #${cardId}`
        }
    }

    const sortCards = (cards: CollectionCard[]): CollectionCard[] => {
        return [...cards].sort((a, b) => {
            switch (sortBy) {
                case 'cardId-asc':
                    return a.cardId - b.cardId
                case 'cardId-desc':
                    return b.cardId - a.cardId
                case 'rarity-asc':
                    return getRarityValue(a.description).localeCompare(getRarityValue(b.description))
                case 'rarity-desc':
                    return getRarityValue(b.description).localeCompare(getRarityValue(a.description))
                default:
                    return 0
            }
        })
    }

    const filteredAndSortedCards = (() => {
        let cards = collectionCards

        // Filter by search term (including description search)
        if (searchTerm) {
            cards = cards.filter(card => {
                try {
                    const traits = JSON.parse(card.description)
                    const cardTitle = getCardTitle(card.description, card.cardId)
                    const rarity = getRarityValue(card.description)
                    const colorTrait = traits.find((trait: any) => trait.trait_type === "Color")
                    const color = colorTrait ? colorTrait.value : ""
                    
                    const searchLower = searchTerm.toLowerCase()
                    return cardTitle.toLowerCase().includes(searchLower) ||
                           rarity.toLowerCase().includes(searchLower) ||
                           color.toLowerCase().includes(searchLower) ||
                           card.cardId.toString().includes(searchTerm) ||
                           card.description.toLowerCase().includes(searchLower)
                } catch {
                    return card.cardId.toString().includes(searchTerm)
                }
            })
        }

        // Hide duplicates if checkbox is checked
        if (hideDuplicates) {
            const seenCardIds = new Set<number>()
            cards = cards.filter(card => {
                if (seenCardIds.has(card.cardId)) {
                    return false
                }
                seenCardIds.add(card.cardId)
                return true
            })
        }

        // Sort cards
        return sortCards(cards)
    })()

    const totalCards = allCards.length
    const uniqueCards = new Set(allCards.map(card => card.cardId)).size

    const getGridClasses = () => {
        switch (viewMode) {
            case 'large-grid':
                return 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4'
            case 'small-grid':
                return 'grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-2'
            case 'list':
                return 'space-y-4'
            default:
                return 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4'
        }
    }

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
                    <div className="flex flex-col gap-6">
                        {/* Stats */}
                        <div className="flex gap-8 text-center justify-center">
                            <div>
                                <p className="text-2xl font-bold text-white">{totalCards}</p>
                                <p className="text-gray-400">Total Cards</p>
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-white">{uniqueCards}</p>
                                <p className="text-gray-400">Unique Cards</p>
                            </div>
                        </div>

                        {/* Controls */}
                        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                            {/* Search */}
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                                <Input
                                    type="text"
                                    placeholder="Search cards, rarity, color..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10 bg-white/10 border-white/20 text-white placeholder-gray-400 w-80"
                                />
                            </div>
                            
                            <div className="flex gap-4 items-center">
                                {/* Hide Duplicates Checkbox */}
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="hideDuplicates"
                                        checked={hideDuplicates}
                                        onCheckedChange={(checked) => setHideDuplicates(checked as boolean)}
                                        className="border-white/20 data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600"
                                    />
                                    <label htmlFor="hideDuplicates" className="text-sm text-white cursor-pointer">
                                        Hide duplicates
                                    </label>
                                </div>

                                {/* Sort Dropdown */}
                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value as SortOption)}
                                    className="bg-white/10 border border-white/20 text-white rounded-lg px-3 py-2 text-sm"
                                >
                                    <option value="cardId-asc">Card ID ↑</option>
                                    <option value="cardId-desc">Card ID ↓</option>
                                    <option value="rarity-asc">Rarity A-Z</option>
                                    <option value="rarity-desc">Rarity Z-A</option>
                                </select>

                                {/* View Mode Buttons */}
                                <div className="flex border border-white/20 rounded-lg overflow-hidden">
                                    <Button
                                        onClick={() => setViewMode('large-grid')}
                                        variant={viewMode === 'large-grid' ? 'default' : 'outline'}
                                        size="sm"
                                        className={`${viewMode === 'large-grid' ? 'bg-purple-600' : 'bg-transparent border-0'} text-white`}
                                        title="Large Grid"
                                    >
                                        <LayoutGrid className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        onClick={() => setViewMode('small-grid')}
                                        variant={viewMode === 'small-grid' ? 'default' : 'outline'}
                                        size="sm"
                                        className={`${viewMode === 'small-grid' ? 'bg-purple-600' : 'bg-transparent border-0'} text-white`}
                                        title="Small Grid"
                                    >
                                        <Grid3X3 className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        onClick={() => setViewMode('list')}
                                        variant={viewMode === 'list' ? 'default' : 'outline'}
                                        size="sm"
                                        className={`${viewMode === 'list' ? 'bg-purple-600' : 'bg-transparent border-0'} text-white`}
                                        title="List View"
                                    >
                                        <List className="h-4 w-4" />
                                    </Button>
                                </div>
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
        {!isLoading && filteredAndSortedCards.length > 0 && (
                    <div className={getGridClasses()}>
                        {filteredAndSortedCards.map((card, index) => (
                            <div key={`${card.cardId}-${card.tokenId}-${index}`} className="relative">
                                <PopoutCard cardData={card} showBackDefault={false} />
                            </div>
                        ))}
                    </div>
                )}

                {/* Search Results */}
                {!isLoading && searchTerm && filteredAndSortedCards.length === 0 && collectionCards.length > 0 && (
                    <div className="text-center py-12">
                        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
                            <p className="text-xl text-gray-300 mb-2">No cards match your search</p>
                            <p className="text-gray-400">Try searching for a different card name, rarity, or color</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}