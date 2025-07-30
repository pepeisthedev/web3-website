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
  onOpenAnother?: () => Promise<void>
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
  onOpenAnother,
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

  const handleOpenAnother = async () => {
    if (onOpenAnother) {
      try {
        setModalState("waiting")
        await onOpenAnother()
        setModalState("completed")
      } catch (error) {
        console.error("Open another pack error:", error)
        setModalState("error")
        setErrorMessage(error instanceof Error ? error.message : "Transaction failed")
      }
    }
  }

  const handleClose = () => {
    if (modalState !== "waiting") {
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2">
      <div className="absolute inset-0 bg-black/70" onClick={handleClose} />
      <div className="relative bg-teal-800 border-4 border-yellow-300 rounded-lg p-3 max-w-4xl w-full shadow-2xl max-h-[95vh] overflow-y-auto font-mono">
        {modalState !== "waiting" && (
          <button
            onClick={handleClose}
            className="absolute top-1 right-1 text-yellow-300 hover:text-yellow-400 transition-colors z-10 bg-black border-2 border-gray-400 rounded p-1"
          >
            <X className="h-3 w-3" />
          </button>
        )}

        <div className="text-center mb-3">
          <h2 className="text-lg font-bold text-yellow-300 font-mono tracking-wider">{title}</h2>
        </div>

        {modalState === "init" && (
          <div className="text-center">
            <div className="bg-black border-2 border-gray-400 rounded p-2 mb-3 mx-auto w-fit">
              <img
                src={initImage || "/placeholder.svg"}
                alt="Transaction preview"
                className="w-20 h-20 mx-auto rounded object-contain pixelated"
              />
            </div>
            <p className="text-cyan-300 mb-4 text-sm leading-tight font-mono">{initText}</p>
            <div className="flex gap-2 justify-center max-w-xs mx-auto">
              <Button
                onClick={handleClose}
                className="flex-1 bg-gray-600 border-2 border-gray-400 text-white hover:bg-gray-700 font-mono text-xs py-1"
              >
                CANCEL
              </Button>
              <Button
                onClick={handleConfirm}
                className="flex-1 bg-red-600 border-2 border-red-400 hover:bg-red-700 text-white font-mono text-xs py-1"
              >
                CONFIRM
              </Button>
            </div>
          </div>
        )}

        {modalState === "waiting" && (
          <div className="text-center">
            <div className="bg-black border-2 border-gray-400 rounded p-3 mb-3 mx-auto w-fit">
              <Loader2 className="h-10 w-10 text-green-400 animate-spin" />
            </div>
            <p className="text-green-400 mb-2 text-sm font-bold animate-pulse font-mono">PROCESSING...</p>
            <p className="text-cyan-300 text-xs font-mono">CONFIRM IN WALLET</p>
          </div>
        )}

        {modalState === "completed" && (
          <div className="text-center">
            <p className="text-cyan-300 mb-3 text-sm leading-tight font-mono">{completedText}</p>
            <div className="mb-3">
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-1 justify-items-center max-w-3xl mx-auto">
                {extractedCards.map((card, index) => (
                  <div key={index} className="scale-75">
                    <Card cardData={card} showBackDefault={true} />
                  </div>
                ))}
              </div>
            </div>
            <div className="flex gap-2 justify-center max-w-sm mx-auto">
              <Button
                onClick={handleClose}
                className="flex-1 bg-gray-600 border-2 border-gray-400 hover:bg-gray-700 text-white font-mono text-xs py-1"
              >
                CLOSE
              </Button>
              {onOpenAnother && (
                <Button
                  onClick={handleOpenAnother}
                  className="flex-1 bg-cyan-600 border-2 border-cyan-400 hover:bg-cyan-700 text-white font-mono text-xs py-1"
                >
                  OPEN ANOTHER
                </Button>
              )}
            </div>
          </div>
        )}

        {modalState === "error" && (
          <div className="text-center">
            <div className="bg-black border-2 border-red-400 rounded p-2 mb-3 mx-auto w-fit">
              <div className="text-red-400 text-xl font-mono">ERROR</div>
            </div>
            <p className="text-red-400 mb-1 font-bold font-mono text-sm">TRANSACTION FAILED</p>
            <p className="text-cyan-300 mb-3 text-xs font-mono">{errorMessage}</p>
            <div className="flex gap-2 justify-center max-w-xs mx-auto">
              <Button
                onClick={handleClose}
                className="flex-1 bg-gray-600 border-2 border-gray-400 text-white hover:bg-gray-700 font-mono text-xs py-1"
              >
                CLOSE
              </Button>
              <Button
                onClick={() => setModalState("init")}
                className="flex-1 bg-red-600 border-2 border-red-400 hover:bg-red-700 text-white font-mono text-xs py-1"
              >
                TRY AGAIN
              </Button>
            </div>
          </div>
        )}

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
    </div>
  )
}
