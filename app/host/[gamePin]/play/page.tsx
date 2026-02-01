"use client"

import { useEffect, useState, use } from "react"
import { useParams, useRouter } from "next/navigation"
import { onRoomChange, onParticipantsChange, nextQuestion, type Room, type Participant } from "@/lib/quiz-service"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

const answerColors = ["text-red-600", "text-blue-600", "text-yellow-600", "text-green-600"]
const answerBgColors = ["bg-red-100", "bg-blue-100", "bg-yellow-100", "bg-green-100"]

export default function AdminQuizDisplayPage({ params }: { params: Promise<{ gamePin: string }> }) {
  const { gamePin } = use(params)
  const router = useRouter()

  const [room, setRoom] = useState<Room | null>(null)
  const [participants, setParticipants] = useState<Participant[]>([])
  const [loading, setLoading] = useState(true)

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

  const handleNextQuestion = async () => {
    if (!room) return
    try {
      await nextQuestion(room.id)
    } catch (error) {
      console.error("Failed to go to next question:", error)
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

  const currentQuestion = room.quiz.questions[room.quiz.currentQuestionIndex]
  const answerCounts = [0, 0, 0, 0]
  let totalAnswered = 0

  participants.forEach((p) => {
    const answer = p.answers[room.quiz.currentQuestionIndex]
    if (answer !== undefined) {
      answerCounts[answer.optionIndex]++
      totalAnswered++
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
                <h2 className="text-5xl font-black text-purple-800">
                  {currentQuestion.text}
                </h2>
              </Card>

        {/* Answer Options with Response Count */}
        <div className="grid grid-cols-2 gap-6 mb-8">
          {currentQuestion.options.map((option, index) => {
            const percentage =
              totalAnswered > 0 ? Math.round((answerCounts[index] / totalAnswered) * 100) : 0
            const isCorrect = index === currentQuestion.correctOptionIndex
            return (
              <Card
                key={index}
                className={`p-8 rounded-2xl shadow-lg transition-all ${
                  isCorrect ? "bg-green-100 border-4 border-green-500" : "bg-gray-100"
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <span className={`text-5xl font-black ${answerColors[index]}`}>
                    {String.fromCharCode(65 + index)}
                  </span>
                  {isCorrect && <Badge className="bg-green-500 text-white text-lg">CORRECT</Badge>}
                </div>
                <p className="text-2xl font-bold text-gray-800 mb-6">{option}</p>
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

        {/* Next Question Button */}
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
      </div>
    </div>
  )
}
