import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'

import TeamChallenge from '../TeamChallenge.vue'

describe('TeamChallenge', () => {
  it('zeigt Multiplayer fuer bis zu vier Spieler', async () => {
    const wrapper = mount(TeamChallenge)

    expect(wrapper.find('[data-testid="team-count"]').text()).toContain('2 / 4')
    expect(wrapper.findAll('[data-testid="player-card"]')).toHaveLength(2)
  })

  it('erlaubt maximal vier Spieler', async () => {
    const wrapper = mount(TeamChallenge)
    const input = wrapper.find('input')

    await input.setValue('Player 3')
    await wrapper.find('form').trigger('submit')
    await input.setValue('Player 4')
    await wrapper.find('form').trigger('submit')
    await input.setValue('Player 5')
    await wrapper.find('form').trigger('submit')

    expect(wrapper.findAll('[data-testid="player-card"]')).toHaveLength(4)
    expect(wrapper.find('[data-testid="team-count"]').text()).toContain('4 / 4')
  })
})
