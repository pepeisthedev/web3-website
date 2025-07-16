
import Dex from "./Dex"
import LandingPage from "./LandingPage"
import React, { useState } from "react"
import NavBar from "./NavBar"
import MintPage from "./MintPage"
import OpenPack from "./OpenPack"
import { SectionType } from "./types/SectionTypes"
import CollectionPage from "./CollectionPage"
import Eggs from "./Eggs"


export default function MainPage(): React.JSX.Element {
    const [currentView, setCurrentView] = useState<SectionType>("landing")

    return (
        <>
            <NavBar setCurrentView={setCurrentView} currentView={currentView} />
            <div className="pt-16 lg:pt-0">
                {currentView === "landing" && (
                    <LandingPage setCurrentView={setCurrentView}>
                    </LandingPage>
                )}

                {currentView === "mint" && (
                    <MintPage />
                )}


                {currentView === "openPack" && (
                    <OpenPack />
                )}

                {currentView === "collection" && (
                    <CollectionPage />
                )}

                {currentView === "dex" && (
                    <Dex />
                )}

                {currentView === "eggs" && (
                    <Eggs />
                )}
            </div>
        </>
    )
}