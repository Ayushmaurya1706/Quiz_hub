"use client"

import { useEffect, useState, use } from "react"
import { useParams, useRouter } from "next/navigation"
import { onRoomChange, onParticipantsChange, startQuiz, nextQuestion, type Room, type Participant } from "@/lib/quiz-service"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Copy, Check } from "lucide-react"
import { toast } from "sonner"

export default function AdminRoomPage({ params }: { params: Promise<{ gamePin: string }> }) {
  const { gamePin } = use(params)
  const router = useRouter()

  const [room, setRoom] = useState<Room | null>(null)
  const [participants, setParticipants] = useState<Participant[]>([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [quizDuration, setQuizDuration] = useState("10")

  const roomId = typeof window !== "undefined" ? sessionStorage.getItem("roomId") : null

  // Redirect to quiz display if quiz is in progress
  useEffect(() => {
    if (room && (room.quiz.status === "quiz_started" || room.quiz.status === "question_active" || room.quiz.status === "question_ended")) {
      router.push(`/host/${gamePin}/play`)
    }
  }, [room?.quiz.status, gamePin, router])

  useEffect(() => {
    console.log("AdminRoomPage useEffect running, roomId:", roomId)
    if (!roomId) {
      console.log("No roomId, setting loading to false")
      setLoading(false)
      return
    }

    console.log("Setting up listeners for roomId:", roomId)
    const unsubRoom = onRoomChange(roomId, (room) => {
      console.log("Room callback fired, room:", room)
      setRoom(room)
    })
    const unsubParticipants = onParticipantsChange(roomId, (participants) => {
      console.log("Participants callback fired, participants:", participants)
      setParticipants(participants)
    })

    setLoading(false)

    return () => {
      unsubRoom()
      unsubParticipants()
    }
  }, [roomId])

  const handleCopyCode = async () => {
    if (!room) return
    await navigator.clipboard.writeText(room.code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast.success("Room code copied!")
  }

  const handleStartQuiz = async () => {
    if (!room) return
    try {
      await startQuiz(room.id, parseInt(quizDuration))
      toast.success("Quiz started!")
      router.push(`/host/${gamePin}/play`)
    } catch (error) {
      console.error("Failed to start quiz:", error)
      toast.error("Failed to start quiz")
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
            Back to Host
          </Button>
        </Card>
      </div>
    )
  }

  // Show results page when quiz ends
  if (room.quiz.status === "quiz_ended") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 to-purple-800 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-5xl font-black text-white mb-4">🏆 FINAL RESULTS 🏆</h1>
          </div>

          {/* Final Leaderboard */}
          <Card className="p-8 bg-white rounded-2xl shadow-2xl mb-8">
            <h2 className="text-2xl font-black text-purple-600 mb-6">FINAL LEADERBOARD</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-purple-200">
                    <th className="text-left py-3 px-4 font-black text-purple-600">RANK</th>
                    <th className="text-left py-3 px-4 font-black text-purple-600">PLAYER</th>
                    <th className="text-left py-3 px-4 font-black text-purple-600">SCORE</th>
                    <th className="text-left py-3 px-4 font-black text-purple-600">CORRECT</th>
                    <th className="text-left py-3 px-4 font-black text-purple-600">TIME</th>
                  </tr>
                </thead>
                <tbody>
                  {participants
                    .sort((a, b) => b.totalScore - a.totalScore)
                    .map((p, idx) => {
                      const totalQuestions = room.quiz.questions.length
                      const correct = Object.values(p.answers).filter(a => a.isCorrect).length
                      const totalTime = p.totalQuizTime || 0
                      const timeFormatted = `${Math.floor(totalTime / 60)}:${(totalTime % 60).toString().padStart(2, '0')}`
                      return (
                        <tr key={p.id} className="border-b border-purple-100 hover:bg-purple-50">
                          <td className="py-3 px-4 font-bold text-2xl">
                            {idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : idx + 1}
                          </td>
                          <td className="py-3 px-4 font-bold text-lg">{p.name}</td>
                          <td className="py-3 px-4 font-bold text-lime-600 text-lg">{p.totalScore.toLocaleString()}</td>
                          <td className="py-3 px-4 font-bold text-lg">{correct}/{totalQuestions}</td>
                          <td className="py-3 px-4 font-bold text-lg">{timeFormatted}</td>
                        </tr>
                      )
                    })}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Back Buttons */}
          <div className="flex gap-4 justify-center">
            <Button
              onClick={() => router.push("/")}
              className="bg-purple-600 hover:bg-purple-700 text-white font-black text-xl px-12 py-6 rounded-2xl"
            >
              GO BACK HOME
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 to-purple-800 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
                    <h1 className="text-5xl font-black text-white mb-4">KAHOOT! HOST</h1>
          <p className="text-xl text-lime-400 font-bold">Room: {room.code}</p>
        </div>

        {/* Room Code Card */}
        <Card className="p-8 bg-white rounded-3xl shadow-2xl mb-8 max-w-md mx-auto">
          <h2 className="text-2xl font-black text-purple-600 mb-6 text-center">GAME PIN</h2>
          <div className="flex items-center justify-between bg-purple-100 p-6 rounded-2xl">
            <span className="text-4xl font-black text-purple-600">{room.code}</span>
            <button
              onClick={handleCopyCode}
              className="ml-4 p-2 hover:bg-purple-200 rounded-lg transition-colors"
            >
              {copied ? (
                <Check className="w-6 h-6 text-green-600" />
              ) : (
                <Copy className="w-6 h-6 text-purple-600" />
              )}
            </button>
          </div>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="p-6 bg-white rounded-2xl shadow-lg">
            <p className="text-purple-600 font-black mb-2">PARTICIPANTS</p>
            <p className="text-5xl font-black text-purple-600">{participants.length}</p>
          </Card>
          <Card className="p-6 bg-white rounded-2xl shadow-lg">
            <p className="text-purple-600 font-black mb-2">STATUS</p>
            <Badge className="text-lg font-black bg-lime-400 text-purple-900">
              {room.quiz.status === "waiting" ? "WAITING" : "ACTIVE"}
            </Badge>
          </Card>
          <Card className="p-6 bg-white rounded-2xl shadow-lg">
            <p className="text-purple-600 font-black mb-2">QUESTIONS</p>
            <p className="text-5xl font-black text-purple-600">{room.quiz.questions.length}</p>
          </Card>
        </div>

        {/* Participants Table */}
        <Card className="p-8 bg-white rounded-2xl shadow-2xl mb-8">
          <h2 className="text-2xl font-black text-purple-600 mb-6">PARTICIPANTS</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-purple-200">
                  <th className="text-left py-3 px-4 font-black text-purple-600">#</th>
                  <th className="text-left py-3 px-4 font-black text-purple-600">NAME</th>
                  <th className="text-left py-3 px-4 font-black text-purple-600">SCORE</th>
                </tr>
              </thead>
              <tbody>
                {participants
                  .sort((a, b) => b.totalScore - a.totalScore)
                  .map((p, idx) => (
                    <tr key={p.id} className="border-b border-purple-100 hover:bg-purple-50">
                      <td className="py-3 px-4 font-bold">
                        {idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : idx + 1}
                      </td>
                      <td className="py-3 px-4 font-bold">{p.name}</td>
                      <td className="py-3 px-4 font-bold text-lime-600">{p.totalScore}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </Card>

      </div>
        {room.quiz.status === "waiting" && (
          <div className="flex flex-col items-center gap-6">
            {/* Duration Selector */}
            <Card className="p-6 bg-white rounded-2xl shadow-lg">
              <h3 className="text-xl font-black text-purple-600 mb-4 text-center">QUIZ DURATION</h3>
              <Select value={quizDuration} onValueChange={setQuizDuration}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Select duration" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10 minutes</SelectItem>
                  <SelectItem value="15">15 minutes</SelectItem>
                  <SelectItem value="20">20 minutes</SelectItem>
                </SelectContent>
              </Select>
            </Card>

            <Button
              onClick={handleStartQuiz}
              className="h-16 text-2xl font-black bg-lime-400 hover:bg-lime-500 text-purple-900 rounded-2xl px-12 shadow-xl"
            >
              START QUIZ
            </Button>
          </div>
        )}
    </div>
  )
}
