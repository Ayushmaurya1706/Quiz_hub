import {
  collection,
  collectionGroup,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  onSnapshot,
  serverTimestamp,
  query,
  where,
  getDocs,
  Timestamp,
  writeBatch,
  increment,
} from "firebase/firestore"
import { db } from "./firebase"

// Types
export interface Question {
  id: string
  text: string
  options: string[]
  correctOptionIndex: number
  basePoints: number
}

export interface QuizData {
  questions: Question[]
  currentQuestionIndex: number
  status: "waiting" | "quiz_started" | "question_active" | "question_ended" | "quiz_ended"
  questionStartTime: Timestamp | null
  questionEndTime: Timestamp | null
}

export interface Room {
  id: string
  code: string
  adminId: string
  quiz: QuizData
  createdAt: Timestamp
  playerCount?: number
}

export interface Participant {
  id: string
  roomId: string
  name: string
  sessionId: string
  createdByUid: string
  joinedAt: Timestamp
  answers: Record<string, { optionIndex: number; submittedAt: Timestamp; isCorrect: boolean }>
  totalScore: number
}

export interface AdminDashboardRow {
  participantId: string
  name: string
  answered: boolean
  isCorrect: boolean | null
  timeTaken: number | null
  totalScore: number
}

// Generate a 6-character room code
export function generateRoomCode(): string {
  return Math.random().toString(36).substr(2, 6).toUpperCase()
}

// Generate a unique ID
export function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

// Create a new room with predefined questions
export async function createRoom(
  adminId: string,
  questions: Question[]
): Promise<Room> {
  const roomId = generateId()
  const roomCode = generateRoomCode()

  const quizData: QuizData = {
    questions,
    currentQuestionIndex: 0,
    status: "waiting",
    questionStartTime: null,
    questionEndTime: null,
  }

  const room: Room = {
    id: roomId,
    code: roomCode,
    adminId,
    quiz: quizData,
    createdAt: serverTimestamp() as Timestamp,
    playerCount: 0,
  }

  try {
    console.log("Firestore db object:", db)
    console.log("Writing room to Firestore:", roomId)
    
    await setDoc(doc(db, "rooms", roomId), {
      ...room,
      createdAt: serverTimestamp(),
    })
    
    console.log("Room written successfully to Firestore")
    return { ...room, createdAt: new Timestamp(Date.now() / 1000, 0) }
  } catch (error) {
    console.error("Error creating room in Firestore:", error)
    throw new Error(`Failed to create room: ${error instanceof Error ? error.message : String(error)}`)
  }
}

// Join a room as a participant
export async function joinRoom(
  roomCode: string,
  participantName: string,
  sessionId: string,
  createdByUid: string
): Promise<{ roomId: string; participantId: string }> {
  try {
    console.log("Querying for room with code:", roomCode)
    console.log("Firebase db instance:", db)
    
    // Find room by code
    const roomsQuery = query(collection(db, "rooms"), where("code", "==", roomCode))
    console.log("Query created, about to execute getDocs...")
    
    const querySnapshot = await getDocs(roomsQuery)
    console.log("Query completed, snapshot empty?", querySnapshot.empty, "docs count:", querySnapshot.size)

    if (querySnapshot.empty) {
      throw new Error("Room code not found - check the code")
    }

    const roomDoc = querySnapshot.docs[0]
    const roomId = roomDoc.id
    console.log("Found room:", roomId)

    // Check if this sessionId is already in the room by querying the participants subcollection
    const room = roomDoc.data() as Room
    const existingParticipantsQuery = query(
      collection(db, "rooms", roomId, "participants"),
      where("sessionId", "==", sessionId)
    )
    const existingParticipantsSnapshot = await getDocs(existingParticipantsQuery)

    if (!existingParticipantsSnapshot.empty) {
      const docRef = existingParticipantsSnapshot.docs[0]
      console.log("Participant already exists in subcollection, returning existing:", docRef.id)
      return { roomId, participantId: docRef.id }
    }

    // Create new participant document inside the room's participants subcollection
    const participantId = generateId()
    console.log("Creating new participant:", participantId)

    const participantRef = doc(db, "rooms", roomId, "participants", participantId)
    const participant: Participant = {
      id: participantId,
      roomId,
      name: participantName,
      sessionId,
      createdByUid: "",
      joinedAt: serverTimestamp() as Timestamp,
      answers: {},
      totalScore: 0,
    }

    await setDoc(participantRef, {
      ...participant,
      joinedAt: serverTimestamp(),
    })
    console.log("Participant document created in subcollection")

    // Increment lightweight playerCount on the room document
    try {
      await updateDoc(doc(db, "rooms", roomId), {
        playerCount: increment(1),
      })
      console.log("Room playerCount incremented")
    } catch (err) {
      // Non-fatal: if increment fails, continue. It just means playerCount may be stale.
      console.warn("Failed to increment playerCount:", err)
    }

    return { roomId, participantId }
  } catch (error) {
    console.error("Error in joinRoom:", error)
    throw new Error(`Failed to join: ${error instanceof Error ? error.message : String(error)}`)
  }
}

// Submit an answer for a question
export async function submitAnswer(
  roomId: string,
  participantId: string,
  questionIndex: number,
  optionIndex: number,
  questionStartTime: Timestamp
): Promise<boolean> {
  // Locate the participant document in the specific room's participants subcollection
  const participantRef = doc(db, "rooms", roomId, "participants", participantId)
  const participantDoc = await getDoc(participantRef)
  if (!participantDoc.exists()) {
    throw new Error("Participant not found")
  }

  const participant = participantDoc.data() as Participant

  // Check if already answered
  if (participant.answers[questionIndex.toString()]) {
    throw new Error("Already answered this question")
  }

  // Get room and question
  const roomDoc = await getDoc(doc(db, "rooms", roomId))
  if (!roomDoc.exists()) throw new Error("Room not found")

  const room = roomDoc.data() as Room
  const question = room.quiz.questions[questionIndex]
  const isCorrect = optionIndex === question.correctOptionIndex

  // Calculate score
  const submittedAt = serverTimestamp() as Timestamp
  const timeTakenSeconds = Date.now() / 1000 - questionStartTime.seconds
  const basePoints = question.basePoints
  const bonusPoints = Math.max(0, 30 - Math.round(timeTakenSeconds))
  const points = isCorrect ? basePoints + bonusPoints : 0

  // Update participant
  await updateDoc(participantRef, {
    [`answers.${questionIndex}`]: {
      optionIndex,
      submittedAt,
      isCorrect,
    },
    totalScore: participant.totalScore + points,
  })

  return isCorrect
}

// Start the quiz (admin only)
export async function startQuiz(roomId: string): Promise<void> {
  const roomRef = doc(db, "rooms", roomId)

  await updateDoc(roomRef, {
    "quiz.status": "quiz_started",
    "quiz.currentQuestionIndex": 0,
  })

  // Start first question
  await startQuestion(roomId, 0)
}

// Start a specific question (admin only)
export async function startQuestion(roomId: string, questionIndex: number): Promise<void> {
  const roomRef = doc(db, "rooms", roomId)
  // Use server timestamp for the start time, and compute an end time
  // using the client's clock (30 seconds later) since `serverTimestamp()`
  // is a sentinel and doesn't expose `seconds`/`nanoseconds` on the client.
  const endTime = Timestamp.fromDate(new Date(Date.now() + 30 * 1000))

  await updateDoc(roomRef, {
    "quiz.status": "question_active",
    "quiz.currentQuestionIndex": questionIndex,
    "quiz.questionStartTime": serverTimestamp(),
    "quiz.questionEndTime": endTime,
  })
}

// Move to next question (admin only)
export async function nextQuestion(roomId: string): Promise<void> {
  const roomDoc = await getDoc(doc(db, "rooms", roomId))
  if (!roomDoc.exists()) throw new Error("Room not found")

  const room = roomDoc.data() as Room
  const nextIndex = room.quiz.currentQuestionIndex + 1

  if (nextIndex >= room.quiz.questions.length) {
    // Quiz ended
    await updateDoc(doc(db, "rooms", roomId), {
      "quiz.status": "quiz_ended",
    })
  } else {
    // Start next question
    await startQuestion(roomId, nextIndex)
  }
}

// Real-time listener for room
export function onRoomChange(
  roomId: string,
  callback: (room: Room | null) => void
): () => void {
  return onSnapshot(doc(db, "rooms", roomId), (doc) => {
    callback(doc.exists() ? (doc.data() as Room) : null)
  })
}

// Real-time listener for participants in a room
export function onParticipantsChange(
  roomId: string,
  callback: (participants: Participant[]) => void
): () => void {
  return onSnapshot(collection(db, "rooms", roomId, "participants"), (snapshot) => {
    const participants = snapshot.docs.map((doc) => doc.data() as Participant)
    callback(participants)
  })
}

// Real-time listener for current participant
export function onParticipantChange(
  roomId: string,
  participantId: string,
  callback: (participant: Participant | null) => void
): () => void {
  return onSnapshot(doc(db, "rooms", roomId, "participants", participantId), (doc) => {
    callback(doc.exists() ? (doc.data() as Participant) : null)
  })
}

// Get admin dashboard data
export async function getAdminDashboard(roomId: string): Promise<AdminDashboardRow[]> {
  const roomDoc = await getDoc(doc(db, "rooms", roomId))
  if (!roomDoc.exists()) throw new Error("Room not found")

  const room = roomDoc.data() as Room
  const participantDocs = await getDocs(
    collection(db, "rooms", roomId, "participants")
  )

  const currentQuestionIndex = room.quiz.currentQuestionIndex
  const questionStartTime = room.quiz.questionStartTime

  return participantDocs.docs.map((doc) => {
    const participant = doc.data() as Participant
    const answer = participant.answers[currentQuestionIndex.toString()]

    return {
      participantId: doc.id,
      name: participant.name,
      answered: !!answer,
      isCorrect: answer ? answer.isCorrect : null,
      timeTaken: answer && questionStartTime
        ? Math.round((answer.submittedAt.seconds - questionStartTime.seconds) * 1000) / 1000
        : null,
      totalScore: participant.totalScore,
    }
  })
}

// Delete a room (admin only)
export async function deleteRoom(roomId: string): Promise<void> {
  const batch = writeBatch(db)

  // Delete all participants in the room's participants subcollection
  const participantDocs = await getDocs(collection(db, "rooms", roomId, "participants"))
  participantDocs.docs.forEach((doc) => batch.delete(doc.ref))

  // Delete room
  batch.delete(doc(db, "rooms", roomId))

  await batch.commit()
}
