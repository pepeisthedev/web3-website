import { Car, Zap, Flame, Leaf } from "lucide-react"
import { Badge } from "./ui/badge"
import { Button } from "./ui/button"
import Dex from "./Dex"
import LandingPage from "./LandingPage"
import React, { useState } from "react"
import NavBar from "./NavBar"
import MintPage from "./MintPage"
import OpenPack from "./OpenPack"
import { SectionType } from "./types/SectionTypes"
import CollectionPage from "./CollectionPage"

//Mock data for owned cards
const initialOwnedCards = new Set([1, 3, 7, 12, 15, 23, 34, 45, 56, 67, 78, 89, 92, 95])

export default function MainPage(): React.JSX.Element {
    const [currentView, setCurrentView] = useState<SectionType>("landing")
    const [ownedCards, setOwnedCards] = useState(initialOwnedCards)

    const totalCards = 100
    const ownedCount = ownedCards.size

    return (
        <>
            <NavBar setCurrentView={setCurrentView} />
            <div className="pt-16 lg:pt-0">
                {currentView === "landing" && (
                    <LandingPage setCurrentView={setCurrentView}>
                    </LandingPage>
                )}

                {currentView === "mint" && (
                    <MintPage />
                )}

                {currentView === "dex" && (
                    <Dex
                        setCurrentView={setCurrentView}
                        ownedCards={ownedCards}
                    />
                )}

                {currentView === "openPack" && (
                    <OpenPack />
                )}

                {currentView === "collection" && (
                    <CollectionPage />
                )}
            </div>
        </>
    )
}