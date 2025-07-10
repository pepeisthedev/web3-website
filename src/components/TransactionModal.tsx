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
    onConfirm,
}: TransactionModalProps) {
    const [modalState, setModalState] = useState<ModalState>("init")
    const [errorMessage, setErrorMessage] = useState("")

    // Reset modal state when opened
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
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose} />

            {/* Modal */}
            <div className="relative bg-gradient-to-br from-slate-900 to-purple-900 rounded-2xl p-8 max-w-md w-full mx-4 border border-white/10 shadow-2xl">
                {/* Close button - only show if not waiting */}
                {modalState !== "waiting" && (
                    <button
                        onClick={handleClose}
                        className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
                    >
                        <X className="h-6 w-6" />
                    </button>
                )}

                {/* Header */}
                <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold text-white mb-2">{title}</h2>
                </div>

                {/* Content based on state */}
                {modalState === "init" && (
                    <div className="text-center">
                        <img
                            src={initImage || "/placeholder.svg"}
                            alt="Transaction preview"
                            className="w-32 max-h-32 mx-auto mb-4 rounded-lg object-contain"
                        />
                        <p className="text-gray-300 mb-6 leading-relaxed">{initText}</p>
                        <div className="flex gap-3">
                            <Button
                                onClick={handleClose}
                                variant="outline"
                                className="flex-1 border-gray-600 text-white hover:bg-gray-800 bg-transparent"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleConfirm}
                                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                            >
                                Confirm
                            </Button>
                        </div>
                    </div>
                )}

                {modalState === "waiting" && (
                    <div className="text-center">
                        <div className="w-32 h-32 mx-auto mb-4 flex items-center justify-center">
                            <Loader2 className="h-16 w-16 text-blue-400 animate-spin" />
                        </div>
                        <p className="text-blue-400 mb-4 text-lg font-medium animate-pulse">Waiting for transaction...</p>
                        <p className="text-gray-400 text-sm">
                            Please confirm the transaction in your wallet and wait for confirmation.
                        </p>
                    </div>
                )}

                {modalState === "completed" && (
                    <div className="text-center">
                        <img
                            src={completedImage || "/placeholder.svg"}
                            alt="Transaction completed"
                            className="w-32 max-h-32 mx-auto mb-4 rounded-lg object-contain"
                        />
                        <p className="text-gray-300 mb-6 leading-relaxed">{completedText}</p>
                        <Button
                            onClick={handleClose}
                            className="w-full bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white"
                        >
                            Close
                        </Button>
                    </div>
                )}

                {modalState === "error" && (
                    <div className="text-center">
                        <div className="text-red-400 text-4xl mb-4">❌</div>
                        <p className="text-red-400 mb-2 font-medium">Transaction Failed</p>
                        <p className="text-gray-400 mb-6 text-sm">{errorMessage}</p>
                        <div className="flex gap-3">
                            <Button
                                onClick={handleClose}
                                variant="outline"
                                className="flex-1 border-gray-600 text-white hover:bg-gray-800 bg-transparent"
                            >
                                Close
                            </Button>
                            <Button
                                onClick={() => setModalState("init")}
                                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                            >
                                Try Again
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
