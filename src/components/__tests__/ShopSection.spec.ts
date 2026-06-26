import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'

import ShopSection from '../ShopSection.vue'
import { flushPromises, installFetchMock } from './test-utils'

describe('ShopSection', () => {
  beforeEach(() => {
    installFetchMock()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('zeigt Shop Items und Coins', async () => {
    const wrapper = mount(ShopSection)
    await flushPromises()

    expect(wrapper.text()).toContain('XP Boost')
    expect(wrapper.text()).toContain('StreakFreeze')
    expect(wrapper.text()).toContain('90')
  })

  it('ruft beim Kaufen die Shop API auf', async () => {
    const fetchMock = installFetchMock()
    const wrapper = mount(ShopSection)
    await flushPromises()

    await wrapper.find('.buy-button').trigger('click')
    await flushPromises()

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/shop/purchases'),
      expect.objectContaining({ method: 'POST' }),
    )
  })
})
