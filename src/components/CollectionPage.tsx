"use client"

import { useState, useEffect } from "react"
import { useAppKitAccount, useAppKitProvider } from "@reown/appkit/react"
import { ethers } from "ethers"
import Card from "./Card"
import { Loader2, Search, Grid, List, ChevronDown, Grid3X3, LayoutGrid, Heart, ArrowUp, Columns, Rows } from "lucide-react"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Checkbox } from "./ui/checkbox"

// Contract addresses and ABIs
import cardContractABI from "../assets/abi/Bead151Card.json"
import routerContractABI from "../assets/abi/Bead151ArtRouter.json"
import candyContractABI from "../assets/abi/Bead151Candy.json"
import candyPerCardContractABI from "../assets/abi/Bead151CandyPerCard.json"

const cardContractAddress = import.meta.env.VITE_BEAD151_CARD_CONTRACT
const routerContractAddress = import.meta.env.VITE_BEAD151_CARD_ART_CONTRACT
const candyContractAddress = import.meta.env.VITE_BEAD151_CANDY_CONTRACT
const candyPerCardContractAddress = import.meta.env.VITE_BEAD151_CANDY_PER_CARD_CONTRACT

interface CardData {
    tokenId: number
    cardId: number
    svg: string
    description: string
}

interface CollectionCard extends CardData {
    count: number
}

interface CandyRates {
    candies3Cards: number[]
    candies5Cards: number[]
    candies6Cards: number[]
    candies7Cards: number[]
}

type ViewMode = 'large-grid' | 'small-grid' | 'list'

export default function CollectionPage() {
    const { address, isConnected } = useAppKitAccount()
    const { walletProvider } = useAppKitProvider("eip155")

    const [allCards, setAllCards] = useState<CardData[]>([])
    const [collectionCards, setCollectionCards] = useState<CollectionCard[]>([])
    const [selectedCard, setSelectedCard] = useState<CollectionCard | null>(null)
    const [isLoading, setIsLoading] = useState<boolean>(false)
    const [searchTerm, setSearchTerm] = useState<string>("")
    const [viewMode, setViewMode] = useState<ViewMode>('large-grid')
    const [hideDuplicates, setHideDuplicates] = useState<boolean>(false)
    const [showOnlyDuplicates, setShowOnlyDuplicates] = useState<boolean>(false)
    const [useSideBySideLayout, setUseSideBySideLayout] = useState<boolean>(true)

    // Set responsive default view mode on component mount
    useEffect(() => {
        if (typeof window !== 'undefined' && window.innerWidth < 768) {
            setViewMode('small-grid')
        }
    }, [])
    const [userCandyBalance, setUserCandyBalance] = useState<number>(0)
    const [candyRates, setCandyRates] = useState<CandyRates>({
        candies3Cards: [],
        candies5Cards: [],
        candies6Cards: [],
        candies7Cards: []
    })
    const [showDoctorModal, setShowDoctorModal] = useState<boolean>(false)
    const [isLoadingCandy, setIsLoadingCandy] = useState<boolean>(false)

    useEffect(() => {
        if (isConnected && address) {
            fetchUserCollection()
            fetchCandyData()
        }
    }, [isConnected, address])

    const fetchCandyData = async () => {
        if (!walletProvider || !address) return

        setIsLoadingCandy(true)
        try {
            const ethersProvider = new ethers.BrowserProvider(walletProvider as ethers.Eip1193Provider)
            const candyContract = new ethers.Contract(candyContractAddress, candyContractABI, ethersProvider)
            const candyPerCardContract = new ethers.Contract(candyPerCardContractAddress, candyPerCardContractABI, ethersProvider)

            // Get user's candy balance (token ID 0 for candies)
            const candyBalance = await candyContract.balanceOf(address, 1)
            setUserCandyBalance(Number(candyBalance))

            // Get candy rates for different card types
            const [candies3Cards, candies5Cards, candies6Cards, candies7Cards] = await Promise.all([
                candyPerCardContract.getCandies3Cards(),
                candyPerCardContract.getCandies5Cards(),
                candyPerCardContract.getCandies6Cards(),
                candyPerCardContract.getCandies7Cards()
            ])

            setCandyRates({
                candies3Cards: candies3Cards.map((id: any) => Number(id)),
                candies5Cards: candies5Cards.map((id: any) => Number(id)),
                candies6Cards: candies6Cards.map((id: any) => Number(id)),
                candies7Cards: candies7Cards.map((id: any) => Number(id))
            })

        } catch (error) {
            console.error("Error fetching candy data:", error)
        }
        setIsLoadingCandy(false)
    }

    const getCandyReward = (cardId: number): number => {
        if (candyRates.candies7Cards.includes(cardId)) return 7
        if (candyRates.candies6Cards.includes(cardId)) return 6
        if (candyRates.candies5Cards.includes(cardId)) return 5
        if (candyRates.candies3Cards.includes(cardId)) return 3
        return 0 // Default if card not found in any array
    }

    const handleSendToDoctor = async () => {
        if (!selectedCard || !walletProvider) return

        try {
            const ethersProvider = new ethers.BrowserProvider(walletProvider as ethers.Eip1193Provider)
            const signer = await ethersProvider.getSigner()
            const cardContract = new ethers.Contract(cardContractAddress, cardContractABI, signer)

            const tx = await cardContract.sendToDoctor(selectedCard.tokenId)
            console.log("token id sent to doctor:", selectedCard.tokenId)
            console.log("Card id sent to doctor:", selectedCard.cardId)
            await tx.wait()

            // Refresh collection and candy balance
            await Promise.all([fetchUserCollection(), fetchCandyData()])
            setSelectedCard(null)
            setShowDoctorModal(false)
        } catch (error) {
            console.error("Error sending card to doctor:", error)
        }
    }

    const handleCardClick = (card: CollectionCard) => {
        if (selectedCard?.tokenId === card.tokenId) {
            // If clicking the same card, deselect it
            setSelectedCard(null)
        } else {
            // Otherwise, select the new card
            setSelectedCard(card)
        }
    }

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
        return [...cards].sort((a, b) => a.cardId - b.cardId) // Always sort by cardId ascending
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

        // Show only duplicates if checkbox is checked (cards with count > 1)
        if (showOnlyDuplicates) {
            cards = cards.filter(card => card.count > 1)
        }

        // Sort cards
        return sortCards(cards)
    })()

    const totalCards = allCards.length
    const uniqueCards = new Set(allCards.map(card => card.cardId)).size

    const getGridClasses = () => {
        const isSideBySide = useSideBySideLayout && window.innerWidth >= 1024
        
        switch (viewMode) {
            case 'large-grid':
                return isSideBySide 
                    ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4'
                    : 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4'
            case 'small-grid':
                return isSideBySide
                    ? 'grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-2'
                    : 'grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-2'
            case 'list':
                return 'space-y-4'
            default:
                return isSideBySide 
                    ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4'
                    : 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4'
        }
    }

    if (!isConnected) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-teal-900 via-cyan-800 to-teal-900 pt-4 md:pt-20 px-4">
                <div className="max-w-6xl mx-auto text-center">
                    <h1 className="text-4xl font-bold text-yellow-300 mb-8 font-mono">BEAD151 COLLECTION</h1>
                    <div className="bg-teal-800 border-4 border-yellow-300 rounded-lg p-8">
                        <p className="text-yellow-300 text-xl font-mono">Connect your wallet to view your collection</p>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-teal-900 via-cyan-800 to-teal-900 pt-4 md:pt-20 px-4">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl md:text-5xl font-bold text-yellow-300 mb-4 font-mono tracking-wider">
                        BEAD151 COLLECTION
                    </h1>
                    <p className="text-xl text-cyan-300 font-mono">Your Trading Card Collection</p>
                </div>

                {/* Stats */}
                <div className="bg-teal-800 border-4 border-yellow-300 rounded-lg p-6 mb-8">
                    <div className="flex justify-center items-center">
                        <div className="flex gap-2 sm:gap-4 md:gap-8 text-center">
                            <div className="bg-black border-2 border-gray-400 rounded p-2 sm:p-3 md:p-4 flex-1 min-w-0">
                                <div className="text-green-400 font-mono text-center">
                                    <div className="text-xs sm:text-sm mb-1 sm:mb-2">TOTAL CARDS</div>
                                    <div className="text-lg sm:text-xl md:text-2xl font-bold tracking-widest">{totalCards.toString().padStart(3, '0')}</div>
                                </div>
                            </div>
                            <div className="bg-black border-2 border-gray-400 rounded p-2 sm:p-3 md:p-4 flex-1 min-w-0">
                                <div className="text-green-400 font-mono text-center">
                                    <div className="text-xs sm:text-sm mb-1 sm:mb-2">UNIQUE CARDS</div>
                                    <div className="text-lg sm:text-xl md:text-2xl font-bold tracking-widest">{uniqueCards.toString().padStart(3, '0')}</div>
                                </div>
                            </div>
                            <div className="bg-black border-2 border-gray-400 rounded p-2 sm:p-3 md:p-4 flex-1 min-w-0">
                                <div className="text-green-400 font-mono text-center">
                                    <div className="text-xs sm:text-sm mb-1 sm:mb-2">CANDIES</div>
                                    <div className="text-lg sm:text-xl md:text-2xl font-bold tracking-widest">{userCandyBalance.toString().padStart(3, '0')}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Loading State */}
                {isLoading && (
                    <div className="text-center py-8">
                        <Loader2 className="h-8 w-8 text-yellow-300 animate-spin mx-auto mb-4" />
                        <p className="text-yellow-300 font-mono">Loading collection...</p>
                    </div>
                )}

                {/* Empty State */}
                {!isLoading && collectionCards.length === 0 && (
                    <div className="text-center py-12">
                        <div className="bg-teal-800 border-4 border-yellow-300 rounded-lg p-8">
                            <p className="text-xl text-yellow-300 mb-4 font-mono">No cards found in your collection</p>
                            <p className="text-cyan-300 font-mono">Open some packs to start collecting!</p>
                        </div>
                    </div>
                )}

                {/* Combined Controls and Card Collection */}
                {!isLoading && collectionCards.length > 0 && (
                    <div className={`flex flex-col gap-8 ${useSideBySideLayout ? 'lg:flex-row lg:items-stretch' : ''}`}>
                        {/* Selected Card Section - Always Visible */}
                        <div className={`${useSideBySideLayout ? 'lg:w-1/3' : ''} flex`}>
                            <div className="bg-teal-800 border-4 border-yellow-300 rounded-lg p-6 w-full">
                                <h2 className="text-2xl font-bold text-yellow-300 mb-6 font-mono text-center">
                                    SELECTED CARD
                                </h2>
                                <div className="flex flex-col items-center gap-2 md:gap-6">
                                    {/* Card Display */}
                                    <div className="flex-shrink-0">
                                        <div className="w-48 h-46 md:h-64">
                                            {selectedCard ? (
                                                <Card 
                                                    cardData={selectedCard}
                                                    showBackDefault={false}
                                                    disableFlip={false}
                                                    forceShowFront={false}
                                                    scaleIfHover={false}
                                                />
                                            ) : (
                                                <div className="w-full h-full bg-gray-600 border-2 border-gray-400 rounded-lg flex flex-col items-center justify-center">
                                                    <div className="text-gray-400 font-mono text-center">
                                                        <div className="text-lg mb-2">📋</div>
                                                        <div className="text-sm">SELECT A CARD</div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    
                                    {/* Card Info */}
                                    <div className="text-center text-cyan-300 font-mono">
                                        <h3 className="text-xl font-bold mb-2">
                                            {selectedCard ? (() => {
                                                try {
                                                    const traits = JSON.parse(selectedCard.description)
                                                    const cardTrait = traits.find((trait: any) => trait.trait_type === "Card")
                                                    return cardTrait ? cardTrait.value : `Card #${selectedCard.cardId}`
                                                } catch {
                                                    return `Card #${selectedCard.cardId}`
                                                }
                                            })() : "No Card Selected"}
                                        </h3>
                                        {!selectedCard && (
                                            <p className="text-sm mb-4">
                                                Click on a card below to select it
                                            </p>
                                        )}
                                    </div>
                                    
                                    {/* Card Actions */}
                                    <div className="flex flex-row sm:flex-row gap-2 sm:gap-4 w-full px-2 sm:px-0">
                                        <Button
                                            onClick={() => selectedCard && setShowDoctorModal(true)}
                                            disabled={!selectedCard}
                                            className={`flex-1 border-4 font-mono font-bold py-2 sm:py-3 text-xs sm:text-sm lg:text-xs xl:text-sm ${
                                                selectedCard 
                                                    ? 'bg-red-600 hover:bg-red-700 border-red-400 text-white'
                                                    : 'bg-gray-600 border-gray-400 text-gray-300 cursor-not-allowed'
                                            }`}
                                        >
                                            <Heart className="w-4 h-4 mr-1 sm:mr-2" />
                                            SEND
                                        </Button>
                                        <Button
                                            disabled
                                            className="flex-1 bg-gray-600 border-4 border-gray-400 text-gray-300 font-mono font-bold py-2 sm:py-3 text-xs sm:text-sm lg:text-xs xl:text-sm cursor-not-allowed"
                                        >
                                            <ArrowUp className="w-4 h-4 mr-1 sm:mr-2" />
                                            UPGRADE
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Card Collection */}
                        <div className={`${useSideBySideLayout ? 'lg:w-2/3' : ''} flex`}>
                            <div className="bg-teal-800 border-4 border-yellow-300 rounded-lg p-6 w-full">
                                <div className="flex justify-between items-center mb-6">
                                    <div className="w-16"></div> {/* Spacer for balance */}
                                    <h2 className="text-2xl font-bold text-yellow-300 font-mono text-center flex-1">
                                        CARD COLLECTION
                                    </h2>
                                    
                                    {/* Layout Toggle - Only show on desktop */}
                                    <div className="hidden lg:flex items-center space-x-1 w-16 justify-end">
                                        <button
                                            onClick={() => setUseSideBySideLayout(true)}
                                            className={`p-2 border-2 rounded ${useSideBySideLayout ? 'bg-cyan-600 border-cyan-400' : 'bg-teal-700 border-gray-400'} text-yellow-300 transition-colors`}
                                            title="Side by Side Layout"
                                        >
                                            <Columns className="h-4 w-4" />
                                        </button>
                                        <button
                                            onClick={() => setUseSideBySideLayout(false)}
                                            className={`p-2 border-2 rounded ${!useSideBySideLayout ? 'bg-cyan-600 border-cyan-400' : 'bg-teal-700 border-gray-400'} text-yellow-300 transition-colors`}
                                            title="Stacked Layout"
                                        >
                                            <Rows className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                        
                                {/* Controls */}
                        <div className="flex flex-col gap-4 mb-8">
                            {/* Search */}
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-yellow-300 h-4 w-4" />
                                <Input
                                    type="text"
                                    placeholder="Search cards, rarity, color..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10 bg-black border-2 border-gray-400 text-green-400 placeholder-gray-400 font-mono"
                                />
                            </div>
                            
                            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                                {/* Filter Checkboxes */}
                                <div className="flex flex-col sm:flex-row gap-4">
                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id="hideDuplicates"
                                            checked={hideDuplicates}
                                            disabled={showOnlyDuplicates}
                                            onCheckedChange={(checked) => {
                                                setHideDuplicates(checked as boolean)
                                                if (checked) setShowOnlyDuplicates(false)
                                            }}
                                            className="border-yellow-300 data-[state=checked]:bg-cyan-600 data-[state=checked]:border-cyan-600"
                                        />
                                        <label htmlFor="hideDuplicates" className={`text-xs sm:text-sm cursor-pointer font-mono ${showOnlyDuplicates ? 'text-gray-400' : 'text-yellow-300'}`}>
                                            HIDE DUPLICATES
                                        </label>
                                    </div>
                                    
                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id="showOnlyDuplicates"
                                            checked={showOnlyDuplicates}
                                            disabled={hideDuplicates}
                                            onCheckedChange={(checked) => {
                                                setShowOnlyDuplicates(checked as boolean)
                                                if (checked) setHideDuplicates(false)
                                            }}
                                            className="border-yellow-300 data-[state=checked]:bg-cyan-600 data-[state=checked]:border-cyan-600"
                                        />
                                        <label htmlFor="showOnlyDuplicates" className={`text-xs sm:text-sm cursor-pointer font-mono ${hideDuplicates ? 'text-gray-400' : 'text-yellow-300'}`}>
                                            SHOW ONLY DUPLICATES
                                        </label>
                                    </div>
                                </div>

                                {/* View Mode Buttons */}
                                <div className="flex border-2 border-yellow-300 rounded-lg overflow-hidden">
                                    <Button
                                        onClick={() => setViewMode('large-grid')}
                                        className={`${viewMode === 'large-grid' ? 'bg-cyan-600 border-cyan-400' : 'bg-teal-700 border-gray-400'} text-yellow-300 font-mono border-2`}
                                        size="sm"
                                    >
                                        <LayoutGrid className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        onClick={() => setViewMode('small-grid')}
                                        className={`${viewMode === 'small-grid' ? 'bg-cyan-600 border-cyan-400' : 'bg-teal-700 border-gray-400'} text-yellow-300 font-mono border-2`}
                                        size="sm"
                                    >
                                        <Grid3X3 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* Card Grid */}
                        {filteredAndSortedCards.length > 0 ? (
                            <div className="max-h-72 overflow-y-auto">
                                <div className={getGridClasses()}>
                                    {filteredAndSortedCards.map((card, index) => (
                                        <div 
                                            key={`${card.cardId}-${card.tokenId}-${index}`} 
                                            className={`
                                                relative cursor-pointer transition-all duration-300 p-2 rounded-lg border-2
                                                ${selectedCard?.tokenId === card.tokenId 
                                                    ? 'border-yellow-300 bg-yellow-900/30' 
                                                    : 'border-transparent hover:border-cyan-400'
                                                }
                                            `}
                                            onClick={() => handleCardClick(card)}
                                        >
                                            <Card 
                                                cardData={card} 
                                                showBackDefault={false} 
                                                disableFlip={true}
                                                forceShowFront={true}
                                                scaleIfHover={false}
                                            />
                                  
                                  
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            /* Search Results - No matches */
                            searchTerm && (
                                <div className="text-center py-12">
                                    <p className="text-xl text-yellow-300 mb-2 font-mono">No cards match your search</p>
                                    <p className="text-cyan-300 font-mono">Try searching for a different card name, rarity, or color</p>
                                </div>
                            )
                        )}
                            </div>
                        </div>
                    </div>
                )}

            {/* Doctor Modal */}
            {showDoctorModal && selectedCard && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                    <div className="bg-teal-800 border-4 border-yellow-300 rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
                        <div className="text-center space-y-4">
                            <h2 className="text-2xl font-bold text-yellow-300 font-mono">
                                SEND TO DOCTOR
                            </h2>
                            
                            <div className="flex justify-center mb-8">
                                <div className="w-48 h-42 md:h-62 overflow-hidden">
                                    <Card 
                                        cardData={selectedCard}
                                        showBackDefault={false}
                                        disableFlip={false}
                                        forceShowFront={false}
                                        scaleIfHover={false}
                                    />
                                </div>
                            </div>

                            <div className="text-cyan-300 font-mono space-y-3 px-2 mt-4">
                                <p className="text-base">
                                    Send Bead151 to doctor and receive{' '}
                                    <span className="text-yellow-300 font-bold">
                                        {getCandyReward(selectedCard.cardId)} candies
                                    </span>
                                </p>
                                <p className="text-sm text-orange-300 leading-relaxed">
                                    ⚠️ WARNING: If sent to doctor the Bead151 is burned forever and cannot be recovered.
                                </p>
                            </div>

                            <div className="flex gap-4 pt-4">
                                <Button
                                    onClick={handleSendToDoctor}
                                    className="flex-1 bg-red-600 hover:bg-red-700 border-4 border-red-400 text-white font-mono font-bold py-3"
                                >
                                    CONFIRM
                                </Button>
                                <Button
                                    onClick={() => setShowDoctorModal(false)}
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
                    font-family: 'PokemonGB';
                    src: url('/fonts/PokemonGb-RAeo.ttf') format('truetype');
                }
                
                .font-mono {
                    font-family: 'PokemonGB', monospace;
                }
                
                /* Custom select styling for retro look */
                select {
                    background-image: none;
                    appearance: none;
                    -webkit-appearance: none;
                    -moz-appearance: none;
                }
            `}</style>
            </div>
        </div>
    )
}