<template>
  <section class="dashboard-card" data-testid="streak-list">
    <div class="section-header">
      <div>
        <p class="eyebrow">Live-Daten aus dem Backend</p>
        <h2>Trainingsübersicht</h2>
        <p class="section-description">
          Lege eigene Übungen an und bestätige sie nach dem Training, damit deine Streak weiterläuft.
        </p>
      </div>

      <button class="refresh-button" type="button" @click="loadAll" :disabled="loading">
        {{ loading ? 'Lädt ...' : 'Aktualisieren' }}
      </button>
    </div>

    <form class="exercise-form" @submit.prevent="createExercise">
      <label>
        Übung
        <input v-model.trim="newExercise.name" type="text" name="name" placeholder="z. B. Schwimmen" required />
      </label>

      <label>
        Kategorie
        <input v-model.trim="newExercise.category" type="text" name="category" placeholder="Cardio" required />
      </label>

      <label>
        Länge in Minuten
        <input
          v-model.number="newExercise.targetMinutesPerDay"
          type="number"
          name="targetMinutesPerDay"
          min="1"
          max="240"
          required
        />
      </label>

      <button class="save-button" type="submit" :disabled="saving">
        {{ saving ? 'Speichert ...' : 'Übung hinzufügen' }}
      </button>
    </form>

    <p v-if="message" class="save-message">{{ message }}</p>

    <div v-if="loading" class="state-box" data-testid="loading-state">
      <div class="spinner"></div>
      <p>Übungen werden geladen ...</p>
    </div>

    <div v-else-if="error" class="state-box error-box">
      <strong>Backend konnte nicht geladen werden.</strong>
      <p>{{ error }}</p>
      <button class="refresh-button" type="button" @click="loadAll">Erneut versuchen</button>
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

      <div v-if="exercises.length === 0" class="empty-state">
        <strong>Noch keine Übungen gespeichert.</strong>
        <p>Lege die erste Übung an, damit sie in der Datenbank landet.</p>
      </div>

      <div v-else class="exercise-grid">
        <article
          v-for="exercise in exercises"
          :key="exercise.id"
          class="exercise-card"
          data-testid="exercise-card"
          :class="{ completed: completedExerciseIds.has(exercise.id) }"
        >
          <div class="exercise-card-header">
            <div class="exercise-icon">{{ exercise.name.charAt(0) }}</div>
            <div>
              <h3>{{ exercise.name }}</h3>
              <span class="category-badge">{{ exercise.category }}</span>
            </div>
            <button
              class="delete-button"
              type="button"
              :disabled="deletingId === exercise.id"
              @click="deleteExercise(exercise)"
            >
              {{ deletingId === exercise.id ? 'Entfernt ...' : 'Entfernen' }}
            </button>
          </div>

          <div class="target-row">
            <span>Geplante Länge</span>
            <strong>{{ exercise.targetMinutesPerDay }} Minuten</strong>
          </div>

          <div class="progress-track">
            <div class="progress-fill" :style="{ width: progressWidth(exercise.targetMinutesPerDay) }"></div>
          </div>

          <div class="reward-row">
            <span>{{ exercise.targetMinutesPerDay * XP_PER_MINUTE }} XP</span>
            <span>{{ coinsFor(exercise.targetMinutesPerDay) }} Coins</span>
          </div>

          <div class="completion-row">
            <label>
              Gemacht
              <input
                v-model.number="completionMinutes[exercise.id]"
                type="number"
                min="1"
                max="240"
                :disabled="completedExerciseIds.has(exercise.id)"
              />
            </label>

            <button
              class="complete-button"
              data-testid="complete-workout-button"
              type="button"
              :disabled="completingId === exercise.id || completedExerciseIds.has(exercise.id)"
              @click="completeExercise(exercise)"
            >
              {{ completedExerciseIds.has(exercise.id) ? 'Heute erledigt' : 'Bestätigen' }}
            </button>
          </div>
        </article>
      </div>

      <section class="executions-panel" data-testid="execution-list">
        <div class="executions-header">
          <div>
            <p class="eyebrow">Ausführungen</p>
            <h3>Absolvierte Workouts</h3>
          </div>
          <span>{{ executions.length }} gesamt</span>
        </div>

        <p v-if="executions.length === 0" class="execution-empty">
          Noch keine Workouts abgeschlossen.
        </p>

        <div v-else class="execution-list">
          <article v-for="execution in sortedExecutions" :key="execution.id" class="execution-row">
            <div>
              <strong>{{ execution.exerciseName }}</strong>
              <span>{{ formatExecutionDate(execution.date) }}</span>
            </div>
            <div class="execution-rewards">
              <span>{{ execution.duration }} min</span>
              <span>{{ execution.earnedXp }} XP</span>
              <span>{{ execution.earnedCoins }} Coins</span>
            </div>
          </article>
        </div>
      </section>
    </template>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'

interface Exercise {
  id: number
  name: string
  category: string
  targetMinutesPerDay: number
}

interface ExerciseExecution {
  id: number
  date: string
  duration: number
  exerciseId: number
  exerciseName: string
  earnedXp: number
  earnedCoins: number
}

interface NewExercise {
  name: string
  category: string
  targetMinutesPerDay: number
}

const XP_PER_MINUTE = 10
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'https://streakflow-backend-k8hh.onrender.com'
const EXERCISES_URL = API_BASE_URL + '/exercises'
const EXECUTIONS_URL = API_BASE_URL + '/executions'

const exercises = ref<Exercise[]>([])
const executions = ref<ExerciseExecution[]>([])
const loading = ref(true)
const saving = ref(false)
const completingId = ref<number | null>(null)
const deletingId = ref<number | null>(null)
const error = ref('')
const message = ref('')
const completionMinutes = reactive<Record<number, number>>({})

const newExercise = reactive<NewExercise>({
  name: '',
  category: '',
  targetMinutesPerDay: 30,
})

const today = computed(() => new Date().toISOString().slice(0, 10))

const completedExerciseIds = computed(() => {
  return new Set(
    executions.value
      .filter((execution) => execution.date === today.value)
      .map((execution) => execution.exerciseId),
  )
})

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

  const sortedCategories = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1])

  return sortedCategories[0]?.[0] ?? '-'
})

const sortedExecutions = computed(() => {
  return [...executions.value].sort((a, b) => {
    if (a.date === b.date) {
      return b.id - a.id
    }

    return b.date.localeCompare(a.date)
  })
})

function coinsFor(minutes: number) {
  return Math.max(1, Math.floor(minutes / 10))
}

function progressWidth(minutes: number) {
  return Math.min(minutes, 60) / 60 * 100 + '%'
}

function notifyProgressChanged() {
  window.dispatchEvent(new Event('streakflow-progress-updated'))
}

function formatExecutionDate(date: string) {
  return new Intl.DateTimeFormat('de-DE', {
    dateStyle: 'medium',
  }).format(new Date(date + 'T12:00:00'))
}

async function loadAll() {
  loading.value = true
  error.value = ''

  try {
    await Promise.all([loadExercises(), loadExecutions()])
  } catch (caughtError) {
    error.value = caughtError instanceof Error ? caughtError.message : 'Unbekannter Fehler'
  } finally {
    loading.value = false
  }
}

async function loadExercises() {
  const response = await fetch(EXERCISES_URL)

  if (!response.ok) {
    throw new Error('Übungen: HTTP ' + response.status)
  }

  exercises.value = await response.json()
  exercises.value.forEach((exercise) => {
    completionMinutes[exercise.id] = completionMinutes[exercise.id] ?? exercise.targetMinutesPerDay
  })
}

async function loadExecutions() {
  const response = await fetch(EXECUTIONS_URL)

  if (!response.ok) {
    throw new Error('Bestätigungen: HTTP ' + response.status)
  }

  executions.value = await response.json()
}

async function createExercise() {
  saving.value = true
  message.value = ''
  error.value = ''

  try {
    const response = await fetch(EXERCISES_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(newExercise),
    })

    if (!response.ok) {
      throw new Error('HTTP ' + response.status)
    }

    const createdExercise: Exercise = await response.json()
    completionMinutes[createdExercise.id] = createdExercise.targetMinutesPerDay
    newExercise.name = ''
    newExercise.category = ''
    newExercise.targetMinutesPerDay = 30
    message.value = 'Übung wurde gespeichert.'
    await loadExercises()
  } catch (caughtError) {
    error.value = caughtError instanceof Error ? caughtError.message : 'Unbekannter Fehler'
  } finally {
    saving.value = false
  }
}

async function deleteExercise(exercise: Exercise) {
  deletingId.value = exercise.id
  message.value = ''
  error.value = ''

  try {
    const response = await fetch(EXERCISES_URL + '/' + exercise.id, {
      method: 'DELETE',
    })

    if (!response.ok) {
      throw new Error('HTTP ' + response.status)
    }

    exercises.value = exercises.value.filter((storedExercise) => storedExercise.id !== exercise.id)
    executions.value = executions.value.filter((execution) => execution.exerciseId !== exercise.id)
    delete completionMinutes[exercise.id]
    message.value = exercise.name + ' wurde entfernt.'
    notifyProgressChanged()
  } catch (caughtError) {
    error.value = caughtError instanceof Error ? caughtError.message : 'Unbekannter Fehler'
  } finally {
    deletingId.value = null
  }
}

async function completeExercise(exercise: Exercise) {
  completingId.value = exercise.id
  message.value = ''
  error.value = ''

  const duration = completionMinutes[exercise.id] || exercise.targetMinutesPerDay

  try {
    const response = await fetch(EXECUTIONS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        exerciseId: exercise.id,
        duration,
      }),
    })

    if (!response.ok) {
      throw new Error('HTTP ' + response.status)
    }

    const execution: ExerciseExecution = await response.json()
    executions.value = [...executions.value, execution]
    message.value = exercise.name + ' bestätigt: +' + execution.earnedXp + ' XP, +' + execution.earnedCoins + ' Coins.'
    notifyProgressChanged()
  } catch (caughtError) {
    error.value = caughtError instanceof Error ? caughtError.message : 'Unbekannter Fehler'
  } finally {
    completingId.value = null
  }
}

onMounted(loadAll)
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
  max-width: 640px;
  margin-top: 0.6rem;
  color: #94a3b8;
}

.exercise-form {
  display: grid;
  grid-template-columns: 1.4fr 1fr 0.8fr auto;
  gap: 1rem;
  align-items: end;
  padding: 1rem;
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 22px;
  background: rgba(30, 41, 59, 0.64);
}

.exercise-form label,
.completion-row label {
  display: grid;
  gap: 0.45rem;
  color: #cbd5e1;
  font-size: 0.86rem;
  font-weight: 700;
}

.exercise-form input,
.completion-row input {
  width: 100%;
  border: 1px solid rgba(148, 163, 184, 0.32);
  border-radius: 14px;
  padding: 0.78rem 0.9rem;
  color: #f8fafc;
  background: rgba(15, 23, 42, 0.88);
  font: inherit;
}

.exercise-form input:focus,
.completion-row input:focus {
  outline: 2px solid rgba(34, 197, 94, 0.45);
  border-color: rgba(34, 197, 94, 0.8);
}

.refresh-button,
.save-button,
.complete-button {
  border: 0;
  border-radius: 999px;
  padding: 0.8rem 1.15rem;
  color: #052e16;
  background: linear-gradient(135deg, #86efac, #22c55e);
  font-weight: 800;
  cursor: pointer;
}

.complete-button {
  min-width: 136px;
}

.delete-button {
  margin-left: auto;
  border: 1px solid rgba(248, 113, 113, 0.32);
  border-radius: 999px;
  padding: 0.6rem 0.85rem;
  color: #fecaca;
  background: rgba(127, 29, 29, 0.28);
  font-weight: 800;
  cursor: pointer;
}

.refresh-button:disabled,
.save-button:disabled,
.complete-button:disabled,
.delete-button:disabled {
  cursor: default;
  opacity: 0.68;
}

.save-message {
  margin: 0.9rem 0 0;
  color: #bbf7d0;
  font-weight: 700;
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

.exercise-card.completed {
  border-color: rgba(134, 239, 172, 0.65);
  background: rgba(20, 83, 45, 0.4);
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

.empty-state {
  margin-top: 1.5rem;
  padding: 1.4rem;
  border: 1px dashed rgba(148, 163, 184, 0.36);
  border-radius: 22px;
  color: #cbd5e1;
  text-align: center;
}

.empty-state strong {
  color: #f8fafc;
}

.executions-panel {
  margin-top: 1.5rem;
  padding: 1.15rem;
  border: 1px solid rgba(148, 163, 184, 0.22);
  border-radius: 24px;
  background: rgba(15, 23, 42, 0.55);
}

.executions-header {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: flex-start;
}

.executions-header h3 {
  margin: 0;
  color: #f8fafc;
  font-size: 1.25rem;
}

.executions-header span,
.execution-empty {
  color: #94a3b8;
  font-weight: 700;
}

.execution-list {
  display: grid;
  gap: 0.75rem;
  margin-top: 1rem;
}

.execution-row {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.9rem;
  border-radius: 18px;
  background: rgba(30, 41, 59, 0.72);
}

.execution-row strong {
  display: block;
  color: #f8fafc;
}

.execution-row span {
  color: #cbd5e1;
}

.execution-rewards {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 0.5rem;
  font-weight: 800;
}

.execution-rewards span {
  padding: 0.3rem 0.55rem;
  border-radius: 999px;
  background: rgba(34, 197, 94, 0.16);
  color: #bbf7d0;
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

.target-row,
.reward-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.7rem;
  color: #cbd5e1;
}

.reward-row {
  margin-top: 0.75rem;
  color: #bbf7d0;
  font-size: 0.9rem;
  font-weight: 800;
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

.completion-row {
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: end;
  gap: 0.75rem;
  margin-top: 1rem;
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

@media (max-width: 960px) {
  .exercise-form,
  .completion-row {
    grid-template-columns: 1fr 1fr;
  }

  .save-button {
    grid-column: 1 / -1;
  }
}

@media (max-width: 860px) {
  .section-header {
    flex-direction: column;
  }

  .stats-grid,
  .exercise-grid,
  .exercise-form,
  .completion-row {
    grid-template-columns: 1fr;
  }

  .exercise-card-header {
    align-items: flex-start;
  }

  .delete-button {
    margin-left: 0;
  }

  .execution-row {
    display: grid;
  }

  .execution-rewards {
    justify-content: flex-start;
  }
}
</style>
