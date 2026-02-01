# Real-Time Quiz Game - Setup Guide

## Overview

A Kahoot-style real-time multiplayer quiz application built with Next.js (React) and Firebase Firestore. Features real-time room management, 30-second timed questions, speed-based scoring, and live leaderboards.

## Features Implemented

### Room Management
- ✅ Admin creates quiz rooms with shareable room codes
- ✅ Participants join using room code and name
- ✅ Real-time participant list in admin dashboard
- ✅ Session ID-based duplicate prevention

### Quiz Flow
- ✅ Admin controls quiz start and question progression
- ✅ 30-second countdown timer per question
- ✅ Single submission per question (prevented via Firestore)
- ✅ Auto-submit on timeout
- ✅ Real-time waiting screen between questions

### Scoring System
- ✅ Points calculated: basePoints + (30 - timeTaken)
- ✅ Correct answers only earn points
- ✅ Real-time score tracking per participant
- ✅ Time-based bonus points for faster answers

### Admin Dashboard
- ✅ Real-time participant table: name, answered status, correctness, time taken, total score
- ✅ Quiz status display
- ✅ Question counter
- ✅ Quiz control buttons

### Technical Implementation
- ✅ Firebase Firestore for real-time data synchronization
- ✅ Server timestamps for accurate time calculations
- ✅ Real-time listeners for room and participant updates
- ✅ Session-based page refresh recovery
- ✅ Mobile-friendly responsive UI

## Firestore Schema

```
rooms/
  {roomId}
    code: string (unique, 6 chars)
    adminId: string
    quiz: object
      questions: Question[]
      currentQuestionIndex: number
      status: "waiting" | "quiz_started" | "question_active" | "question_ended" | "quiz_ended"
      questionStartTime: Timestamp | null
      questionEndTime: Timestamp | null
    createdAt: Timestamp
    participants: Record<participantId, { name, sessionId }>

participants/
  {participantId}
    roomId: string
    name: string
    sessionId: string (browser-based, prevents duplicates)
    joinedAt: Timestamp
    answers: Record<questionIndex, { optionIndex, submittedAt, isCorrect }>
    totalScore: number
```

## Environment Setup

### 1. Firebase Configuration

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### 2. Firebase Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow read/write for rooms
    match /rooms/{roomId} {
      allow read: if true;
      allow create: if request.auth != null;
      allow update: if true;
      allow delete: if request.auth != null;
    }
    
    // Allow read/write for participants
    match /participants/{participantId} {
      allow read: if true;
      allow create: if true;
      allow update: if true;
      allow delete: if true;
    }
  }
}
```

## Usage

### For Hosts (Admin)

1. Navigate to `/host`
2. Click "Create New Quiz Room"
3. Share the room code with participants
4. Wait for participants to join
5. Click "Start Quiz" when ready
6. Monitor the admin dashboard in real-time
7. Click "Next Question" between questions
8. View final results when quiz ends

### For Participants

1. Navigate to `/play`
2. Enter the room code from the host
3. Enter your name
4. Wait in the lobby
5. When questions appear, select an answer before time runs out
6. View your score after the quiz

## Pages & Routes

```
/                          Home page with navigation
/host                      Create quiz room
/host/[gamePin]           Admin dashboard with participant list
/host/[gamePin]/play      Quiz display (currently routes to /play/[gamePin])
/play                      Join room form
/play/[gamePin]           Participant quiz interface
```

## Core Components

### lib/quiz-service.ts
- `createRoom()` - Create new quiz room
- `joinRoom()` - Join room as participant
- `submitAnswer()` - Submit answer for a question
- `startQuiz()` - Start quiz (admin)
- `startQuestion()` - Start specific question
- `nextQuestion()` - Move to next question (admin)
- `onRoomChange()` - Real-time room listener
- `onParticipantsChange()` - Real-time participants listener
- `getAdminDashboard()` - Get dashboard data

### Pages
- `/app/page.tsx` - Home navigation
- `/app/host/page.tsx` - Host login/create room
- `/app/host/[gamePin]/page.tsx` - Admin dashboard
- `/app/host/[gamePin]/play/page.tsx` - Quiz player (admin view)
- `/app/play/page.tsx` - Participant join form
- `/app/play/[gamePin]/page.tsx` - Quiz player (participant view)

## Scoring Formula

```
Score = isCorrect ? (basePoints + max(0, 30 - timeTaken)) : 0
```

Where:
- `basePoints` = 100 (configurable per question)
- `timeTaken` = seconds from question start to answer submission
- Bonus points decrease with time (max 30 bonus points)

## Sample Questions

The app includes 5 sample questions pre-loaded:
1. What is the capital of France? (Answer: Paris)
2. Which planet is closest to the Sun? (Answer: Mercury)
3. What is 2 + 2? (Answer: 4)
4. Who wrote Romeo and Juliet? (Answer: William Shakespeare)
5. What is the largest ocean? (Answer: Pacific Ocean)

## Session Management

### Browser Session ID
- Generated and stored in `localStorage` as `sessionId`
- Used to identify returning participants
- Prevents duplicate joins from same browser

### Room & Participant Storage
- `sessionStorage.roomId` - Current room ID
- `sessionStorage.participantId` - Current participant ID
- Cleared when leaving a room

## Real-Time Features

All updates synchronize in real-time via Firestore listeners:
- New participants joining
- Questions changing
- Answers being submitted
- Scores updating
- Quiz status changes

## Known Limitations & Future Improvements

### Current
- Sample questions hardcoded (5 questions)
- No user authentication (anyone can create rooms)
- No persistent quiz history
- Single browser tab support recommended

### Future Enhancements
- Admin question editor UI
- Multiple quizzes per host
- Question randomization
- Category-based quizzes
- Analytics dashboard
- Multiplayer settings (time per question, scoring modes)
- Mobile optimizations
- Dark mode
- Sound effects/music

## Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Connect repo to Vercel
3. Add environment variables in Vercel settings
4. Deploy automatically on push

### Other Platforms

Build and deploy:
```bash
npm run build
npm start
```

## Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

Visit `http://localhost:3000` in your browser.

## Troubleshooting

### "Room not found" error
- Check room code spelling
- Ensure code is entered in uppercase
- Room may have expired (refresh and try again)

### Timer not counting down
- Check browser console for errors
- Verify room quiz status is "question_active"
- Ensure question data is loaded

### Real-time updates not syncing
- Check Firestore connection in browser DevTools
- Verify Firebase credentials in `.env.local`
- Check Firestore security rules allow read/write

### Duplicate participants error
- Clear `sessionStorage` in browser
- Browser cookies/localStorage may need clearing
- Try incognito window for testing

## Support

For issues, check:
1. Firebase Firestore console for data integrity
2. Browser console for JavaScript errors
3. Network tab for Firestore request failures
4. Verify `.env.local` configuration
