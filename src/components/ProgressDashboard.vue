<template>
  <div class="dashboard">

    <div class="streak-card">
      <h1>🔥 {{ progress.currentStreak }} Day Streak</h1>
      <p>Longest Streak: {{ progress.longestStreak }}</p>
    </div>

    <div class="xp-card">
      <div class="xp-header">
        <span>Level {{ progress.level }}</span>
        <span>{{ progress.xp }} XP</span>
      </div>

      <div class="xp-bar">
        <div class="xp-fill" :style="{ width: xpPercent + '%' }"></div>
      </div>
    </div>

    <div class="stats-grid">

      <div class="stat-box">
        <h2>🪙 Coins</h2>
        <p>{{ progress.coins }}</p>
      </div>

      <div class="stat-box">
        <h2>❄️ Freezers</h2>
        <p>{{ progress.streakFreezers }}</p>
      </div>

      <div class="stat-box">
        <h2>✅ Daily Goal</h2>
        <p>{{ progress.completedToday }} / {{ progress.dailyGoal }}</p>
      </div>

    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

const progress = ref({
  currentStreak: 0,
  longestStreak: 0,
  xp: 0,
  level: 1,
  coins: 0,
  streakFreezers: 0,
  completedToday: 0,
  dailyGoal: 1
})

const xpPercent = computed(() => {
  return (progress.value.xp % 1000) / 10
})

onMounted(async () => {
  const response = await fetch('https://streakflow-backend-k8hh.onrender.com/progress')
  progress.value = await response.json()
})
</script>

<style scoped>

.dashboard {
  padding: 30px;
  color: white;
}

.streak-card {
  background: linear-gradient(135deg, #ff6b00, #ffb347);
  padding: 30px;
  border-radius: 20px;
  margin-bottom: 25px;
  box-shadow: 0 8px 20px rgba(255,107,0,0.4);
}

.streak-card h1 {
  font-size: 42px;
  margin: 0;
}

.xp-card {
  background: #1f1f1f;
  padding: 20px;
  border-radius: 20px;
  margin-bottom: 25px;
}

.xp-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
}

.xp-bar {
  width: 100%;
  height: 20px;
  background: #333;
  border-radius: 20px;
  overflow: hidden;
}

.xp-fill {
  height: 100%;
  background: linear-gradient(90deg, #00ff99, #00ccff);
  transition: 0.4s;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}

.stat-box {
  background: #1f1f1f;
  padding: 25px;
  border-radius: 20px;
  text-align: center;
}

.stat-box h2 {
  margin-bottom: 10px;
}

.stat-box p {
  font-size: 28px;
  font-weight: bold;
}

</style>
