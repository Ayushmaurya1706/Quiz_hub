"use client"

import { useEffect, useState, use } from "react"
import { useParams, useRouter } from "next/navigation"
import { onRoomChange, onParticipantsChange, nextQuestion, endQuestion, kickParticipant, type Room, type Participant } from "@/lib/quiz-service"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { doc, updateDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"

const answerColors = ["text-red-600", "text-blue-600", "text-yellow-600", "text-green-600"]
const answerBgColors = ["bg-red-100", "bg-blue-100", "bg-yellow-100", "bg-green-100"]

export default function AdminQuizDisplayPage({ params }: { params: Promise<{ gamePin: string }> }) {
  const { gamePin } = use(params)
  const router = useRouter()

  const [room, setRoom] = useState<Room | null>(null)
  const [participants, setParticipants] = useState<Participant[]>([])
  const [loading, setLoading] = useState(true)
  const [adminQuestionIndex, setAdminQuestionIndex] = useState(0)

  const roomId = typeof window !== "undefined" ? sessionStorage.getItem("roomId") : null

  useEffect(() => {
    if (!roomId) {
      setLoading(false)
      return
    }

    const unsubRoom = onRoomChange(roomId, setRoom)
    const unsubParticipants = onParticipantsChange(roomId, setParticipants)

    setLoading(false)

    return () => {
      unsubRoom()
      unsubParticipants()
    }
  }, [roomId])

  // Global timer countdown for host
  const [globalTimeLeft, setGlobalTimeLeft] = useState<number | null>(null)

  useEffect(() => {
    if (!room || room.quiz.status !== "quiz_started" || !room.quiz.quizStartTime || !room.quiz.quizDuration) return

    const startTime = room.quiz.quizStartTime.seconds * 1000
    const durationMs = room.quiz.quizDuration * 60 * 1000
    const endTime = startTime + durationMs

    const updateTimer = () => {
      const now = Date.now()
      const timeLeft = Math.max(0, Math.ceil((endTime - now) / 1000))
      setGlobalTimeLeft(timeLeft)

      if (timeLeft <= 0) {
        // Quiz should end automatically via Firebase rules or manual end
        // For now, just update local state
      }
    }

    updateTimer()
    const timer = setInterval(updateTimer, 1000)

    return () => clearInterval(timer)
  }, [room?.quiz.status, room?.quiz.quizStartTime, room?.quiz.quizDuration])

  const handleNextQuestion = async () => {
    if (!room) return
    try {
      await nextQuestion(room.id)
    } catch (error) {
      console.error("Failed to go to next question:", error)
    }
  }

  const handleKickParticipant = async (participantId: string) => {
    if (!room) return
    try {
      await kickParticipant(room.id, participantId)
      toast.success("Participant removed")
    } catch (error) {
      console.error("Failed to kick participant:", error)
      toast.error("Failed to remove participant")
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
          <p className="text-gray-800 mb-4 text-lg font-bold">Room not found</p>
          <Button onClick={() => router.push("/host")} className="bg-purple-600 hover:bg-purple-700 text-white">
            Back
          </Button>
        </Card>
      </div>
    )
  }

  const currentQuestion = room.quiz.questions[adminQuestionIndex]
  const questionId = currentQuestion.id
  const answerCounts = [0, 0, 0, 0]
  let totalAnswered = 0

  participants.forEach((p) => {
    const answer = p.answers[questionId]
    if (answer !== undefined) {
      const optionIndex = currentQuestion.options.findIndex(opt => opt.id === answer.optionId)
      if (optionIndex !== -1) {
        answerCounts[optionIndex]++
        totalAnswered++
      }
    }
  })

  if (room.quiz.status === "quiz_ended") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-600 to-purple-800">
        <Card className="p-12 text-center bg-white max-w-2xl shadow-2xl rounded-3xl">
          <h1 className="text-6xl font-black text-purple-600 mb-6">QUIZ OVER!</h1>
          <p className="text-2xl text-gray-700 mb-8">Check the leaderboard</p>
          <div className="flex gap-4 justify-center">
            <Button
              onClick={() => router.push(`/host/${gamePin}`)}
              className="bg-lime-400 hover:bg-lime-500 text-purple-900 font-black text-xl px-12 py-6 rounded-2xl"
            >
              VIEW RESULTS
            </Button>
            <Button
              onClick={() => router.push("/")}
              className="bg-purple-600 hover:bg-purple-700 text-white font-black text-xl px-12 py-6 rounded-2xl"
            >
              GO BACK HOME
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 to-purple-800 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black text-white mb-2">
            Q{room.quiz.currentQuestionIndex + 1}/{room.quiz.questions.length}
          </h1>
          <div className="text-sm text-lime-300 font-bold">
            {totalAnswered}/{participants.length} answered
          </div>
        </div>

        {/* Question Card */}
        <Card className="p-8 bg-white rounded-3xl shadow-2xl mb-8 text-center">
                <h2 className="text-5xl font-black text-purple-800 whitespace-pre-wrap">
                  {currentQuestion.text}
                </h2>
              </Card>

        {/* Answer Options with Response Count - No correct answers shown */}
        <div className="grid grid-cols-2 gap-6 mb-8">
          {currentQuestion.options.map((option, index) => {
            const percentage =
              totalAnswered > 0 ? Math.round((answerCounts[index] / totalAnswered) * 100) : 0
            return (
              <Card
                key={index}
                className="p-8 rounded-2xl shadow-lg bg-gray-100"
              >
                <div className="flex items-center justify-between mb-4">
                  <span className={`text-5xl font-black ${answerColors[index]}`}>
                    {String.fromCharCode(65 + index)}
                  </span>
                </div>
                <p className="text-2xl font-bold text-gray-800 mb-6 whitespace-pre-wrap">{option.text}</p>
                <div className="w-full bg-gray-300 rounded-full h-8 overflow-hidden">
                  <div
                    className={`h-full ${answerBgColors[index]} transition-all duration-500`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <p className="text-center text-xl font-black text-gray-700 mt-4">
                  {answerCounts[index]} ({percentage}%)
                </p>
              </Card>
            )
          })}
        </div>

        {/* Participants List with Kick Option */}
        <div className="mb-8">
          <h3 className="text-2xl font-black text-white mb-4">Participants ({participants.length})</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {participants.map((p) => (
              <Card key={p.id} className="p-4 bg-white rounded-xl shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-lg font-bold text-purple-800">{p.name}</p>
                    <p className="text-sm text-gray-600">Answered: {p.answers[questionId] ? "Yes" : "No"}</p>
                  </div>
                  <Button
                    onClick={() => handleKickParticipant(p.id)}
                    className="bg-red-500 hover:bg-red-600 text-white text-sm px-3 py-1 rounded-lg"
                  >
                    Kick
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Admin Navigation Buttons */}
        <div className="flex justify-center gap-4 mb-8 max-w-5xl mx-auto w-full">
          <Button
            onClick={() => setAdminQuestionIndex(Math.max(0, adminQuestionIndex - 1))}
            disabled={adminQuestionIndex === 0}
            className="bg-white/20 hover:bg-white/30 text-white font-black px-6 py-2"
          >
            ← Previous Question
          </Button>
          <Button
            onClick={() => setAdminQuestionIndex(Math.min(room.quiz.questions.length - 1, adminQuestionIndex + 1))}
            disabled={adminQuestionIndex === room.quiz.questions.length - 1}
            className="bg-white/20 hover:bg-white/30 text-white font-black px-6 py-2"
          >
            Next Question →
          </Button>
        </div>

        {/* Next Question Button - Hidden for auto flow, but kept in code if needed for manual override */}
        {/* 
        {(room.quiz.status === "question_ended" || room.quiz.status === "question_active") && (
          <div className="flex justify-center">
            <Button
              onClick={handleNextQuestion}
              className="bg-lime-400 hover:bg-lime-500 text-purple-900 font-black text-2xl px-12 py-8 rounded-2xl shadow-xl"
            >
              NEXT QUESTION
            </Button>
          </div>
        )} 
        */}
        
        {/* Manual Quiz End Button */}
        <div className="flex justify-center gap-4 mt-8">
          <Button
            onClick={async () => {
              if (!room) return
              try {
                // End quiz manually
                await updateDoc(doc(db, "rooms", room.id), {
                  "quiz.status": "quiz_ended"
                })
                toast.success("Quiz ended!")
              } catch (error) {
                console.error("Failed to end quiz:", error)
                toast.error("Failed to end quiz")
              }
            }}
            className="bg-red-500 hover:bg-red-600 text-white font-black text-xl px-8 py-4 rounded-2xl"
          >
            END QUIZ NOW
          </Button>
        </div>

        {/* Global Timer Display */}
        {globalTimeLeft !== null && (
          <div className="flex justify-center mt-4">
            <div className={`text-2xl font-black px-6 py-3 rounded-xl ${
              globalTimeLeft <= 300 ? "bg-red-500 text-white animate-pulse" :
              globalTimeLeft <= 600 ? "bg-yellow-400 text-purple-900" :
              "bg-lime-400 text-purple-900"
            }`}>
              Time Left: {Math.floor(globalTimeLeft / 60)}:{(globalTimeLeft % 60).toString().padStart(2, '0')}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
