"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { joinRoom } from "@/lib/quiz-service"
import { getAuth, signInAnonymously } from "firebase/auth"
import { toast } from "sonner"

export default function JoinPage() {
  const router = useRouter()
  const [roomCode, setRoomCode] = useState("")
  const [playerName, setPlayerName] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      console.log("Joining room with code:", roomCode)
      
      const sessionId = sessionStorage.getItem("sessionId") || `session_${Date.now()}_${Math.random()}`
      if (!sessionStorage.getItem("sessionId")) {
        sessionStorage.setItem("sessionId", sessionId)
      }

      // Add timeout - if joinRoom takes more than 15 seconds, fail
      const joinPromise = joinRoom(roomCode.trim(), playerName.trim(), sessionId, "")
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Join request timed out - check room code")), 15000)
      )

      const { roomId, participantId } = await Promise.race([joinPromise, timeoutPromise]) as any
      
      console.log("Join successful, roomId:", roomId, "participantId:", participantId)
      sessionStorage.setItem("roomId", roomId)
      sessionStorage.setItem("participantId", participantId)

      toast.success("Joined successfully!")
      router.push(`/play/${roomCode}`)
    } catch (err: any) {
      const message = err.message || "Failed to join room - check code"
      console.error("Join error:", err)
      setError(message)
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 to-purple-800 p-4 flex items-center justify-center">
      <Card className="p-12 max-w-md w-full bg-white shadow-2xl rounded-3xl">
        <h1 className="text-5xl font-black text-center text-purple-600 mb-8">JOIN</h1>

        {error && (
          <div className="mb-6 p-4 bg-red-100 border-2 border-red-500 text-red-700 rounded-xl font-bold">
            {error}
          </div>
        )}

        <form onSubmit={handleJoin} className="space-y-6">
          <div>
            <Label htmlFor="roomCode" className="text-purple-700 font-black text-lg">ROOM CODE</Label>
            <Input
              id="roomCode"
              type="text"
              placeholder="e.g., ABC123"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              className="mt-3 text-2xl font-black text-center py-4 border-2 border-purple-300 rounded-xl"
              disabled={isLoading}
            />
          </div>

          <div>
            <Label htmlFor="playerName" className="text-purple-700 font-black text-lg">YOUR NAME</Label>
            <Input
              id="playerName"
              type="text"
              placeholder="Enter your name"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              className="mt-3 text-xl font-bold py-4 border-2 border-purple-300 rounded-xl"
              disabled={isLoading}
            />
          </div>

          <Button
            type="submit"
            disabled={isLoading || !roomCode.trim() || !playerName.trim()}
            className="w-full mt-8 h-16 text-2xl font-black bg-lime-400 hover:bg-lime-500 text-purple-900 rounded-xl transform hover:scale-105 transition-all"
          >
            {isLoading ? "JOINING..." : "JOIN QUIZ"}
          </Button>
        </form>
      </Card>
    </div>
  )
}
