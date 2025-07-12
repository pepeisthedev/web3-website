"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "./ui/button"
import { ArrowRight, Play, Star, Users, Zap } from "lucide-react"
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
                    <div className="mb-6">
                        <span className="inline-block px-4 py-2 bg-blue-500/20 text-blue-300 rounded-full text-sm font-medium backdrop-blur-sm border border-blue-500/30">
                            ✨ Welcome to the Future
                        </span>
                    </div>

                    <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
                        Beads 151
                        <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                            {" "}
                            Next Level
                        </span>
                    </h1>

                    <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-2xl mx-auto leading-relaxed">
                        Discover a revolutionary platform that transforms the way you interact with technology. Built for creators,
                        designed for the future.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                        <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 text-lg" onClick={() => setCurrentView("mint")}>
                            Mint <ArrowRight className="ml-2 h-5 w-5" />
                        </Button>
                        <Button
                            size="lg"
                            variant="outline"
                            className="border-gray-600 text-white hover:bg-gray-800 px-8 text-lg bg-transparent"
                        >
                            <Play className="mr-2 h-5 w-5" /> Watch Demo
                        </Button>
                    </div>
                </div>
            </section>

            {/* Infinite Rolling Images */}
            <section
                id="gallery"
                className={`relative z-20  transition-all duration-1000 delay-300 ${isVisible.gallery ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
                    }`}
            >
                <div className="mb-12 text-center">
                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Powered by Innovation</h2>
                    <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                        See what's possible when cutting-edge technology meets creative vision
                    </p>
                </div>

                <div className="relative overflow-hidden">
                    <div className="flex animate-scroll-left">
                        {[...images, ...images, ...images].map((src, index) => (
                            <div key={index} className="flex-shrink-0 mx-4">
                                <div className="relative group">
                                    <img
                                        src={src || "/placeholder.svg"}
                                        alt={`Gallery image ${index + 1}`}
                                        width={400}
                                        height={300}
                                        className="rounded-lg shadow-2xl transition-transform duration-300 group-hover:scale-105"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>


            {/* Features Section */}
            <section
                id="features"
                className={`relative z-20 py-20 px-4 transition-all duration-1000 delay-500 ${isVisible.features ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
                    }`}
            >
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Why Choose Us?</h2>
                        <p className="text-xl text-gray-400 max-w-3xl mx-auto">
                            We're not just another platform. We're your gateway to unlimited possibilities.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            {
                                icon: <Zap className="h-8 w-8" />,
                                title: "Lightning Fast",
                                description: "Experience blazing-fast performance that keeps up with your creativity.",
                            },
                            {
                                icon: <Users className="h-8 w-8" />,
                                title: "Community Driven",
                                description: "Join thousands of creators building the future together.",
                            },
                            {
                                icon: <Star className="h-8 w-8" />,
                                title: "Premium Quality",
                                description: "Every detail crafted to perfection for the ultimate experience.",
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

            {/* Stats Section */}
            <section
                id="stats"
                className={`relative z-20 py-20 px-4 transition-all duration-1000 delay-700 ${isVisible.stats ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
                    }`}
            >
                <div className="max-w-4xl mx-auto">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                        {[
                            { number: "10K+", label: "Active Users" },
                            { number: "99.9%", label: "Uptime" },
                            { number: "50+", label: "Countries" },
                            { number: "24/7", label: "Support" },
                        ].map((stat, index) => (
                            <div key={index} className="group">
                                <div className="text-3xl md:text-4xl font-bold text-white mb-2 group-hover:text-blue-400 transition-colors">
                                    {stat.number}
                                </div>
                                <div className="text-gray-400 text-sm uppercase tracking-wide">{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section
                id="cta"
                className={`relative z-20 py-20 px-4 transition-all duration-1000 delay-900 ${isVisible.cta ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
                    }`}
            >
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Ready to Begin?</h2>
                    <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
                        Join thousands of creators who have already transformed their workflow with our platform.
                    </p>
                    <Button
                        size="lg"
                        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-12 py-4 text-lg"
                    >
                        Start Your Journey <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
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
