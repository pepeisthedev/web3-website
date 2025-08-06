
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
    
    // Check if only front page should be enabled
    const onlyFrontPage = import.meta.env.VITE_FEATURE_ONLY_FRONT_PAGE === 'true'
    
    // Override setCurrentView to prevent navigation when feature flag is set
    const handleSetCurrentView = (view: SectionType) => {
        if (onlyFrontPage && view !== "landing") {
            return
        }
        setCurrentView(view)
    }

    return (
        <>
            <NavBar setCurrentView={handleSetCurrentView} currentView={currentView} />
            <div>
                {currentView === "landing" && (
                    <LandingPage setCurrentView={handleSetCurrentView}>
                    </LandingPage>
                )}

                {!onlyFrontPage && currentView === "mint" && (
                    <MintPage />
                )}


                {!onlyFrontPage && currentView === "openPack" && (
                    <OpenPack />
                )}

                {!onlyFrontPage && currentView === "collection" && (
                    <CollectionPage />
                )}

                {!onlyFrontPage && currentView === "dex" && (
                    <Dex />
                )}

                {!onlyFrontPage && currentView === "eggs" && (
                    <Eggs />
                )}
            </div>
                        <style>{`
                @font-face {
                    font-family: 'GameBoy';
                    src: url('/fonts/gameboy.woff2') format('woff2');
                }
                
                .font-mono {
                    font-family: 'GameBoy', monospace;
                }
            `}</style>
        </>
    )
}