"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "./ui/button"
import { ArrowRight, Play, Star, Zap, Brush  } from "lucide-react"
import { SectionType } from "./types/SectionTypes"

interface LandingPageProps {
    setCurrentView: (view: SectionType) => void
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

            // Create pixelated effect around mouse
            const gradient = ctx.createRadialGradient(mousePos.x, mousePos.y, 0, mousePos.x, mousePos.y, radius)

            gradient.addColorStop(0, "rgba(59, 130, 246, 0.3)")
            gradient.addColorStop(0.5, "rgba(147, 51, 234, 0.2)")
            gradient.addColorStop(1, "rgba(0, 0, 0, 0)")

            ctx.fillStyle = gradient

            // Draw pixelated circles
            for (let x = mousePos.x - radius; x < mousePos.x + radius; x += pixelSize) {
                for (let y = mousePos.y - radius; y < mousePos.y + radius; y += pixelSize) {
                    const distance = Math.sqrt((x - mousePos.x) ** 2 + (y - mousePos.y) ** 2)
                    if (distance < radius) {
                        const alpha = (1 - distance / radius) * 0.4
                        ctx.fillStyle = `rgba(59, 130, 246, ${alpha})`
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
            { threshold: 0.1 },
        )

        const sections = ["hero", "features", "gallery", "stats", "cta"]
        sections.forEach((id) => {
            const element = document.getElementById(id)
            if (element) observer.observe(element)
        })

        return () => observer.disconnect()
    }, [])

    const images = [
        "/images/img1.png?height=300&width=400",
        "/images/img2.png?height=300&width=400",
        "/images/img3.png?height=300&width=400",

    ]

    return (
        <div className="relative min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 overflow-hidden">
            {/* Pixelated mouse effect canvas */}
            <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-10" style={{ mixBlendMode: "screen" }} />

            {/* Animated background */}
            <div className="fixed inset-0 opacity-20">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 animate-pulse" />
                <div
                    className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-bounce"
                    style={{ animationDuration: "6s" }}
                />
                <div
                    className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-bounce"
                    style={{ animationDuration: "8s", animationDelay: "2s" }}
                />
            </div>

            {/* Hero Section */}
            <section
                id="hero"
                className={`relative z-20 min-h-screen flex items-center justify-center px-4 transition-all duration-1000 ${isVisible.hero ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
                    }`}
            >
                <div className="max-w-4xl mx-auto text-center">
                

                    <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
                        Beads 151
                      
                    </h1>

                    <section
                id="gallery"
                className={`relative z-20  transition-all duration-1000 delay-300 ${isVisible.gallery ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
                    }`}
            >
          
                <div className="relative overflow-hidden">
                    <div className="flex animate-scroll-left">
                        {[...images, ...images, ...images].map((src, index) => (
                            <div key={index} className="flex-shrink-0 mx-4">
                                <div className="relative group">
                                    <img
                                        src={src || "/placeholder.svg"}
                                        alt={`Gallery image ${index + 1}`}
                                        width={200}
                                        height={200}
                                        className="rounded-lg shadow-2xl transition-transform duration-300 group-hover:scale-105"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
      <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                        <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 text-lg mb-8 mt-8" onClick={() => setCurrentView("mint")}>
                            Mint <ArrowRight className="ml-2 h-5 w-5" />
                        </Button>
                      
                    </div>

                    <p className="text-lg md:text-lg text-gray-300 mb-8 max-w-2xl mx-auto leading-relaxed">
                       Bead151 is a dynamic on-chain NFT experience. Mint unique collectible cards, each with their own rarity and traits. Burn your NFTs to earn candy, evolve your collection, and unlock rare combinations. All the art, and every action — from minting to evolving — is powered by verified smart contracts and stored directly on the blockchain. No off-chain hacks, just pure on-chain play.
                    </p>

              
                </div>
            </section>

            

            {/* Features Section */}
            <section
                id="features"
                className={`relative z-20 mb-8 px-4 transition-all duration-1000 delay-500 ${isVisible.features ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
                    }`}
            >
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">About the project</h2>
                     
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            {
                                icon: <Zap className="h-8 w-8" />,
                                title: "On-Chain",
                                description: "Everything is on-chain, all the art and all the actions. We use X number of smart contracts to make this possible",
                            },
                            {
                                icon: <Brush className="h-8 w-8" />,
                                title: "Hand made art",
                                description: "All 151 cards are hand drawn and pixelated by our artist, no use of AI",
                            },
                            {
                                icon: <Star className="h-8 w-8" />,
                                title: "Awesome experience",
                                description: "Join us in an unique experience, only on Base",
                            },
                        ].map((feature, index) => (
                            <div
                                key={index}
                                className="group p-8 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-all duration-300 hover:scale-105"
                            >
                                <div className="text-blue-400 mb-4 group-hover:text-blue-300 transition-colors">{feature.icon}</div>
                                <h3 className="text-xl font-semibold text-white mb-3">{feature.title}</h3>
                                <p className="text-gray-400 leading-relaxed">{feature.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

           

            <style>{`
        @keyframes scroll-left {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-33.333%);
          }
        }
        
        .animate-scroll-left {
          animation: scroll-left 30s linear infinite;
        }
      `}</style>
        </div>
    )
}
