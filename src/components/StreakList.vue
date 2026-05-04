<template>
  <div>
    <h2>Meine Streaks</h2>

    <ul>
      <li v-for="streak in streaks" :key="streak.id">
        {{ streak.name }} – {{ streak.count }} Tage
      </li>
    </ul>
  </div>
</template>

<script setup>
const streaks = [
  { id: 1, name: "Sport", count: 5 },
  { id: 2, name: "Lesen", count: 10 },
  { id: 3, name: "Coding", count: 3 }
]
</script>
