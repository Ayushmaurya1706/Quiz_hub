"use client"

import { useEffect, useState, use } from "react"
import { useParams } from "next/navigation"
import { onRoomChange, onParticipantChange, submitAnswer, type Room, type Participant } from "@/lib/quiz-service"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { toast } from "sonner"

// Kahoot answer colors
const answerColors = ["bg-red-500", "bg-blue-500", "bg-yellow-400", "bg-green-500"]

export default function QuizPlayPage({ params }: { params: Promise<{ gamePin: string }> }) {
  const { gamePin } = use(params)

  const [room, setRoom] = useState<Room | null>(null)
  const [participant, setParticipant] = useState<Participant | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeLeft, setTimeLeft] = useState(30)
  const [selectedOption, setSelectedOption] = useState<number | null>(null)
  const [submitted, setSubmitted] = useState(false)

  const participantId = typeof window !== "undefined" ? sessionStorage.getItem("participantId") : null
  const roomId = typeof window !== "undefined" ? sessionStorage.getItem("roomId") : null

  // Real-time listeners
  useEffect(() => {
    if (!roomId || !participantId) {
      setLoading(false)
      return
    }

    const unsubscribeRoom = onRoomChange(roomId, setRoom)
    const unsubscribeParticipant = onParticipantChange(roomId, participantId, setParticipant)

    setLoading(false)

    return () => {
      unsubscribeRoom()
      unsubscribeParticipant()
    }
  }, [roomId, participantId])

  // Reset answer state when question changes
  useEffect(() => {
    setSubmitted(false)
    setSelectedOption(null)
    setTimeLeft(30)
  }, [room?.quiz.currentQuestionIndex])

  // Countdown timer
  useEffect(() => {
    if (!room || room.quiz.status !== "question_active" || submitted) return

    setTimeLeft(30)
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (selectedOption !== null) {
            handleSubmitAnswer(selectedOption)
          } else {
            setSubmitted(true)
          }
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [room?.quiz.status, room?.quiz.currentQuestionIndex, submitted])

  const handleSubmitAnswer = async (optionIndex: number) => {
    if (!room || !participant || submitted) return

    if (!roomId) return

    try {
      setSubmitted(true)

      await submitAnswer(
        roomId,
        participant.id,
        room.quiz.currentQuestionIndex,
        optionIndex,
        room.quiz.questionStartTime!
      )

      // Silent submission - no feedback shown to player
    } catch (error) {
      console.error("Failed to submit answer:", error)
      toast.error("Failed to submit answer")
      setSubmitted(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-600 to-purple-800">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-white/30 border-t-white mx-auto mb-4" />
          <p className="text-2xl text-white font-black">LOADING...</p>
        </div>
      </div>
    )
  }

  if (!room) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-600 to-purple-800">
        <Card className="p-8 text-center bg-white">
          <p className="text-gray-800 mb-4 text-lg font-bold">Quiz not found</p>
          <Button onClick={() => window.location.href = "/"} className="bg-purple-600 hover:bg-purple-700 text-white">
            Back Home
          </Button>
        </Card>
      </div>
    )
  }

  const currentQuestion = room.quiz.questions[room.quiz.currentQuestionIndex]

  // Waiting for quiz to start
  if (room.quiz.status === "waiting") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-600 to-purple-800">
        <Card className="p-12 text-center bg-white max-w-md shadow-2xl rounded-3xl">
          <h2 className="text-4xl font-black mb-4 text-purple-600">READY?</h2>
          <p className="text-gray-700 mb-8 text-lg font-bold">Waiting for host to start...</p>
          <div className="flex gap-3 justify-center">
            <div className="w-4 h-4 bg-lime-400 rounded-full animate-bounce" />
            <div className="w-4 h-4 bg-lime-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
            <div className="w-4 h-4 bg-lime-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
          </div>
        </Card>
      </div>
    )
  }

  // Quiz ended
  if (room.quiz.status === "quiz_ended") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-600 to-purple-800">
        <Card className="p-12 text-center bg-white max-w-md shadow-2xl rounded-3xl">
          <div className="text-6xl mb-4">🏁</div>
          <h2 className="text-4xl font-black mb-6 text-purple-600">QUIZ OVER!</h2>
          <p className="text-gray-700 mb-2 text-lg font-bold">Final Score:</p>
          <p className="text-6xl font-black text-lime-400 mb-8">{participant?.totalScore || 0}</p>
          <Button onClick={() => window.location.href = "/"} className="w-full bg-purple-600 hover:bg-purple-700 text-white font-black">
            GO BACK HOME
          </Button>
        </Card>
      </div>
    )
  }

  // Question active
  if (room.quiz.status === "question_active" && currentQuestion) {
    return (
      <div className="flex flex-col min-h-screen bg-gradient-to-br from-purple-600 to-purple-800 p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-8 max-w-5xl mx-auto w-full">
          <div className="text-white font-black text-xl">Q{room.quiz.currentQuestionIndex + 1}/{room.quiz.questions.length}</div>
          <div className={`text-6xl font-black px-8 py-4 rounded-full transition-all ${
            timeLeft <= 5 ? "bg-red-500 text-white animate-pulse" :
            timeLeft <= 10 ? "bg-yellow-400 text-purple-900" :
            "bg-lime-400 text-purple-900"
          }`}>
            {timeLeft}
          </div>
          <div className="text-white font-black text-xl"></div>
        </div>

        {/* Question */}
        <Card className="mb-12 p-8 bg-white rounded-2xl shadow-2xl max-w-5xl mx-auto w-full">
          <h2 className="text-4xl font-black text-center text-purple-800">{currentQuestion.text}</h2>
        </Card>

        {/* Answers - Kahoot Style 2x2 Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto w-full flex-1 mb-6">
          {currentQuestion.options.map((option, index) => (
            <Button
              key={index}
              onClick={() => {
                setSelectedOption(index)
                handleSubmitAnswer(index)
              }}
              disabled={submitted}
              className={`h-32 text-2xl font-black rounded-2xl transition-all transform hover:scale-105 text-white ${
                selectedOption === index
                  ? `${answerColors[index]} shadow-lg scale-105`
                  : `${answerColors[index]} shadow-lg hover:brightness-110`
              } ${submitted ? "opacity-60 cursor-not-allowed" : ""}`}
            >
              {option}
            </Button>
          ))}
        </div>

        {submitted && (
          <div className="text-center mt-8">
            <p className="text-white font-black text-xl">ANSWER SUBMITTED ✓</p>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-600 to-purple-800">
      <p className="text-white font-black text-2xl">Loading...</p>
    </div>
  )
}
