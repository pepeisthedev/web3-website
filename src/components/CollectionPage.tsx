"use client"

import { useState, useEffect } from "react"
// ...existing code...
import { useAppKitAccount, useAppKitProvider } from "@reown/appkit/react"
import { ethers } from "ethers"
import Card from "./Card"
import { Loader2, Search, Grid, List, ChevronDown, LayoutGrid, Heart, ArrowUp, Columns, Rows, Filter, X } from "lucide-react"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Checkbox } from "./ui/checkbox"

import { fetchAllUserCards } from "../lib/fetchAllUserCards"

// Contract addresses and ABIs
import cardContractABI from "../assets/abi/Bead151Card.json"
import candyContractABI from "../assets/abi/Bead151Candy.json"
import characterStatsContractABI from "../assets/abi/Bead151CharacterStats.json"
import cardArtSvgRouterContractABI from "../assets/abi/Bead151ArtRouter.json"

const cardContractAddress = import.meta.env.VITE_BEAD151_CARD_CONTRACT
const candyContractAddress = import.meta.env.VITE_BEAD151_CANDY_CONTRACT
const characterStatsContractAddress = import.meta.env.VITE_BEAD151_CHARACTER_STATS_CONTRACT
const svgContractAddress = import.meta.env.VITE_BEAD151_CARD_ART_CONTRACT

interface CardData {
    tokenId: number
    cardId: number
    metadata: string 
}

interface CollectionCard extends CardData {
    count: number
}

interface CharacterStat {
    cardId: number
    nextEvolutionCardId: number
    candiesIfBurned: number
    candiesToEvolve: number
    rarity: number
}

type ViewMode = 'large-grid' | 'dex' | 'list'

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
    const [showFilterMenu, setShowFilterMenu] = useState<boolean>(false)
    const [rarityFilters, setRarityFilters] = useState<{
        Common: boolean,
        Uncommon: boolean,
        Rare: boolean,
        Legendary: boolean
    }>({
        Common: true,
        Uncommon: true,
        Rare: true,
        Legendary: true
    })

    // Set responsive default view mode on component mount
    useEffect(() => {
        if (typeof window !== 'undefined' && window.innerWidth < 768) {
            setViewMode('dex')
        }
    }, [])
    const [userCandyBalance, setUserCandyBalance] = useState<number>(0)
    const [characterStats, setCharacterStats] = useState<Map<number, CharacterStat>>(new Map())
    const [showDoctorModal, setShowDoctorModal] = useState<boolean>(false)
    const [showEvolveModal, setShowEvolveModal] = useState<boolean>(false)
    const [showEvolutionResultModal, setShowEvolutionResultModal] = useState<boolean>(false)
    const [evolvedCardId, setEvolvedCardId] = useState<number>(0)
    const [evolvedCardData, setEvolvedCardData] = useState<{ svg: string } | null>(null)
    const [showCongratulationsModal, setShowCongratulationsModal] = useState<boolean>(false)
    const [candiesReceived, setCandiesReceived] = useState<number>(0)
    const [isLoadingCandy, setIsLoadingCandy] = useState<boolean>(false)

    useEffect(() => {
        if (isConnected && address) {
            fetchUserCollection()
            fetchCandyData()
        }
    }, [isConnected, address])

    const resetFilters = () => {
        setRarityFilters({
            Common: true,
            Uncommon: true,
            Rare: true,
            Legendary: true
        })
        setHideDuplicates(false)
        setShowOnlyDuplicates(false)
    }

    const getImageSrc = (svg: string) => {
        if (svg.startsWith("<svg")) {
            const encodedSvg = encodeURIComponent(svg)
            return `data:image/svg+xml,${encodedSvg}`
        }
        return svg
    }

      const getImageSrcFromMetadata = (metadata: string) => {
            try {
            const meta = JSON.parse(metadata)
            // meta.image is a data URI: data:image/svg+xml;base64,...
            return meta.image || "/placeholder.svg"
            } catch (e) {
            return "/placeholder.svg"
            }
        }

    const fetchCandyData = async () => {
        if (!walletProvider || !address) return

        setIsLoadingCandy(true)
        try {
            const ethersProvider = new ethers.BrowserProvider(walletProvider as ethers.Eip1193Provider)
            const candyContract = new ethers.Contract(candyContractAddress, candyContractABI, ethersProvider)
            const characterStatsContract = new ethers.Contract(characterStatsContractAddress, characterStatsContractABI, ethersProvider)

            // Get user's candy balance (token ID 1 for candies)
            console.log("Start fetch candies")
            const candyBalance = await candyContract.getCandyBalance(address)
            console.log("Fetched candy balance:", candyBalance.toString())
            setUserCandyBalance(Number(candyBalance))

            // Get all character stats in one call
            const allStats = await characterStatsContract.getAllStats()

            // Convert to Map for efficient lookup
            const statsMap = new Map<number, CharacterStat>()
            allStats.forEach((stat: any) => {
                const cardId = Number(stat.cardId)
                const nextEvolutionCardId = Number(stat.nextEvolutionCardId)
                const candiesIfBurned = Number(stat.candiesIfBurned)
                const candiesToEvolve = Number(stat.candiesToEvolve)
                const rarity = Number(stat.rarity)

                statsMap.set(cardId, {
                    cardId,
                    nextEvolutionCardId,
                    candiesIfBurned,
                    candiesToEvolve,
                    rarity
                })
            })

            setCharacterStats(statsMap)
            console.log("Character stats map:", statsMap)

        } catch (error) {
            console.error("Error fetching candy data:", error)
        }
        setIsLoadingCandy(false)
    }

    const getCandyReward = (cardId: number): number => {
        const stats = characterStats.get(cardId)
        return stats ? stats.candiesIfBurned : 0
    }

    const getEvolutionCost = (cardId: number): number => {
        const stats = characterStats.get(cardId)
        return stats ? stats.candiesToEvolve : 0
    }

    const getNextEvolutionCardId = (cardId: number): number => {
        const stats = characterStats.get(cardId)
        return stats ? stats.nextEvolutionCardId : 0
    }

    const canEvolve = (cardId: number): boolean => {
        const evolutionCost = getEvolutionCost(cardId)
        return evolutionCost > 0 && userCandyBalance >= evolutionCost
    }

    const getEvolveButtonText = (cardId: number): string => {
        const evolutionCost = getEvolutionCost(cardId)
        if (evolutionCost === 0) {
            return 'MAX EVOLVED'
        }
        if (userCandyBalance < evolutionCost) {
            return 'NEED CANDIES'
        }
        return 'EVOLVE'
    }

    // Fetches SVG from the svgContract and metadata from the user's collection (already loaded)
    const getCardDataById = async (cardId: number): Promise<{ svg: string } | null> => {
        try {
            // Dynamically import ABI if not already imported
            const ethersProvider = new ethers.BrowserProvider(walletProvider as ethers.Eip1193Provider)
            const svgContract = new ethers.Contract(svgContractAddress, cardArtSvgRouterContractABI, ethersProvider)

            // Fetch SVG from contract
            console.log("Fetching SVG for card ID:", cardId)
            const svg = await svgContract.render(cardId)

            return {
                svg
            }
        } catch (error) {
            console.error(`Error loading SVG/metadata for card ${cardId}:`, error)
            return null
        }
    }

    const handleEvolveCard = async () => {
        if (!selectedCard || !walletProvider) return

        try {
            const ethersProvider = new ethers.BrowserProvider(walletProvider as ethers.Eip1193Provider)
            const signer = await ethersProvider.getSigner()
            const candyContract = new ethers.Contract(candyContractAddress, candyContractABI, signer)

            console.log("Evolving card token id:", selectedCard.tokenId)
            const tx = await candyContract.evolveCard(selectedCard.tokenId)
   
            await tx.wait()

            // Show evolution result modal
            const nextCardId = getNextEvolutionCardId(selectedCard.cardId)
            setEvolvedCardId(nextCardId)
            
            // Fetch the evolved card data
            const evolvedData = await getCardDataById(nextCardId)
            setEvolvedCardData(evolvedData)
            
            setShowEvolutionResultModal(true)

            // Refresh collection and candy balance
            await Promise.all([fetchUserCollection(), fetchCandyData()])
            setSelectedCard(null)
            setShowEvolveModal(false)
        } catch (error) {
            console.error("Error evolving card:", error)
        }
    }

    const handleOpenEvolveModal = async () => {
        if (!selectedCard) return
        
        // Pre-load the evolved card data
        const nextCardId = getNextEvolutionCardId(selectedCard.cardId)
        const evolvedData = await getCardDataById(nextCardId)
        setEvolvedCardData(evolvedData)
        setShowEvolveModal(true)
    }

    const handleSendToDoctor = async () => {
        if (!selectedCard || !walletProvider) return

        try {
            const ethersProvider = new ethers.BrowserProvider(walletProvider as ethers.Eip1193Provider)
            const signer = await ethersProvider.getSigner()
            const cardContract = new ethers.Contract(cardContractAddress, cardContractABI, signer)

            // Get the candy reward before sending
            const candyReward = getCandyReward(selectedCard.cardId)

            const tx = await cardContract.sendToDoctor(selectedCard.tokenId)
            console.log("token id sent to doctor:", selectedCard.tokenId)
            console.log("Card id sent to doctor:", selectedCard.cardId)
            await tx.wait()

            // Show congratulations modal
            setCandiesReceived(candyReward)
            setShowCongratulationsModal(true)

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


    const fetchUserCollection = async () => {
        if (!address) return

        setIsLoading(true)
        try {
            const cards = await fetchAllUserCards(
                address,
                walletProvider
            )
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

    // New: get rarity and card title from metadata JSON
    const getRarityValue = (metadata: string): string => {
        try {
            const meta = JSON.parse(metadata)
            const attributes = meta.attributes || []
            const rarityTrait = attributes.find((trait: any) => trait.trait_type === "Rarity")
            return rarityTrait ? rarityTrait.value : "Unknown"
        } catch {
            return "Unknown"
        }
    }

    const getCardTitle = (metadata: string, cardId: number): string => {
        try {
            const meta = JSON.parse(metadata)
            const attributes = meta.attributes || []
            const cardTrait = attributes.find((trait: any) => trait.trait_type === "Card")
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

        // Filter by search term (including metadata search)
        if (searchTerm) {
            cards = cards.filter(card => {
                try {
                    const meta = JSON.parse(card.metadata)
                    const attributes = meta.attributes || []
                    const cardTitle = getCardTitle(card.metadata, card.cardId)
                    const rarity = getRarityValue(card.metadata)
                    const colorTrait = attributes.find((trait: any) => trait.trait_type === "Color")
                    const color = colorTrait ? colorTrait.value : ""

                    const searchLower = searchTerm.toLowerCase()
                    return cardTitle.toLowerCase().includes(searchLower) ||
                        rarity.toLowerCase().includes(searchLower) ||
                        color.toLowerCase().includes(searchLower) ||
                        card.cardId.toString().includes(searchTerm) ||
                        card.metadata.toLowerCase().includes(searchLower)
                } catch {
                    return card.cardId.toString().includes(searchTerm)
                }
            })
        }

        // Filter by rarity checkboxes
        const activeRarities = Object.entries(rarityFilters)
            .filter(([_, isActive]) => isActive)
            .map(([rarity, _]) => rarity)

        if (activeRarities.length < 4) { // Only filter if not all rarities are selected
            cards = cards.filter(card => {
                const rarity = getRarityValue(card.metadata)
                return activeRarities.includes(rarity)
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
                    ? 'grid grid-cols-2 sm:grid-cols-3 2xl:grid-cols-4'
                    : 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 2xl:grid-cols-5 3xl:grid-cols-6'
            case 'dex':
                return isSideBySide
                    ? 'grid grid-cols-6 sm:grid-cols-6 md:grid-cols-6 lg:grid-cols-6 xl:grid-cols-6 2xl:grid-cols-12 gap-1'
                    : 'grid grid-cols-4 sm:grid-cols-6 md:grid-cols-6 lg:grid-cols-6 xl:grid-cols-8 2xl:grid-cols-10'
            case 'list':
                return 'space-y-4'
            default:
                return isSideBySide
                    ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5'
                    : 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6'
        }
    }

    if (!isConnected) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-teal-900 via-cyan-800 to-teal-900 pt-8 md:pt-16 px-2 md:px-4">
                <div className="max-w-3xl mx-auto text-center">
                    <h1 className="text-2xl md:text-3xl font-bold text-yellow-300 mb-4 font-mono">BEAD151 COLLECTION</h1>
                    <div className="bg-teal-800 border-2 border-yellow-300 rounded-lg p-4 md:p-6">
                        <p className="text-yellow-300 text-base md:text-lg font-mono">Connect your wallet to view your collection</p>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-teal-900 via-cyan-800 to-teal-900 pt-20 md:pt-20 px-2 md:px-4">
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="text-center mb-4">
                    <h1 className="text-2xl md:text-3xl font-bold text-yellow-300 mb-2 font-mono tracking-wider">
                        BEAD151 COLLECTION
                    </h1>
                    <p className="text-base md:text-lg text-cyan-300 font-mono">Your Trading Card Collection</p>
                </div>

                {/* Stats */}
                <div className="bg-teal-800 border-2 border-yellow-300 rounded-lg p-3 md:p-4 mb-4">
                    <div className="flex justify-center items-center">
                        <div className="flex gap-2 sm:gap-3 md:gap-4 text-center">
                            <div className="bg-black border-2 border-gray-400 rounded p-2 flex-1 min-w-0">
                                <div className="text-green-400 font-mono text-center">
                                    <div className="text-xs mb-1">TOTAL</div>
                                    <div className="text-base md:text-lg font-bold tracking-widest">{totalCards.toString().padStart(3, '0')}</div>
                                </div>
                            </div>
                            <div className="bg-black border-2 border-gray-400 rounded p-2 flex-1 min-w-0">
                                <div className="text-green-400 font-mono text-center">
                                    <div className="text-xs mb-1">UNIQUE</div>
                                    <div className="text-base md:text-lg font-bold tracking-widest">{uniqueCards.toString().padStart(3, '0')}</div>
                                </div>
                            </div>
                            <div className="bg-black border-2 border-gray-400 rounded p-2 flex-1 min-w-0">
                                <div className="text-green-400 font-mono text-center">
                                    <div className="text-xs mb-1">CANDY</div>
                                    <div className="text-base md:text-lg font-bold tracking-widest">{userCandyBalance.toString().padStart(3, '0')}</div>
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
                                            {selectedCard ? getCardTitle(selectedCard.metadata, selectedCard.cardId) : "No Card Selected"}
                                        </h3>

                                        {selectedCard ? (
                                            <div className="space-y-2 text-sm">
                                                <div className="bg-black border-2 border-gray-400 rounded p-2">
                                                    <div className="text-orange-300 mb-1">🍬 BURN REWARD</div>
                                                    <div className="text-yellow-300 font-bold">
                                                        {getCandyReward(selectedCard.cardId)} Candies
                                                    </div>
                                                </div>
                                                <div className="bg-black border-2 border-gray-400 rounded p-2">
                                                    <div className="text-purple-300 mb-1">⚡ EVOLVE COST</div>
                                                    <div className="text-yellow-300 font-bold">
                                                        {getEvolutionCost(selectedCard.cardId) === 0
                                                            ? "Max evolved"
                                                            : `${getEvolutionCost(selectedCard.cardId)} Candies`
                                                        }
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <p className="text-sm mb-4">
                                                Click on a card below to select it
                                            </p>
                                        )}
                                    </div>

                                    {/* Card Actions */}
                                    <div className="flex flex-row sm:flex-row gap-2 sm:gap-4 w-full px-2 sm:px-0 flex-wrap">
                                        <Button
                                            onClick={() => selectedCard && setShowDoctorModal(true)}
                                            disabled={!selectedCard}
                                            className={`flex-1 min-w-[120px] border-4 font-mono font-bold py-2 sm:py-3 text-xs sm:text-sm lg:text-xs xl:text-sm ${selectedCard
                                                ? 'bg-red-600 hover:bg-red-700 border-red-400 text-white'
                                                : 'bg-gray-600 border-gray-400 text-gray-300 cursor-not-allowed'
                                                }`}
                                        >
                                            <Heart className="w-4 h-4 mr-1 sm:mr-2" />
                                            BURN
                                        </Button>
                                        <Button
                                            onClick={() => selectedCard && handleOpenEvolveModal()}
                                            disabled={!selectedCard || !canEvolve(selectedCard.cardId)}
                                            className={`flex-1 min-w-[140px] border-4 font-mono font-bold py-2 sm:py-3 text-xs sm:text-sm lg:text-xs xl:text-sm ${selectedCard && canEvolve(selectedCard.cardId)
                                                ? 'bg-purple-600 hover:bg-purple-700 border-purple-400 text-white'
                                                : 'bg-gray-600 border-gray-400 text-gray-300 cursor-not-allowed'
                                                }`}
                                        >
                                            <ArrowUp className="w-4 h-4 mr-1 sm:mr-2" />
                                            {selectedCard ? getEvolveButtonText(selectedCard.cardId) : 'CANNOT EVOLVE'}
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
                                        {/* Filter Button */}
                                        <div className="flex items-center">
                                            <Button
                                                onClick={() => setShowFilterMenu(true)}
                                                className="bg-teal-700 border-gray-400 hover:bg-cyan-600 hover:border-cyan-400 text-yellow-300 font-mono border-2 px-3 py-2"
                                                size="sm"
                                            >
                                                <Filter className="h-4 w-4 mr-2" />
                                                FILTERS
                                            </Button>
                                        </div>

                                        {/* View Mode Buttons */}
                                        <div className="flex gap-1 bg-black border-2 border-yellow-300 rounded-lg p-1">
                                            <Button
                                                onClick={() => setViewMode('large-grid')}
                                                className={`${viewMode === 'large-grid' ? 'bg-cyan-600 border-cyan-400' : 'bg-teal-700 border-gray-400'} text-yellow-300 font-mono border-2 px-3 py-2 min-w-[44px] flex items-center justify-center`}
                                                size="sm"
                                                title="Large Grid"
                                            >
                                                <LayoutGrid className="h-4 w-4 flex-shrink-0" />
                                            </Button>
                                            <Button
                                                onClick={() => setViewMode('dex')}
                                                className={`${viewMode === 'dex' ? 'bg-cyan-600 border-cyan-400' : 'bg-teal-700 border-gray-400'} text-yellow-300 font-mono border-2 px-3 py-2 min-w-[44px] flex items-center justify-center`}
                                                size="sm"
                                                title="Dex View (Thumbnails)"
                                            >
                                                <Grid className="h-4 w-4 flex-shrink-0" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>

                                {/* Card Grid */}
                                {filteredAndSortedCards.length > 0 ? (
                                    <div className="max-h-124 overflow-y-auto">
                                        <div className={getGridClasses()}>
                                            {filteredAndSortedCards.map((card, index) => (
                                                <div
                                                    key={`${card.cardId}-${card.tokenId}-${index}`}
                                                    className={`relative cursor-pointer transition-all duration-300 rounded-lg border-2
                                                ${viewMode === 'dex' ? 'p-0 sm:p-1' : 'p-1'}
                                                ${selectedCard?.tokenId === card.tokenId
                                                            ? 'border-yellow-300 bg-yellow-900/30'
                                                            : 'border-transparent hover:border-cyan-400'
                                                        }
                                            `}
                                                    onClick={() => handleCardClick(card)}
                                                >
                                                    {viewMode === 'dex' ? (
                                                        // Dex mode: small thumbnails with no metadata
                                                        <div
                                                            key={card.cardId}
                                                      
                                                            className="relative aspect-square rounded border-2 overflow-hidden transition-all duration-300 hover:scale-105 cursor-pointer bg-black border-yellow-300 shadow-lg hover:border-cyan-300"

                                                        >
                                                            {/* Card Number */}
                                                            <div className="absolute top-0.5 left-0.5 z-10">
                                                                <span className="text-[10px] sm:text-xs font-bold px-1 py-0.5 border rounded font-mono bg-green-400 text-black border-green-400 leading-none">
                                                                    {card.cardId.toString().padStart(3, '0')}
                                                                </span>
                                                            </div>
                                                            {/* Card Image */}
                                                            <div className="w-full h-full flex items-center justify-center p-1">
                                                                <img
                                                                    src={getImageSrcFromMetadata(card.metadata)}
                                                                    alt={card.cardId.toString()}
                                                                    className={`
                                                                            max-w-full max-h-full object-contain transition-all duration-300 pixelated
                                                                        }
                                                                        `}
                                                                    onError={(e) => {
                                                                        (e.target as HTMLImageElement).src = '/placeholder.svg'
                                                                    }}
                                                                />
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        // Regular modes: full Card component
                                                        <Card
                                                            cardData={card}
                                                            showBackDefault={false}
                                                            disableFlip={true}
                                                            forceShowFront={true}
                                                            scaleIfHover={false}
                                                        />
                                                    )}
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

                {/* Filter Side Menu */}
                {showFilterMenu && (
                    <div className="fixed inset-0 bg-black/50 z-50 flex justify-end">
                        <div className="bg-teal-800 border-l-4 border-yellow-300 w-80 h-full overflow-y-auto">
                            <div className="p-6">
                                {/* Header */}
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-xl font-bold text-yellow-300 font-mono">
                                        FILTERS
                                    </h3>
                                    <button
                                        onClick={() => setShowFilterMenu(false)}
                                        className="text-yellow-300 hover:text-cyan-300 transition-colors"
                                    >
                                        <X className="h-6 w-6" />
                                    </button>
                                </div>

                                {/* Rarity Filters */}
                                <div className="mb-6">
                                    <h4 className="text-lg font-bold text-cyan-300 font-mono mb-4">
                                        RARITY FILTERS
                                    </h4>
                                    <div className="bg-black border-2 border-gray-400 rounded-lg p-4">
                                        <div className="grid grid-cols-1 gap-3">
                                            {(['Common', 'Uncommon', 'Rare', 'Legendary'] as const).map((rarity) => (
                                                <div key={rarity} className="flex items-center space-x-3">
                                                    <Checkbox
                                                        id={`sidebar-rarity-${rarity.toLowerCase()}`}
                                                        checked={rarityFilters[rarity]}
                                                        onCheckedChange={(checked) => {
                                                            setRarityFilters(prev => ({
                                                                ...prev,
                                                                [rarity]: checked as boolean
                                                            }))
                                                        }}
                                                        className="border-yellow-300 data-[state=checked]:bg-cyan-600 data-[state=checked]:border-cyan-600"
                                                    />
                                                    <label
                                                        htmlFor={`sidebar-rarity-${rarity.toLowerCase()}`}
                                                        className={`text-sm cursor-pointer font-mono ${rarity === 'Common' ? 'text-gray-300' :
                                                            rarity === 'Uncommon' ? 'text-green-400' :
                                                                rarity === 'Rare' ? 'text-blue-400' :
                                                                    'text-purple-400'
                                                            }`}
                                                    >
                                                        {rarity.toUpperCase()}
                                                    </label>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Duplicate Filters */}
                                <div className="mb-6">
                                    <h4 className="text-lg font-bold text-cyan-300 font-mono mb-4">
                                        DUPLICATE FILTERS
                                    </h4>
                                    <div className="bg-black border-2 border-gray-400 rounded-lg p-4">
                                        <div className="space-y-3">
                                            <div className="flex items-center space-x-3">
                                                <Checkbox
                                                    id="sidebar-hideDuplicates"
                                                    checked={hideDuplicates}
                                                    disabled={showOnlyDuplicates}
                                                    onCheckedChange={(checked) => {
                                                        setHideDuplicates(checked as boolean)
                                                        if (checked) setShowOnlyDuplicates(false)
                                                    }}
                                                    className="border-yellow-300 data-[state=checked]:bg-cyan-600 data-[state=checked]:border-cyan-600"
                                                />
                                                <label htmlFor="sidebar-hideDuplicates" className={`text-sm cursor-pointer font-mono ${showOnlyDuplicates ? 'text-gray-400' : 'text-yellow-300'}`}>
                                                    HIDE DUPLICATES
                                                </label>
                                            </div>

                                            <div className="flex items-center space-x-3">
                                                <Checkbox
                                                    id="sidebar-showOnlyDuplicates"
                                                    checked={showOnlyDuplicates}
                                                    disabled={hideDuplicates}
                                                    onCheckedChange={(checked) => {
                                                        setShowOnlyDuplicates(checked as boolean)
                                                        if (checked) setHideDuplicates(false)
                                                    }}
                                                    className="border-yellow-300 data-[state=checked]:bg-cyan-600 data-[state=checked]:border-cyan-600"
                                                />
                                                <label htmlFor="sidebar-showOnlyDuplicates" className={`text-sm cursor-pointer font-mono ${hideDuplicates ? 'text-gray-400' : 'text-yellow-300'}`}>
                                                    SHOW ONLY DUPLICATES
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Reset Button */}
                                <div className="mt-8">
                                    <Button
                                        onClick={resetFilters}
                                        className="w-full bg-orange-600 hover:bg-orange-700 border-4 border-orange-400 text-white font-mono font-bold py-3"
                                    >
                                        RESET TO DEFAULT
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Evolve Modal */}
                {showEvolveModal && selectedCard && (
                    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                        <div className="bg-teal-800 border-4 border-yellow-300 rounded-lg p-4 sm:p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
                            <div className="text-center space-y-4 sm:space-y-6">
                                <h2 className="text-xl sm:text-2xl font-bold text-yellow-300 font-mono">
                                    EVOLVE BEAD151
                                </h2>

                                {/* Evolution Preview */}
                                <div className="flex items-center justify-center gap-3 sm:gap-4">
                                    {/* Current Card */}
                                    <div className="flex flex-col items-center flex-1">
                                        <div className="text-cyan-300 font-mono mb-2 text-xs sm:text-sm">CURRENT</div>
                                        <div className="w-30 h-30 sm:w-38 sm:h-38 mb-2 bg-black border-2 border-yellow-300 rounded-lg overflow-hidden">
                                            <img
                                                src={getImageSrcFromMetadata(selectedCard.metadata)}
                                                alt={`Card ${selectedCard.cardId}`}
                                                className="w-full h-full object-contain pixelated"
                                                onError={(e) => {
                                                    (e.target as HTMLImageElement).src = '/placeholder.svg'
                                                }}
                                            />
                                        </div>
                                        <div className="text-xs text-gray-300 font-mono">
                                            #{selectedCard.cardId.toString().padStart(3, '0')}
                                        </div>
                                    </div>

                                    {/* Arrow */}
                                    <div className="flex flex-col items-center text-yellow-300 px-2">
                                        <ArrowUp className="h-12 w-12 sm:h-12 sm:w-12 rotate-90" />
                                    </div>

                                    {/* Next Evolution Card */}
                                    <div className="flex flex-col items-center flex-1">
                                        <div className="text-purple-300 font-mono mb-2 text-xs sm:text-sm">EVOLVED</div>
                                        <div className="w-30 h-30 sm:w-38 sm:h-38 mb-2 bg-black border-2 border-purple-400 rounded-lg overflow-hidden">
                                            {evolvedCardData ? (
                                                <img
                                                    src={getImageSrc(evolvedCardData.svg)}
                                                    alt={`Card ${getNextEvolutionCardId(selectedCard.cardId)}`}
                                                    className="w-full h-full object-contain pixelated"
                                                    onError={(e) => {
                                                        (e.target as HTMLImageElement).src = '/placeholder.svg'
                                                    }}
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <div className="text-gray-400 font-mono text-center">
                                                        <Loader2 className="h-4 w-4 sm:h-6 sm:w-6 animate-spin mx-auto mb-1" />
                                                        <div className="text-[10px] sm:text-xs">LOADING...</div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                        <div className="text-xs text-gray-300 font-mono">
                                            #{getNextEvolutionCardId(selectedCard.cardId).toString().padStart(3, '0')}
                                        </div>
                                    </div>
                                </div>

                                {/* Evolution Info */}
                                <div className="bg-black border-2 border-gray-400 rounded-lg p-3 sm:p-4">
                                    <div className="text-cyan-300 font-mono space-y-2 sm:space-y-3">
                                        <p className="text-sm sm:text-base">
                                            Are you sure you want to evolve this Bead151?
                                        </p>
                                        <div className="text-lg sm:text-xl font-bold text-yellow-300">
                                            Cost: {getEvolutionCost(selectedCard.cardId)} 🍬 CANDIES
                                        </div>
                                        <p className="text-xs sm:text-sm text-orange-300 leading-relaxed">
                                            ⚠️ WARNING: This action cannot be reverted!
                                        </p>
                                    </div>
                                </div>

                                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-2 sm:pt-4">
                                    <Button
                                        onClick={handleEvolveCard}
                                        disabled={!selectedCard || !canEvolve(selectedCard.cardId)}
                                        className={`flex-1 border-4 font-mono font-bold py-2 sm:py-3 text-sm sm:text-base ${
                                            selectedCard && canEvolve(selectedCard.cardId)
                                                ? 'bg-purple-600 hover:bg-purple-700 border-purple-400 text-white'
                                                : 'bg-gray-600 border-gray-400 text-gray-300 cursor-not-allowed'
                                        }`}
                                    >
                                        {selectedCard ? getEvolveButtonText(selectedCard.cardId) : 'CANNOT EVOLVE'}
                                    </Button>
                                    <Button
                                        onClick={() => setShowEvolveModal(false)}
                                        className="flex-1 bg-gray-600 hover:bg-gray-700 border-4 border-gray-400 text-white font-mono font-bold py-2 sm:py-3 text-sm sm:text-base"
                                    >
                                        CANCEL
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Evolution Result Modal */}
                {showEvolutionResultModal && (
                    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                        <div className="bg-teal-800 border-4 border-yellow-300 rounded-lg p-4 sm:p-6 max-w-md w-full">
                            <div className="text-center space-y-4 sm:space-y-6">
                                <div className="text-4xl sm:text-6xl mb-2 sm:mb-4">✨</div>

                                <h2 className="text-xl sm:text-2xl font-bold text-yellow-300 font-mono">
                                    EVOLUTION COMPLETE!
                                </h2>

                                <div className="text-base sm:text-lg text-purple-300 font-mono mb-3 sm:mb-4">
                                    Your Bead151 has evolved!
                                </div>

                                {/* Show evolved card */}
                                <div className="flex justify-center mb-4 sm:mb-6">
                                    <div className="w-32 h-32 sm:w-48 sm:h-48 bg-black border-4 border-purple-400 rounded-lg overflow-hidden">
                                        {evolvedCardData ? (
                                            <img
                                                src={getImageSrc(evolvedCardData.svg)}
                                                alt={`Evolved Card ${evolvedCardId}`}
                                                className="w-full h-full object-contain pixelated"
                                                onError={(e) => {
                                                    (e.target as HTMLImageElement).src = '/placeholder.svg'
                                                }}
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center animate-pulse">
                                                <div className="text-gray-400 font-mono text-center">
                                                    <div className="text-xl sm:text-2xl mb-2">🎉</div>
                                                    <div className="text-xs sm:text-sm">EVOLVED CARD</div>
                                                    <div className="text-xs mt-2">#{evolvedCardId.toString().padStart(3, '0')}</div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <Button
                                    onClick={() => {
                                        setShowEvolutionResultModal(false)
                                        setSelectedCard(null) // Deselect all cards
                                    }}
                                    className="w-full bg-purple-600 hover:bg-purple-700 border-4 border-purple-400 text-white font-mono font-bold py-2 sm:py-3 text-sm sm:text-lg"
                                >
                                    AMAZING!
                                </Button>
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

                {/* Congratulations Modal */}
                {showCongratulationsModal && (
                    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                        <div className="bg-teal-800 border-4 border-yellow-300 rounded-lg p-6 max-w-md w-full">
                            <div className="text-center space-y-6">
                                <div className="text-6xl mb-4">🎉</div>

                                <h2 className="text-2xl font-bold text-yellow-300 font-mono">
                                    CONGRATULATIONS!
                                </h2>

                                <div className="bg-black border-2 border-gray-400 rounded-lg p-4">
                                    <div className="text-cyan-300 font-mono space-y-2">
                                        <p className="text-lg">
                                            Card successfully sent to doctor!
                                        </p>
                                        <div className="text-2xl font-bold text-yellow-300">
                                            +{candiesReceived} 🍬 CANDIES
                                        </div>
                                    </div>
                                </div>

                                <Button
                                    onClick={() => setShowCongratulationsModal(false)}
                                    className="w-full bg-cyan-600 hover:bg-cyan-700 border-4 border-cyan-400 text-white font-mono font-bold py-3 text-lg"
                                >
                                    AWESOME!
                                </Button>
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