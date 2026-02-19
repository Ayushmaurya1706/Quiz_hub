"use client"

import Link from "next/link"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function WelcomePage() {
  return (
    <div className="min-h-screen bg-[#eaf4ff] flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {/* College Name */}
        <div className="text-center mb-6">
          <p className="text-black text-xl md:text-2xl font-medium">
            Seth Ghasiram Gopikishan Badruka Education Society
          </p>
          <p className="text-blue-600 text-2xl md:text-3xl font-semibold">
            Bankatlal Badruka College for Information Technology
          </p>
        </div>

        {/* Main Title */}
        <div className="text-center mb-4">
          <h1 className="text-5xl md:text-7xl font-black text-purple-700">
            NATIONAL ABACUS  IT QUIZ
          </h1>
        </div>

        {/* Subtitle */}
        <div className="text-center mb-6">
          <p className="text-2xl md:text-3xl text-lime-500 font-bold">
            presents LiveQuiz Hub
          </p>
        </div>

        {/* Description */}
        <div className="text-center mb-10">
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Experience the thrill of real-time quiz competitions. Compete with participants, 
            track your progress on live leaderboards, and test your knowledge in timed assessments.
          </p>
        </div>

        {/* Get Started Button */}
        <div className="text-center mb-12">
          <Link href="/entry">
            <Button className="bg-purple-600 hover:bg-purple-700 text-white py-6 px-12 text-xl rounded-2xl font-black transition-all hover:shadow-lg">
              Get Started
            </Button>
          </Link>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Real-time synchronization */}
          <Card className="p-6 bg-purple-50 rounded-2xl border border-purple-200 shadow-md">
            <div className="text-4xl mb-3">⚡</div>
            <h3 className="font-black text-purple-900 mb-2">Real-time synchronization</h3>
            <p className="text-sm text-purple-700 font-bold">Instant updates across all devices</p>
          </Card>

          {/* Live Leaderboards */}
          <Card className="p-6 bg-purple-50 rounded-2xl border border-purple-200 shadow-md">
            <div className="text-4xl mb-3">🏆</div>
            <h3 className="font-black text-purple-900 mb-2">Live Leaderboards</h3>
            <p className="text-sm text-purple-700 font-bold">Track rankings in real-time</p>
          </Card>

          {/* Timed Assessments */}
          <Card className="p-6 bg-purple-50 rounded-2xl border border-purple-200 shadow-md">
            <div className="text-4xl mb-3">⏱️</div>
            <h3 className="font-black text-purple-900 mb-2">Timed Assessments</h3>
            <p className="text-sm text-purple-700 font-bold">Challenge yourself with time limits</p>
          </Card>
        </div>
      </div>
    </div>
  )
}
