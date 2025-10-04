"use client"

import Link from "next/link"
import { Button } from "@/components/ui/Button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card"
import { Globe, Users, Zap, ArrowRight, Rocket } from "lucide-react"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a1628] via-[#1a1a4e] to-[#2d1b4e] text-white overflow-hidden relative">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="stars" />
        <div className="stars2" />
        <div className="stars3" />
      </div>

      <div className="container mx-auto px-4 py-12 relative z-10">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center space-y-6 animate-fade-in">
            <div className="flex items-center justify-center gap-3">
              <Globe className="h-12 w-12 text-[#00e5ff]" />
              <h1
                className="text-4xl md:text-6xl font-black tracking-wide"
                style={{
                  fontFamily: "'Orbitron', 'Arial Black', sans-serif",
                }}
              >
                <span className="bg-gradient-to-r from-[#00e5ff] to-[#00d4ff] bg-clip-text text-transparent">
                  Space
                </span>
                <span className="bg-gradient-to-r from-[#a78bfa] to-[#c084fc] bg-clip-text text-transparent">
                  Habitat
                </span>
              </h1>
            </div>
            <p className="text-xl md:text-2xl text-emerald-400 font-light tracking-wide">
              <span className="font-bold">Prepare your crew for habitat construction</span>
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/lobby" className="w-full sm:w-auto">
              <Button
                size="lg"
                className="w-full text-lg font-semibold px-10 py-6 bg-[#22d3ee] hover:bg-[#06b6d4] text-slate-900 shadow-lg shadow-cyan-500/50 transition-all tracking-wide cursor-pointer"
              >
                <Rocket className="mr-2 h-5 w-5" />
                Join room
              </Button>
            </Link>
            <Link href="/how-to-play" className="w-full sm:w-auto">
              <Button
                size="lg"
                variant="outline"
                className="w-full text-lg font-medium px-10 py-6 bg-transparent border-2 border-[#22d3ee]/50 text-[#22d3ee] hover:bg-[#22d3ee]/10 hover:border-[#22d3ee] transition-all tracking-wide cursor-pointer"
              >
                Create room
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mt-16">
            <Card className="bg-[#0f1a2e]/70 border-[#22d3ee]/30 backdrop-blur-md hover:border-[#22d3ee]/60 hover:shadow-lg hover:shadow-cyan-500/20 transition-all">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-xl font-bold text-[#22d3ee] tracking-wide">
                  <span className="text-3xl">🏗️</span>
                  Design Habitats
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-slate-300 leading-relaxed text-base">
                  Use a 20×20 grid powered by Phaser 3 to place functional areas like kitchens, sleep quarters, and
                  control centers. Balance space, cost, and crew needs.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="bg-[#0f1a2e]/70 border-[#22d3ee]/30 backdrop-blur-md hover:border-[#22d3ee]/60 hover:shadow-lg hover:shadow-cyan-500/20 transition-all">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-xl font-bold text-[#22d3ee] tracking-wide">
                  <Users className="h-7 w-7 text-[#22d3ee]" />
                  Cooperate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-slate-300 leading-relaxed text-base">
                  Work with up to 5 players in real-time. Each role brings unique perspectives to create the optimal
                  habitat design for deep space missions.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="bg-[#0f1a2e]/70 border-[#22d3ee]/30 backdrop-blur-md hover:border-[#22d3ee]/60 hover:shadow-lg hover:shadow-cyan-500/20 transition-all">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-xl font-bold text-[#22d3ee] tracking-wide">
                  <Zap className="h-7 w-7 text-[#22d3ee]" />
                  Survive Events
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-slate-300 leading-relaxed text-base">
                  Face technical challenges like oxygen leaks, power failures, and equipment malfunctions. Your design
                  choices determine crew survival!
                </CardDescription>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-[#0f1a2e]/70 border-[#22d3ee]/30 backdrop-blur-md">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-[#22d3ee] flex items-center gap-2 tracking-wide">
                <Users className="h-6 w-6" />
                Mission Objective
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-[#22d3ee] mt-2 flex-shrink-0" />
                <p className="text-slate-300 leading-relaxed text-base">
                  <strong className="text-[#22d3ee] font-semibold">Mission:</strong> Design a space habitat that can
                  sustain your crew through a 30-day mission within strict budget constraints.
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-[#22d3ee] mt-2 flex-shrink-0" />
                <p className="text-slate-300 leading-relaxed text-base">
                  <strong className="text-[#22d3ee] font-semibold">Challenge:</strong> Balance area requirements, costs,
                  and crew needs while preparing for random technical events that will test your design.
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-[#22d3ee] mt-2 flex-shrink-0" />
                <p className="text-slate-300 leading-relaxed text-base">
                  <strong className="text-[#22d3ee] font-semibold">Victory:</strong> Keep all crew resources (Hunger,
                  Sanity, Oxygen, Health) above critical levels throughout the entire simulation.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.8s ease-out;
        }

        .stars,
        .stars2,
        .stars3 {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          width: 100%;
          height: 100%;
          display: block;
        }

        /* Removed animation to keep stars static and always visible */
        .stars {
          background: transparent
            url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Ccircle cx='10' cy='10' r='0.8' fill='white' opacity='0.8'/%3E%3Ccircle cx='50' cy='30' r='0.6' fill='white' opacity='0.6'/%3E%3Ccircle cx='80' cy='60' r='0.9' fill='white' opacity='0.9'/%3E%3Ccircle cx='30' cy='80' r='0.7' fill='white' opacity='0.7'/%3E%3Ccircle cx='120' cy='40' r='0.8' fill='white' opacity='0.8'/%3E%3Ccircle cx='160' cy='90' r='0.6' fill='white' opacity='0.6'/%3E%3Ccircle cx='90' cy='120' r='0.7' fill='white' opacity='0.7'/%3E%3Ccircle cx='140' cy='160' r='0.8' fill='white' opacity='0.8'/%3E%3Ccircle cx='180' cy='20' r='0.6' fill='white' opacity='0.6'/%3E%3Ccircle cx='20' cy='140' r='0.9' fill='white' opacity='0.9'/%3E%3Ccircle cx='65' cy='15' r='0.7' fill='white' opacity='0.7'/%3E%3Ccircle cx='110' cy='75' r='0.6' fill='white' opacity='0.6'/%3E%3Ccircle cx='145' cy='25' r='0.8' fill='white' opacity='0.8'/%3E%3Ccircle cx='35' cy='110' r='0.7' fill='white' opacity='0.7'/%3E%3Ccircle cx='175' cy='135' r='0.6' fill='white' opacity='0.6'/%3E%3Ccircle cx='95' cy='180' r='0.8' fill='white' opacity='0.8'/%3E%3Ccircle cx='130' cy='50' r='0.7' fill='white' opacity='0.7'/%3E%3Ccircle cx='15' cy='165' r='0.6' fill='white' opacity='0.6'/%3E%3Ccircle cx='190' cy='105' r='0.9' fill='white' opacity='0.9'/%3E%3Ccircle cx='55' cy='145' r='0.7' fill='white' opacity='0.7'/%3E%3Ccircle cx='100' cy='5' r='0.6' fill='white' opacity='0.6'/%3E%3Ccircle cx='170' cy='70' r='0.6' fill='white' opacity='0.6'/%3E%3C/svg%3E")
            repeat;
        }

        .stars2 {
          background: transparent
            url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='250' height='250'%3E%3Ccircle cx='20' cy='40' r='1' fill='white' opacity='0.5'/%3E%3Ccircle cx='90' cy='20' r='1.2' fill='white' opacity='0.7'/%3E%3Ccircle cx='130' cy='100' r='1' fill='white' opacity='0.6'/%3E%3Ccircle cx='200' cy='180' r='1.1' fill='white' opacity='0.6'/%3E%3Ccircle cx='60' cy='200' r='1' fill='white' opacity='0.5'/%3E%3Ccircle cx='180' cy='80' r='1.2' fill='white' opacity='0.7'/%3E%3Ccircle cx='45' cy='120' r='1' fill='white' opacity='0.6'/%3E%3Ccircle cx='150' cy='60' r='1.1' fill='white' opacity='0.5'/%3E%3Ccircle cx='220' cy='140' r='1' fill='white' opacity='0.6'/%3E%3Ccircle cx='110' cy='230' r='1.2' fill='white' opacity='0.7'/%3E%3Ccircle cx='30' cy='160' r='1' fill='white' opacity='0.5'/%3E%3Ccircle cx='190' cy='30' r='1.1' fill='white' opacity='0.6'/%3E%3Ccircle cx='75' cy='90' r='1' fill='white' opacity='0.5'/%3E%3Ccircle cx='165' cy='210' r='1.2' fill='white' opacity='0.7'/%3E%3Ccircle cx='125' cy='15' r='1' fill='white' opacity='0.6'/%3E%3Ccircle cx='240' cy='110' r='1.1' fill='white' opacity='0.5'/%3E%3Ccircle cx='10' cy='70' r='1' fill='white' opacity='0.6'/%3E%3Ccircle cx='95' cy='170' r='1.2' fill='white' opacity='0.7'/%3E%3Ccircle cx='210' cy='50' r='1' fill='white' opacity='0.5'/%3E%3Ccircle cx='55' cy='240' r='1.1' fill='white' opacity='0.6'/%3E%3C/svg%3E")
            repeat;
        }

        .stars3 {
          background: transparent
            url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Ccircle cx='40' cy='60' r='1.5' fill='white' opacity='0.4'/%3E%3Ccircle cx='160' cy='140' r='1.8' fill='white' opacity='0.5'/%3E%3Ccircle cx='240' cy='80' r='1.6' fill='white' opacity='0.4'/%3E%3Ccircle cx='100' cy='240' r='1.7' fill='white' opacity='0.5'/%3E%3Ccircle cx='200' cy='200' r='1.5' fill='white' opacity='0.4'/%3E%3Ccircle cx='80' cy='160' r='1.6' fill='white' opacity='0.5'/%3E%3Ccircle cx='270' cy='180' r='1.8' fill='white' opacity='0.4'/%3E%3Ccircle cx='140' cy='40' r='1.5' fill='white' opacity='0.5'/%3E%3Ccircle cx='20' cy='220' r='1.7' fill='white' opacity='0.4'/%3E%3Ccircle cx='280' cy='120' r='1.6' fill='white' opacity='0.5'/%3E%3Ccircle cx='120' cy='100' r='1.5' fill='white' opacity='0.4'/%3E%3Ccircle cx='60' cy='20' r='1.8' fill='white' opacity='0.5'/%3E%3Ccircle cx='220' cy='260' r='1.6' fill='white' opacity='0.4'/%3E%3Ccircle cx='180' cy='30' r='1.7' fill='white' opacity='0.5'/%3E%3Ccircle cx='10' cy='150' r='1.5' fill='white' opacity='0.4'/%3E%3C/svg%3E")
            repeat;
        }
      `}</style>
    </div>
  )
}
