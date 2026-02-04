 "use client"

import { Clock, Award, HelpCircle, ToggleLeft, Coins } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
  pointsMode: string
}
import { cn } from "@/lib/utils"

interface SettingsPanelProps {
  question: QuizCreatorQuestion
  onTimeLimitChange: (time: number) => void
  onPointsModeChange: (mode: string) => void
  onBasePointsChange: (points: number) => void
  onTypeChange: (type: string) => void
}

const questionTypes: { type: string; label: string; icon: string }[] = [
  { type: "quiz", label: "Quiz", icon: "?" },
  { type: "truefalse", label: "True or false", icon: "T/F" },
  { type: "poll", label: "Poll", icon: "P" },
  { type: "puzzle", label: "Puzzle", icon: "Z" },
  { type: "slide", label: "Slide", icon: "S" },
]

const timeLimits = [5, 10, 20, 30, 60, 90, 120, 240]

const pointsModeOptions: { value: string; label: string; description: string }[] = [
  { value: "standard", label: "Standard", description: "1000 base points" },
  { value: "double", label: "Double points", description: "2000 base points" },
  { value: "none", label: "No points", description: "0 points" },
]

export function SettingsPanel({
  question,
  onTimeLimitChange,
  onPointsModeChange,
  onBasePointsChange,
  onTypeChange,
}: SettingsPanelProps) {
  
  const handlePointsModeChange = (mode: string) => {
    onPointsModeChange(mode)
    // Auto-set base points based on mode
    switch (mode) {
      case "standard":
        onBasePointsChange(1000)
        break
      case "double":
        onBasePointsChange(2000)
        break
      case "none":
        onBasePointsChange(0)
        break
    }
  }

  return (
    <aside className="w-72 overflow-y-auto border-l border-[rgba(255,255,255,0.1)] bg-[var(--kahoot-purple-dark)] p-4">
      {/* Question Type */}
      <div className="mb-6">
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
          <HelpCircle className="h-4 w-4" />
          Question type
        </h3>
        <div className="space-y-2">
          {questionTypes.map(({ type, label, icon }) => (
            <Button
              key={type}
              variant="ghost"
              onClick={() => onTypeChange(type)}
              className={cn(
                "w-full justify-start gap-3 text-white",
                question.type === type
                  ? "bg-[var(--kahoot-purple-light)] ring-2 ring-white/50"
                  : "hover:bg-[var(--kahoot-purple)]"
              )}
            >
              <span className="flex h-8 w-8 items-center justify-center rounded bg-[var(--kahoot-purple)] text-sm font-bold">
                {icon}
              </span>
              <span className="text-sm">{label}</span>
              {type === "quiz" && (
                <span className="ml-auto rounded bg-[var(--kahoot-green)] px-2 py-0.5 text-xs">
                  Free
                </span>
              )}
            </Button>
          ))}
        </div>
      </div>

      {/* Time Limit */}
      <div className="mb-6">
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
          <Clock className="h-4 w-4" />
          Time limit
        </h3>
        <div className="grid grid-cols-4 gap-2">
          {timeLimits.map((time) => (
            <Button
              key={time}
              variant="ghost"
              size="sm"
              onClick={() => onTimeLimitChange(time)}
              className={cn(
                "h-10 text-sm text-white transition-all",
                question.timeLimit === time
                  ? "bg-[var(--kahoot-purple-light)] ring-2 ring-white"
                  : "bg-[var(--kahoot-purple)] hover:bg-[var(--kahoot-purple-light)]"
              )}
            >
              {time < 60 ? `${time} sec` : `${time / 60} min`}
            </Button>
          ))}
        </div>
        <p className="mt-2 text-xs text-white/60">
          Current: {question.timeLimit < 60 ? `${question.timeLimit} seconds` : `${question.timeLimit / 60} minutes`}
        </p>
      </div>

      {/* Points Mode */}
      <div className="mb-6">
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
          <Award className="h-4 w-4" />
          Points mode
        </h3>
        <div className="space-y-2">
          {pointsModeOptions.map(({ value, label, description }) => (
            <Button
              key={value}
              variant="ghost"
              onClick={() => handlePointsModeChange(value)}
              className={cn(
                "w-full flex-col items-start gap-0.5 py-3 text-white transition-all h-auto",
                question.pointsMode === value
                  ? "bg-[var(--kahoot-purple-light)] ring-2 ring-white/50"
                  : "hover:bg-[var(--kahoot-purple)]"
              )}
            >
              <span className="text-sm font-medium">{label}</span>
              <span className="text-xs text-white/60">{description}</span>
            </Button>
          ))}
        </div>
      </div>

      {/* Custom Base Points */}
      <div className="mb-6">
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
          <Coins className="h-4 w-4" />
          Base points
        </h3>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            value={question.basePoints}
            onChange={(e) => onBasePointsChange(Math.max(0, parseInt(e.target.value) || 0))}
            min={0}
            max={10000}
            step={100}
            className="h-10 bg-[var(--kahoot-purple)] text-white border-white/20 focus:border-white"
          />
          <span className="text-xs text-white/60 whitespace-nowrap">points</span>
        </div>
        <p className="mt-2 text-xs text-white/60">
          Points scale based on answer speed (faster = more points)
        </p>
      </div>

      {/* Answer Options */}
      <div>
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
          <ToggleLeft className="h-4 w-4" />
          Answer options
        </h3>
        <div className="space-y-3 rounded-lg bg-[var(--kahoot-purple)] p-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-white">Single select</span>
            <div className={cn(
              "h-5 w-9 rounded-full p-0.5 transition-colors cursor-pointer",
              question.type === "quiz" || question.type === "truefalse" 
                ? "bg-[var(--kahoot-green)]" 
                : "bg-white/20"
            )}>
              <div className={cn(
                "h-4 w-4 rounded-full bg-white transition-transform",
                (question.type === "quiz" || question.type === "truefalse") && "translate-x-4"
              )} />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-white">Multi-select</span>
            <div className={cn(
              "h-5 w-9 rounded-full p-0.5 transition-colors cursor-pointer",
              question.type === "poll" ? "bg-[var(--kahoot-green)]" : "bg-white/20"
            )}>
              <div className={cn(
                "h-4 w-4 rounded-full bg-white transition-transform",
                question.type === "poll" && "translate-x-4"
              )} />
            </div>
          </div>
        </div>
      </div>

      {/* Correct Answer Info */}
      {(question.type === "quiz" || question.type === "truefalse") && (
        <div className="mt-6 rounded-lg bg-[var(--kahoot-purple)] p-3">
          <h4 className="text-xs font-semibold text-white/80 mb-2">Correct Answer Status</h4>
          {question.correctOptionIndex >= 0 ? (
            <p className="text-sm text-green-400">
              Answer {question.correctOptionIndex + 1} is marked correct
            </p>
          ) : (
            <p className="text-sm text-yellow-400">
              No correct answer selected - click an answer to mark it correct
            </p>
          )}
        </div>
      )}
    </aside>
  )
}
