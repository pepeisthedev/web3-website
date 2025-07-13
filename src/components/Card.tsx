"use client"

interface CardData {
  svg: string
  description: string
}

interface CardProps {
    cardData: CardData
}

export default function Card({ cardData }: CardProps) {
    const getImageSrc = () => {
        if (cardData.svg.startsWith('<svg')) {
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
                // Extract just the hue value from hsl for shorter display
                const colorValue = colorTrait.value.includes('hsl') 
                    ? colorTrait.value.match(/\d+/)?.[0] + '°' 
                    : colorTrait.value
                details.push(`Color: ${colorValue}`)
            }
            if (rarityTrait) details.push(`Rarity: ${rarityTrait.value}`)
            
            return details.join('\n')
        } catch (error) {
            console.error("Error parsing card description:", error)
            return "No details available"
        }
    }
    

    
    return (
        <div className="bg-gradient-to-bl from-gray-900 via-gray-700 to-black w-auto h-auto flex flex-row justify-center items-center m-0 rounded-xl border-2 border-black">
            <div className="w-full max-w-6xl flex flex-row justify-center items-center">
                <div className="w-32 sm:w-48 bg-gradient-to-bl from-gray-900 via-gray-700 to-black p-2 sm:p-3 m-1 sm:m-2 shadow-lg rounded-xl flex flex-col items-center transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/20 cursor-pointer">
                    <div className="w-32 h-24 sm:w-48 sm:h-36 flex items-center justify-center rounded-xl">
                        <img
                            src={getImageSrc()}
                            alt={getCardTitle()}
                            className="max-w-full max-h-full object-contain rounded-lg"
                        />
                    </div>
                    
                    <h1 className="text-sm sm:text-xl font-bold text-white leading-tight mt-1 sm:mt-2 mb-1">{getCardTitle()}</h1>
                    
                    <p className="text-xs sm:text-sm text-gray-300  px-1 sm:px-2 space-y-1">
                      {getCardDetails().split('\n').map((line, index) => (
                        <div key={index} className="whitespace-nowrap overflow-hidden text-ellipsis">
                          {line}
                        </div>
                      ))}
                    </p>
                    
                    
                </div>
            </div>
        </div>
    )
    
}