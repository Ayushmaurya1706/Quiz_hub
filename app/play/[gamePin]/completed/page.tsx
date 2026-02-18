"use client"

import { useState, useEffect, use } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { CheckCircle, Clock, AlertTriangle, LogOut, Home } from "lucide-react"

type ExitReason = "SUBMITTED_MANUALLY" | "TIME_OVER" | "TAB_SWITCH_LIMIT" | "LEFT_BY_USER"

const exitMessages: Record<ExitReason, { title: string; description: string; icon: typeof CheckCircle }> = {
  SUBMITTED_MANUALLY: {
    title: "Thank you for submitting your response.",
    description: "Your answers have been recorded.",
    icon: CheckCircle,
  },
  TIME_OVER: {
    title: "Time is over.",
    description: "Your responses were submitted automatically.",
    icon: Clock,
  },
  TAB_SWITCH_LIMIT: {
    title: "Quiz submitted due to multiple tab switches.",
    description: "Please stay on the quiz page during the session.",
    icon: AlertTriangle,
  },
  LEFT_BY_USER: {
    title: "You have left the quiz.",
    description: "We hope to see you again soon!",
    icon: LogOut,
  },
}

export default function CompletedPage({ params }: { params: Promise<{ gamePin: string }> }) {
  const { gamePin } = use(params)
  const router = useRouter()
  const [participantName, setParticipantName] = useState("")
  const [exitReason, setExitReason] = useState<ExitReason | null>(null)

  useEffect(() => {
    // Get participant name from session storage or local storage if available
    const storedName = sessionStorage.getItem("participantName") || localStorage.getItem("lastPlayerName")
    if (storedName) {
      setParticipantName(storedName)
    }

    // Get exit reason from URL query params
    const urlParams = new URLSearchParams(window.location.search)
    const reason = urlParams.get("exitReason") as ExitReason | null
    if (reason && exitMessages[reason]) {
      setExitReason(reason)
    }
  }, [])

  const handleGoHome = () => {
    // Clear session storage
    sessionStorage.removeItem("roomId")
    sessionStorage.removeItem("participantId")
    sessionStorage.removeItem("participantName")

    // Clear any shuffled questions from session storage
    const keysToRemove: string[] = []
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i)
      if (key && key.startsWith("shuffled_")) {
        keysToRemove.push(key)
      }
    }
    keysToRemove.forEach(key => sessionStorage.removeItem(key))

    router.push("/")
  }

  // Get the appropriate message based on exit reason
  const message = exitReason ? exitMessages[exitReason] : null
  const Icon = message?.icon || CheckCircle

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 to-purple-800 p-6 flex items-center justify-center">
      <Card className="p-12 max-w-md w-full bg-white shadow-2xl rounded-3xl text-center">
        {/* Icon */}
        <div className="mb-6">
          <div className="w-24 h-24 bg-purple-100 rounded-full flex items-center justify-center mx-auto">
            <Icon className="h-16 w-16 text-purple-600" />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-3xl font-black text-purple-600 mb-4">
          QUIZ COMPLETED
        </h1>

        {/* Message */}
        {message ? (
          <>
            <p className="text-gray-700 text-lg font-bold mb-2">
              {participantName ? `${participantName}, ${message.title}` : message.title}
            </p>
            <p className="text-gray-500 text-sm mb-8">
              {message.description}
            </p>
          </>
        ) : (
          <>
            <p className="text-gray-700 text-lg font-bold mb-2">
              {participantName ? `${participantName}, your quiz session has ended.` : "Your quiz session has ended."}
            </p>
            <p className="text-gray-500 text-sm mb-8">
              Thank you for participating.
            </p>
          </>
        )}

        {/* Go Home Button */}
        <Button
          onClick={handleGoHome}
          className="w-full h-14 text-xl font-black bg-purple-600 hover:bg-purple-700 text-white rounded-xl transform hover:scale-105 transition-all"
        >
          <Home className="h-5 w-5 mr-2" />
          GO BACK HOME
        </Button>
      </Card>
    </div>
  )
}
