<template>
  <section class="team-card" data-testid="team-challenge">
    <div class="section-header">
      <div>
        <p class="eyebrow">Multiplayer</p>
        <h2>Team-Challenge</h2>
        <p class="section-description">
          Bis zu vier Spieler sammeln gemeinsam Minuten, XP und Coins fuer eine Tages-Challenge.
        </p>
      </div>

      <div class="team-count" data-testid="team-count">
        <span>Spieler</span>
        <strong>{{ players.length }} / 4</strong>
      </div>
    </div>

    <form class="player-form" @submit.prevent="addPlayer">
      <label>
        Name
        <input v-model.trim="newPlayerName" type="text" placeholder="z. B. Linh" :disabled="players.length >= 4" />
      </label>

      <button class="add-button" type="submit" :disabled="players.length >= 4 || newPlayerName.length === 0">
        {{ players.length >= 4 ? 'Team voll' : 'Spieler hinzufügen' }}
      </button>
    </form>

    <div class="team-grid">
      <article v-for="player in players" :key="player.id" class="player-card" data-testid="player-card">
        <div>
          <h3>{{ player.name }}</h3>
          <p>{{ player.minutes }} Minuten · {{ player.xp }} XP · {{ player.coins }} Coins</p>
        </div>

        <div class="player-actions">
          <button type="button" @click="completeTeamWorkout(player.id)">+ Workout</button>
          <button class="remove-button" type="button" @click="removePlayer(player.id)">Entfernen</button>
        </div>
      </article>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'

interface Player {
  id: number
  name: string
  minutes: number
  xp: number
  coins: number
}

const players = ref<Player[]>([
  { id: 1, name: 'Player 1', minutes: 90, xp: 900, coins: 9 },
  { id: 2, name: 'Player 2', minutes: 45, xp: 450, coins: 4 },
])
const newPlayerName = ref('')
let nextPlayerId = 3

function addPlayer() {
  if (players.value.length >= 4 || newPlayerName.value.length === 0) {
    return
  }

  players.value = [
    ...players.value,
    {
      id: nextPlayerId,
      name: newPlayerName.value,
      minutes: 0,
      xp: 0,
      coins: 0,
    },
  ]
  nextPlayerId += 1
  newPlayerName.value = ''
}

function completeTeamWorkout(playerId: number) {
  players.value = players.value.map((player) => {
    if (player.id !== playerId) {
      return player
    }

    return {
      ...player,
      minutes: player.minutes + 30,
      xp: player.xp + 300,
      coins: player.coins + 3,
    }
  })
}

function removePlayer(playerId: number) {
  players.value = players.value.filter((player) => player.id !== playerId)
}
</script>

<style scoped>
.team-card {
  width: min(1100px, 100%);
  margin: 2rem auto;
  padding: 2rem;
  border: 1px solid rgba(148, 163, 184, 0.24);
  border-radius: 28px;
  background: rgba(15, 23, 42, 0.78);
  box-shadow: 0 24px 80px rgba(0, 0, 0, 0.28);
}

.section-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}

.eyebrow {
  margin-bottom: 0.4rem;
  color: #38bdf8;
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

h2,
h3 {
  margin: 0;
  color: #f8fafc;
}

h2 {
  font-size: clamp(1.8rem, 4vw, 2.7rem);
  font-weight: 850;
}

.section-description,
.player-card p,
.team-count span {
  color: #94a3b8;
}

.team-count {
  display: grid;
  min-width: 130px;
  padding: 1rem;
  border-radius: 20px;
  background: rgba(56, 189, 248, 0.12);
  text-align: center;
}

.team-count strong {
  color: #f8fafc;
  font-size: 1.8rem;
}

.player-form {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 1rem;
  align-items: end;
  margin-bottom: 1rem;
}

.player-form label {
  display: grid;
  gap: 0.45rem;
  color: #cbd5e1;
  font-weight: 700;
}

.player-form input {
  width: 100%;
  border: 1px solid rgba(148, 163, 184, 0.32);
  border-radius: 14px;
  padding: 0.78rem 0.9rem;
  color: #f8fafc;
  background: rgba(15, 23, 42, 0.88);
  font: inherit;
}

.team-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

.player-card {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  padding: 1rem;
  border: 1px solid rgba(148, 163, 184, 0.22);
  border-radius: 22px;
  background: rgba(30, 41, 59, 0.82);
}

.player-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 0.6rem;
}

.add-button,
.player-actions button {
  border: 0;
  border-radius: 999px;
  padding: 0.75rem 1rem;
  color: #052e16;
  background: linear-gradient(135deg, #86efac, #22c55e);
  font-weight: 900;
  cursor: pointer;
}

.remove-button {
  color: #fecaca !important;
  background: rgba(127, 29, 29, 0.4) !important;
}

button:disabled,
input:disabled {
  cursor: default;
  opacity: 0.58;
}

@media (max-width: 860px) {
  .section-header,
  .player-card {
    display: grid;
  }

  .player-form,
  .team-grid {
    grid-template-columns: 1fr;
  }

  .player-actions {
    justify-content: flex-start;
  }
}
</style>
