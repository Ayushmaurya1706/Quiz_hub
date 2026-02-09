# TODO: Fix Quiz Time Calculation & Leaderboard Consistency

- [x] Remove `totalQuizTime` from the `Participant` interface
- [x] Update `nextQuestion()` to set `timeUsed` instead of `totalQuizTime`
- [x] Update `endQuiz()` to remove `totalQuizTime` assignment
- [x] Update sorting in `onParticipantsChange()` to use `timeUsed ?? Number.MAX_SAFE_INTEGER`
