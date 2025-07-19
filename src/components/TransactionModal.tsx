"use client"

import { useState, useEffect } from "react"
import { Button } from "./ui/button"
import { X, Loader2 } from "lucide-react"

interface TransactionModalProps {
    isOpen: boolean
    onClose: () => void
    title: string
    initText: string
    completedText: string
    initImage: string
    completedImage: string
    onConfirm: () => Promise<void>
}

type ModalState = "init" | "waiting" | "completed" | "error"

export default function TransactionModal({
    isOpen,
    onClose,
    title,
    initText,
    completedText,
    initImage,
    completedImage,
    onConfirm
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
        <>
            <div className="fixed inset-0 z-50 flex items-center justify-center">
                <div className="absolute inset-0 bg-black/80" onClick={handleClose} />

                <div className="relative bg-teal-800 border-4 border-yellow-300 p-6 max-w-md w-full mx-4 font-mono">
                    {modalState !== "waiting" && (
                        <button
                            onClick={handleClose}
                            className="absolute top-2 right-2 text-yellow-300 hover:text-green-400 z-10 bg-black border-2 border-yellow-300 p-1"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    )}

                    <div className="text-center mb-6">
                        <h2 className="text-xl font-bold text-yellow-300 mb-2 font-mono tracking-wider">{title}</h2>
                    </div>

                {modalState === "init" && (
                    <div className="text-center">
                        <div className="bg-black border-2 border-yellow-300 p-4 mb-4">
                            <img
                                src={initImage || "/placeholder.svg"}
                                alt="Transaction preview"
                                className="w-24 h-24 mx-auto object-contain pixelated"
                            />
                        </div>
                        <p className="text-cyan-300 mb-6 text-sm font-mono">{initText}</p>
                        <div className="flex gap-2 justify-center">
                            <Button
                                onClick={handleClose}
                                className="flex-1 bg-gray-600 border-2 border-gray-400 text-white hover:bg-gray-700 font-mono text-xs py-2"
                            >
                                CANCEL
                            </Button>
                            <Button
                                onClick={handleConfirm}
                                className="flex-1 bg-red-600 border-2 border-red-400 hover:bg-red-700 text-white font-mono text-xs py-2"
                            >
                                CONFIRM
                            </Button>
                        </div>
                    </div>
                )}

                {modalState === "waiting" && (
                    <div className="text-center">
                        <div className="bg-black border-2 border-yellow-300 p-6 mb-4">
                            <Loader2 className="h-12 w-12 text-green-400 animate-spin mx-auto" />
                        </div>
                        <p className="text-green-400 mb-4 text-sm font-bold animate-pulse font-mono">PROCESSING...</p>
                        <p className="text-cyan-300 text-xs font-mono">
                            CONFIRM IN WALLET
                        </p>
                    </div>
                )}

                {modalState === "completed" && (
                    <div className="text-center">
                        <div className="bg-black border-2 border-yellow-300 p-4 mb-4">
                            <img
                                src={completedImage || "/placeholder.svg"}
                                alt="Transaction completed"
                                className="w-24 h-24 mx-auto object-contain pixelated"
                            />
                        </div>
                        <p className="text-green-400 mb-6 text-sm font-mono">{completedText}</p>
                        <Button 
                            onClick={handleClose} 
                            className="w-full bg-green-600 border-2 border-green-400 hover:bg-green-700 text-white font-mono text-xs py-2"
                        >
                            CLOSE
                        </Button>
                    </div>
                )}

                {modalState === "error" && (
                    <div className="text-center">
                        <div className="bg-black border-2 border-red-400 p-4 mb-4">
                            <div className="text-red-400 text-2xl">❌</div>
                        </div>
                        <p className="text-red-400 mb-2 font-bold text-sm font-mono">TRANSACTION FAILED</p>
                        <p className="text-cyan-300 mb-6 text-xs font-mono">{errorMessage}</p>
                        <div className="flex gap-2">
                            <Button
                                onClick={handleClose}
                                className="flex-1 bg-gray-600 border-2 border-gray-400 text-white hover:bg-gray-700 font-mono text-xs py-2"
                            >
                                CLOSE
                            </Button>
                            <Button
                                onClick={() => setModalState("init")}
                                className="flex-1 bg-red-600 border-2 border-red-400 hover:bg-red-700 text-white font-mono text-xs py-2"
                            >
                                TRY AGAIN
                            </Button>
                        </div>
                    </div>
                )}
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

            .pixelated {
                image-rendering: pixelated;
                image-rendering: -moz-crisp-edges;
                image-rendering: crisp-edges;
            }
        `}</style>
        </>
    )
}