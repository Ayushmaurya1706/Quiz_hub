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
}

const answerConfigs = [
  { color: "bg-[var(--kahoot-red)]", hoverColor: "hover:bg-[#c8172f]", icon: Triangle, shape: "triangle" },
  { color: "bg-[var(--kahoot-blue)]", hoverColor: "hover:bg-[#0f5ab8]", icon: Diamond, shape: "diamond" },
  { color: "bg-[var(--kahoot-yellow)]", hoverColor: "hover:bg-[#c28d00]", icon: Circle, shape: "circle" },
  { color: "bg-[var(--kahoot-green)]", hoverColor: "hover:bg-[#1e7009]", icon: Square, shape: "square" },
]

export function QuestionEditor({
  question,
  questionNumber,
  onQuestionChange,
  onAnswerChange,
  onToggleCorrect,
  onSetCorrectByIndex,
}: QuestionEditorProps) {
  const needsCorrectAnswer = question.type === "quiz" || question.type === "truefalse"
  const hasCorrectAnswer = question.correctOptionIndex >= 0

  return (
    <main className="flex flex-1 flex-col overflow-hidden bg-[var(--kahoot-purple)] p-6">
      {/* Question Input Area */}
      <div className="mb-6 flex flex-col items-center">
        <div className="relative w-full max-w-2xl">
          <div className="rounded-lg bg-white p-1 shadow-lg">
            <Textarea
              value={question.question}
              onChange={(e) => onQuestionChange(e.target.value)}
              placeholder="Click to start typing your question"
              className="min-h-[100px] resize-none border-none bg-transparent text-center text-xl font-bold text-gray-800 placeholder:text-gray-400 focus-visible:ring-0"
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

      {/* Answer Options */}
      <div className="flex-1">
        <div className="grid grid-cols-2 gap-4">
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
                  "group relative flex min-h-[80px] cursor-pointer items-center gap-4 rounded-lg p-4 transition-all",
                  config.color,
                  config.hoverColor,
                  isCorrect && "ring-4 ring-white ring-offset-2 ring-offset-[var(--kahoot-purple)]"
                )}
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center">
                  <Icon className="h-8 w-8 fill-white/20 text-white" />
                </div>
                <input
                  type="text"
                  value={answer.text}
                  onChange={(e) => {
                    e.stopPropagation()
                    onAnswerChange(answer.id, { text: e.target.value })
                  }}
                  onClick={(e) => e.stopPropagation()}
                  placeholder={`Add answer ${index + 1}`}
                  className="flex-1 bg-transparent text-lg font-medium text-white placeholder:text-white/50 focus:outline-none"
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
                  <Check className={cn("h-6 w-6 transition-all", isCorrect ? "opacity-100" : "opacity-0 group-hover:opacity-30 group-hover:text-white")} />
                </div>
                {isCorrect && (
                  <div className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-green-500 shadow-md animate-in zoom-in">
                    <Check className="h-4 w-4 text-white" />
                  </div>
                )}
              </div>
            )
          })}
        </div>
        
        {/* Points Info */}
        <div className="mt-4 flex justify-center">
          <div className="rounded-lg bg-white/10 px-4 py-2">
            <span className="text-sm text-white/80">
              {question.basePoints > 0 
                ? `${question.basePoints} base points | ${question.timeLimit}s time limit`
                : `No points | ${question.timeLimit}s time limit`
              }
            </span>
          </div>
        </div>
      </div>
    </main>
  )
}
