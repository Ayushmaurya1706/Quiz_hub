"use client"

import { Plus, Copy, Trash2, GripVertical } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

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
}

interface QuestionSidebarProps {
  questions: QuizCreatorQuestion[]
  selectedIndex: number
  onSelect: (index: number) => void
  onAdd: (type?: string) => void
  onDuplicate: (index: number) => void
  onDelete: (index: number) => void
  onReorder: (fromIndex: number, toIndex: number) => void
}

const questionTypeIcons: Record<string, string> = {
  quiz: "Quiz",
  truefalse: "T/F",
  poll: "Poll",
  puzzle: "Puzzle",
  slide: "Slide",
}

export function QuestionSidebar({
  questions,
  selectedIndex,
  onSelect,
  onAdd,
  onDuplicate,
  onDelete,
}: QuestionSidebarProps) {
  return (
    <aside className="flex w-64 flex-col border-r border-[rgba(255,255,255,0.1)] bg-[var(--kahoot-purple-dark)]">
      <div className="flex-1 overflow-y-auto p-3">
        <div className="space-y-2">
          {questions.map((question, index) => (
            <div
              key={question.id}
              className={cn(
                "group relative cursor-pointer rounded-lg p-2 transition-all",
                selectedIndex === index
                  ? "bg-[var(--kahoot-purple-light)] ring-2 ring-white"
                  : "hover:bg-[var(--kahoot-purple)]"
              )}
              onClick={() => onSelect(index)}
            >
              <div className="flex items-start gap-2">
                <div className="flex flex-col items-center gap-1">
                  <span className="text-xs text-white/70">{index + 1}</span>
                  <GripVertical className="h-4 w-4 text-white/50" />
                </div>
                <div className="flex-1">
                  <div className="mb-2 aspect-video w-full rounded bg-[var(--kahoot-purple)] flex items-center justify-center">
                    <span className="text-xs text-white/50">
                      {questionTypeIcons[question.type]}
                    </span>
                  </div>
                  <p className="truncate text-xs text-white">
                    {question.question || "Click to add question"}
                  </p>
                  <div className="mt-1 flex gap-1">
                    {question.answers.slice(0, 4).map((answer: { id: string; text: string; isCorrect: boolean }, i: number) => {
                      const colors = ["bg-[var(--kahoot-red)]", "bg-[var(--kahoot-blue)]", "bg-[var(--kahoot-yellow)]", "bg-[var(--kahoot-green)]"]
                      return (
                        <div
                          key={answer.id}
                          className={cn(
                            "h-1.5 flex-1 rounded-full",
                            answer.text ? colors[i] : "bg-white/20"
                          )}
                        />
                      )
                    })}
                  </div>
                </div>
              </div>
              <div className="absolute right-2 top-2 hidden gap-1 group-hover:flex">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-white hover:bg-[var(--kahoot-purple)]"
                  onClick={(e) => {
                    e.stopPropagation()
                    onDuplicate(index)
                  }}
                >
                  <Copy className="h-3 w-3" />
                </Button>
                {questions.length > 1 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-white hover:bg-[var(--kahoot-red)]"
                    onClick={(e) => {
                      e.stopPropagation()
                      onDelete(index)
                    }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="border-t border-[rgba(255,255,255,0.1)] p-3">
        <Button
          onClick={() => onAdd("quiz")}
          className="w-full gap-2 bg-[var(--kahoot-blue)] text-white hover:bg-[#0f5ab8]"
        >
          <Plus className="h-4 w-4" />
          Add question
        </Button>
      </div>
    </aside>
  )
}
