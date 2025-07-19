"use client"

import { useState } from "react"

interface CardData {
  svg: string
  description: string
}

interface CardProps {
  cardData: CardData
  showBackDefault?: boolean
  disableFlip?: boolean
  forceShowFront?: boolean // New prop to force front display
    scaleIfHover?: boolean 
}

export default function Card({
  cardData,
  showBackDefault = false,
  disableFlip = false,
  forceShowFront = false,
  scaleIfHover = true,
}: CardProps) {
  const [isFlipped, setIsFlipped] = useState(showBackDefault && !forceShowFront)

  const getImageSrc = () => {
    if (cardData.svg.startsWith("<svg")) {
      const encodedSvg = encodeURIComponent(cardData.svg)
      return `data:image/svg+xml,${encodedSvg}`
    }
    return cardData.svg
  }

  // Parse the JSON description and extract card title
  const getCardTitle = (): string => {
    try {
      const traits = JSON.parse(cardData.description)
      const cardTrait = traits.find((trait: any) => trait.trait_type === "Card")
      return cardTrait ? cardTrait.value : "Unknown Card"
    } catch (error) {
      console.error("Error parsing card description:", error)
      return "Unknown Card"
    }
  }

  // Parse the JSON description and extract Color and Rarity
  const getCardDetails = (): string => {
    try {
      const traits = JSON.parse(cardData.description)
      const colorTrait = traits.find((trait: any) => trait.trait_type === "Color")
      const rarityTrait = traits.find((trait: any) => trait.trait_type === "Rarity")

      const details = []
      if (colorTrait) {
        const colorValue = colorTrait.value.includes("hsl")
          ? colorTrait.value.match(/\d+/)?.[0] + "°"
          : colorTrait.value
        details.push(`Color: ${colorValue}`)
      }
      if (rarityTrait) details.push(`Rarity: ${rarityTrait.value}`)

      return details.join("\n")
    } catch (error) {
      console.error("Error parsing card description:", error)
      return "No details available"
    }
  }

  const handleCardClick = () => {
    if (!disableFlip && !forceShowFront) {
      setIsFlipped(!isFlipped)
    }
  }

  // Force show front if forceShowFront is true
  const shouldShowFront = forceShowFront || !isFlipped

  return (
     <div className="w-auto h-auto flex flex-row justify-center items-center m-0">
      <div className="w-full max-w-6xl flex flex-row justify-center items-center">
        <div className="w-40 h-46 sm:w-48 h-44 sm:h-60 perspective-1000 cursor-pointer m-1 sm:m-2" onClick={handleCardClick}>
          <div
            className={`relative w-full h-full transition-transform duration-300 ease-out preserve-3d ${
              shouldShowFront ? "" : "rotate-y-180"
            }`}
          >
            {/* Front of card (details) */}
            <div className={`absolute inset-0 w-full h-full backface-hidden bg-black border-4 border-gray-400 p-2 sm:p-3 shadow-lg rounded-lg flex flex-col transition-all duration-200 font-mono ${
              scaleIfHover ? 'hover:scale-105 hover:border-yellow-300' : ''
            }`}>
              {/* Larger image container */}
              <div className="w-full h-24 sm:h-36 flex items-center justify-center bg-gray-600 border-2 border-gray-400 rounded mb-2">
                <img
                  src={getImageSrc() || "/placeholder.svg"}
                  alt={getCardTitle()}
                  className="max-w-full max-h-full object-contain pixelated"
                />
              </div>

              {/* Text content in remaining space */}
              <div className="flex-1 w-full flex flex-col justify-start mt-2">
                <h1 className="text-xxs sm:text-sm font-bold text-yellow-300 leading-tight mb-1 text-left font-mono">
                  {getCardTitle()}
                </h1>

                <div className="text-xxxs text-green-400 text-left space-y-0.5 font-mono">
                  {getCardDetails()
                    .split("\n")
                    .map((line, index) => (
                      <div key={index} className="whitespace-nowrap overflow-hidden text-ellipsis text-xxxs">
                        {line}
                      </div>
                    ))}
                </div>
              </div>
            </div>

            {/* Back of card */}
            <div className={`absolute inset-0 w-full h-full backface-hidden rotate-y-180 bg-teal-800 border-4 border-yellow-300 p-2 sm:p-3 shadow-lg rounded-lg flex flex-col items-center justify-center transition-all duration-200 font-mono ${
              scaleIfHover ? 'hover:scale-105 hover:border-cyan-300' : ''
            }`}>
              <div className="w-16 sm:w-24 h-16 sm:h-24 bg-black border-2 border-gray-400 rounded flex items-center justify-center mb-4">
                <span className="text-xl sm:text-3xl font-bold text-yellow-300 font-mono">B</span>
              </div>

              <h2 className="text-sm sm:text-lg font-bold text-yellow-300 text-center mb-2 font-mono">BEAD151</h2>
              <p className="text-xs sm:text-sm text-cyan-300 text-center font-mono">TRADING CARD</p>

              <div className="mt-4 text-xs text-green-400 text-center font-mono">CLICK TO REVEAL</div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .perspective-1000 {
          perspective: 1000px;
        }
        .preserve-3d {
          transform-style: preserve-3d;
        }
        .backface-hidden {
          backface-visibility: hidden;
        }
        .rotate-y-180 {
          transform: rotateY(180deg);
        }

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

        .text-xxs {
            font-size: 10px;
            line-height: 12px;
        }

        .text-xxxs {
            font-size: 8px;
            line-height: 10px;
        }
      `}</style>
    </div>
  )
}
