"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "./ui/button"
import { ArrowRight, Star, Zap, Brush, RefreshCcw } from "lucide-react"
import { SectionType } from "./types/SectionTypes"
import Card from "./Card"
import { generateFakeCardMetadataFromCardIdWithElement } from "../lib/combineCompleteCard"

interface LandingPageProps {
  setCurrentView: (view: SectionType) => void
}

interface CardData {
  metadata: string
}

export default function LandingPage({ setCurrentView }: LandingPageProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const [isVisible, setIsVisible] = useState({
    hero: false,
    features: false,
    gallery: false,
    stats: false,
    cta: false,
  })

  const [randomCards, setRandomCards] = useState<CardData[]>([])
  const [isLoadingGallery, setIsLoadingGallery] = useState<boolean>(true)

  // Check if only front page should be enabled
  const onlyFrontPage = import.meta.env.VITE_FEATURE_ONLY_FRONT_PAGE === "true"

  // Helpers
  function getRandomUniqueInts(count: number, min: number, max: number): number[] {
    const set = new Set<number>()
    while (set.size < count) {
      set.add(Math.floor(Math.random() * (max - min + 1)) + min)
    }
    return Array.from(set)
  }

  async function loadRandomCards() {
    setIsLoadingGallery(true)
    try {
      const ids = getRandomUniqueInts(10, 1, 151)
      const metas = await Promise.all(
        ids.map((id) => generateFakeCardMetadataFromCardIdWithElement(id))
      )
      setRandomCards(metas.map((m) => ({ metadata: m })))
    } catch (e) {
      console.error("Failed generating random gallery cards:", e)
      setRandomCards([])
    } finally {
      setIsLoadingGallery(false)
    }
  }

  // Mouse tracking for pixelated effect
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY })
    }
    window.addEventListener("mousemove", handleMouseMove)
    return () => window.removeEventListener("mousemove", handleMouseMove)
  }, [])

  // Pixelated canvas effect
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    const pixelSize = 8
    const radius = 80

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      const gradient = ctx.createRadialGradient(
        mousePos.x, mousePos.y, 0,
        mousePos.x, mousePos.y, radius
      )

      gradient.addColorStop(0, "rgba(251, 191, 36, 0.4)") // yellow-400
      gradient.addColorStop(0.5, "rgba(34, 197, 94, 0.3)") // green-500
      gradient.addColorStop(1, "rgba(0, 0, 0, 0)")

      ctx.fillStyle = gradient

      for (let x = mousePos.x - radius; x < mousePos.x + radius; x += pixelSize) {
        for (let y = mousePos.y - radius; y < mousePos.y + radius; y += pixelSize) {
          const distance = Math.sqrt((x - mousePos.x) ** 2 + (y - mousePos.y) ** 2)
          if (distance < radius) {
            const alpha = (1 - distance / radius) * 0.5
            const color =
              Math.floor((x + y) / pixelSize) % 2 === 0
                ? `rgba(251, 191, 36, ${alpha})` // yellow-400
                : `rgba(34, 197, 94, ${alpha})` // green-500
            ctx.fillStyle = color
            ctx.fillRect(x, y, pixelSize, pixelSize)
          }
        }
      }

      requestAnimationFrame(animate)
    }

    animate()

    const handleResize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [mousePos])

  // Intersection Observer for scroll animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = entry.target.id as keyof typeof isVisible
            setIsVisible((prev) => ({ ...prev, [id]: true }))
          }
        })
      },
      { threshold: 0.1 }
    )

    const sections = ["hero", "features", "gallery", "stats", "cta"]
    sections.forEach((id) => {
      const element = document.getElementById(id)
      if (element) observer.observe(element)
    })

    return () => observer.disconnect()
  }, [])

  // Load 10 random cards on mount
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      await loadRandomCards()
      if (cancelled) return
    })()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-teal-900 via-cyan-800 to-teal-900 overflow-hidden font-mono">
      {/* Pixelated mouse effect canvas */}
      <canvas
        ref={canvasRef}
        className="fixed inset-0 pointer-events-none z-10"
        style={{ mixBlendMode: "screen" }}
      />

      {/* Retro grid pattern background */}
      <div className="fixed inset-0 opacity-10">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(rgba(34, 197, 94, 0.3) 1px, transparent 1px),
              linear-gradient(90deg, rgba(34, 197, 94, 0.3) 1px, transparent 1px)
            `,
            backgroundSize: "20px 20px",
          }}
        />
      </div>

      {/* Hero + Gallery Section */}
      <section
        id="hero"
        className={`relative z-20 min-h-screen flex items-center justify-center px-4 pt-20 transition-all duration-1000 ${
          isVisible.hero ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
        }`}
      >
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-7xl font-bold text-yellow-300 mb-6 leading-tight font-mono tracking-wider">
            BEADS 151
          </h1>

          {/* Gallery */}
          <section
            id="gallery"
            className={`relative z-20 mb-8 transition-all duration-1000 delay-300 ${
              isVisible.gallery ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
            }`}
          >
            <div className="relative overflow-hidden bg-black border-4 border-yellow-300 p-4 mb-4">
              {isLoadingGallery ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-cyan-300 text-sm font-mono">Loading cards…</div>
                </div>
              ) : randomCards.length === 0 ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-yellow-300 text-sm font-mono">No preview cards</div>
                </div>
              ) : (
                <div className="flex animate-scroll-left">
                  {[...randomCards, ...randomCards, ...randomCards].map((cardData, index) => (
                    <div key={`gallery-card-${index}`} className="flex-shrink-0 mx-2">
                      <div className="relative group">
                     
                          <Card
                            cardData={cardData}
                            showBackDefault={false}
                            disableFlip={false}
                            forceShowFront={false}
                            scaleIfHover={false}
                            customClasses="w-35 h-38 sm:w-45 sm:h-58"
                          />
                   
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-center">
              <Button
                size="sm"
                className="bg-cyan-700 hover:bg-cyan-600 border-2 border-cyan-400 text-white font-mono"
                onClick={loadRandomCards}
                disabled={isLoadingGallery}
              >
                <RefreshCcw className="h-4 w-4 mr-2" />
                Shuffle
              </Button>
            </div>
          </section>

          {!onlyFrontPage && (
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button
                size="lg"
                className="bg-red-600 hover:bg-red-700 border-4 border-red-400 text-white px-8 py-4 text-lg mb-8 mt-8 font-mono font-bold"
                onClick={() => setCurrentView("mint")}
              >
                MINT <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          )}

          <div className="bg-teal-800 border-4 border-yellow-300 p-6 mb-8">
            <div className="max-w-2xl mx-auto font-mono space-y-4">
              <p className="text-lg text-cyan-300 leading-relaxed">
                BEAD151 IS A DYNAMIC ON-CHAIN NFT EXPERIENCE.
              </p>
              <p className="text-base text-cyan-300 leading-relaxed">
                MINT UNIQUE COLLECTIBLE CARDS, EACH WITH THEIR OWN RARITY AND TRAITS. BURN YOUR NFTS
                TO EARN CANDY, EVOLVE YOUR COLLECTION, AND UNLOCK RARE COMBINATIONS.
              </p>
              <p className="text-base text-green-400 leading-relaxed">
                ALL THE ART, AND EVERY ACTION — FROM MINTING TO EVOLVING — IS POWERED BY OVER 600
                VERIFIED SMART CONTRACTS.
              </p>
              <p className="text-base text-yellow-300 font-bold leading-relaxed">
                NO OFF-CHAIN HACKS, JUST PURE ON-CHAIN PLAY.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section
        id="features"
        className={`relative pt-10 md:pt-0 z-20 mb-8 px-4 transition-all duration-1000 delay-500 ${
          isVisible.features ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
        }`}
      >
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-yellow-300 mb-6 font-mono tracking-wider">
              ABOUT THE PROJECT
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <Zap className="h-8 w-8" />,
                title: "ON-CHAIN",
                description:
                  "EVERYTHING IS ON-CHAIN, ALL THE ART AND ALL THE ACTIONS. WE USE OVER 600 SMART CONTRACTS TO MAKE THIS POSSIBLE",
              },
              {
                icon: <Brush className="h-8 w-8" />,
                title: "HAND MADE ART",
                description:
                  "ALL 151 CARDS ARE HAND DRAWN AND PIXELATED BY OUR ARTIST, NO USE OF AI",
              },
              {
                icon: <Star className="h-8 w-8" />,
                title: "AWESOME EXPERIENCE",
                description: "JOIN US IN AN UNIQUE EXPERIENCE, ONLY ON BASE",
              },
            ].map((feature, index) => (
              <div
                key={index}
                className="group p-6 bg-teal-800 border-4 border-yellow-300 hover:border-green-400 transition-all duration-300 hover:scale-105"
              >
                <div className="text-green-400 mb-4 group-hover:text-cyan-300 transition-colors">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-yellow-300 mb-3 font-mono">{feature.title}</h3>
                <p className="text-cyan-300 leading-relaxed font-mono text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <style>{`
        .pixelated {
          image-rendering: pixelated;
          image-rendering: -moz-crisp-edges;
          image-rendering: crisp-edges;
        }

        @keyframes scroll-left {
          0% { transform: translateX(0); }
          100% { transform: translateX(-33.333%); }
        }
        .animate-scroll-left {
          animation: scroll-left 30s linear infinite;
        }
      `}</style>
    </div>
  )
}
