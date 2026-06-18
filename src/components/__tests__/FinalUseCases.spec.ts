import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'

import App from '../../App.vue'
import ProgressDashboard from '../ProgressDashboard.vue'
import StreakList from '../StreakList.vue'

const progress = {
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

const exercises = [
  { id: 1, name: 'Joggen', category: 'Cardio', targetMinutesPerDay: 30 },
  { id: 2, name: 'Muay Thai', category: 'Kampfsport', targetMinutesPerDay: 90 },
]

const executions = [
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

const shopItems = [
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

async function flushPromises() {
  await Promise.resolve()
  await nextTick()
  await Promise.resolve()
  await nextTick()
}

function installFetchMock() {
  const fetchMock = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
    const url = input.toString()

    if (init?.method === 'POST' && url.includes('/executions')) {
      return jsonResponse({ ...executions[0], id: 2 }, true, 201)
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

describe('finale Use-Cases', () => {
  beforeEach(() => {
    installFetchMock()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('App zeigt StreakFlow Titel', () => {
    const wrapper = mount(App)

    expect(wrapper.text()).toContain('StreakFlow')
  })

  it('ProgressDashboard wird angezeigt', async () => {
    const wrapper = mount(ProgressDashboard)
    await flushPromises()

    expect(wrapper.find('[data-testid="progress-dashboard"]').exists()).toBe(true)
  })

  it('Streak-Wert wird angezeigt', async () => {
    const wrapper = mount(ProgressDashboard)
    await flushPromises()

    expect(wrapper.find('[data-testid="current-streak"]').text()).toContain('10 Day Streak')
  })

  it('XP-Wert wird angezeigt', async () => {
    const wrapper = mount(ProgressDashboard)
    await flushPromises()

    expect(wrapper.find('[data-testid="xp-value"]').text()).toContain('9000 XP')
  })

  it('Coins werden angezeigt', async () => {
    const wrapper = mount(ProgressDashboard)
    await flushPromises()

    expect(wrapper.find('[data-testid="coins-card"]').text()).toContain('90')
  })

  it('Freezer werden angezeigt', async () => {
    const wrapper = mount(ProgressDashboard)
    await flushPromises()

    expect(wrapper.find('[data-testid="freezer-card"]').text()).toContain('2')
  })

  it('StreakList lädt Übungen', async () => {
    const wrapper = mount(StreakList)
    await flushPromises()

    expect(wrapper.text()).toContain('Joggen')
    expect(wrapper.text()).toContain('Muay Thai')
  })

  it('Übungskarten werden gerendert', async () => {
    const wrapper = mount(StreakList)
    await flushPromises()

    expect(wrapper.findAll('[data-testid="exercise-card"]')).toHaveLength(2)
  })

  it('Loading-State erscheint', () => {
    vi.stubGlobal('fetch', vi.fn(() => new Promise(() => undefined)))
    const wrapper = mount(StreakList)

    expect(wrapper.find('[data-testid="loading-state"]').text()).toContain('Übungen werden geladen')
  })

  it('Klick auf Workout abschließen ruft API auf', async () => {
    const fetchMock = installFetchMock()
    const wrapper = mount(StreakList)
    await flushPromises()

    await wrapper.find('[data-testid="complete-workout-button"]').trigger('click')
    await flushPromises()

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/executions'),
      expect.objectContaining({
        method: 'POST',
      }),
    )
  })
})
