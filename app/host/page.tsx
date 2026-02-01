"use client"

import { useState, useEffect } from "react"
import { createRoom, generateId, type Question } from "@/lib/quiz-service"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { X, Plus } from "lucide-react"

interface QuestionForm extends Omit<Question, 'id'> {
  tempId: string
}

export default function HostPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [adminId, setAdminId] = useState<string | null>(null)
  const [questions, setQuestions] = useState<QuestionForm[]>([])
  const [editingIndex, setEditingIndex] = useState<number | null>(null)

  useEffect(() => {
    const stored = localStorage.getItem("adminId")
    if (stored) {
      setAdminId(stored)
    } else {
      const newAdminId = generateId()
      localStorage.setItem("adminId", newAdminId)
      setAdminId(newAdminId)
    }
  }, [])

  const addQuestion = () => {
    const newQuestion: QuestionForm = {
      tempId: generateId(),
      text: "",
      options: ["", "", "", ""],
      correctOptionIndex: 0,
      basePoints: 100,
    }
    setQuestions([...questions, newQuestion])
    setEditingIndex(questions.length)
  }

  const updateQuestion = (index: number, field: string, value: any) => {
    const updated = [...questions]
    if (field === "options") {
      updated[index].options = value
    } else if (field === "correctOptionIndex") {
      updated[index].correctOptionIndex = value
    } else {
      updated[index] = { ...updated[index], [field]: value }
    }
    setQuestions(updated)
  }

  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index))
    if (editingIndex === index) setEditingIndex(null)
  }

  const handleCreateRoom = async () => {
    if (!adminId) {
      toast.error("Admin ID not loaded")
      return
    }

    if (questions.length === 0) {
      toast.error("Add at least 1 question")
      return
    }

    for (let i = 0; i < questions.length; i++) {
      if (!questions[i].text.trim()) {
        toast.error(`Question ${i + 1}: Add question text`)
        return
      }
      if (questions[i].options.some(opt => !opt.trim())) {
        toast.error(`Question ${i + 1}: Fill all options`)
        return
      }
    }

    try {
      setLoading(true)
      console.log("Creating room with admin ID:", adminId)

      const formattedQuestions: Question[] = questions.map((q, idx) => ({
        id: `q${idx}`,
        text: q.text,
        options: q.options,
        correctOptionIndex: q.correctOptionIndex,
        basePoints: q.basePoints,
      }))

      const room = await createRoom(adminId, formattedQuestions)
      console.log("Room created successfully:", room)
      
      // Save to recent quizzes
      const recentQuizzes = JSON.parse(localStorage.getItem("recentQuizzes") || "[]")
      const newQuiz = {
        id: room.id,
        code: room.code,
        name: `Quiz - ${new Date().toLocaleDateString()}`,
        questions: formattedQuestions.length,
        createdAt: new Date().toISOString(),
      }
      recentQuizzes.unshift(newQuiz)
      // Keep only last 10 quizzes
      if (recentQuizzes.length > 10) {
        recentQuizzes.pop()
      }
      localStorage.setItem("recentQuizzes", JSON.stringify(recentQuizzes))
      
      toast.success(`Room created! Code: ${room.code}`)
      sessionStorage.setItem("roomId", room.id)
      router.push(`/host/${room.code}`)
    } catch (error) {
      console.error("Failed to create room:", error)
      toast.error(`Failed to create room: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 to-purple-800 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-black text-white mb-4">LiveQuiz Hub QUIZ CREATOR</h1>
          <p className="text-lg text-lime-300 font-bold">Create your custom quiz</p>
        </div>

        <div className="space-y-6 mb-8">
          {questions.length === 0 ? (
            <Card className="p-12 text-center bg-white rounded-2xl">
              <p className="text-gray-600 text-lg font-bold mb-6">No questions yet</p>
              <Button
                onClick={addQuestion}
                className="bg-lime-400 hover:bg-lime-500 text-purple-900 font-black text-lg px-8 py-4 rounded-xl"
              >
                + Add First Question
              </Button>
            </Card>
          ) : (
            questions.map((q, idx) => (
              <Card
                key={q.tempId}
                className={`p-8 rounded-2xl transition-all ${
                  editingIndex === idx
                    ? "bg-white border-4 border-lime-400 shadow-2xl"
                    : "bg-white hover:shadow-lg cursor-pointer"
                }`}
                onClick={() => editingIndex !== idx && setEditingIndex(idx)}
              >
                <div className="flex justify-between items-start mb-6">
                  <h3 className="text-2xl font-black text-purple-600">
                    Question {idx + 1}
                  </h3>
                  <button
                    onClick={() => removeQuestion(idx)}
                    className="text-red-600 hover:text-red-700 p-2"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                {editingIndex === idx ? (
                  <div className="space-y-6">
                    <div>
                      <label className="block text-purple-600 font-black mb-2">Question Text</label>
                      <Input
                        value={q.text}
                        onChange={(e) => updateQuestion(idx, "text", e.target.value)}
                        placeholder="Enter question text"
                        className="text-lg p-4 rounded-xl border-2 border-purple-200"
                        autoFocus
                      />
                    </div>

                    <div>
                      <label className="block text-purple-600 font-black mb-3">
                        Answer Options
                      </label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {q.options.map((option, optIdx) => (
                          <div key={optIdx} className="relative">
                            <Input
                              value={option}
                              onChange={(e) => {
                                const newOptions = [...q.options]
                                newOptions[optIdx] = e.target.value
                                updateQuestion(idx, "options", newOptions)
                              }}
                              placeholder={`Option ${optIdx + 1}`}
                              className={`p-4 rounded-xl border-2 pr-16 text-lg ${
                                q.correctOptionIndex === optIdx
                                  ? "border-green-500 bg-green-50"
                                  : "border-gray-200"
                              }`}
                            />
                            <button
                              onClick={() => updateQuestion(idx, "correctOptionIndex", optIdx)}
                              className={`absolute right-3 top-1/2 -translate-y-1/2 px-3 py-1 rounded-lg text-sm font-black transition-all ${
                                q.correctOptionIndex === optIdx
                                  ? "bg-green-500 text-white"
                                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                              }`}
                            >
                              {q.correctOptionIndex === optIdx ? "✓ Correct" : "Mark"}
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-purple-600 font-black mb-2">Base Points</label>
                      <Input
                        type="number"
                        value={q.basePoints}
                        onChange={(e) => updateQuestion(idx, "basePoints", parseInt(e.target.value))}
                        className="text-lg p-4 rounded-xl border-2 border-purple-200"
                        min="10"
                        max="1000"
                      />
                    </div>

                    <Button
                      onClick={() => setEditingIndex(null)}
                      className="w-full bg-purple-600 hover:bg-purple-700 text-white font-black text-lg py-4 rounded-xl"
                    >
                      Done Editing
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-xl font-bold text-gray-800">{q.text || "Untitled question"}</p>
                    <div className="grid grid-cols-2 gap-2">
                      {q.options.map((opt, optIdx) => (
                        <div
                          key={optIdx}
                          className={`p-3 rounded-lg text-sm font-bold ${
                            q.correctOptionIndex === optIdx
                              ? "bg-green-100 text-green-700 border-2 border-green-500"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {opt || "Empty"}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            ))
          )}
        </div>

        {questions.length > 0 && editingIndex === null && (
          <div className="text-center mb-8">
            <Button
              onClick={addQuestion}
              className="bg-lime-400 hover:bg-lime-500 text-purple-900 font-black text-lg px-12 py-6 rounded-2xl shadow-lg"
            >
              <Plus className="w-6 h-6 mr-2" />
              Add Another Question
            </Button>
          </div>
        )}

        {questions.length > 0 && editingIndex === null && (
          <div className="flex justify-center gap-4">
            <Button
              onClick={handleCreateRoom}
              disabled={loading}
              className="h-16 text-2xl font-black bg-lime-400 hover:bg-lime-500 text-purple-900 rounded-2xl px-16 shadow-xl"
            >
              {loading ? "Creating..." : `CREATE ROOM (${questions.length} Questions)`}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
