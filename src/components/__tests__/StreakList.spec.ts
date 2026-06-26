import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'

import StreakList from '../StreakList.vue'
import { flushPromises, installFetchMock } from './test-utils'

describe('StreakList', () => {
  beforeEach(() => {
    installFetchMock()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('lädt Übungen aus dem Backend', async () => {
    const wrapper = mount(StreakList)
    await flushPromises()

    expect(wrapper.text()).toContain('Joggen')
    expect(wrapper.text()).toContain('Muay Thai')
  })

  it('rendert Übungskarten und absolvierte Workouts', async () => {
    const wrapper = mount(StreakList)
    await flushPromises()

    expect(wrapper.findAll('[data-testid="exercise-card"]')).toHaveLength(2)
    expect(wrapper.find('[data-testid="execution-list"]').text()).toContain('Muay Thai')
  })

  it('zeigt den Loading-State', () => {
    vi.stubGlobal('fetch', vi.fn(() => new Promise(() => undefined)))
    const wrapper = mount(StreakList)

    expect(wrapper.find('[data-testid="loading-state"]').text()).toContain('Übungen werden geladen')
  })

  it('ruft beim Workout-Abschluss die API auf', async () => {
    const fetchMock = installFetchMock()
    const wrapper = mount(StreakList)
    await flushPromises()

    await wrapper.find('[data-testid="complete-workout-button"]').trigger('click')
    await flushPromises()

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/executions'),
      expect.objectContaining({ method: 'POST' }),
    )
  })
})
