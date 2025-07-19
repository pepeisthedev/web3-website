"use client"

import { useState } from "react"
import { useAppKit, useAppKitAccount } from "@reown/appkit/react"
import { Button } from "./ui/button"
import { Wallet, X } from "lucide-react"
import { SectionType } from "./types/SectionTypes";


interface NavBarProps {
    setCurrentView: (view: SectionType) => void
    currentView?: SectionType
}

export default function NavBar({ setCurrentView, currentView }: NavBarProps) {
    const { open } = useAppKit()
    const { isConnected, address } = useAppKitAccount()
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

    const handleWalletClick = () => {
        if (!isConnected) {
            // Open wallet connection modal
            open()
        } else {
            // If connected, open account modal to show details/disconnect
            open({ view: "Account" })
        }
    }

    const formatAddress = (addr: string | undefined): string => {
        if (!addr) return ""
        return `${addr.slice(0, 4)}...${addr.slice(-4)}`
    }

    const getWalletButtonText = (): string => {
        return isConnected && address ? formatAddress(address) : "Connect Wallet"
    }

    const toggleMobileMenu = () => {
        setIsMobileMenuOpen(!isMobileMenuOpen)
    }

    const closeMobileMenu = () => {
        setIsMobileMenuOpen(false)
    }

    const handleNavClick = (view: SectionType) => {
        setCurrentView(view)
        closeMobileMenu()
    }

    const getNavBarBackground = (): string => {
        return "bg-black border-b-4 border-yellow-300"
    }

    return (
        <nav className={`fixed top-0 left-0 right-0 z-50 ${getNavBarBackground()} transition-colors duration-500 font-mono`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo/Brand */}
                    <div className="flex items-center">
                        <div className="text-xl sm:text-2xl font-bold text-yellow-300 font-mono tracking-wider">
                            BEAD151
                        </div>
                    </div>

                    {/* Navigation Links - Desktop */}
                    <div className="hidden md:block">
                        <div className="ml-10 flex items-baseline space-x-4">
                            <button
                                onClick={() => setCurrentView("landing")}
                                className="text-cyan-300 hover:text-yellow-300 px-3 py-2 rounded text-sm font-bold font-mono transition-colors duration-200 hover:bg-gray-600 border-2 border-transparent hover:border-gray-400"
                            >
                                HOME
                            </button>

                            <button
                                onClick={() => setCurrentView("mint")}
                                className="text-cyan-300 hover:text-yellow-300 px-3 py-2 rounded text-sm font-bold font-mono transition-colors duration-200 hover:bg-gray-600 border-2 border-transparent hover:border-gray-400"
                            >
                                MINT
                            </button>
                            <button
                                onClick={() => setCurrentView("openPack")}
                                className="text-cyan-300 hover:text-yellow-300 px-3 py-2 rounded text-sm font-bold font-mono transition-colors duration-200 hover:bg-gray-600 border-2 border-transparent hover:border-gray-400"
                            >
                                OPEN PACK
                            </button>
                            <button
                                onClick={() => setCurrentView("collection")}
                                className="text-cyan-300 hover:text-yellow-300 px-3 py-2 rounded text-sm font-bold font-mono transition-colors duration-200 hover:bg-gray-600 border-2 border-transparent hover:border-gray-400"
                            >
                                COLLECTION
                            </button>
                            <button
                                onClick={() => setCurrentView("dex")}
                                className="text-cyan-300 hover:text-yellow-300 px-3 py-2 rounded text-sm font-bold font-mono transition-colors duration-200 hover:bg-gray-600 border-2 border-transparent hover:border-gray-400"
                            >
                                DEX
                            </button>

                            <button
                                onClick={() => setCurrentView("eggs")}
                                className="text-cyan-300 hover:text-yellow-300 px-3 py-2 rounded text-sm font-bold font-mono transition-colors duration-200 hover:bg-gray-600 border-2 border-transparent hover:border-gray-400"
                            >
                                EGGS
                            </button>

                        </div>
                    </div>

                    {/* Right side - Wallet + Mobile Menu Button */}
                    <div className="flex items-center space-x-2 sm:space-x-4">
                        {/* Connection Status Indicator - Hidden on small screens */}
                        <div className="hidden sm:flex items-center space-x-2">
                            <div
                                className={`w-2 h-2 border border-gray-400 transition-colors duration-200 ${isConnected ? "bg-green-400 animate-pulse" : "bg-gray-500"
                                    }`}
                            />
                            <span className="text-xs text-green-400 font-mono">{isConnected ? "CONNECTED" : "DISCONNECTED"}</span>
                        </div>

                        {/* Wallet Button - Responsive sizing */}
                        <Button
                            onClick={handleWalletClick}
                            className={`
                relative px-2 sm:px-4 py-2 text-xs sm:text-sm font-bold font-mono border-2 rounded
                transition-all duration-200 ease-in-out
                transform hover:scale-105 active:scale-95
                ${isConnected
                                    ? "bg-green-600 hover:bg-green-700 border-green-400 text-black"
                                    : "bg-red-600 hover:bg-red-700 border-red-400 text-white"
                                }
              `}
                        >
                            <Wallet className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                            <span className="hidden sm:inline">{getWalletButtonText()}</span>
                            <span className="sm:hidden">{isConnected ? formatAddress(address) : "CONNECT"}</span>
                        </Button>

                        {/* Mobile menu button */}
                        <div className="md:hidden">
                            <button
                                type="button"
                                onClick={toggleMobileMenu}
                                className="text-cyan-300 hover:text-yellow-300 hover:bg-gray-600 p-2 border-2 border-gray-400 rounded transition-colors duration-200"
                                aria-controls="mobile-menu"
                                aria-expanded={isMobileMenuOpen}
                            >
                                <span className="sr-only">{isMobileMenuOpen ? "Close main menu" : "Open main menu"}</span>
                                {/* Hamburger/X icon with animation */}
                                {isMobileMenuOpen ? (
                                    <X className="h-6 w-6 transition-transform duration-200" />
                                ) : (
                                    <svg
                                        className="h-6 w-6 transition-transform duration-200"
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                    </svg>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile menu with smooth animation */}
            <div
                className={`md:hidden transition-all duration-300 ease-in-out overflow-hidden ${isMobileMenuOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                    }`}
                id="mobile-menu"
            >
                <div className="px-2 pt-2 pb-3 space-y-1 bg-black border-t-2 border-gray-400">
                    <button
                        onClick={() => handleNavClick("landing")}
                        className="text-cyan-300 hover:text-yellow-300 block px-3 py-2 border-2 border-transparent hover:border-gray-400 rounded text-base font-bold font-mono w-full text-left transition-all duration-200 hover:bg-gray-600"
                    >
                        HOME
                    </button>
                    <button
                        onClick={() => handleNavClick("mint")}
                        className="text-cyan-300 hover:text-yellow-300 block px-3 py-2 border-2 border-transparent hover:border-gray-400 rounded text-base font-bold font-mono w-full text-left transition-all duration-200 hover:bg-gray-600"
                    >
                        MINT
                    </button>
                    <button
                        onClick={() => handleNavClick("collection")}
                        className="text-cyan-300 hover:text-yellow-300 block px-3 py-2 border-2 border-transparent hover:border-gray-400 rounded text-base font-bold font-mono w-full text-left transition-all duration-200 hover:bg-gray-600"
                    >
                        COLLECTION
                    </button>
                    <button
                        onClick={() => handleNavClick("dex")}
                        className="text-cyan-300 hover:text-yellow-300 block px-3 py-2 border-2 border-transparent hover:border-gray-400 rounded text-base font-bold font-mono w-full text-left transition-all duration-200 hover:bg-gray-600"
                    >
                        DEX
                    </button>
                    <button
                        onClick={() => handleNavClick("openPack")}
                        className="text-cyan-300 hover:text-yellow-300 block px-3 py-2 border-2 border-transparent hover:border-gray-400 rounded text-base font-bold font-mono w-full text-left transition-all duration-200 hover:bg-gray-600"
                    >
                        OPEN PACK
                    </button>

                    <button
                        onClick={() => handleNavClick("eggs")}
                        className="text-cyan-300 hover:text-yellow-300 block px-3 py-2 border-2 border-transparent hover:border-gray-400 rounded text-base font-bold font-mono w-full text-left transition-all duration-200 hover:bg-gray-600"
                    >
                        EGGS
                    </button>

                </div>
            </div>

            <style>{`
                @font-face {
                    font-family: 'PokemonGB';
                    src: url('/fonts/PokemonGb-RAeo.ttf') format('truetype');
                }
                
                .font-mono {
                    font-family: 'PokemonGB', monospace;
                }
            `}</style>
        </nav>
    )
}
