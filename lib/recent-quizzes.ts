const RECENT_QUIZZES_KEY = 'recent_quizzes'
const MAX_RECENT = 10 // Keep last 10 quizzes

export interface RecentQuiz {
  id: string
  title: string
  description?: string
  questions: Array<{
    question: string
    answers: Array<{ id: string; text: string }>
    correctAnswerId: string
    timeLimit: number
    points: number
  }>
  createdAt: number  // timestamp
  gamePin?: string
  totalPlayers?: number
}

export function saveRecentQuiz(quiz: RecentQuiz) {
  const recent = getRecentQuizzes()

  // Add to beginning, remove duplicates by id
  const updated = [quiz, ...recent.filter(q => q.id !== quiz.id)]

  // Keep only last 10
  const trimmed = updated.slice(0, MAX_RECENT)

  localStorage.setItem(RECENT_QUIZZES_KEY, JSON.stringify(trimmed))
}

export function getRecentQuizzes(): RecentQuiz[] {
  if (typeof window === 'undefined') return []

  const stored = localStorage.getItem(RECENT_QUIZZES_KEY)
  return stored ? JSON.parse(stored) : []
}

export function deleteRecentQuiz(quizId: string) {
  const recent = getRecentQuizzes()
  const filtered = recent.filter(q => q.id !== quizId)
  localStorage.setItem(RECENT_QUIZZES_KEY, JSON.stringify(filtered))
}

export function clearRecentQuizzes() {
  localStorage.removeItem(RECENT_QUIZZES_KEY)
}
