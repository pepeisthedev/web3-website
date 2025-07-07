"use client"
import { useAppKit, useAppKitAccount } from "@reown/appkit/react"
import { Button } from "./ui/button"
import { Wallet } from "lucide-react"

interface NavBarProps {
  setCurrentView: (view: "landing" | "dex") => void
}

export default function NavBar({ setCurrentView }: NavBarProps) {
  const { open } = useAppKit()
  const { isConnected, address } = useAppKitAccount()

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

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black/20 backdrop-blur-md border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo/Brand */}
          <div className="flex items-center">
            <div className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Beads 151
            </div>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              <button
                onClick={() => setCurrentView("landing")}
                className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 hover:bg-white/10"
              >
                Home
              </button>
              <button
                onClick={() => setCurrentView("dex")}
                className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 hover:bg-white/10"
              >
                DEX
              </button>
              <a
                href="#features"
                className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 hover:bg-white/10"
              >
                Features
              </a>
              <a
                href="#stats"
                className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 hover:bg-white/10"
              >
                Stats
              </a>
            </div>
          </div>

          {/* Wallet Connect Button */}
          <div className="flex items-center space-x-4">
            {/* Connection Status Indicator */}
            <div className="hidden sm:flex items-center space-x-2">
              <div
                className={`w-2 h-2 rounded-full transition-colors duration-200 ${
                  isConnected ? "bg-green-500 animate-pulse" : "bg-gray-500"
                }`}
              />
              <span className="text-xs text-gray-400">{isConnected ? "Connected" : "Disconnected"}</span>
            </div>

            {/* Wallet Button */}
            <Button
              onClick={handleWalletClick}
              className={`
                relative px-4 py-2 text-sm font-medium rounded-lg
                transition-all duration-200 ease-in-out
                transform hover:scale-105 active:scale-95
                shadow-lg hover:shadow-xl
                focus:outline-none focus:ring-2 focus:ring-opacity-50
                ${
                  isConnected
                    ? "bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white focus:ring-green-300"
                    : "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white focus:ring-blue-300"
                }
              `}
            >
              <Wallet className="w-4 h-4 mr-2" />
              {getWalletButtonText()}
            </Button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              type="button"
              className="text-gray-300 hover:text-white hover:bg-white/10 p-2 rounded-md"
              aria-controls="mobile-menu"
              aria-expanded="false"
            >
              <span className="sr-only">Open main menu</span>
              {/* Hamburger icon */}
              <svg
                className="h-6 w-6"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div className="md:hidden" id="mobile-menu">
        <div className="px-2 pt-2 pb-3 space-y-1 bg-black/30 backdrop-blur-md">
          <button
            onClick={() => setCurrentView("landing")}
            className="text-gray-300 hover:text-white block px-3 py-2 rounded-md text-base font-medium w-full text-left transition-colors duration-200 hover:bg-white/10"
          >
            Home
          </button>
          <button
            onClick={() => setCurrentView("dex")}
            className="text-gray-300 hover:text-white block px-3 py-2 rounded-md text-base font-medium w-full text-left transition-colors duration-200 hover:bg-white/10"
          >
            DEX
          </button>
          <a
            href="#features"
            className="text-gray-300 hover:text-white block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200 hover:bg-white/10"
          >
            Features
          </a>
          <a
            href="#stats"
            className="text-gray-300 hover:text-white block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200 hover:bg-white/10"
          >
            Stats
          </a>
        </div>
      </div>
    </nav>
  )
}
