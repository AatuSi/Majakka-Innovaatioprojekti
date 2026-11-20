import { useSyncExternalStore } from 'react'
import { getAttemptHistory } from '../../client'
import type { QuizAttemptHistoryItem } from '../../client'
import { useAuthUser } from '../../components/authUserStore'
import { continuableAttempts } from './attemptHistory'

// The notifications are reminders about quizzes the user has left unfinished,
// built from their attempt history. There is no notification table in the
// backend, so what the user does with them (read, favourite, delete) and the
// reminder setting are kept in this browser, separately for every account.

export interface NotificationMessage {
  /** Id of the unfinished attempt the reminder is about. */
  id: string
  title: string
  description: string
  /** When the attempt was last answered, as an ISO timestamp. */
  time: string
  quizName?: string | null
  read: boolean
  favorite: boolean
  selected: boolean
}

type SavedState = {
  read: string[]
  favorite: string[]
  deleted: string[]
  remindersOn: boolean
}

type Snapshot = {
  userId: string | null
  notifications: NotificationMessage[]
  remindersOn: boolean
}

const storageKey = (userId: string) => `majakka.notifications.${userId}`

const defaultSaved: SavedState = {
  read: [],
  favorite: [],
  deleted: [],
  remindersOn: true,
}

function loadSaved(userId: string): SavedState {
  try {
    const raw = window.localStorage.getItem(storageKey(userId))
    if (!raw) return defaultSaved
    const parsed = JSON.parse(raw) as Partial<SavedState>
    return {
      read: Array.isArray(parsed.read) ? parsed.read : [],
      favorite: Array.isArray(parsed.favorite) ? parsed.favorite : [],
      deleted: Array.isArray(parsed.deleted) ? parsed.deleted : [],
      remindersOn: parsed.remindersOn !== false,
    }
  } catch {
    return defaultSaved
  }
}

function persist(userId: string, saved: SavedState) {
  try {
    window.localStorage.setItem(storageKey(userId), JSON.stringify(saved))
  } catch {
    // Storage can be full or blocked; the state still holds for this visit.
  }
}

function describe(attempt: QuizAttemptHistoryItem) {
  const answered = attempt.total_questions
  return answered > 0
    ? `Olet vastannut ${answered} kysymykseen. Jatka siitä, mihin jäit.`
    : 'Aloitit tietovisan, mutta et vielä vastannut kysymyksiin.'
}

let userId: string | null = null
let attempts: QuizAttemptHistoryItem[] = []
let saved: SavedState = defaultSaved
let selected = new Set<string>()
let requestId = 0

const emptySnapshot: Snapshot = {
  userId: null,
  notifications: [],
  remindersOn: true,
}
let snapshot: Snapshot = emptySnapshot
const listeners = new Set<() => void>()

function emit() {
  const deleted = new Set(saved.deleted)
  const read = new Set(saved.read)
  const favorite = new Set(saved.favorite)

  const notifications = saved.remindersOn
    ? attempts
        .filter((attempt) => !deleted.has(attempt.id))
        .map((attempt) => ({
          id: attempt.id,
          title: `Kesken: ${attempt.quiz_name ?? 'Nimetön tietovisa'}`,
          description: describe(attempt),
          time: attempt.last_activity_at,
          quizName: attempt.quiz_name,
          read: read.has(attempt.id),
          favorite: favorite.has(attempt.id),
          selected: selected.has(attempt.id),
        }))
    : []

  snapshot = { userId, notifications, remindersOn: saved.remindersOn }
  listeners.forEach((listener) => listener())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

function switchUser(nextUserId: string) {
  if (userId === nextUserId) return
  userId = nextUserId
  attempts = []
  saved = loadSaved(nextUserId)
  selected = new Set()
}

/**
 * Loads the user's unfinished attempts again. Called by the header's bell when
 * the user or the page changes, so a quiz finished meanwhile drops out.
 */
export async function refreshNotifications(forUserId: string) {
  switchUser(forUserId)
  emit()

  const thisRequest = ++requestId
  const result = await getAttemptHistory({
    query: { include_unfinished: true },
  })

  // A later refresh or another login has taken over; this answer is stale.
  if (thisRequest !== requestId || userId !== forUserId || result.error) return

  const continuable = continuableAttempts(result.data)
  attempts = result.data
    .filter((attempt) => continuable.has(attempt.id))
    .sort((a, b) => b.last_activity_at.localeCompare(a.last_activity_at))

  // Forget saved ids whose attempts are gone, so the saved lists don't grow forever.
  const known = new Set(attempts.map((attempt) => attempt.id))
  saved = {
    ...saved,
    read: saved.read.filter((id) => known.has(id)),
    favorite: saved.favorite.filter((id) => known.has(id)),
    deleted: saved.deleted.filter((id) => known.has(id)),
  }
  persist(forUserId, saved)
  emit()
}

/** Turns the unfinished-quiz reminders on or off for the given user. */
export function setQuizReminders(forUserId: string, on: boolean) {
  switchUser(forUserId)
  saved = { ...saved, remindersOn: on }
  persist(forUserId, saved)
  emit()
}

/**
 * Applies a change to the list. A notification left out of the new list counts
 * as deleted, and stays hidden until its quiz is continued or finished.
 */
function updateNotifications(
  next:
    | NotificationMessage[]
    | ((prev: NotificationMessage[]) => NotificationMessage[]),
) {
  if (!userId) return
  const current = snapshot.notifications
  const list = typeof next === 'function' ? next(current) : next

  const kept = new Set(list.map((item) => item.id))
  const removed = current
    .filter((item) => !kept.has(item.id))
    .map((item) => item.id)
  const listed = new Set(current.map((item) => item.id))

  // Ids not shown now (turned off, or not loaded) keep their saved state.
  const untouched = (ids: string[]) => ids.filter((id) => !listed.has(id))

  saved = {
    ...saved,
    read: [
      ...untouched(saved.read),
      ...list.filter((item) => item.read).map((item) => item.id),
    ],
    favorite: [
      ...untouched(saved.favorite),
      ...list.filter((item) => item.favorite).map((item) => item.id),
    ],
    deleted: [...new Set([...saved.deleted, ...removed])],
  }
  selected = new Set(
    list.filter((item) => item.selected).map((item) => item.id),
  )
  persist(userId, saved)
  emit()
}

function useSnapshot() {
  return useSyncExternalStore(
    subscribe,
    () => snapshot,
    () => emptySnapshot,
  )
}

export function useNotificationStore() {
  const authUser = useAuthUser()
  const current = useSnapshot()

  // Nothing from a previous login is shown while the new user's list loads.
  const notifications =
    authUser && current.userId === authUser.id ? current.notifications : []

  return {
    notifications,
    setNotifications: updateNotifications,
  }
}

/** Whether the logged-in user wants reminders about unfinished quizzes. */
export function useQuizReminders() {
  const authUser = useAuthUser()
  const current = useSnapshot()
  if (!authUser) return true
  return current.userId === authUser.id
    ? current.remindersOn
    : loadSaved(authUser.id).remindersOn
}

const relativeTime = new Intl.RelativeTimeFormat('fi-FI', { numeric: 'auto' })
const DAY_MS = 24 * 60 * 60 * 1000

/** "5 minuuttia sitten", "eilen" and so on; the date itself after a week. */
export function formatNotificationTime(iso: string) {
  const then = new Date(iso)
  const now = new Date()
  const minutes = Math.floor((now.getTime() - then.getTime()) / 60000)

  if (minutes < 1) return 'juuri nyt'
  if (minutes < 60) return relativeTime.format(-minutes, 'minute')

  // Whole calendar days, so "eilen" always means the previous date.
  const startOfDay = (date: Date) =>
    new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()
  const days = Math.round((startOfDay(now) - startOfDay(then)) / DAY_MS)

  if (days === 0) return relativeTime.format(-Math.floor(minutes / 60), 'hour')
  if (days < 7) return relativeTime.format(-days, 'day')
  return then.toLocaleDateString('fi-FI')
}
