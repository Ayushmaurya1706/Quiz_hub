"use client"

import { useEffect, useState, use } from "react"
import { useParams } from "next/navigation"
import { onRoomChange, onParticipantChange, submitAnswer, endQuiz, leaveRoom, kickParticipant, type Room, type Participant } from "@/lib/quiz-service"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { Check, LogOut, ArrowLeft, Triangle, Diamond, Circle, Square } from "lucide-react"

// Kahoot answer colors
const answerColors = ["bg-red-500", "bg-blue-500", "bg-yellow-400", "bg-green-500"]

const answerIcons = [Triangle, Diamond, Circle, Square]
const iconColors = ["text-red-500", "text-blue-500", "text-yellow-500", "text-green-500"]

interface ShuffledOption {
  id: string
  text: string
  originalIndex: number
}

interface ShuffledQuestion {
  id: string
  text: string
  options: ShuffledOption[]
  correctOptionId: string
  basePoints: number
  originalIndex: number
  correctAnswerIndex: number
}

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

export default function QuizPlayPage({ params }: { params: Promise<{ gamePin: string }> }) {
  const { gamePin } = use(params)

  const [room, setRoom] = useState<Room | null>(null)
  const [participant, setParticipant] = useState<Participant | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedOption, setSelectedOption] = useState<number | null>(null)
  const [globalTimeLeft, setGlobalTimeLeft] = useState<number | null>(null)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [shuffledQuestions, setShuffledQuestions] = useState<ShuffledQuestion[] | null>(null)
  const [tabSwitchCount, setTabSwitchCount] = useState(0)
  const [showWarningModal, setShowWarningModal] = useState(false)

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

  // Shuffle questions and options when room is loaded
  useEffect(() => {
    if (!room || !participantId) return

    const shuffleKey = `shuffled_${roomId}_${participantId}`
    const storedShuffled = sessionStorage.getItem(shuffleKey)

    if (storedShuffled) {
      setShuffledQuestions(JSON.parse(storedShuffled))
      return
    }

    // Shuffle questions
    const shuffledQuestions: ShuffledQuestion[] = shuffleArray(room.quiz.questions.map((q, qIndex) => {
      const shuffledOptions = shuffleArray(q.options.map((opt, optIndex) => ({
        id: opt.id,
        text: opt.text,
        originalIndex: optIndex
      })))
      const correctOptionIndex = q.options.findIndex(opt => opt.id === q.correctOptionId)
      return {
        id: q.id,
        text: q.text,
        options: shuffledOptions,
        correctOptionId: q.correctOptionId,
        basePoints: q.basePoints,
        originalIndex: qIndex,
        correctAnswerIndex: correctOptionIndex
      }
    }))

    setShuffledQuestions(shuffledQuestions)
    sessionStorage.setItem(shuffleKey, JSON.stringify(shuffledQuestions))
  }, [room, participantId, roomId])

  // Check if participant is kicked and redirect if removed
  useEffect(() => {
    if (participant && participant.status === "removed") {
      toast.error("You have been removed from the quiz")
      window.location.href = "/"
    }
  }, [participant])

  // Reset answer state when question changes
  useEffect(() => {
    if (participant && room && shuffledQuestions) {
      const shuffledQ = shuffledQuestions[currentQuestionIndex]
      const answer = participant.answers[shuffledQ.id]
      if (answer) {
        const selectedIndex = shuffledQ.options.findIndex(opt => opt.id === answer.optionId)
        setSelectedOption(selectedIndex)
      } else {
        setSelectedOption(null)
      }
    }
  }, [currentQuestionIndex, participant, shuffledQuestions])

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
        // Auto-submit when timer expires - set finish time before redirecting
        if (roomId && participantId) {
          leaveRoom(roomId, participantId).catch(console.error)
        }
        // Redirect to home (same as Submit Quiz button)
        window.location.href = "/"
        // End the quiz globally for the host
        endQuiz(room.id).catch(console.error)
      }
    }

    updateTimer()
    const timer = setInterval(updateTimer, 1000)

    return () => clearInterval(timer)
  }, [room?.quiz.status, room?.quiz.quizStartTime, room?.quiz.quizDuration, room?.id, roomId, participantId])

  // Tab switch monitoring during active quiz
  useEffect(() => {
    if (!room || (room.quiz.status !== "quiz_started" && room.quiz.status !== "question_active")) return

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setTabSwitchCount(prev => {
          const newCount = prev + 1
          if (newCount === 1) {
            setShowWarningModal(true)
          } else if (newCount === 2) {
            // Remove participant
            if (roomId && participantId) {
              kickParticipant(roomId, participantId).catch(console.error)
            }
            // Redirect to removed screen
            window.location.href = `/play/${gamePin}/leave?removed=true`
          }
          return newCount
        })
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [room?.quiz.status, roomId, participantId, gamePin])

  const handleSubmitAnswer = async (optionIndex: number) => {
    if (!room || !participant || !shuffledQuestions) return

    if (!roomId) return

    try {
      setSelectedOption(optionIndex)

      // Get question and option IDs
      const shuffledQ = shuffledQuestions[currentQuestionIndex]
      const optionId = shuffledQ.options[optionIndex].id

      await submitAnswer(
        roomId,
        participant.id,
        shuffledQ.id,
        optionId
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

  const handleLeaveRoom = async () => {
    // Set finish time before leaving
    if (roomId && participantId) {
      try {
        await leaveRoom(roomId, participantId)
      } catch (error) {
        console.error("Failed to record finish time:", error)
      }
    }
    // Redirect to home - keep session storage intact so user can return if needed
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

  const currentQuestion = room.quiz.questions[currentQuestionIndex]
  console.log("Current question index:", currentQuestionIndex, "Questions length:", room.quiz.questions.length, "Current question:", currentQuestion)

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
  if ((room.quiz.status === "quiz_started" || room.quiz.status === "question_active") && currentQuestion && shuffledQuestions) {
    const formatTime = (seconds: number | null) => {
      if (seconds === null) return "--:--"
      const mins = Math.floor(seconds / 60)
      const secs = seconds % 60
      return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }

    const hasCompletedAllQuestions = participant && Object.keys(participant.answers).length === room.quiz.questions.length

    const shuffledQ = shuffledQuestions[currentQuestionIndex]

    return (
      <div className="flex flex-col min-h-screen bg-gradient-to-br from-purple-600 to-purple-800 p-6">
        {/* Submit Quiz Button - Fixed top-right, always visible */}
        <Button
          onClick={handleLeaveRoom}
          className="fixed top-4 right-4 z-50 bg-red-500 hover:bg-red-600 text-white font-black px-4 py-2 rounded-lg shadow-lg"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Submit Quiz
        </Button>
        {/* Header */}
        <div className="flex justify-between items-center mb-8 max-w-5xl mx-auto w-full">
          <div className="text-white font-black text-xl">Q{currentQuestionIndex + 1}/{room.quiz.questions.length} ({shuffledQ.basePoints} pts)</div>
          <div className={`text-4xl font-black px-6 py-3 rounded-full transition-all ${
            globalTimeLeft && globalTimeLeft <= 300 ? "bg-red-500 text-white animate-pulse" :
            globalTimeLeft && globalTimeLeft <= 600 ? "bg-yellow-400 text-purple-900" :
            "bg-lime-400 text-purple-900"
          }`}>
            {formatTime(globalTimeLeft)}
          </div>
          <div className="text-white font-black text-xl"></div>
        </div>

        {/* Question */}
        <Card className="mb-12 p-8 bg-white rounded-2xl shadow-2xl max-w-5xl mx-auto w-full">
          <h2 className="text-4xl font-black text-center text-purple-800 whitespace-pre-wrap">
            {shuffledQ.text}
          </h2>
        </Card>

        {/* Answers - Kahoot Style 2x2 Grid */}
        <div className="w-full px-8 py-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 auto-rows-auto items-start max-w-5xl mx-auto">
            {shuffledQ.options.map((option, index) => {
              const isSelected = selectedOption === index

              const iconConfigs = [
                { icon: Triangle, color: "text-red-500", bgColor: "bg-red-500" },
                { icon: Diamond, color: "text-blue-500", bgColor: "bg-blue-500" },
                { icon: Circle, color: "text-yellow-500", bgColor: "bg-yellow-500" },
                { icon: Square, color: "text-green-600", bgColor: "bg-green-600" },
              ]

              const config = iconConfigs[index]
              const Icon = config.icon

              return (
                <div
                  key={option.id}
                  onClick={() => handleSubmitAnswer(index)}
                  className={cn(
                    // Base styles - CRITICAL for preventing overlap
                    "relative flex flex-col items-start gap-4 rounded-xl p-6 cursor-pointer transition-all duration-300",
                    "min-h-[120px] h-auto w-full", // Auto height, full width
                    "overflow-hidden", // Prevent content spillover

                    // NOT SELECTED: White background
                    !isSelected && "bg-white text-gray-800 hover:shadow-lg hover:-translate-y-1 border-2 border-gray-200",

                    // SELECTED: Green background
                    isSelected && "bg-green-500 text-white border-4 border-white shadow-2xl scale-[1.02]"
                  )}
                >
                  {/* Top row: Icon + Answer Text */}
                  <div className="flex items-start gap-4 w-full">
                    {/* Icon */}
                    <div className="flex-shrink-0 mt-1">
                      <Icon
                        className={cn(
                          "w-8 h-8",
                          isSelected ? "text-white fill-white/20" : `${config.color} fill-current/20`
                        )}
                      />
                    </div>

                    {/* Answer Text - PRESERVES LINE BREAKS */}
                    <div className={cn(
                      "flex-1 font-mono text-sm font-semibold leading-relaxed",
                      "whitespace-pre-wrap break-words overflow-wrap-anywhere",
                      "max-w-full" // Prevent text from exceeding box width
                    )}>
                      {option.text}
                    </div>

                    {/* Checkmark (only when selected) */}
                    {isSelected && (
                      <div className="flex-shrink-0 w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-xl">
                        <Check className="w-7 h-7 text-green-500 stroke-[3]" />
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-center gap-4 mb-8 max-w-5xl mx-auto w-full">
          <Button
            onClick={() => {
              setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))
            }}
            disabled={currentQuestionIndex === 0}
            className="bg-white/20 hover:bg-white/30 text-white font-black px-6 py-2"
          >
            ← Previous
          </Button>
          <Button
            onClick={() => {
              setCurrentQuestionIndex(Math.min(room.quiz.questions.length - 1, currentQuestionIndex + 1))
            }}
            disabled={currentQuestionIndex === room.quiz.questions.length - 1}
            className="bg-white/20 hover:bg-white/30 text-white font-black px-6 py-2"
          >
            Next →
          </Button>
        </div>

        {/* Warning Modal for Tab Switch */}
        <Dialog open={showWarningModal} onOpenChange={setShowWarningModal}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-center text-red-600 font-black text-2xl">⚠️ WARNING</DialogTitle>
            </DialogHeader>
            <DialogDescription className="text-center text-lg font-bold text-gray-800">
              Switching tabs is not allowed. Next time you will be removed from the quiz.
            </DialogDescription>
            <DialogFooter className="flex justify-center">
              <Button
                onClick={() => setShowWarningModal(false)}
                className="bg-red-500 hover:bg-red-600 text-white font-black px-8 py-2"
              >
                OK
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-600 to-purple-800">
      <p className="text-white font-black text-2xl">Loading...</p>
    </div>
  )
}
