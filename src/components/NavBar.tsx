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
        switch (currentView) {
            case "eggs":
                return "bg-green-900/80 backdrop-blur-md"
            case "collection":
                return "bg-teal-900/80 backdrop-blur-md"
            case "dex":
                return "bg-black/80 backdrop-blur-md"
            default:
                return "bg-purple-900/80 backdrop-blur-md"
        }
    }

    return (
        <nav className={`fixed top-0 left-0 right-0 z-50 ${getNavBarBackground()} border-b border-white/10 transition-colors duration-500`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo/Brand */}
                    <div className="flex items-center">
                        <div className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                            Beads 151
                        </div>
                    </div>

                    {/* Navigation Links - Desktop */}
                    <div className="hidden md:block">
                        <div className="ml-10 flex items-baseline space-x-4">
                            <button
                                onClick={() => setCurrentView("landing")}
                                className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 hover:bg-white/10 cursor-pointer"
                            >
                                Home
                            </button>

                            <button
                                onClick={() => setCurrentView("mint")}
                                className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 hover:bg-white/10 cursor-pointer"
                            >
                                Mint
                            </button>
                            <button
                                onClick={() => setCurrentView("openPack")}
                                className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 hover:bg-white/10 cursor-pointer"
                            >
                                Open Pack
                            </button>
                            <button
                                onClick={() => setCurrentView("collection")}
                                className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 hover:bg-white/10 cursor-pointer"
                            >
                                My Collection
                            </button>
                            <button
                                onClick={() => setCurrentView("dex")}
                                className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 hover:bg-white/10 cursor-pointer"
                            >
                                Dex
                            </button>

                            <button
                                onClick={() => setCurrentView("eggs")}
                                className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 hover:bg-white/10 cursor-pointer"
                            >
                                Eggs
                            </button>

                        </div>
                    </div>

                    {/* Right side - Wallet + Mobile Menu Button */}
                    <div className="flex items-center space-x-2 sm:space-x-4">
                        {/* Connection Status Indicator - Hidden on small screens */}
                        <div className="hidden sm:flex items-center space-x-2">
                            <div
                                className={`w-2 h-2 rounded-full transition-colors duration-200 ${isConnected ? "bg-green-500 animate-pulse" : "bg-gray-500"
                                    }`}
                            />
                            <span className="text-xs text-gray-400">{isConnected ? "Connected" : "Disconnected"}</span>
                        </div>

                        {/* Wallet Button - Responsive sizing */}
                        <Button
                            onClick={handleWalletClick}
                            className={`
                relative px-2 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-lg
                transition-all duration-200 ease-in-out
                transform hover:scale-105 active:scale-95
                shadow-lg hover:shadow-xl
                focus:outline-none focus:ring-2 focus:ring-opacity-50
                ${isConnected
                                    ? "bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white focus:ring-green-300"
                                    : "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white focus:ring-blue-300"
                                }
              `}
                        >
                            <Wallet className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                            <span className="hidden sm:inline">{getWalletButtonText()}</span>
                            <span className="sm:hidden">{isConnected ? formatAddress(address) : "Connect"}</span>
                        </Button>

                        {/* Mobile menu button */}
                        <div className="md:hidden">
                            <button
                                type="button"
                                onClick={toggleMobileMenu}
                                className="text-gray-300 hover:text-white hover:bg-white/10 p-2 rounded-md transition-colors duration-200"
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
                <div className="px-2 pt-2 pb-3 space-y-1 bg-black/30 backdrop-blur-md border-t border-white/10">
                    <button
                        onClick={() => handleNavClick("landing")}
                        className="text-gray-300 hover:text-white block px-3 py-2 rounded-md text-base font-medium w-full text-left transition-all duration-200 hover:bg-white/10 transform hover:translate-x-1"
                    >
                        Home
                    </button>
                    <button
                        onClick={() => handleNavClick("mint")}
                        className="text-gray-300 hover:text-white block px-3 py-2 rounded-md text-base font-medium w-full text-left transition-all duration-200 hover:bg-white/10 transform hover:translate-x-1"
                    >
                        Mint
                    </button>
                    <button
                        onClick={() => handleNavClick("collection")}
                        className="text-gray-300 hover:text-white block px-3 py-2 rounded-md text-base font-medium w-full text-left transition-all duration-200 hover:bg-white/10 transform hover:translate-x-1"
                    >
                        My Collection
                    </button>
                    <button
                        onClick={() => handleNavClick("dex")}
                        className="text-gray-300 hover:text-white block px-3 py-2 rounded-md text-base font-medium w-full text-left transition-all duration-200 hover:bg-white/10 transform hover:translate-x-1"
                    >
                        Dex
                    </button>
                    <button
                        onClick={() => handleNavClick("openPack")}
                        className="text-gray-300 hover:text-white block px-3 py-2 rounded-md text-base font-medium w-full text-left transition-all duration-200 hover:bg-white/10 transform hover:translate-x-1"
                    >
                        Open Pack
                    </button>

                    <button
                        onClick={() => handleNavClick("eggs")}
                        className="text-gray-300 hover:text-white block px-3 py-2 rounded-md text-base font-medium w-full text-left transition-all duration-200 hover:bg-white/10 transform hover:translate-x-1"
                    >
                        Eggs
                    </button>

                </div>
            </div>
        </nav>
    )
}
