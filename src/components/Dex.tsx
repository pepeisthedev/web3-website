import { Car, Zap, Flame, Leaf } from "lucide-react"
import { Badge } from "./ui/badge"
import { Button } from "./ui/button"
import { Label } from "./ui/label"
import { Switch } from "./ui/switch"
import { CardContent, Card } from "./ui/card"
import React, { useState } from "react"

const carTypes = [
    "Sports Car",
    "SUV",
    "Sedan",
    "Hatchback",
    "Convertible",
    "Truck",
    "Coupe",
    "Wagon",
    "Crossover",
    "Roadster",
    "Muscle Car",
    "Luxury",
    "Electric",
    "Hybrid",
    "Compact",
]

const getCarName = (id: number) => {
    const type = carTypes[id % carTypes.length]
    return `${type} #${id.toString().padStart(3, "0")}`
}

interface DexProps {
    setCurrentView: (view: "landing" | "dex") => void
    ownedCards: Set<number>
}

export default function Dex({ setCurrentView, ownedCards }: DexProps): React.JSX.Element {
    const [showOnlyOwned, setShowOnlyOwned] = useState(false)
    const ownedCount = ownedCards.size
    const totalCards = 100

    const cardsToShow = showOnlyOwned
        ? Array.from({ length: totalCards }, (_, i) => i + 1).filter((id) => ownedCards.has(id))
        : Array.from({ length: totalCards }, (_, i) => i + 1)

    const getCardColor = (id: number) => {
        const colors = [
            "from-yellow-400 to-yellow-600", // Pikachu yellow
            "from-green-400 to-green-600", // Bulbasaur green
            "from-orange-400 to-red-500", // Charmander orange/red
            "from-blue-400 to-blue-600", // Water type blue
            "from-purple-400 to-purple-600", // Psychic purple
        ]
        return colors[id % colors.length]
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-yellow-300 via-orange-200 to-red-300">
            <div className="container mx-auto px-4 py-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                    <div className="flex items-center gap-4">
                        <Button
                            onClick={() => setCurrentView("landing")}
                            variant="outline"
                            className="bg-orange backdrop-blur-sm"
                        >
                            ← Back to Home
                        </Button>
                        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                            Car Dex
                        </h1>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="flex items-center space-x-2 bg-orange backdrop-blur-sm rounded-lg px-4 py-2">
                            <Switch id="show-owned" checked={showOnlyOwned} onCheckedChange={setShowOnlyOwned} />
                            <Label htmlFor="show-owned" className="text-sm font-medium">
                                Show only owned
                            </Label>
                        </div>
                        <Badge variant="secondary" className="bg-orange/80 backdrop-blur-sm">
                            {ownedCount} / {totalCards}
                        </Badge>
                    </div>
                </div>

                {/* Progress bar */}
                <div className="mb-8 bg-white/50 backdrop-blur-sm rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-gray-700">Collection Progress</span>
                        <span className="text-sm font-medium text-gray-700">{Math.round((ownedCount / totalCards) * 100)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                        <div
                            className="bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 h-3 rounded-full transition-all duration-500"
                            style={{ width: `${(ownedCount / totalCards) * 100}%` }}
                        />
                    </div>
                </div>

                {/* Cards grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                    {cardsToShow.map((cardId) => {
                        const isOwned = ownedCards.has(cardId)
                        return (
                            <Card
                                key={cardId}
                                className={`cursor-pointer transition-all duration-200 hover:scale-105 ${isOwned ? "bg-white shadow-lg hover:shadow-xl" : "bg-gray-100 opacity-60 hover:opacity-80"
                                    }`}

                            >
                                <CardContent className="p-4 text-center">
                                    <div
                                        className={`w-full h-24 rounded-lg mb-3 flex items-center justify-center ${isOwned ? `bg-gradient-to-br ${getCardColor(cardId)}` : "bg-gray-300"
                                            }`}
                                    >
                                        {isOwned ? (
                                            <Car className="w-8 h-8 text-white" />
                                        ) : (
                                            <span className="text-2xl font-bold text-gray-500">#{cardId}</span>
                                        )}
                                    </div>

                                    <div className="space-y-1">
                                        <p className={`text-sm font-semibold ${isOwned ? "text-gray-800" : "text-gray-500"}`}>
                                            #{cardId.toString().padStart(3, "0")}
                                        </p>
                                        {isOwned && <p className="text-xs text-gray-600">{getCarName(cardId)}</p>}
                                    </div>

                                    {isOwned && (
                                        <Badge variant="secondary" className="mt-2 bg-green-100 text-green-800 text-xs">
                                            Owned
                                        </Badge>
                                    )}
                                </CardContent>
                            </Card>
                        )
                    })}
                </div>

                {cardsToShow.length === 0 && (
                    <div className="text-center py-16">
                        <Car className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <p className="text-xl text-gray-500">No cars to display</p>
                        <p className="text-gray-400">Try toggling the filter or collect some cars!</p>
                    </div>
                )}
            </div>
        </div>
    )
}