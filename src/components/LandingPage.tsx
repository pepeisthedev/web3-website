import { Car, Zap, Flame, Leaf } from "lucide-react"
import { Badge } from "./ui/badge"
import { Button } from "./ui/button"
import Dex from "./Dex"
import React, { useState } from "react"

//Mock data for owned cards
const initialOwnedCards = new Set([1, 3, 7, 12, 15, 23, 34, 45, 56, 67, 78, 89, 92, 95])

export default function LadingPage(): React.JSX.Element {
    const [currentView, setCurrentView] = useState<"landing" | "dex">("landing")
    const [ownedCards, setOwnedCards] = useState(initialOwnedCards)


    const totalCards = 100
    const ownedCount = ownedCards.size

    if (currentView === "landing") {
        return (
            <div className="min-h-screen bg-gradient-to-br from-yellow-300 via-orange-200 to-red-300">
                <div className="container mx-auto px-4 py-16 flex flex-col items-center justify-center min-h-screen text-center">
                    {/* Decorative icons */}
                    <div className="flex gap-8 mb-8 animate-bounce">
                        <Zap className="w-12 h-12 text-yellow-600" />
                        <Leaf className="w-12 h-12 text-green-600" />
                        <Flame className="w-12 h-12 text-red-600" />
                    </div>

                    {/* Main title */}
                    <h1 className="text-6xl md:text-8xl font-bold mb-6 bg-gradient-to-r from-yellow-600 via-orange-600 to-red-600 bg-clip-text text-transparent drop-shadow-lg">
                        CAR DEX
                    </h1>

                    <p className="text-xl md:text-2xl text-gray-700 mb-8 max-w-2xl">
                        Gotta collect them all! Discover and collect amazing cars in your personal Pokedex-style collection.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 items-center mb-8">
                        <Badge variant="secondary" className="text-lg px-4 py-2 bg-yellow-100 text-yellow-800">
                            {ownedCount} / {totalCards} Collected
                        </Badge>
                        <Badge variant="secondary" className="text-lg px-4 py-2 bg-green-100 text-green-800">
                            {Math.round((ownedCount / totalCards) * 100)}% Complete
                        </Badge>
                    </div>

                    <Button
                        onClick={() => setCurrentView("dex")}
                        size="lg"
                        className="text-xl px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg transform hover:scale-105 transition-all duration-200"
                    >
                        <Car className="w-6 h-6 mr-2" />
                        Open Car Dex
                    </Button>
                </div>
            </div>

        );

    }

    else {
        return (
            <Dex
                setCurrentView={setCurrentView}
                ownedCards={ownedCards}
            />
        )
    }
}