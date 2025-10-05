"use client"

import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/Button"
import { Terminal, Users, Zap, Globe } from "lucide-react"
import { useEffect, useRef } from "react"
import { TypewriterText } from "@/components/typewriter-text"

export default function HomePage() {
  const heroRef = useRef<HTMLDivElement>(null)
  const featuresRef = useRef<HTMLDivElement>(null)
  const spaceshipRef = useRef<HTMLDivElement>(null)
  const ctaRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("animate-fade-in-up")
          }
        })
      },
      { threshold: 0.1 },
    )

    const elements = [heroRef.current, featuresRef.current, spaceshipRef.current, ctaRef.current]
    elements.forEach((el) => el && observer.observe(el))

    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.scrollY
      const stars1 = document.querySelector(".stars") as HTMLElement
      const stars2 = document.querySelector(".stars2") as HTMLElement
      const stars3 = document.querySelector(".stars3") as HTMLElement

      if (stars1) stars1.style.transform = `translateY(${scrolled * 0.5}px)`
      if (stars2) stars2.style.transform = `translateY(${scrolled * 0.3}px)`
      if (stars3) stars3.style.transform = `translateY(${scrolled * 0.2}px)`
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0f172a] via-[#1e293b] to-[#0f172a] text-blue-300 relative overflow-hidden font-mono scroll-smooth">
      {/* Scanline effect */}
      <div className="absolute inset-0 pointer-events-none opacity-5">
        <div className="h-full w-full bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(96,165,250,0.1)_2px,rgba(96,165,250,0.1)_4px)]"></div>
      </div>

      {/* CRT flicker effect */}
      <div className="absolute inset-0 pointer-events-none opacity-5 animate-pulse"></div>

      {/* Pixel stars background */}
      <div className="absolute inset-0 overflow-hidden opacity-60">
        <div className="stars"></div>
        <div className="stars2"></div>
        <div className="stars3"></div>
      </div>

      {/* Navigation */}
      <nav className="relative z-10 border-b-2 border-blue-400/30 px-4 sm:px-6 md:px-8 py-4 bg-slate-900/50 backdrop-blur-[2px]">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <Terminal className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400" />
            <span className="text-lg sm:text-xl font-bold tracking-wider text-blue-400">[SPATIUM]</span>
          </div>
          <div className="hidden md:flex items-center gap-4 lg:gap-6 text-xs lg:text-sm">
            <Link href="#mission" className="hover:text-cyan-400 transition-colors">
              {">"} MISSION
            </Link>
            <Link href="#features" className="hover:text-cyan-400 transition-colors">
              {">"} FEATURES
            </Link>
            <Link href="#about" className="hover:text-cyan-400 transition-colors">
              {">"} ABOUT
            </Link>
            <Link href="/pages/lobby" className="hover:text-cyan-400 transition-colors">
              {">"} PLAY NOW
            </Link>
          </div>
          <Button
            asChild
            size="sm"
            className="md:hidden bg-blue-400 text-black hover:bg-blue-300 font-mono font-bold border-2 border-blue-400 text-xs px-3 py-1"
          >
            <Link href="/pages/lobby">PLAY</Link>
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 md:px-8 pt-8 sm:pt-12 pb-12 sm:pb-20">
        <div ref={heroRef} className="space-y-6 sm:space-y-8 opacity-0 transition-all duration-1000">
          {/* ASCII Art Header */}
          <div className="text-center overflow-x-auto">
            <pre className="text-blue-400 text-[0.5rem] sm:text-xs md:text-sm leading-tight inline-block drop-shadow-[0_0_10px_rgba(96,165,250,0.5)]">
              {`   _____ _____   _______ _____ _    _ __  __ 
  / ____|  __ \\ /\\|__   __|_   _| |  | |  \\/  |
 | (___ | |__) /  \\  | |    | | | |  | | \\  / |
  \\___ \\|  ___/ /\\ \\ | |    | | | |  | | |\\/| |
  ____) | |  / ____ \\| |   _| |_| |__| | |  | |
 |_____/|_| /_/    \\_\\_|  |_____|\\____/|_|  |_|`}
            </pre>
          </div>

          {/* System Status */}
          <div className="border-2 border-blue-400/50 bg-slate-900/80 backdrop-blur-[2px] p-4 sm:p-6 max-w-4xl mx-auto shadow-[0_0_20px_rgba(96,165,250,0.3)]">
            <div className="space-y-2 text-xs sm:text-sm">
              <p className="text-cyan-400">
                <TypewriterText text="> SYSTEM STATUS: ONLINE" speed={40} />
              </p>
              <p className="text-blue-300">
                <TypewriterText text="> MISSION TYPE: MARS HABITAT SIMULATION" speed={40} delay={800} />
              </p>
              <p className="text-purple-400">
                <TypewriterText text="> CLEARANCE LEVEL: AUTHORIZED" speed={40} delay={1600} />
              </p>
            </div>
          </div>

          {/* Main heading */}
          <div className="text-center space-y-3 sm:space-y-4 py-6 sm:py-8">
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight px-2">
              <span className="text-blue-400">{">"} BUILDING THE FUTURE OF</span>
              <br />
              <span className="text-cyan-400 animate-pulse drop-shadow-[0_0_15px_rgba(34,211,238,0.7)]">
                SPACE HABITATS
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-sm sm:text-base md:text-lg text-blue-200 max-w-3xl mx-auto leading-relaxed px-4">
              {">"} Collaborate with your crew to design, build, and survive in a Mars habitat.
              <br className="hidden sm:block" />
              {">"} Face real challenges, make critical decisions, and learn what it takes to live among the stars.
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 pt-4 px-4">
            <Button
              asChild
              size="lg"
              className="w-full sm:w-auto bg-blue-400 text-black hover:bg-blue-300 font-mono font-bold border-2 border-blue-400 text-sm sm:text-base"
            >
              <Link href="/pages/lobby">
                <Users className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                {">"} JOIN MISSION
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="w-full sm:w-auto border-2 border-cyan-400 text-cyan-400 hover:bg-cyan-400/10 font-mono font-bold bg-transparent text-sm sm:text-base"
            >
              <Link href="#features">{">"} LEARN MORE</Link>
            </Button>
          </div>

          {/* Stats Terminal */}
          <div className="grid grid-cols-3 gap-2 sm:gap-4 max-w-3xl mx-auto pt-8 sm:pt-12 px-2">
            <div className="border-2 border-blue-400/50 bg-slate-900/80 backdrop-blur-[2px] p-2 sm:p-4 text-center shadow-[0_0_15px_rgba(96,165,250,0.2)]">
              <div className="text-xl sm:text-2xl md:text-3xl font-bold text-cyan-400 font-mono">
                <TypewriterText text="05" speed={100} />
              </div>
              <div className="text-[0.6rem] sm:text-xs text-blue-300 mt-1 sm:mt-2">
                <TypewriterText text="PLAYERS PER MISSION" speed={30} delay={300} />
              </div>
            </div>
            <div className="border-2 border-blue-400/50 bg-slate-900/80 backdrop-blur-[2px] p-2 sm:p-4 text-center shadow-[0_0_15px_rgba(96,165,250,0.2)]">
              <div className="text-xl sm:text-2xl md:text-3xl font-bold text-purple-400 font-mono">
                <TypewriterText text="20" speed={100} delay={100} />
              </div>
              <div className="text-[0.6rem] sm:text-xs text-blue-300 mt-1 sm:mt-2">
                <TypewriterText text="CRITICAL EVENTS" speed={30} delay={400} />
              </div>
            </div>
            <div className="border-2 border-blue-400/50 bg-slate-900/80 backdrop-blur-[2px] p-2 sm:p-4 text-center shadow-[0_0_15px_rgba(96,165,250,0.2)]">
              <div className="text-xl sm:text-2xl md:text-3xl font-bold text-blue-400 font-mono">
                <TypewriterText text="30" speed={100} delay={200} />
              </div>
              <div className="text-[0.6rem] sm:text-xs text-blue-300 mt-1 sm:mt-2">
                <TypewriterText text="MISSION DAYS" speed={30} delay={500} />
              </div>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <section
          id="features"
          ref={featuresRef}
          className="pt-12 sm:pt-20 space-y-8 sm:space-y-12 opacity-0 transition-all duration-1000"
        >
          <div className="text-center px-4">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-blue-400">{">"} MISSION FEATURES</h2>
            <div className="h-1 w-24 sm:w-32 bg-blue-400 mx-auto mt-3 sm:mt-4 shadow-[0_0_10px_rgba(96,165,250,0.7)]"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 px-2">
            <div className="border-2 border-blue-400/50 bg-slate-900/80 backdrop-blur-[2px] p-4 sm:p-6 space-y-3 sm:space-y-4 hover:border-cyan-400 transition-colors shadow-[0_0_15px_rgba(96,165,250,0.2)] hover:shadow-[0_0_25px_rgba(34,211,238,0.4)]">
              <div className="flex items-center gap-2 sm:gap-3">
                <Globe className="w-5 h-5 sm:w-6 sm:h-6 text-cyan-400 flex-shrink-0" />
                <h3 className="text-base sm:text-lg font-bold text-cyan-400">
                  <TypewriterText text="COLLABORATIVE DESIGN" speed={50} />
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-blue-200 leading-relaxed">
                <TypewriterText
                  text="> Work together to design a 20×20 habitat with essential areas: kitchen, sleeping quarters, recreation, and more."
                  speed={20}
                  delay={800}
                />
              </p>
            </div>

            <div className="border-2 border-blue-400/50 bg-slate-900/80 backdrop-blur-[2px] p-4 sm:p-6 space-y-3 sm:space-y-4 hover:border-cyan-400 transition-colors shadow-[0_0_15px_rgba(96,165,250,0.2)] hover:shadow-[0_0_25px_rgba(34,211,238,0.4)]">
              <div className="flex items-center gap-2 sm:gap-3">
                <Zap className="w-5 h-5 sm:w-6 sm:h-6 text-purple-400 flex-shrink-0" />
                <h3 className="text-base sm:text-lg font-bold text-purple-400">
                  <TypewriterText text="REAL TIME EVENTS" speed={50} delay={200} />
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-blue-200 leading-relaxed">
                <TypewriterText
                  text="> Face 20 technical challenges from oxygen leaks to meteor strikes. Every decision matters for survival."
                  speed={20}
                  delay={1000}
                />
              </p>
            </div>

            <div className="border-2 border-blue-400/50 bg-slate-900/80 backdrop-blur-[2px] p-4 sm:p-6 space-y-3 sm:space-y-4 hover:border-cyan-400 transition-colors shadow-[0_0_15px_rgba(96,165,250,0.2)] hover:shadow-[0_0_25px_rgba(34,211,238,0.4)]">
              <div className="flex items-center gap-2 sm:gap-3">
                <Users className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400 flex-shrink-0" />
                <h3 className="text-base sm:text-lg font-bold text-blue-400">
                  <TypewriterText text="TEAM ROLES" speed={50} delay={400} />
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-blue-200 leading-relaxed">
                <TypewriterText
                  text="> Each player gets a specialized role: Engineer, Medic, Biologist, Technician, or Scientist."
                  speed={20}
                  delay={1200}
                />
              </p>
            </div>
          </div>
        </section>

        {/* ASCII Art Spaceship */}
        <section ref={spaceshipRef} className="pt-12 sm:pt-20 opacity-0 transition-all duration-1000 overflow-x-auto">
          <div className="text-center">
            <pre className="text-blue-400 text-[0.5rem] sm:text-xs leading-tight inline-block opacity-60 drop-shadow-[0_0_8px_rgba(96,165,250,0.4)]">
              {`
       /\\
      /  \\
     |    |
    /|    |\\
   / |    | \\
  |  |    |  |
  |  |    |  |
  |  |::::|  |
  |  |::::|  |
  |  |::::|  |
  |  |::::|  |
  |  |::::|  |
   \\ |::::| /
    \\|::::|/
     |::::|
     |::::|
    /|::::|\\
   / |::::| \\
  |  |::::|  |
  |  |::::|  |
   \\ |::::| /
    \\|::::|/
     |::::|
     |::::|
     /====\\
    /======\\
   |========|
   |========|
    \\======/
     \\====/
      \\==/
       \\/
`}
            </pre>
          </div>
        </section>

        {/* CTA Section */}
        <section
          ref={ctaRef}
          className="pt-12 sm:pt-20 text-center space-y-4 sm:space-y-6 opacity-0 transition-all duration-1000 px-4"
        >
          <div className="border-2 border-blue-400/50 bg-slate-900/80 backdrop-blur-[2px] p-6 sm:p-8 max-w-2xl mx-auto shadow-[0_0_25px_rgba(96,165,250,0.3)]">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-cyan-400 mb-3 sm:mb-4">
              <TypewriterText text="> READY TO BOARD THE STARSHIP?" speed={50} />
            </h2>
            <p className="text-sm sm:text-base text-blue-200 mb-4 sm:mb-6">
              <TypewriterText
                text="> Join your crew and start building humanity's future in space."
                speed={30}
                delay={1200}
              />
            </p>
            <Button
              asChild
              size="lg"
              className="w-full sm:w-auto bg-cyan-400 text-slate-900 hover:bg-cyan-300 font-mono font-bold border-2 border-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.5)] text-sm sm:text-base"
            >
              <Link href="/pages/lobby">
                <Terminal className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                {">"} LAUNCH MISSION
              </Link>
            </Button>
          </div>
        </section>

        {/* Credits Section */}
        <section className="pt-12 sm:pt-20 pb-8 sm:pb-12">
          <div className="text-center mb-8 sm:mb-12 px-4">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-blue-400">{">"} MISSION CREW</h2>
            <div className="h-1 w-24 sm:w-32 bg-blue-400 mx-auto mt-3 sm:mt-4 shadow-[0_0_10px_rgba(96,165,250,0.7)]"></div>
            <p className="text-blue-300 mt-3 sm:mt-4 text-xs sm:text-sm">{">"} DEVELOPED BY</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 md:gap-6 max-w-6xl mx-auto px-2">
            {/* Team Member 1 */}
            <div className="border-2 border-blue-400/50 bg-slate-900/80 backdrop-blur-[2px] p-3 sm:p-4 text-center hover:border-cyan-400 transition-colors shadow-[0_0_15px_rgba(96,165,250,0.2)] hover:shadow-[0_0_25px_rgba(34,211,238,0.4)]">
              <div className="aspect-square border-2 border-cyan-400/50 bg-slate-800/50 mb-3 sm:mb-4 flex items-center justify-center overflow-hidden relative">
                <Image src="/JoseFernando.jpeg" alt="Team Member 1" fill className="object-cover" />
              </div>
              <p className="text-cyan-400 font-bold text-xs sm:text-sm mb-1">José Fernando González Ortiz</p>
              <p className="text-blue-300 text-[0.6rem] sm:text-xs break-all">joseortiz@utb.edu.co</p>
            </div>

            {/* Team Member 2 */}
            <div className="border-2 border-blue-400/50 bg-slate-900/80 backdrop-blur-[2px] p-3 sm:p-4 text-center hover:border-cyan-400 transition-colors shadow-[0_0_15px_rgba(96,165,250,0.2)] hover:shadow-[0_0_25px_rgba(34,211,238,0.4)]">
              <div className="aspect-square border-2 border-cyan-400/50 bg-slate-800/50 mb-3 sm:mb-4 flex items-center justify-center overflow-hidden relative">
                <Image src="/SantiagoQuintero.png" alt="Team Member 2" fill className="object-cover" />
              </div>
              <p className="text-cyan-400 font-bold text-xs sm:text-sm mb-1">Santiago Quintero Pareja</p>
              <p className="text-blue-300 text-[0.6rem] sm:text-xs break-all">squintero@utb.edu.co</p>
            </div>

            {/* Team Member 3 */}
            <div className="border-2 border-blue-400/50 bg-slate-900/80 backdrop-blur-[2px] p-3 sm:p-4 text-center hover:border-cyan-400 transition-colors shadow-[0_0_15px_rgba(96,165,250,0.2)] hover:shadow-[0_0_25px_rgba(34,211,238,0.4)]">
              <div className="aspect-square border-2 border-cyan-400/50 bg-slate-800/50 mb-3 sm:mb-4 flex items-center justify-center overflow-hidden relative">
                <Image src="/IsabellaArrieta.png" alt="Team Member 3" fill className="object-cover" />
              </div>
              <p className="text-cyan-400 font-bold text-xs sm:text-sm mb-1">Isabella Sofía Arrieta Guardo</p>
              <p className="text-blue-300 text-[0.6rem] sm:text-xs break-all">arrietai@utb.edu.co</p>
            </div>

            {/* Team Member 4 */}
            <div className="border-2 border-blue-400/50 bg-slate-900/80 backdrop-blur-[2px] p-3 sm:p-4 text-center hover:border-cyan-400 transition-colors shadow-[0_0_15px_rgba(96,165,250,0.2)] hover:shadow-[0_0_25px_rgba(34,211,238,0.4)]">
              <div className="aspect-square border-2 border-cyan-400/50 bg-slate-800/50 mb-3 sm:mb-4 flex items-center justify-center overflow-hidden relative">
                <Image src="/FabianQuintero.png" alt="Team Member 4" fill className="object-cover" />
              </div>
              <p className="text-cyan-400 font-bold text-xs sm:text-sm mb-1">Fabián Camilo Quintero Pareja</p>
              <p className="text-blue-300 text-[0.6rem] sm:text-xs break-all">parejaf@utb.edu.co</p>
            </div>

            {/* Team Member 5 */}
            <div className="border-2 border-blue-400/50 bg-slate-900/80 backdrop-blur-[2px] p-3 sm:p-4 text-center hover:border-cyan-400 transition-colors shadow-[0_0_15px_rgba(96,165,250,0.2)] hover:shadow-[0_0_25px_rgba(34,211,238,0.4)]">
              <div className="aspect-square border-2 border-cyan-400/50 bg-slate-800/50 mb-3 sm:mb-4 flex items-center justify-center overflow-hidden relative">
                <Image src="/EduardoNegrin.jpeg" alt="Team Member 5" fill className="object-cover" />
              </div>
              <p className="text-cyan-400 font-bold text-xs sm:text-sm mb-1">Eduardo Alejandro Negrín Pérez</p>
              <p className="text-blue-300 text-[0.6rem] sm:text-xs break-all">enegrin@utb.edu.co</p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t-2 border-blue-400/30 mt-12 sm:mt-20 bg-slate-900/50 backdrop-blur-[2px]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-4 sm:py-6 text-center text-blue-400/60 text-xs sm:text-sm">
          <p>{">"} © 2025 SPATIUM. ALL SYSTEMS OPERATIONAL.</p>
          <p className="mt-2 text-cyan-400/60">{">"} NASA SPACE APPS CHALLENGE 2025</p>
        </div>
      </footer>
    </div>
  )
}
