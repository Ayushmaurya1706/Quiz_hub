"use client"

import { X, ChevronLeft, ChevronRight, Triangle, Diamond, Circle, Square, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { Question } from "@/app/page"
import { cn } from "@/lib/utils"

interface PreviewModalProps {
  question: Question
  questionNumber: number
  totalQuestions: number
  onClose: () => void
  onNext: () => void
  onPrev: () => void
}

const answerConfigs = [
  { color: "bg-[var(--kahoot-red)]", icon: Triangle },
  { color: "bg-[var(--kahoot-blue)]", icon: Diamond },
  { color: "bg-[var(--kahoot-yellow)]", icon: Circle },
  { color: "bg-[var(--kahoot-green)]", icon: Square },
]

export function PreviewModal({
  question,
  questionNumber,
  totalQuestions,
  onClose,
  onNext,
  onPrev,
}: PreviewModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
      <div className="relative flex h-[90vh] w-[90vw] max-w-5xl flex-col rounded-xl bg-[var(--kahoot-purple)] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
          <div className="flex items-center gap-4">
            <span className="text-lg font-bold text-white">Preview Mode</span>
            <span className="text-sm text-white/60">
              Question {questionNumber} of {totalQuestions}
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-10 w-10 text-white hover:bg-white/10"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Preview Content - Player View */}
        <div className="flex-1 flex flex-col items-center justify-center p-8">
          {/* Timer Display */}
          <div className="mb-6 flex items-center gap-2 rounded-full bg-white/10 px-4 py-2">
            <Clock className="h-5 w-5 text-white" />
            <span className="text-2xl font-bold text-white">{question.timeLimit}</span>
          </div>

          {/* Question */}
          <div className="mb-8 w-full max-w-2xl rounded-xl bg-white p-6 text-center shadow-lg">
            <h2 className="text-2xl font-bold text-gray-800">
              {question.question || "Your question will appear here"}
            </h2>
          </div>

          {/* Answers Grid - Player View */}
          <div className="grid w-full max-w-3xl grid-cols-2 gap-4">
            {question.answers.map((answer, index) => {
              const config = answerConfigs[index] || answerConfigs[0]
              const Icon = config.icon
              const isCorrect = answer.isCorrect

              return (
                <div
                  key={answer.id}
                  className={cn(
                    "flex min-h-[100px] items-center gap-4 rounded-xl p-6 transition-all",
                    config.color,
                    isCorrect && "ring-4 ring-white"
                  )}
                >
                  <Icon className="h-10 w-10 shrink-0 fill-white/20 text-white" />
                  <span className="text-xl font-bold text-white">
                    {answer.text || `Answer ${index + 1}`}
                  </span>
                  {isCorrect && (
                    <div className="ml-auto flex h-8 w-8 items-center justify-center rounded-full bg-white">
                      <span className="text-lg text-green-600">✓</span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Points Info */}
          <div className="mt-6 text-center">
            <span className="text-sm text-white/60">
              {question.basePoints > 0 
                ? `${question.basePoints} points available`
                : "No points for this question"
              }
            </span>
          </div>
        </div>

        {/* Navigation Footer */}
        <div className="flex items-center justify-between border-t border-white/10 px-6 py-4">
          <Button
            variant="ghost"
            onClick={onPrev}
            disabled={questionNumber <= 1}
            className="gap-2 text-white hover:bg-white/10 disabled:opacity-50"
          >
            <ChevronLeft className="h-5 w-5" />
            Previous
          </Button>
          
          <div className="flex gap-2">
            {Array.from({ length: totalQuestions }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  "h-2 w-8 rounded-full transition-colors",
                  i + 1 === questionNumber ? "bg-white" : "bg-white/30"
                )}
              />
            ))}
          </div>

          <Button
            variant="ghost"
            onClick={onNext}
            disabled={questionNumber >= totalQuestions}
            className="gap-2 text-white hover:bg-white/10 disabled:opacity-50"
          >
            Next
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  )
}
