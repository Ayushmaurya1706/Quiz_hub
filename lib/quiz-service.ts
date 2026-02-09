import {
  collection,
  collectionGroup,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  serverTimestamp,
  query,
  where,
  orderBy,
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
  options: Array<{ id: string; text: string }>
  correctOptionId: string
  basePoints: number
}

export interface QuizData {
  questions: Question[]
  currentQuestionIndex: number
  status: "waiting" | "quiz_started" | "question_active" | "question_ended" | "quiz_ended"
  questionStartTime: Timestamp | null
  questionEndTime: Timestamp | null
  // Global quiz timer fields
  quizStartTime: Timestamp | null
  quizDuration: number | null // in minutes
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
  answers: Record<string, { optionId: string; submittedAt: Timestamp; isCorrect: boolean; timeTaken: number }>
  score: number
  status: "active" | "removed" // New field for kick feature
  quizStartedAt: Timestamp | null
  quizFinishedAt: Timestamp | null
  timeUsed: number | null // in seconds
}

export interface AdminDashboardRow {
  participantId: string
  name: string
  answered: boolean
  isCorrect: boolean | null
  timeTaken: number | null
  score: number
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
    quizStartTime: null,
    quizDuration: null,
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
      score: 0,
      status: "active", // New field for kick feature
      quizStartedAt: null,
      quizFinishedAt: null,
      timeUsed: null,
    }

    await setDoc(participantRef, {
      ...participant,
      joinedAt: serverTimestamp(),
    })
    console.log("Participant document created in subcollection")

    // If quiz has already started, set the start time
    const currentRoomDoc = await getDoc(doc(db, "rooms", roomId))
    const currentRoom = currentRoomDoc.data() as Room
    if (currentRoom.quiz.status === "quiz_started" && currentRoom.quiz.quizStartTime) {
      await updateDoc(participantRef, {
        quizStartedAt: currentRoom.quiz.quizStartTime,
      })
    }

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

// Submit an answer for a question (allows updates)
export async function submitAnswer(
  roomId: string,
  participantId: string,
  questionId: string,
  optionId: string
): Promise<boolean> {
  // Locate the participant document in the specific room's participants subcollection
  const participantRef = doc(db, "rooms", roomId, "participants", participantId)
  const participantDoc = await getDoc(participantRef)
  if (!participantDoc.exists()) {
    throw new Error("Participant not found")
  }

  const participant = participantDoc.data() as Participant

  // Get room and question
  const roomDoc = await getDoc(doc(db, "rooms", roomId))
  if (!roomDoc.exists()) throw new Error("Room not found")

  const room = roomDoc.data() as Room
  const question = room.quiz.questions.find(q => q.id === questionId)
  if (!question) throw new Error("Question not found")

  const isCorrect = optionId === question.correctOptionId

  // Calculate score (base points only)
  const submittedAt = Timestamp.now()
  const basePoints = question.basePoints
  const points = isCorrect ? basePoints : 0

  // Calculate time taken
  const questionStartTime = room.quiz.questionStartTime
  const timeTaken = questionStartTime ? Math.floor((submittedAt.toMillis() - questionStartTime.toMillis()) / 1000) : 0

  // Check if previously answered to adjust score
  const previousAnswer = participant.answers[questionId]
  let scoreAdjustment = points
  if (previousAnswer) {
    // Subtract previous points if changing answer
    const previousPoints = previousAnswer.isCorrect ? basePoints : 0
    scoreAdjustment = points - previousPoints
  }

  // Update participant
  await updateDoc(participantRef, {
    [`answers.${questionId}`]: {
      optionId,
      submittedAt,
      isCorrect,
      timeTaken,
    },
    score: participant.score + scoreAdjustment,
  })

  return isCorrect
}

// Start the quiz (admin only)
export async function startQuiz(roomId: string, durationMinutes: number): Promise<void> {
  const roomRef = doc(db, "rooms", roomId)

  await updateDoc(roomRef, {
    "quiz.status": "quiz_started",
    "quiz.currentQuestionIndex": 0,
    "quiz.quizStartTime": Timestamp.now(),
    "quiz.quizDuration": durationMinutes,
  })

  // Set quizStartedAt for all active participants
  const participantsQuery = query(collection(db, "rooms", roomId, "participants"), where("status", "==", "active"))
  const participantsSnapshot = await getDocs(participantsQuery)
  const batch = writeBatch(db)
  participantsSnapshot.docs.forEach((doc) => {
    batch.update(doc.ref, {
      quizStartedAt: Timestamp.now(),
    })
  })
  await batch.commit()
}

// Start a specific question (admin only)
export async function startQuestion(roomId: string, questionIndex: number): Promise<void> {
  const roomRef = doc(db, "rooms", roomId)
  // Use client timestamp for the start time to enable accurate time calculations
  const startTime = Timestamp.now()
  const endTime = Timestamp.fromDate(new Date(Date.now() + 30 * 1000))

  await updateDoc(roomRef, {
    "quiz.status": "question_active",
    "quiz.currentQuestionIndex": questionIndex,
    "quiz.questionStartTime": startTime,
    "quiz.questionEndTime": endTime,
  })
}

// End the current question (admin only)
export async function endQuestion(roomId: string): Promise<void> {
  const roomRef = doc(db, "rooms", roomId)
  await updateDoc(roomRef, {
    "quiz.status": "question_ended",
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

    // Set quizFinishedAt and timeUsed for all active participants who haven't finished yet
    const participantsQuery = query(collection(db, "rooms", roomId, "participants"), where("status", "==", "active"))
    const participantsSnapshot = await getDocs(participantsQuery)
    const batch = writeBatch(db)
    participantsSnapshot.docs.forEach((doc) => {
      const participant = doc.data() as Participant
      if (participant.quizStartedAt && !participant.quizFinishedAt) {
        const finishedAt = Timestamp.now()
        const totalTime = Math.floor((finishedAt.toMillis() - participant.quizStartedAt.toMillis()) / 1000)
        batch.update(doc.ref, {
          quizFinishedAt: finishedAt,
          timeUsed: totalTime,
        })
      }
    })
    await batch.commit()
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
  const participantsQuery = query(
    collection(db, "rooms", roomId, "participants"),
    where("status", "==", "active")
  )
  return onSnapshot(participantsQuery, (snapshot) => {
    const participants = snapshot.docs.map((doc) => doc.data() as Participant)
    // Sort by score descending, then by timeUsed ascending
    participants.sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score
      }
      const timeA = a.timeUsed ?? Number.MAX_SAFE_INTEGER
      const timeB = b.timeUsed ?? Number.MAX_SAFE_INTEGER
      return timeA - timeB
    })
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
  const questionId = room.quiz.questions[currentQuestionIndex].id
  const questionStartTime = room.quiz.questionStartTime

  return participantDocs.docs.map((doc) => {
    const participant = doc.data() as Participant
    const answer = participant.answers[questionId]

    return {
      participantId: doc.id,
      name: participant.name,
      answered: !!answer,
      isCorrect: answer ? answer.isCorrect : null,
      timeTaken: answer && questionStartTime
        ? Math.round((answer.submittedAt.seconds - questionStartTime.seconds) * 1000) / 1000
        : null,
      score: participant.score,
    }
  })
}

// Kick a participant (admin only)
export async function kickParticipant(roomId: string, participantId: string): Promise<void> {
  const participantRef = doc(db, "rooms", roomId, "participants", participantId)
  await updateDoc(participantRef, {
    status: "removed"
  })
}

// End quiz globally (called when timer expires)
export async function endQuiz(roomId: string): Promise<void> {
  const roomRef = doc(db, "rooms", roomId)
  await updateDoc(roomRef, {
    "quiz.status": "quiz_ended",
  })

  // Set quizFinishedAt and timeUsed for all active participants who haven't finished yet
  const participantsQuery = query(collection(db, "rooms", roomId, "participants"), where("status", "==", "active"))
  const participantsSnapshot = await getDocs(participantsQuery)
  const batch = writeBatch(db)
  participantsSnapshot.docs.forEach((doc) => {
    const participant = doc.data() as Participant
    if (participant.quizStartedAt && !participant.quizFinishedAt) {
      const finishedAt = Timestamp.now()
      const totalTime = Math.floor((finishedAt.toMillis() - participant.quizStartedAt.toMillis()) / 1000)
      batch.update(doc.ref, {
        quizFinishedAt: finishedAt,
        timeUsed: totalTime,
      })
    }
  })
  await batch.commit()
}

// Leave a room (participant only) - does not delete participant data
export async function leaveRoom(roomId: string, participantId: string): Promise<void> {
  console.log("leaveRoom called for participant:", participantId, "in room:", roomId)

  // Set quiz finish time if not already set
  const participantRef = doc(db, "rooms", roomId, "participants", participantId)
  const participantDoc = await getDoc(participantRef)
  if (participantDoc.exists()) {
    const participant = participantDoc.data() as Participant
    console.log("Participant data:", participant)
    console.log("quizStartedAt:", participant.quizStartedAt)
    console.log("quizFinishedAt:", participant.quizFinishedAt)

    if (participant.quizStartedAt && !participant.quizFinishedAt) {
      const finishedAt = Timestamp.now()
      const totalTime = Math.floor((finishedAt.toMillis() - participant.quizStartedAt.toMillis()) / 1000)
      console.log("Setting timeUsed to:", totalTime)

      await updateDoc(participantRef, {
        quizFinishedAt: finishedAt,
        timeUsed: totalTime,
      })
      console.log("Successfully updated participant with finish time")
    } else {
      console.log("Participant already has finish time or no start time")
    }
  } else {
    console.log("Participant document not found")
  }

  // Decrement playerCount on the room document only
  try {
    await updateDoc(doc(db, "rooms", roomId), {
      playerCount: increment(-1),
    })
    console.log("Room playerCount decremented")
  } catch (err) {
    // Non-fatal: if decrement fails, continue. It just means playerCount may be stale.
    console.warn("Failed to decrement playerCount:", err)
  }
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
