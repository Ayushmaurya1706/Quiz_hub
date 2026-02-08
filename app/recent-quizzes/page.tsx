'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getRecentQuizzes, deleteRecentQuiz, type RecentQuiz } from '@/lib/recent-quizzes'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import Link from 'next/link'

export default function RecentQuizzesPage() {
  const router = useRouter()
  const [quizzes, setQuizzes] = useState<RecentQuiz[]>([])

  useEffect(() => {
    setQuizzes(getRecentQuizzes())
  }, [])

  const handleDelete = (id: string) => {
    deleteRecentQuiz(id)
    setQuizzes(getRecentQuizzes())
  }

  const handleReuse = (quiz: RecentQuiz) => {
    // Load quiz into creator
    localStorage.setItem('draft_quiz', JSON.stringify(quiz))
    router.push('/host')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 to-purple-800 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-black text-white mb-4">Recent Quizzes</h1>
          <p className="text-lg text-lime-300 font-bold">Your quiz history</p>
          <Link href="/">
            <Button className="mt-4 bg-lime-400 hover:bg-lime-500 text-purple-900 font-black">
              Back to Home
            </Button>
          </Link>
        </div>

        {quizzes.length === 0 ? (
          <Card className="p-12 text-center bg-white rounded-2xl">
            <p className="text-gray-600 text-lg font-bold mb-6">No recent quizzes</p>
            <Link href="/host">
              <Button className="bg-lime-400 hover:bg-lime-500 text-purple-900 font-black text-lg px-8 py-4 rounded-xl">
                Create Your First Quiz
              </Button>
            </Link>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {quizzes.map((quiz: RecentQuiz) => (
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
                    🗑️
                  </button>
                </div>
                <p className="text-sm text-gray-600 mb-4">{quiz.questions.length} questions</p>
                <p className="text-xs text-gray-500 mb-4">{new Date(quiz.createdAt).toLocaleDateString()}</p>
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleReuse(quiz)}
                    className="flex-1 bg-lime-500 hover:bg-lime-600 text-purple-900 font-bold text-sm"
                  >
                    Reuse
                  </Button>
                  {quiz.gamePin && (
                    <Link href={`/host/${quiz.gamePin}`}>
                      <Button className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm">
                        Resume
                      </Button>
                    </Link>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
