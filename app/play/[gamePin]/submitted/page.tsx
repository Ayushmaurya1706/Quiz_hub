"use client"

import { useState, useEffect, use } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { CheckCircle, Home } from "lucide-react"

export default function SubmittedPage({ params }: { params: Promise<{ gamePin: string }> }) {
  const { gamePin } = use(params)
  const router = useRouter()
  const [participantName, setParticipantName] = useState("")

  useEffect(() => {
    // Get participant name from session storage or local storage if available
    const storedName = sessionStorage.getItem("participantName") || localStorage.getItem("lastPlayerName")
    if (storedName) {
      setParticipantName(storedName)
    }
  }, [])

  const handleGoHome = () => {
    // Clear session storage
    sessionStorage.removeItem("roomId")
    sessionStorage.removeItem("participantId")
    sessionStorage.removeItem("participantName")

    // Clear any shuffled questions from session storage
    const keysToRemove = []
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i)
      if (key && key.startsWith("shuffled_")) {
        keysToRemove.push(key)
      }
    }
    keysToRemove.forEach(key => sessionStorage.removeItem(key))

    router.push("/")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 to-purple-800 p-6 flex items-center justify-center">
      <Card className="p-12 max-w-md w-full bg-white shadow-2xl rounded-3xl text-center">
        {/* Success Icon */}
        <div className="mb-6">
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="h-16 w-16 text-green-500" />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-4xl font-black text-purple-600 mb-4">
          QUIZ SUBMITTED!
        </h1>

        {/* Message */}
        <p className="text-gray-700 text-lg font-bold mb-2">
          {participantName ? `${participantName}, your response has been recorded!` : "Your response has been recorded!"}
        </p>
        <p className="text-gray-500 text-sm mb-8">
          Thank you for participating in this quiz.
        </p>

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
