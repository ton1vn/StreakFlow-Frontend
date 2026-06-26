import { nextTick } from 'vue'
import { vi } from 'vitest'

export const progress = {
  currentStreak: 10,
  longestStreak: 10,
  xp: 9000,
  level: 10,
  coins: 90,
  streakFreezers: 2,
  completedToday: 1,
  dailyGoal: 3,
  minutesToday: 90,
  xpToday: 900,
  activeXpBoosts: 0,
  availableXpBoosts: 1,
  activeXpBoostExpiresAt: null,
}

export const exercises = [
  { id: 1, name: 'Joggen', category: 'Cardio', targetMinutesPerDay: 30 },
  { id: 2, name: 'Muay Thai', category: 'Kampfsport', targetMinutesPerDay: 90 },
]

export const executions = [
  {
    id: 1,
    date: new Date().toISOString().slice(0, 10),
    duration: 90,
    exerciseId: 2,
    exerciseName: 'Muay Thai',
    earnedXp: 900,
    earnedCoins: 9,
  },
]

export const shopItems = [
  {
    id: 'xp-boost',
    name: 'XP Boost',
    cost: 30,
    description: 'Verdoppelt 24 Stunden lang die XP aller bestätigten Übungen.',
  },
  {
    id: 'streak-freeze',
    name: 'StreakFreeze',
    cost: 50,
    description: 'Schützt deine Streak, wenn du einen Tag verpasst.',
  },
]

function jsonResponse(body: unknown, ok = true, status = 200) {
  return Promise.resolve({
    ok,
    status,
    json: () => Promise.resolve(body),
  } as Response)
}

export async function flushPromises() {
  await Promise.resolve()
  await nextTick()
  await Promise.resolve()
  await nextTick()
}

export function installFetchMock() {
  const fetchMock = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
    const url = input.toString()

    if (init?.method === 'POST' && url.includes('/executions')) {
      return jsonResponse({ ...executions[0], id: 2 }, true, 201)
    }

    if (init?.method === 'POST' && url.includes('/shop/purchases')) {
      return jsonResponse({ id: 5, itemId: 'streak-freeze', itemName: 'StreakFreeze', cost: 50 }, true, 201)
    }

    if (url.includes('/progress')) {
      return jsonResponse(progress)
    }

    if (url.includes('/shop/items')) {
      return jsonResponse(shopItems)
    }

    if (url.includes('/shop/purchases')) {
      return jsonResponse([])
    }

    if (url.includes('/exercises')) {
      return jsonResponse(exercises)
    }

    if (url.includes('/executions')) {
      return jsonResponse(executions)
    }

    return jsonResponse({})
  })

  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}
