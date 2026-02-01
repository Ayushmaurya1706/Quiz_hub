"use client"

import { useState } from "react"
import { X, Clock, Award, ListOrdered, Shuffle, Trophy } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import type { QuizSettings } from "@/app/page"
import { cn } from "@/lib/utils"

interface SettingsModalProps {
  settings: QuizSettings
  onSave: (settings: QuizSettings) => void
  onClose: () => void
}

const timeLimitOptions = [5, 10, 20, 30, 60, 90, 120, 240]

export function SettingsModal({ settings, onSave, onClose }: SettingsModalProps) {
  const [localSettings, setLocalSettings] = useState<QuizSettings>(settings)

  const handleSave = () => {
    onSave(localSettings)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
      <div className="relative w-full max-w-lg rounded-xl bg-[var(--kahoot-purple-dark)] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
          <h2 className="text-xl font-bold text-white">Room Settings</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-10 w-10 text-white hover:bg-white/10"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Settings Content */}
        <div className="p-6 space-y-6">
          {/* Default Time Limit */}
          <div>
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
              <Clock className="h-4 w-4" />
              Default Time Limit
            </h3>
            <p className="text-xs text-white/60 mb-3">
              Applied to new questions. Individual questions can override this.
            </p>
            <div className="grid grid-cols-4 gap-2">
              {timeLimitOptions.map((time) => (
                <Button
                  key={time}
                  variant="ghost"
                  size="sm"
                  onClick={() => setLocalSettings({ ...localSettings, timeLimit: time })}
                  className={cn(
                    "h-10 text-sm text-white transition-all",
                    localSettings.timeLimit === time
                      ? "bg-[var(--kahoot-purple-light)] ring-2 ring-white"
                      : "bg-[var(--kahoot-purple)] hover:bg-[var(--kahoot-purple-light)]"
                  )}
                >
                  {time < 60 ? `${time}s` : `${time / 60}m`}
                </Button>
              ))}
            </div>
          </div>

          {/* Scoring Mode */}
          <div>
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
              <Award className="h-4 w-4" />
              Default Scoring Mode
            </h3>
            <div className="space-y-2">
              {[
                { value: "standard", label: "Standard", desc: "1000 base points" },
                { value: "double", label: "Double Points", desc: "2000 base points" },
                { value: "none", label: "No Points", desc: "For practice mode" },
              ].map((option) => (
                <Button
                  key={option.value}
                  variant="ghost"
                  onClick={() => setLocalSettings({ ...localSettings, scoringMode: option.value as QuizSettings["scoringMode"] })}
                  className={cn(
                    "w-full flex-col items-start gap-0.5 py-3 text-white h-auto",
                    localSettings.scoringMode === option.value
                      ? "bg-[var(--kahoot-purple-light)] ring-2 ring-white/50"
                      : "hover:bg-[var(--kahoot-purple)]"
                  )}
                >
                  <span className="text-sm font-medium">{option.label}</span>
                  <span className="text-xs text-white/60">{option.desc}</span>
                </Button>
              ))}
            </div>
          </div>

          {/* Toggle Settings */}
          <div className="space-y-4">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-white">
              <ListOrdered className="h-4 w-4" />
              Game Options
            </h3>
            
            <div className="space-y-4 rounded-lg bg-[var(--kahoot-purple)] p-4">
              {/* Show Leaderboard */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Trophy className="h-4 w-4 text-white/60" />
                  <div>
                    <span className="text-sm text-white">Show Leaderboard</span>
                    <p className="text-xs text-white/50">Display rankings between questions</p>
                  </div>
                </div>
                <Switch
                  checked={localSettings.showLeaderboard}
                  onCheckedChange={(checked) => 
                    setLocalSettings({ ...localSettings, showLeaderboard: checked })
                  }
                />
              </div>

              {/* Randomize Questions */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Shuffle className="h-4 w-4 text-white/60" />
                  <div>
                    <span className="text-sm text-white">Randomize Questions</span>
                    <p className="text-xs text-white/50">Shuffle question order for each game</p>
                  </div>
                </div>
                <Switch
                  checked={localSettings.randomizeQuestions}
                  onCheckedChange={(checked) => 
                    setLocalSettings({ ...localSettings, randomizeQuestions: checked })
                  }
                />
              </div>

              {/* Randomize Answers */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Shuffle className="h-4 w-4 text-white/60" />
                  <div>
                    <span className="text-sm text-white">Randomize Answers</span>
                    <p className="text-xs text-white/50">Shuffle answer positions in each question</p>
                  </div>
                </div>
                <Switch
                  checked={localSettings.randomizeAnswers}
                  onCheckedChange={(checked) => 
                    setLocalSettings({ ...localSettings, randomizeAnswers: checked })
                  }
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-white/10 px-6 py-4">
          <Button
            variant="ghost"
            onClick={onClose}
            className="text-white hover:bg-white/10"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            className="bg-[var(--kahoot-green)] text-white hover:bg-[#1e7009]"
          >
            Save Settings
          </Button>
        </div>
      </div>
    </div>
  )
}
