<template>
  <section class="dashboard-card">
    <div class="section-header">
      <div>
        <p class="eyebrow">Live-Daten aus dem Backend</p>
        <h2>Trainingsübersicht</h2>
        <p class="section-description">
          Deine Übungen werden direkt aus der Render-API geladen.
        </p>
      </div>

      <button class="refresh-button" type="button" @click="loadExercises" :disabled="loading">
        {{ loading ? 'Lädt ...' : 'Aktualisieren' }}
      </button>
    </div>

    <div v-if="loading" class="state-box">
      <div class="spinner"></div>
      <p>Übungen werden geladen ...</p>
    </div>

    <div v-else-if="error" class="state-box error-box">
      <strong>Backend konnte nicht geladen werden.</strong>
      <p>{{ error }}</p>
      <button class="refresh-button" type="button" @click="loadExercises">Erneut versuchen</button>
    </div>

    <template v-else>
      <div class="stats-grid">
        <article class="stat-card">
          <span>Übungen</span>
          <strong>{{ exercises.length }}</strong>
        </article>

        <article class="stat-card">
          <span>Zielzeit pro Tag</span>
          <strong>{{ totalTargetMinutes }} min</strong>
        </article>

        <article class="stat-card">
          <span>Top-Kategorie</span>
          <strong>{{ topCategory }}</strong>
        </article>
      </div>

      <div class="exercise-grid">
        <article v-for="exercise in exercises" :key="exercise.id" class="exercise-card">
          <div class="exercise-card-header">
            <div class="exercise-icon">{{ exercise.name.charAt(0) }}</div>
            <div>
              <h3>{{ exercise.name }}</h3>
              <span class="category-badge">{{ exercise.category }}</span>
            </div>
          </div>

          <div class="target-row">
            <span>Tagesziel</span>
            <strong>{{ exercise.targetMinutesPerDay }} Minuten</strong>
          </div>

          <div class="progress-track">
            <div
              class="progress-fill"
              :style="{ width: `${Math.min(exercise.targetMinutesPerDay, 60) / 60 * 100}%` }"
            ></div>
          </div>
        </article>
      </div>
    </template>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

interface Exercise {
  id: number
  name: string
  category: string
  targetMinutesPerDay: number
}

const API_URL = 'https://streakflow-backend-k8hh.onrender.com/exercises'

const exercises = ref<Exercise[]>([])
const loading = ref(true)
const error = ref('')

const totalTargetMinutes = computed(() =>
  exercises.value.reduce((sum, exercise) => sum + exercise.targetMinutesPerDay, 0),
)

const topCategory = computed(() => {
  if (exercises.value.length === 0) {
    return '-'
  }

  const categoryCounts = exercises.value.reduce<Record<string, number>>((counts, exercise) => {
    counts[exercise.category] = (counts[exercise.category] ?? 0) + 1
    return counts
  }, {})

  return Object.entries(categoryCounts).sort((a, b) => b[1] - a[1])[0][0]
})

async function loadExercises() {
  loading.value = true
  error.value = ''

  try {
    const response = await fetch(API_URL)

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    exercises.value = await response.json()
  } catch (caughtError) {
    error.value = caughtError instanceof Error ? caughtError.message : 'Unbekannter Fehler'
  } finally {
    loading.value = false
  }
}

onMounted(loadExercises)
</script>

<style scoped>
.dashboard-card {
  width: min(1100px, 100%);
  margin: 0 auto;
  padding: 2rem;
  border: 1px solid rgba(148, 163, 184, 0.24);
  border-radius: 28px;
  background: rgba(15, 23, 42, 0.78);
  box-shadow: 0 24px 80px rgba(0, 0, 0, 0.34);
  backdrop-filter: blur(18px);
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
  color: #22c55e;
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

h2 {
  margin: 0;
  color: #f8fafc;
  font-size: clamp(1.8rem, 4vw, 2.7rem);
  font-weight: 850;
  letter-spacing: -0.05em;
}

.section-description {
  max-width: 620px;
  margin-top: 0.6rem;
  color: #94a3b8;
}

.refresh-button {
  border: 0;
  border-radius: 999px;
  padding: 0.8rem 1.15rem;
  color: #052e16;
  background: linear-gradient(135deg, #86efac, #22c55e);
  font-weight: 800;
  cursor: pointer;
}

.stats-grid,
.exercise-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin-top: 1.5rem;
}

.stat-card,
.exercise-card {
  padding: 1.15rem;
  border: 1px solid rgba(148, 163, 184, 0.22);
  border-radius: 24px;
  background: rgba(30, 41, 59, 0.85);
}

.stat-card span {
  color: #94a3b8;
}

.stat-card strong {
  display: block;
  color: #f8fafc;
  font-size: 1.6rem;
  font-weight: 850;
}

.exercise-card:hover {
  transform: translateY(-4px);
  border-color: rgba(34, 197, 94, 0.5);
}

.exercise-card-header {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  margin-bottom: 1.2rem;
}

.exercise-icon {
  display: grid;
  place-items: center;
  width: 46px;
  height: 46px;
  border-radius: 16px;
  color: #052e16;
  background: #86efac;
  font-weight: 900;
}

h3 {
  margin: 0 0 0.35rem;
  color: #f8fafc;
  font-weight: 800;
}

.category-badge {
  border-radius: 999px;
  padding: 0.25rem 0.6rem;
  color: #bbf7d0;
  background: rgba(34, 197, 94, 0.14);
  font-size: 0.78rem;
  font-weight: 700;
}

.target-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.7rem;
  color: #cbd5e1;
}

.target-row strong {
  color: #f8fafc;
}

.progress-track {
  overflow: hidden;
  height: 10px;
  border-radius: 999px;
  background: rgba(148, 163, 184, 0.2);
}

.progress-fill {
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, #22c55e, #bef264);
}

.state-box {
  display: grid;
  place-items: center;
  min-height: 220px;
  color: #cbd5e1;
}

.error-box {
  color: #fecaca;
}

.spinner {
  width: 42px;
  height: 42px;
  border: 4px solid rgba(148, 163, 184, 0.28);
  border-top-color: #22c55e;
  border-radius: 999px;
  animation: spin 0.9s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 860px) {
  .section-header {
    flex-direction: column;
  }

  .stats-grid,
  .exercise-grid {
    grid-template-columns: 1fr;
  }
}
</style>
