"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import Link from "next/link"
import { Trash2 } from "lucide-react"
import { getRecentQuizzes, deleteRecentQuiz, type RecentQuiz } from "@/lib/recent-quizzes"



export default function Home() {
  const [recentQuizzes, setRecentQuizzes] = useState<RecentQuiz[]>([])

  useEffect(() => {
    setRecentQuizzes(getRecentQuizzes())
  }, [])

  const handleDelete = (id: string) => {
    deleteRecentQuiz(id)
    setRecentQuizzes(getRecentQuizzes())
  }

  const handleReuse = (quiz: RecentQuiz) => {
    // Load quiz into creator
    localStorage.setItem('draft_quiz', JSON.stringify(quiz))
    window.location.href = '/host'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 to-purple-800 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <Link href="/recent-quizzes" className="text-white hover:text-lime-300 transition-colors">
              📚 Recent Quizzes
            </Link>
          </div>
          <h1 className="text-6xl md:text-7xl font-black text-white mb-4">LiveQuiz Hub</h1>
          <p className="text-2xl text-lime-400 font-bold">Play live quizzes with friends</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Host Card */}
          <Card className="p-10 shadow-2xl bg-gradient-to-br from-lime-400 to-lime-500 rounded-3xl">
            <div className="text-center">
              <div className="text-6xl mb-4">🎯</div>
              <h2 className="text-3xl font-black text-purple-900 mb-4">HOST</h2>
              <p className="text-purple-800 font-bold mb-6">Create a room and start playing</p>
              <Link href="/host">
                <Button className="w-full bg-purple-900 hover:bg-purple-950 text-white py-6 text-lg rounded-2xl font-black transition-all hover:shadow-lg">
                  CREATE ROOM
                </Button>
              </Link>
            </div>
          </Card>

          {/* Join Card */}
          <Card className="p-10 shadow-2xl bg-gradient-to-br from-blue-500 to-blue-600 rounded-3xl">
            <div className="text-center">
              <div className="text-6xl mb-4">📱</div>
              <h2 className="text-3xl font-black text-white mb-4">JOIN</h2>
              <p className="text-white font-bold mb-6">Enter room code to join</p>
              <Link href="/play">
                <Button className="w-full bg-lime-400 hover:bg-lime-500 text-purple-900 py-6 text-lg rounded-2xl font-black transition-all hover:shadow-lg">
                  JOIN ROOM
                </Button>
              </Link>
            </div>
          </Card>
        </div>

        {/* Features */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-6 bg-white/10 backdrop-blur rounded-2xl border border-white/20">
            <div className="text-4xl mb-3">⚡</div>
            <h3 className="font-black text-white mb-2">REAL-TIME</h3>
            <p className="text-sm text-white/80 font-bold">Instant synchronization across all devices</p>
          </Card>
          <Card className="p-6">
            <div className="text-3xl mb-3">🏆</div>
            <h3 className="font-bold text-gray-900 mb-2">Leaderboard</h3>
            <p className="text-sm text-gray-600">Speed-based scoring rewards fast answers</p>
          </Card>
        </div>

        {/* Recent Quizzes */}
        {recentQuizzes.length > 0 && (
          <div className="mt-12">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-3xl font-black text-white">RECENT QUIZZES</h2>
              <Link href="/recent-quizzes">
                <Button className="bg-lime-400 hover:bg-lime-500 text-purple-900 font-black">
                  View All →
                </Button>
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recentQuizzes.map((quiz) => (
                <Card key={quiz.id} className="p-6 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <p className="text-purple-600 font-black text-sm">Code: {quiz.gamePin}</p>
                      <h3 className="text-lg font-black text-gray-900 mt-1">{quiz.title}</h3>
                    </div>
                    <button
                      onClick={() => handleDelete(quiz.id)}
                      className="text-red-500 hover:text-red-700 transition-colors ml-2"
                      title="Delete quiz"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">{quiz.questions.length} questions</p>
                  <p className="text-xs text-gray-500 mb-4">{new Date(quiz.createdAt).toLocaleDateString()}</p>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleReuse(quiz)}
                      className="flex-1 bg-lime-500 hover:bg-lime-600 text-purple-900 font-bold text-sm"
                    >
                      REUSE
                    </Button>
                    {quiz.gamePin && (
                      <Link href={`/host/${quiz.gamePin}`}>
                        <Button className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm">
                          RESUME
                        </Button>
                      </Link>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
