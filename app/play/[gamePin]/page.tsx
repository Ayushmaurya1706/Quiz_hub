"use client"

import { useEffect, useState, use } from "react"
import { useParams } from "next/navigation"
import { onRoomChange, onParticipantChange, submitAnswer, endQuiz, leaveRoom, type Room, type Participant } from "@/lib/quiz-service"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { toast } from "sonner"
import { doc, updateDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Check, LogOut, ArrowLeft } from "lucide-react"

// Kahoot answer colors
const answerColors = ["bg-red-500", "bg-blue-500", "bg-yellow-400", "bg-green-500"]

export default function QuizPlayPage({ params }: { params: Promise<{ gamePin: string }> }) {
  const { gamePin } = use(params)

  const [room, setRoom] = useState<Room | null>(null)
  const [participant, setParticipant] = useState<Participant | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedOption, setSelectedOption] = useState<number | null>(null)
  const [globalTimeLeft, setGlobalTimeLeft] = useState<number | null>(null)
 
  const participantId = typeof window !== "undefined" ? sessionStorage.getItem("participantId") : null
  const roomId = typeof window !== "undefined" ? sessionStorage.getItem("roomId") : null

  // Real-time listeners
  useEffect(() => {
    console.log("QuizPlayPage useEffect running, roomId:", roomId, "participantId:", participantId)
    if (!roomId || !participantId) {
      console.log("Missing roomId or participantId, setting loading to false")
      setLoading(false)
      return
    }

    console.log("Setting up listeners for roomId:", roomId, "participantId:", participantId)
    const unsubscribeRoom = onRoomChange(roomId, (room) => {
      console.log("Room callback fired, room:", room)
      console.log("Room quiz status:", room?.quiz?.status)
      setRoom(room)
    })
    const unsubscribeParticipant = onParticipantChange(roomId, participantId, (participant) => {
      console.log("Participant callback fired, participant:", participant)
      setParticipant(participant)
    })

    setLoading(false)

    return () => {
      unsubscribeRoom()
      unsubscribeParticipant()
    }
  }, [roomId, participantId])

  // Check if participant is kicked and redirect if removed
  useEffect(() => {
    if (participant && participant.status === "removed") {
      toast.error("You have been removed from the quiz")
      window.location.href = "/"
    }
  }, [participant])

  // Reset answer state when question changes
  useEffect(() => {
    if (participant && room) {
      const answer = participant.answers[room.quiz.currentQuestionIndex.toString()]
      setSelectedOption(answer ? answer.optionIndex : null)
    }
  }, [room?.quiz.currentQuestionIndex, participant])

  // Global timer countdown
  useEffect(() => {
    if (!room || room.quiz.status !== "quiz_started" || !room.quiz.quizStartTime || !room.quiz.quizDuration) return

    const startTime = room.quiz.quizStartTime.seconds * 1000
    const durationMs = room.quiz.quizDuration * 60 * 1000
    const endTime = startTime + durationMs

    const updateTimer = () => {
      const now = Date.now()
      const timeLeft = Math.max(0, Math.ceil((endTime - now) / 1000))
      setGlobalTimeLeft(timeLeft)

      if (timeLeft <= 0 && room.quiz.status !== "quiz_ended") {
        // End the quiz when timer expires
        endQuiz(room.id).catch(console.error)
      }
    }

    updateTimer()
    const timer = setInterval(updateTimer, 1000)

    return () => clearInterval(timer)
  }, [room?.quiz.status, room?.quiz.quizStartTime, room?.quiz.quizDuration, room?.id])

  const handleSubmitAnswer = async (optionIndex: number) => {
    if (!room || !participant) return

    if (!roomId) return

    try {
      setSelectedOption(optionIndex)

      await submitAnswer(
        roomId,
        participant.id,
        room.quiz.currentQuestionIndex,
        optionIndex
      )

      // Show answer selection feedback
      toast.success("Answer marked as completed", {
        duration: 1500,
        description: "Your answer has been recorded"
      })
    } catch (error) {
      console.error("Failed to submit answer:", error)
      toast.error("Failed to submit answer")
    }
  }

  const handleLeaveRoom = () => {
    // Just redirect to home - keep session storage intact so user can return if needed
    // Data remains in Firestore for host to see final scores
    window.location.href = "/"
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
  console.log("Current question index:", room.quiz.currentQuestionIndex, "Questions length:", room.quiz.questions.length, "Current question:", currentQuestion)

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
          <p className="text-gray-700 mb-8 text-lg font-bold">Thanks for participating!</p>
          <Button onClick={() => window.location.href = "/"} className="w-full bg-purple-600 hover:bg-purple-700 text-white font-black">
            GO BACK HOME
          </Button>
        </Card>
      </div>
    )
  }

  // Question ended (Waiting for next question)
  if (room.quiz.status === "question_ended") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-600 to-purple-800">
        <Card className="p-12 text-center bg-white max-w-md shadow-2xl rounded-3xl">
          <h2 className="text-4xl font-black mb-4 text-purple-600">TIME'S UP!</h2>
          <p className="text-gray-700 mb-8 text-lg font-bold">Waiting for next question...</p>
          <div className="flex gap-3 justify-center">
            <div className="w-4 h-4 bg-lime-400 rounded-full animate-bounce" />
            <div className="w-4 h-4 bg-lime-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
            <div className="w-4 h-4 bg-lime-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
          </div>
        </Card>
      </div>
    )
  }

  // Quiz started - participants can navigate questions freely
  console.log("Checking quiz status for question display:", room.quiz.status, "currentQuestion exists:", !!currentQuestion)
  if ((room.quiz.status === "quiz_started" || room.quiz.status === "question_active") && currentQuestion) {
    const formatTime = (seconds: number | null) => {
      if (seconds === null) return "--:--"
      const mins = Math.floor(seconds / 60)
      const secs = seconds % 60
      return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }

    const hasCompletedAllQuestions = participant && Object.keys(participant.answers).length === room.quiz.questions.length

    return (
      <div className="flex flex-col min-h-screen bg-gradient-to-br from-purple-600 to-purple-800 p-6">
        {/* Leave Room Button - Fixed top-right, visible after completing all questions */}
        {hasCompletedAllQuestions && (
          <Button
            onClick={handleLeaveRoom}
            className="fixed top-4 right-4 z-50 bg-red-500 hover:bg-red-600 text-white font-black px-4 py-2 rounded-lg shadow-lg"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Leave Room
          </Button>
        )}
        {/* Header */}
        <div className="flex justify-between items-center mb-8 max-w-5xl mx-auto w-full">
          <div className="text-white font-black text-xl">Q{room.quiz.currentQuestionIndex + 1}/{room.quiz.questions.length}</div>
          <div className={`text-4xl font-black px-6 py-3 rounded-full transition-all ${
            globalTimeLeft && globalTimeLeft <= 300 ? "bg-red-500 text-white animate-pulse" :
            globalTimeLeft && globalTimeLeft <= 600 ? "bg-yellow-400 text-purple-900" :
            "bg-lime-400 text-purple-900"
          }`}>
            {formatTime(globalTimeLeft)}
          </div>
          <div className="text-white font-black text-xl"></div>
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-center gap-4 mb-8 max-w-5xl mx-auto w-full">
          <Button
            onClick={async () => {
              const newIndex = Math.max(0, room.quiz.currentQuestionIndex - 1)
              try {
                // Update question index in database
                await updateDoc(doc(db, "rooms", roomId!), {
                  "quiz.currentQuestionIndex": newIndex
                })
              } catch (error) {
                console.error("Failed to navigate to previous question:", error)
                toast.error("Failed to navigate")
              }
            }}
            disabled={room.quiz.currentQuestionIndex === 0}
            className="bg-white/20 hover:bg-white/30 text-white font-black px-6 py-2"
          >
            ← Previous
          </Button>
          <Button
            onClick={async () => {
              const newIndex = Math.min(room.quiz.questions.length - 1, room.quiz.currentQuestionIndex + 1)
              try {
                // Update question index in database
                await updateDoc(doc(db, "rooms", roomId!), {
                  "quiz.currentQuestionIndex": newIndex
                })
              } catch (error) {
                console.error("Failed to navigate to next question:", error)
                toast.error("Failed to navigate")
              }
            }}
            disabled={room.quiz.currentQuestionIndex === room.quiz.questions.length - 1}
            className="bg-white/20 hover:bg-white/30 text-white font-black px-6 py-2"
          >
            Next →
          </Button>
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
              onClick={() => handleSubmitAnswer(index)}
              className={`h-32 text-2xl font-black rounded-2xl transition-all transform hover:scale-105 text-white relative ${
                selectedOption === index
                  ? `${answerColors[index]} shadow-lg scale-105 ring-4 ring-white/50 animate-pulse`
                  : `${answerColors[index]} shadow-lg hover:brightness-110`
              }`}
            >
              <span className="flex items-center justify-between w-full">
                <span className="flex-1 text-left">{option}</span>
                {selectedOption === index && (
                  <Check className="h-8 w-8 ml-4 animate-in fade-in duration-300" />
                )}
              </span>
            </Button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-600 to-purple-800">
      <p className="text-white font-black text-2xl">Loading...</p>
    </div>
  )
}
