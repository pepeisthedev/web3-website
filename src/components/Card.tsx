"use client"

interface CardProps {
    cardImage: string
    cardTitle: string
    cardDescription: string
}

export default function Card({ cardImage, cardTitle, cardDescription }: CardProps) {
    const getImageSrc = () => {
        if (cardImage.startsWith('<svg')) {
            const encodedSvg = encodeURIComponent(cardImage)
            return `data:image/svg+xml,${encodedSvg}`
        }
        return cardImage
    }

    return (
        <div className="bg-gradient-to-bl from-gray-900 via-gray-700 to-black w-auto h-auto flex flex-row justify-center items-center m-0 rounded-xl border-2 border-black">
            <div className="w-full max-w-6xl flex flex-row justify-center items-center">
                <div className="w-48 bg-gradient-to-bl from-gray-900 via-gray-700 to-black p-3 m-2 shadow-lg rounded-xl flex flex-col items-center transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/20 cursor-pointer">
                    <div className="max-w-48 h-36 flex items-center overflow-hidden rounded-xl">
                        <img
                            src={getImageSrc()}
                            alt={cardTitle}
                            className="w-full"
                        />
                    </div>
                    <h1 className="text-xl font-bold text-white leading-tight mt-2 mb-1 text-center">{cardTitle}</h1>
                    <p className="text-sm text-gray-300 text-center px-2">{cardDescription}</p>
                </div>
            </div>
        </div>
    )
}