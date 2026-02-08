"use client"

import { useState, useEffect } from "react"
import { createRoom, generateId, type Question } from "@/lib/quiz-service"
import { saveRecentQuiz } from "@/lib/recent-quizzes"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { X, Plus } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { QuestionEditor } from "@/components/quiz-creator/question-editor"


interface QuestionForm extends Omit<Question, 'id'> {
  tempId: string
}

export default function HostPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [adminId, setAdminId] = useState<string | null>(null)
  const [questions, setQuestions] = useState<QuestionForm[]>([])
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [password, setPassword] = useState("")
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false)
  const [isPasswordVerified, setIsPasswordVerified] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem("adminId")
    if (stored) {
      setAdminId(stored)
    } else {
      const newAdminId = generateId()
      localStorage.setItem("adminId", newAdminId)
      setAdminId(newAdminId)
    }

    // Load saved questions from localStorage
    const savedQuestions = localStorage.getItem("savedQuestions")
    if (savedQuestions) {
      try {
        const parsedQuestions = JSON.parse(savedQuestions)
        if (Array.isArray(parsedQuestions) && parsedQuestions.length > 0) {
          setQuestions(parsedQuestions.map(q => ({
            ...q,
            tempId: generateId() // Generate new tempId for loaded questions
          })))
          toast.success("Previous questions loaded successfully")
        }
      } catch (error) {
        console.error("Failed to load saved questions:", error)
        toast.error("Failed to load previous questions")
      }
    }

    // Load draft quiz if available
    const draft = localStorage.getItem('draft_quiz')
    if (draft) {
      try {
        const quiz = JSON.parse(draft)
        setQuestions(quiz.questions.map((q: any, idx: number) => ({
          tempId: generateId(),
          text: q.question,
          options: q.answers,
          correctOptionIndex: q.correctAnswer,
          basePoints: q.points,
        })))
        toast.success("Draft quiz loaded successfully")
        localStorage.removeItem('draft_quiz') // Clear after loading
      } catch (error) {
        console.error("Failed to load draft quiz:", error)
        toast.error("Failed to load draft quiz")
      }
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

  // Helper functions to convert between formats for QuestionEditor
  const convertToEditorQuestion = (q: QuestionForm) => ({
    id: q.tempId,
    question: q.text,
    answers: q.options.map((opt, idx) => ({
      id: `a${idx}`,
      text: opt,
      isCorrect: idx === q.correctOptionIndex
    })),
    timeLimit: 20,
    basePoints: q.basePoints,
    type: "quiz",
    correctOptionIndex: q.correctOptionIndex
  })

  const updateFromEditorQuestion = (index: number, editorQuestion: ReturnType<typeof convertToEditorQuestion>) => {
    const updated = [...questions]
    updated[index] = {
      ...updated[index],
      text: editorQuestion.question,
      options: editorQuestion.answers.map(a => a.text),
      correctOptionIndex: editorQuestion.correctOptionIndex,
      basePoints: editorQuestion.basePoints
    }
    setQuestions(updated)
  }


  const handleHostQuiz = () => {
    setIsPasswordDialogOpen(true)
  }

  const handlePasswordSubmit = () => {
    // Use environment variable for password, fallback to a default if not set
    const correctPassword = process.env.NEXT_PUBLIC_HOST_PASSWORD || "Ayush@789"
    if (password === correctPassword) {
      setIsPasswordVerified(true)
      setIsPasswordDialogOpen(false)
      toast.success("Password verified")
    } else {
      toast.error("Incorrect password")
    }
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
      saveRecentQuiz({
        id: room.id,
        title: `Quiz - ${new Date().toLocaleDateString()}`,
        questions: formattedQuestions.map(q => ({
          question: q.text,
          answers: q.options,
          correctAnswer: q.correctOptionIndex,
          timeLimit: 20, // Default time limit
          points: q.basePoints,
        })),
        createdAt: Date.now(),
        gamePin: room.code,
      })

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
                  <div className="space-y-4">
                    <QuestionEditor
                      question={convertToEditorQuestion(q)}
                      questionNumber={idx + 1}
                      onQuestionChange={(text) => updateQuestion(idx, "text", text)}
                      onAnswerChange={(answerId, updates) => {
                        const answerIndex = parseInt(answerId.replace('a', ''))
                        if (updates.text !== undefined) {
                          const newOptions = [...q.options]
                          newOptions[answerIndex] = updates.text
                          updateQuestion(idx, "options", newOptions)
                        }
                      }}
                      onToggleCorrect={(answerId) => {
                        const answerIndex = parseInt(answerId.replace('a', ''))
                        updateQuestion(idx, "correctOptionIndex", answerIndex)
                      }}
                      onSetCorrectByIndex={(index) => {
                        updateQuestion(idx, "correctOptionIndex", index)
                      }}
                      onBasePointsChange={(points) => updateQuestion(idx, "basePoints", points)}
                    />
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
            {!isPasswordVerified ? (
              <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    onClick={handleHostQuiz}
                    className="h-16 text-2xl font-black bg-lime-400 hover:bg-lime-500 text-purple-900 rounded-2xl px-16 shadow-xl"
                  >
                    HOST QUIZ
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle className="text-center text-2xl font-black text-purple-600">
                      Host Password Required
                    </DialogTitle>
                    <DialogDescription className="text-center text-gray-600">
                      Please enter the host password to create a quiz room.
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={(e) => { e.preventDefault(); handlePasswordSubmit(); }} className="space-y-4">
                    <Input
                      type="password"
                      placeholder="Enter host password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="text-lg p-4 rounded-xl border-2 border-purple-200"
                    />
                    <Button
                      type="submit"
                      className="w-full bg-purple-600 hover:bg-purple-700 text-white font-black text-lg py-4 rounded-xl"
                    >
                      Verify Password
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            ) : (
              <Button
                onClick={handleCreateRoom}
                disabled={loading}
                className="h-16 text-2xl font-black bg-lime-400 hover:bg-lime-500 text-purple-900 rounded-2xl px-16 shadow-xl"
              >
                {loading ? "Creating..." : `CREATE ROOM (${questions.length} Questions)`}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
