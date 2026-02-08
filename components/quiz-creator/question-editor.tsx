"use client"

import { ImagePlus, Check, Triangle, Diamond, Circle, Square } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
interface QuizCreatorQuestion {
  id: string
  question: string
  answers: Array<{
    id: string
    text: string
    isCorrect: boolean
  }>
  timeLimit: number
  basePoints: number
  type: string
  correctOptionIndex: number
}

interface Answer {
  id: string
  text: string
  isCorrect: boolean
}
import { cn } from "@/lib/utils"

interface QuestionEditorProps {
  question: QuizCreatorQuestion
  questionNumber: number
  onQuestionChange: (text: string) => void
  onAnswerChange: (answerId: string, updates: Partial<Answer>) => void
  onToggleCorrect: (answerId: string) => void
  onSetCorrectByIndex: (index: number) => void
  onBasePointsChange: (points: number) => void
}

const answerConfigs = [
  { color: "bg-[var(--kahoot-red)]", hoverColor: "hover:bg-[#c8172f]", icon: Triangle, shape: "triangle" },
  { color: "bg-[var(--kahoot-blue)]", hoverColor: "hover:bg-[#0f5ab8]", icon: Diamond, shape: "diamond" },
  { color: "bg-[var(--kahoot-yellow)]", hoverColor: "hover:bg-[#c28d00]", icon: Circle, shape: "circle" },
  { color: "bg-[var(--kahoot-green)]", hoverColor: "hover:bg-[#1e7009]", icon: Square, shape: "square" },
]

const iconColors = [
  "text-red-500",
  "text-blue-500",
  "text-yellow-500",
  "text-green-500",
]

export function QuestionEditor({
  question,
  questionNumber,
  onQuestionChange,
  onAnswerChange,
  onToggleCorrect,
  onSetCorrectByIndex,
  onBasePointsChange,
}: QuestionEditorProps) {
  const needsCorrectAnswer = question.type === "quiz" || question.type === "truefalse"
  const hasCorrectAnswer = question.correctOptionIndex >= 0

  return (
    <main className="flex flex-1 flex-col overflow-hidden bg-[var(--kahoot-purple)] p-6">
      {/* Question Input Area */}
      <div className="mb-6 flex flex-col items-center">
        <div className="relative w-full max-w-2xl">
          <div className="rounded-lg bg-white p-1 shadow-lg" onClick={(e) => e.stopPropagation()}>
            <textarea
              value={question.question}
              onChange={(e) => onQuestionChange(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  const textarea = e.currentTarget
                  const start = textarea.selectionStart
                  const end = textarea.selectionEnd
                  const newValue = question.question.substring(0, start) + '\n' + question.question.substring(end)
                  onQuestionChange(newValue)

                  // Set cursor position after the newline
                  setTimeout(() => {
                    textarea.selectionStart = textarea.selectionEnd = start + 1
                  }, 0)
                }
              }}
              placeholder="Click to start typing your question"
              rows={4}
              className="w-full resize-vertical border-none bg-transparent text-center text-xl font-bold text-gray-800 placeholder:text-gray-400 focus:outline-none p-4"
            />
          </div>
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[var(--kahoot-purple-dark)] px-3 py-1">
            <span className="text-xs font-semibold text-white">Question {questionNumber}</span>
          </div>
        </div>
        
        {/* Correct Answer Reminder */}
        {needsCorrectAnswer && !hasCorrectAnswer && question.question.trim() !== "" && (
          <div className="mt-3 rounded-lg bg-yellow-500/20 border border-yellow-500/50 px-4 py-2">
            <p className="text-sm text-yellow-200">
              Click on an answer below to mark it as the correct answer
            </p>
          </div>
        )}
      </div>

      {/* Media Upload Area */}
      <div className="mb-6 flex justify-center">
        <Button
          variant="outline"
          className="h-40 w-72 flex-col gap-3 rounded-lg border-2 border-dashed border-white/30 bg-white/5 text-white hover:bg-white/10 hover:text-white"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10">
            <ImagePlus className="h-6 w-6" />
          </div>
          <span className="text-sm font-medium">Find and insert media</span>
        </Button>
      </div>

      {/* Base Points Input */}
      <div className="mb-6 flex justify-center">
        <div className="flex items-center gap-4 rounded-lg bg-white p-4 shadow-lg">
          <label className="text-sm font-semibold text-gray-700">Base Points:</label>
          <input
            type="number"
            value={question.basePoints}
            onChange={(e) => onBasePointsChange(parseInt(e.target.value) || 0)}
            min="0"
            max="1000"
            className="w-20 rounded border border-gray-300 px-2 py-1 text-center font-bold text-purple-600 focus:border-purple-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Answer Options */}
      <div className="flex-1">
        <div className="grid grid-cols-2 gap-4 items-start">
          {question.answers.map((answer, index) => {
            const config = answerConfigs[index] || answerConfigs[0]
            const Icon = config.icon
            const isCorrect = answer.isCorrect
            
            return (
              <div
                key={answer.id}
                onClick={() => {
                  if (needsCorrectAnswer) {
                    onSetCorrectByIndex(index)
                  } else {
                    onToggleCorrect(answer.id)
                  }
                }}
                className={cn(
                  "group relative flex min-h-[80px] h-auto cursor-pointer items-start gap-4 rounded-lg px-4 py-6 transition-all bg-white hover:bg-gray-100",
                  isCorrect && "bg-green-500 scale-105"
                )}
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center">
                  <Icon className={cn("h-8 w-8", iconColors[index] || "text-gray-500")} />
                </div>
                <textarea
                  value={answer.text}
                  onChange={(e) => {
                    e.stopPropagation()
                    onAnswerChange(answer.id, { text: e.target.value })
                  }}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      e.stopPropagation()
                      const textarea = e.currentTarget
                      const start = textarea.selectionStart
                      const end = textarea.selectionEnd
                      const newValue = answer.text.substring(0, start) + '\n' + answer.text.substring(end)
                      onAnswerChange(answer.id, { text: newValue })

                      // Set cursor position after the newline
                      setTimeout(() => {
                        textarea.selectionStart = textarea.selectionEnd = start + 1
                      }, 0)
                    }
                  }}
                  onClick={(e) => e.stopPropagation()}
                  placeholder={`Add answer ${index + 1}`}
                  rows={2}
                  className="flex-1 bg-transparent text-lg font-medium text-gray-800 placeholder:text-gray-400 focus:outline-none resize-vertical min-h-[40px]"
                />
                <div
                  onClick={(e) => {
                    e.stopPropagation()
                    if (needsCorrectAnswer) {
                      onSetCorrectByIndex(index)
                    } else {
                      onToggleCorrect(answer.id)
                    }
                  }}
                  className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 transition-all cursor-pointer",
                    isCorrect
                      ? "border-white bg-white text-green-600 shadow-lg scale-110"
                      : "border-white/50 bg-transparent text-transparent group-hover:border-white group-hover:bg-white/10"
                  )}
                >
                  <Check className={cn("h-8 w-8 transition-all", isCorrect ? "opacity-100" : "opacity-0 group-hover:opacity-30 group-hover:text-gray-600")} />
                </div>

              </div>
            )
          })}
        </div>
        

      </div>
    </main>
  )
}
