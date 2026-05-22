<script setup lang="ts">
import StreakList from './components/StreakList.vue'
</script>

<template>
  <main class="app-shell">
    <section class="hero">
      <p class="hero-badge">StreakFlow</p>
      <h1>Baue Fitness-Gewohnheiten auf, die bleiben.</h1>
      <p>
        Tracke Übungen, Tagesziele und Fortschritt in einer klaren Übersicht.
      </p>
    </section>

    <StreakList />
  </main>
</template>

<style scoped>
.app-shell {
  width: min(1180px, 100%);
  margin: 0 auto;
  padding: 4rem 1.25rem;
}

.hero {
  margin-bottom: 2rem;
}

.hero-badge {
  color: #22c55e;
  font-weight: 800;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

h1 {
  max-width: 800px;
  margin: 0.5rem 0 1rem;
  color: #f8fafc;
  font-size: clamp(2.4rem, 7vw, 5.4rem);
  font-weight: 900;
  line-height: 0.95;
  letter-spacing: -0.08em;
}

.hero p:last-child {
  max-width: 620px;
  color: #94a3b8;
  font-size: 1.1rem;
}
</style>
