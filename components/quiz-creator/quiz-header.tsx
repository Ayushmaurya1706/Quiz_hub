"use client"

import { ChevronLeft, Settings, Eye, MoreHorizontal, Play, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface QuizHeaderProps {
  title: string
  onTitleChange: (title: string) => void
  onSave: () => void
  onHost: () => void
  onPreview: () => void
  onSettings: () => void
  isSaving?: boolean
  isSaved?: boolean
}

export function QuizHeader({ 
  title, 
  onTitleChange, 
  onSave, 
  onHost, 
  onPreview,
  onSettings,
  isSaving, 
  isSaved 
}: QuizHeaderProps) {
  return (
    <header className="flex h-14 items-center justify-between border-b border-[rgba(255,255,255,0.1)] bg-[var(--kahoot-purple-dark)] px-4">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 text-white hover:bg-[var(--kahoot-purple-light)]"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div className="flex items-center">
          <span className="text-lg font-bold text-white">K!</span>
        </div>
        <Input
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          className="w-64 border-none bg-transparent text-sm text-white placeholder:text-white/50 focus-visible:ring-0 focus-visible:ring-offset-0"
          placeholder="Enter kahoot title..."
        />
        {isSaved && (
          <span className="text-xs text-green-400 animate-in fade-in">Saved to Firebase</span>
        )}
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={onSettings}
          className="h-9 gap-2 text-white hover:bg-[var(--kahoot-purple-light)]"
        >
          <Settings className="h-4 w-4" />
          <span className="text-sm">Settings</span>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onPreview}
          className="h-9 gap-2 text-white hover:bg-[var(--kahoot-purple-light)]"
        >
          <Eye className="h-4 w-4" />
          <span className="text-sm">Preview</span>
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 text-white hover:bg-[var(--kahoot-purple-light)]"
        >
          <MoreHorizontal className="h-5 w-5" />
        </Button>
        <Button 
          onClick={onSave}
          disabled={isSaving}
          className="h-9 bg-[var(--kahoot-green)] px-6 text-sm font-semibold text-white hover:bg-[#1e7009] disabled:opacity-50"
        >
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Save"
          )}
        </Button>
        <Button 
          onClick={onHost}
          disabled={isSaving}
          className="h-9 gap-2 bg-white px-6 text-sm font-semibold text-[var(--kahoot-purple)] hover:bg-white/90 disabled:opacity-50"
        >
          <Play className="h-4 w-4 fill-current" />
          Host
        </Button>
      </div>
    </header>
  )
}
