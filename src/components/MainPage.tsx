import { Car, Zap, Flame, Leaf } from "lucide-react"
import { Badge } from "./ui/badge"
import { Button } from "./ui/button"
import Dex from "./Dex"
import LandingPage from "./LandingPage"
import React, { useState } from "react"

//Mock data for owned cards
const initialOwnedCards = new Set([1, 3, 7, 12, 15, 23, 34, 45, 56, 67, 78, 89, 92, 95])

export default function MainPage(): React.JSX.Element {
    const [currentView, setCurrentView] = useState<"landing" | "dex">("landing")
    const [ownedCards, setOwnedCards] = useState(initialOwnedCards)


    const totalCards = 100
    const ownedCount = ownedCards.size

    if (currentView === "landing") {
        return (
            <LandingPage setCurrentView={setCurrentView}>
                
            </LandingPage>

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