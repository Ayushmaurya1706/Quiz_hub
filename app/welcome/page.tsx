"use client"

import Link from "next/link"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function WelcomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 to-purple-800 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {/* College Name */}
        <div className="text-center mb-6">
          <p className="text-xl md:text-2xl font-semibold text-blue-300">
            Bankatlal Badruka College for Information Technology
          </p>
        </div>

        {/* Main Title */}
        <div className="text-center mb-4">
          <h1 className="text-5xl md:text-7xl font-black text-white">
            National Abacus IT Quiz
          </h1>
        </div>

        {/* Subtitle */}
        <div className="text-center mb-6">
          <p className="text-2xl md:text-3xl text-lime-400 font-bold">
            presents LiveQuiz Hub
          </p>
        </div>

        {/* Description */}
        <div className="text-center mb-10">
          <p className="text-lg text-white/80 max-w-2xl mx-auto">
            Experience the thrill of real-time quiz competitions. Compete with participants, 
            track your progress on live leaderboards, and test your knowledge in timed assessments.
          </p>
        </div>

        {/* Get Started Button */}
        <div className="text-center mb-12">
          <Link href="/">
            <Button className="bg-lime-400 hover:bg-lime-500 text-purple-900 py-6 px-12 text-xl rounded-2xl font-black transition-all hover:shadow-lg">
              Get Started
            </Button>
          </Link>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Real-time synchronization */}
          <Card className="p-6 bg-white/10 backdrop-blur rounded-2xl border border-white/20">
            <div className="text-4xl mb-3">⚡</div>
            <h3 className="font-black text-white mb-2">Real-time synchronization</h3>
            <p className="text-sm text-white/80 font-bold">Instant updates across all devices</p>
          </Card>

          {/* Live Leaderboards */}
          <Card className="p-6 bg-white/10 backdrop-blur rounded-2xl border border-white/20">
            <div className="text-4xl mb-3">🏆</div>
            <h3 className="font-black text-white mb-2">Live Leaderboards</h3>
            <p className="text-sm text-white/80 font-bold">Track rankings in real-time</p>
          </Card>

          {/* Timed Assessments */}
          <Card className="p-6 bg-white/10 backdrop-blur rounded-2xl border border-white/20">
            <div className="text-4xl mb-3">⏱️</div>
            <h3 className="font-black text-white mb-2">Timed Assessments</h3>
            <p className="text-sm text-white/80 font-bold">Challenge yourself with time limits</p>
          </Card>
        </div>
      </div>
    </div>
  )
}
