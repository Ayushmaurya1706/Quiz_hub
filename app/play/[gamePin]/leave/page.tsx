"use client"

import { useState, useEffect, use } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { leaveRoom } from "@/lib/quiz-service"
import { toast } from "sonner"
import { LogOut, ArrowLeft, Home } from "lucide-react"

export default function LeavePage({ params }: { params: Promise<{ gamePin: string }> }) {
  const { gamePin } = use(params)
  const router = useRouter()
  const [isLeaving, setIsLeaving] = useState(false)
  const [participantName, setParticipantName] = useState("")

  const roomId = typeof window !== "undefined" ? sessionStorage.getItem("roomId") : null
  const participantId = typeof window !== "undefined" ? sessionStorage.getItem("participantId") : null

  useEffect(() => {
    // Get participant name from session storage or local storage if available
    const storedName = sessionStorage.getItem("participantName") || localStorage.getItem("lastPlayerName")
    if (storedName) {
      setParticipantName(storedName)
    }
  }, [])

  const handleLeaveRoom = async () => {
    if (!roomId || !participantId) {
      toast.error("Unable to leave room - session expired")
      router.push("/")
      return
    }

    setIsLeaving(true)
    try {
      await leaveRoom(roomId, participantId)
      toast.success("Successfully left the room")

      // Clear session storage
      sessionStorage.removeItem("roomId")
      sessionStorage.removeItem("participantId")
      sessionStorage.removeItem("participantName")

      // Redirect to home
      router.push("/")
    } catch (error) {
      console.error("Failed to leave room:", error)
      toast.error("Failed to leave room")

      // Still clear session and redirect on error
      sessionStorage.removeItem("roomId")
      sessionStorage.removeItem("participantId")
      sessionStorage.removeItem("participantName")
      router.push("/")
    } finally {
      setIsLeaving(false)
    }
  }

  const handleGoBack = () => {
    router.push(`/play/${gamePin}`)
  }

  const handleGoHome = () => {
    // Clear session storage
    sessionStorage.removeItem("roomId")
    sessionStorage.removeItem("participantId")
    sessionStorage.removeItem("participantName")

    router.push("/")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 to-purple-800 p-6 flex items-center justify-center">
      <Card className="p-12 max-w-md w-full bg-white shadow-2xl rounded-3xl text-center">
        <div className="mb-8">
          <LogOut className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-4xl font-black text-purple-600 mb-4">LEAVE QUIZ?</h1>
          <p className="text-gray-700 text-lg font-bold">
            {participantName ? `${participantName}, are you sure you want to leave?` : "Are you sure you want to leave this quiz?"}
          </p>
          <p className="text-gray-500 text-sm mt-2">
            Your progress will be lost and you won't be able to rejoin.
          </p>
        </div>

        <div className="space-y-4">
          <Button
            onClick={handleLeaveRoom}
            disabled={isLeaving}
            className="w-full h-14 text-xl font-black bg-red-500 hover:bg-red-600 text-white rounded-xl transform hover:scale-105 transition-all"
          >
            {isLeaving ? "LEAVING..." : "YES, LEAVE QUIZ"}
          </Button>

          <Button
            onClick={handleGoBack}
            variant="outline"
            className="w-full h-14 text-xl font-black border-2 border-purple-300 text-purple-600 hover:bg-purple-50 rounded-xl"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            GO BACK TO QUIZ
          </Button>

          <Button
            onClick={handleGoHome}
            variant="ghost"
            className="w-full h-12 text-lg font-bold text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-xl"
          >
            <Home className="h-5 w-5 mr-2" />
            GO HOME INSTEAD
          </Button>
        </div>
      </Card>
    </div>
  )
}
