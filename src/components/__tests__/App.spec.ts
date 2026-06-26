import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'

import App from '../../App.vue'
import { flushPromises, installFetchMock } from './test-utils'

describe('App', () => {
  beforeEach(() => {
    installFetchMock()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('zeigt den StreakFlow Titel', async () => {
    const wrapper = mount(App)
    await flushPromises()

    expect(wrapper.text()).toContain('StreakFlow')
  })

  it('zeigt die Multiplayer Team-Challenge', async () => {
    const wrapper = mount(App)
    await flushPromises()

    expect(wrapper.find('[data-testid="team-challenge"]').exists()).toBe(true)
  })
})
