# TODO: Fix totalQuizTime Calculation

## Steps to Complete
- [x] Update totalQuizTime calculation in endQuiz function to use (quizFinishedAt - quizStartedAt) / 1000
- [x] Update totalQuizTime calculation in leaveRoom function to use (quizFinishedAt - quizStartedAt) / 1000
- [x] Verify that answer.timeTaken is kept for per-question analytics
- [x] Test the changes to ensure result screen shows correct total quiz time

## Notes
- Do not sum answer.timeTaken for totalQuizTime
- Use Timestamp.toMillis() for accurate calculation
