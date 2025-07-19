"use client"

import { useState, useEffect } from "react"
import { Button } from "./ui/button"
import { X, Loader2 } from "lucide-react"
import Card from "./Card"

interface CardData {
  svg: string
  description: string
}

interface TransactionModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  initText: string
  completedText: string
  initImage: string
  onConfirm: () => Promise<void>
  extractedCards?: CardData[]
}

type ModalState = "init" | "waiting" | "completed" | "error"

export default function OpenPackTransactionModal({
  isOpen,
  onClose,
  title,
  initText,
  completedText,
  initImage,
  onConfirm,
  extractedCards = [],
}: TransactionModalProps) {
  const [modalState, setModalState] = useState<ModalState>("init")
  const [errorMessage, setErrorMessage] = useState("")

  useEffect(() => {
    if (isOpen) {
      setModalState("init")
      setErrorMessage("")
    }
  }, [isOpen])

  const handleConfirm = async () => {
    try {
      setModalState("waiting")
      await onConfirm()
      setModalState("completed")
    } catch (error) {
      console.error("Transaction error:", error)
      setModalState("error")
      setErrorMessage(error instanceof Error ? error.message : "Transaction failed")
    }
  }

  const handleClose = () => {
    if (modalState !== "waiting") {
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70" onClick={handleClose} />

      <div className="relative bg-teal-800 border-4 border-yellow-300 rounded-lg p-6 max-w-6xl w-full mx-4 shadow-2xl max-h-[90vh] overflow-y-auto font-mono">
        {modalState !== "waiting" && (
          <button
            onClick={handleClose}
            className="absolute top-2 right-2 text-yellow-300 hover:text-yellow-400 transition-colors z-10 bg-black border-2 border-gray-400 rounded p-1"
          >
            <X className="h-4 w-4" />
          </button>
        )}

        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-yellow-300 mb-2 font-mono tracking-wider">{title}</h2>
        </div>

        {modalState === "init" && (
          <div className="text-center">
            <div className="bg-black border-2 border-gray-400 rounded p-4 mb-4 mx-auto w-fit">
              <img
                src={initImage || "/placeholder.svg"}
                alt="Transaction preview"
                className="w-32 max-h-32 mx-auto rounded object-contain pixelated"
              />
            </div>
            <p className="text-cyan-300 mb-6 leading-relaxed font-mono">{initText}</p>
            <div className="flex gap-3 justify-center max-w-sm mx-auto">
              <Button
                onClick={handleClose}
                className="flex-1 bg-gray-600 border-2 border-gray-400 text-white hover:bg-gray-700 font-mono"
              >
                CANCEL
              </Button>
              <Button
                onClick={handleConfirm}
                className="flex-1 bg-red-600 border-2 border-red-400 hover:bg-red-700 text-white font-mono"
              >
                CONFIRM
              </Button>
            </div>
          </div>
        )}

        {modalState === "waiting" && (
          <div className="text-center">
            <div className="bg-black border-2 border-gray-400 rounded p-6 mb-4 mx-auto w-fit">
              <Loader2 className="h-16 w-16 text-green-400 animate-spin" />
            </div>
            <p className="text-green-400 mb-4 text-lg font-bold animate-pulse font-mono">PROCESSING TRANSACTION...</p>
            <p className="text-cyan-300 text-sm font-mono">
              CONFIRM IN WALLET AND WAIT FOR BLOCKCHAIN CONFIRMATION
            </p>
          </div>
        )}


        {modalState === "completed" && (
          <div className="text-center">
            <p className="text-cyan-300 mb-6 leading-relaxed font-mono">{completedText}</p>
            <div className="mb-6">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 justify-items-center">
                {extractedCards.map((card, index) => (
                  <Card
                    key={index}
                    cardData={card}
                    showBackDefault={true}
                  />
                ))}
              </div>
            </div>
            <Button 
              onClick={handleClose} 
              className="px-8 bg-gray-600 border-2 border-gray-400 hover:bg-gray-700 text-white font-mono"
            >
              CLOSE
            </Button>
          </div>
        )}


        {modalState === "error" && (
          <div className="text-center">
            <div className="bg-black border-2 border-red-400 rounded p-4 mb-4 mx-auto w-fit">
              <div className="text-red-400 text-4xl font-mono">ERROR</div>
            </div>
            <p className="text-red-400 mb-2 font-bold font-mono">TRANSACTION FAILED</p>
            <p className="text-cyan-300 mb-6 text-sm font-mono">{errorMessage}</p>
            <div className="flex gap-3 justify-center max-w-sm mx-auto">
              <Button
                onClick={handleClose}
                className="flex-1 bg-gray-600 border-2 border-gray-400 text-white hover:bg-gray-700 font-mono"
              >
                CLOSE
              </Button>
              <Button
                onClick={() => setModalState("init")}
                className="flex-1 bg-red-600 border-2 border-red-400 hover:bg-red-700 text-white font-mono"
              >
                TRY AGAIN
              </Button>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @font-face {
            font-family: 'PokemonGB';
            src: url('/fonts/PokemonGb-RAeo.ttf') format('truetype');
        }
        
        .font-mono {
            font-family: 'PokemonGB', monospace;
        }

        .pixelated {
            image-rendering: pixelated;
            image-rendering: -moz-crisp-edges;
            image-rendering: crisp-edges;
        }
      `}</style>
    </div>
  )
}
