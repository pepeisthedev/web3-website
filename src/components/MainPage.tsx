import { Car, Zap, Flame, Leaf } from "lucide-react"
import { Badge } from "./ui/badge"
import { Button } from "./ui/button"
import Dex from "./Dex"
import LandingPage from "./LandingPage"
import React, { useState } from "react"
import NavBar from "./NavBar"
import MintPage from "./MintPage"

//Mock data for owned cards
const initialOwnedCards = new Set([1, 3, 7, 12, 15, 23, 34, 45, 56, 67, 78, 89, 92, 95])

export default function MainPage(): React.JSX.Element {
    const [currentView, setCurrentView] = useState<"landing" | "dex" | "mint">("landing")
    const [ownedCards, setOwnedCards] = useState(initialOwnedCards)

    const totalCards = 100
    const ownedCount = ownedCards.size

    if (currentView === "landing") {
        return (
            <>
                <NavBar setCurrentView={setCurrentView} />
                <div className="pt-16 lg:pt-0">
                    <LandingPage setCurrentView={setCurrentView}>
                    </LandingPage>
                </div>
            </>
        );
    }

    else if (currentView === "mint") {
        return (
            <>
                <NavBar setCurrentView={setCurrentView} />
                <div className="pt-16 lg:pt-0">
                    <MintPage >
                    </MintPage>
                </div>
            </>
        );
    }

    else {
        return (
            <>
                <NavBar setCurrentView={setCurrentView} />
                <div className="pt-16 lg:pt-0">
                    <Dex
                        setCurrentView={setCurrentView}
                        ownedCards={ownedCards}
                    />
                </div>
            </>
        )
    }
}