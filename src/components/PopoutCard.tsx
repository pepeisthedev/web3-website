"use client"

import type React from "react"
import { useState } from "react"
import Card from "./Card"

interface CardData {
  tokenId?: number
  cardId: number
  svg: string
  description: string
}

interface PopoutCardProps {
  cardData: CardData
  showBackDefault?: boolean
}

export default function PopoutCard({ cardData, showBackDefault = false }: PopoutCardProps) {
  const [isPopped, setIsPopped] = useState(false)

  const handleCardClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsPopped(true)
  }

  const handleBackdropClick = () => {
    setIsPopped(false)
  }

  const handlePopoutCardClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    // Allow the card to flip when in popout mode
  }

  return (
    <>
      {/* Normal card in grid - always shows front */}
      <div
        onClick={handleCardClick}
        className="cursor-pointer transition-all duration-200 ease-out hover:scale-105 hover:z-10 relative"
      >
        <Card
          cardData={cardData}
          showBackDefault={false} // Always show front in grid
          disableFlip={true} // Disable flip in grid
          forceShowFront={true} // Force front display
          scaleIfHover={true} // Scale on hover
        />
      </div>

      {/* Popped out card */}
      {isPopped && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={handleBackdropClick} />

          {/* Popped card - larger and can flip */}
          <div className="relative z-10 scale-150 sm:scale-200" onClick={handlePopoutCardClick}>
            <Card
              cardData={cardData}
              showBackDefault={showBackDefault}
              disableFlip={false} // Allow flipping in popout
              forceShowFront={false} // Don't force front in popout
              scaleIfHover={false} 
            />
          </div>

          {/* Close hint */}
          <div className="absolute top-4 right-4 text-white/70 text-sm">Click outside to close</div>
        </div>
      )}
    </>
  )
}
