import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'

import ProgressDashboard from '../ProgressDashboard.vue'
import { flushPromises, installFetchMock } from './test-utils'

describe('ProgressDashboard', () => {
  beforeEach(() => {
    installFetchMock()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('wird angezeigt', async () => {
    const wrapper = mount(ProgressDashboard)
    await flushPromises()

    expect(wrapper.find('[data-testid="progress-dashboard"]').exists()).toBe(true)
  })

  it('zeigt Streak, XP, Coins, Freezer und Daily Goal', async () => {
    const wrapper = mount(ProgressDashboard)
    await flushPromises()

    expect(wrapper.find('[data-testid="current-streak"]').text()).toContain('10 Day Streak')
    expect(wrapper.find('[data-testid="xp-value"]').text()).toContain('9000 XP')
    expect(wrapper.find('[data-testid="coins-card"]').text()).toContain('90')
    expect(wrapper.find('[data-testid="freezer-card"]').text()).toContain('2')
    expect(wrapper.find('[data-testid="daily-goal-card"]').text()).toContain('1 / 3')
  })
})
