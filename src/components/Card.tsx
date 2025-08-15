"use client"

import { useState, useEffect } from "react"
import { generateCardSvgDataUriFromMetadata } from '../lib/combineCompleteCard';


interface CardData {
  metadata: string
}

interface CardProps {
  cardData: CardData
  showBackDefault?: boolean
  disableFlip?: boolean
  forceShowFront?: boolean // New prop to force front display
  scaleIfHover?: boolean
  showCardStats?: boolean
  customClasses?: string // New prop to override default sizing
}

export default function Card({
  cardData,
  showBackDefault = false,
  disableFlip = false,
  forceShowFront = false,
  scaleIfHover = true,
  showCardStats = false,
  customClasses
}: CardProps) {
  const [isFlipped, setIsFlipped] = useState(showBackDefault && !forceShowFront)
  const [imageSrc, setImageSrc] = useState<string>("/placeholder.svg")
  const [isLoadingImage, setIsLoadingImage] = useState<boolean>(true)

  // Generate image from metadata when component mounts or metadata changes
  useEffect(() => {
    const generateImage = async () => {
      setIsLoadingImage(true)
      try {
        const generatedSrc = await generateCardSvgDataUriFromMetadata(cardData.metadata)
      //  console.log("Generated SVG Data URI:", generatedSrc)
        setImageSrc(generatedSrc)
      } catch (e) {
        console.error("Error generating card image:", e)
        setImageSrc("/placeholder.svg")
      } finally {
        setIsLoadingImage(false)
      }
    }

    generateImage()
  }, [cardData.metadata])

  // Extract SVG image from metadata (base64 or data URI)
  const getImageSrc = () => {
    return imageSrc
  }

  // Parse the JSON metadata and extract card title
  const getCardTitle = (): string => {
    try {
     // console.log("Card metadata:", cardData.metadata)
      const meta = JSON.parse(cardData.metadata)
      const attributes = meta.attributes || []
      const cardTrait = attributes.find((trait: any) => trait.trait_type === "Card")
      return cardTrait ? cardTrait.value : "Unknown Card"
    } catch (error) {
      console.error("Error parsing card metadata:", error)
      return "Unknown Card"
    }
  }

  // Parse the JSON metadata and extract Color, Attack, HP, Defense
  const getCardDetails = (): string => {
    try {
      const meta = JSON.parse(cardData.metadata)
      const attributes = meta.attributes || []
      const colorTrait = attributes.find((trait: any) => trait.trait_type === "Color")
      const attackTrait = attributes.find((trait: any) => trait.trait_type === "Attack")
      const hpTrait = attributes.find((trait: any) => trait.trait_type === "HP")
      const defenseTrait = attributes.find((trait: any) => trait.trait_type === "Defense")

      const details = []
      if (colorTrait) {
        const colorValue = colorTrait.value.includes("hsl")
          ? colorTrait.value.match(/\d+/)?.[0] + "°"
          : colorTrait.value
        details.push(`Color: ${colorValue}`)
      }

      if(showCardStats) {
        if (attackTrait) details.push(`Attack: ${attackTrait.value}`)
        if (hpTrait) details.push(`HP: ${hpTrait.value}`)
        if (defenseTrait) details.push(`Defense: ${defenseTrait.value}`)
      }

      return details.join("\n")
    } catch (error) {
      console.error("Error parsing card metadata:", error)
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
        <div className={`${customClasses || "w-40 h-46 sm:w-48 h-44 sm:h-60"} perspective-1000 cursor-pointer m-1 sm:m-2`} onClick={handleCardClick}>
          <div
            className={`relative w-full h-full transition-transform duration-300 ease-out preserve-3d ${
              shouldShowFront ? "" : "rotate-y-180"
            }`}
          >
            {/* Front of card (details) */}
            <div className={`absolute inset-0 w-full h-full backface-hidden shadow-lg rounded-lg flex flex-col transition-all duration-200 font-mono ${
              scaleIfHover ? 'hover:scale-105' : ''
            }`}>
              {/* Full card image */}
              <div className="w-full h-full flex items-center justify-center">
                {isLoadingImage ? (
                  <div className="flex items-center justify-center">
                    <div className="text-cyan-300 text-xs font-mono">Loading...</div>
                  </div>
                ) : (
                  <img
                    src={getImageSrc()}
                    alt={getCardTitle()}
                    className="w-full h-full object-contain rounded"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/placeholder.svg'
                    }}
                  />
                )}
              </div>
            </div>

            {/* Back of card */}
            <div className={`absolute inset-0 w-full h-full backface-hidden rotate-y-180 shadow-lg  flex flex-col items-center justify-center transition-all duration-200 font-mono ${
              scaleIfHover ? 'hover:scale-105 ' : ''
            }`} >
         
              <img
                src="/images/cardback.jpg"
                alt="Card Back"
                className="w-full h-full object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/placeholder.svg'
                }}
              />
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
