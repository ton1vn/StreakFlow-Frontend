<template>
  <div>
    <h2>Meine Übungen</h2>

    <ul>
      <li v-for="exercise in exercises" :key="exercise.id">
        {{ exercise.name }} – {{ exercise.category }} – {{ exercise.targetMinutesPerDay }} Minuten
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

interface Exercise {
  id: number
  name: string
  category: string
  targetMinutesPerDay: number
}

const exercises = ref<Exercise[]>([])

onMounted(async () => {
  const response = await fetch('https://streakflow-backend-k8hh.onrender.com/exercises')
  exercises.value = await response.json()
})
</script>
