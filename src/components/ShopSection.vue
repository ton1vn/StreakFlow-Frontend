<template>
  <section class="shop-card">
    <div class="section-header">
      <div>
        <p class="eyebrow">Shop</p>
        <h2>Boosts kaufen</h2>
        <p class="section-description">
          Setze deine verdienten Coins ein, um XP schneller aufzubauen oder deine Streak abzusichern.
        </p>
      </div>

      <div class="wallet">
        <span>Coins</span>
        <strong>{{ progress.coins }}</strong>
      </div>
    </div>

    <p v-if="message" class="shop-message">{{ message }}</p>
    <p v-if="error" class="shop-message error">{{ error }}</p>

    <div class="shop-grid">
      <article v-for="item in items" :key="item.id" class="shop-item">
        <div>
          <span class="item-tag">{{ item.cost }} Coins</span>
          <h3>{{ item.name }}</h3>
          <p>{{ item.description }}</p>
        </div>

        <button
          class="buy-button"
          type="button"
          :disabled="buyingId === item.id || progress.coins < item.cost"
          @click="buyItem(item)"
        >
          {{ progress.coins < item.cost ? 'Zu wenig Coins' : buyingId === item.id ? 'Kauft ...' : 'Kaufen' }}
        </button>
      </article>
    </div>

    <div class="inventory">
      <div>
        <span>Verfügbare XP Boosts</span>
        <strong>{{ progress.availableXpBoosts }}</strong>
        <button
          class="use-button"
          type="button"
          :disabled="usingBoost || !nextAvailableBoost"
          @click="useXpBoost"
        >
          {{ usingBoost ? 'Aktiviert ...' : nextAvailableBoost ? 'XP Boost aktivieren' : 'Kein Boost verfügbar' }}
        </button>
        <p v-if="progress.activeXpBoosts > 0" class="inventory-note">
          Aktiv bis {{ formattedBoostExpiry }}
        </p>
      </div>

      <div>
        <span>StreakFreezer</span>
        <strong>{{ progress.streakFreezers }}</strong>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

interface Progress {
  coins: number
  streakFreezers: number
  activeXpBoosts: number
  availableXpBoosts: number
  activeXpBoostExpiresAt: string | null
}

interface ShopItem {
  id: string
  name: string
  cost: number
  description: string
}

interface ShopPurchase {
  id: number
  itemId: string
  itemName: string
  cost: number
  purchasedAt: string
  usedAt: string | null
  expiresAt: string | null
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'https://streakflow-backend-k8hh.onrender.com'

const fallbackItems: ShopItem[] = [
  {
    id: 'xp-boost',
    name: 'XP Boost',
    cost: 30,
    description: 'Verdoppelt 24 Stunden lang die XP aller bestätigten Übungen.',
  },
  {
    id: 'streak-freeze',
    name: 'StreakFreeze',
    cost: 50,
    description: 'Schützt deine Streak, wenn du einen Tag verpasst.',
  },
]

const items = ref<ShopItem[]>(fallbackItems)
const progress = ref<Progress>({
  coins: 0,
  streakFreezers: 0,
  activeXpBoosts: 0,
  availableXpBoosts: 0,
  activeXpBoostExpiresAt: null,
})
const purchases = ref<ShopPurchase[]>([])
const buyingId = ref<string | null>(null)
const usingBoost = ref(false)
const message = ref('')
const error = ref('')

const nextAvailableBoost = computed(() => {
  return purchases.value.find((purchase) => purchase.itemId === 'xp-boost' && !purchase.usedAt) ?? null
})

const formattedBoostExpiry = computed(() => {
  if (!progress.value.activeXpBoostExpiresAt) {
    return ''
  }

  return new Intl.DateTimeFormat('de-DE', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(progress.value.activeXpBoostExpiresAt))
})

function notifyProgressChanged() {
  window.dispatchEvent(new Event('streakflow-progress-updated'))
}

async function loadShop() {
  error.value = ''

  await Promise.all([loadItems(), loadProgress(), loadPurchases()])
}

async function loadItems() {
  try {
    const response = await fetch(API_BASE_URL + '/shop/items')

    if (response.ok) {
      items.value = await response.json()
    }
  } catch {
    items.value = fallbackItems
  }
}

async function loadProgress() {
  try {
    const response = await fetch(API_BASE_URL + '/progress')

    if (!response.ok) {
      throw new Error('Progress: HTTP ' + response.status)
    }

    progress.value = await response.json()
  } catch (caughtError) {
    error.value = caughtError instanceof Error ? caughtError.message : 'Coins konnten nicht geladen werden.'
  }
}

async function loadPurchases() {
  try {
    const response = await fetch(API_BASE_URL + '/shop/purchases')

    if (response.ok) {
      purchases.value = await response.json()
    }
  } catch {
    purchases.value = []
  }
}

async function buyItem(item: ShopItem) {
  buyingId.value = item.id
  message.value = ''
  error.value = ''

  try {
    const response = await fetch(API_BASE_URL + '/shop/purchases', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ itemId: item.id }),
    })

    if (response.status === 409) {
      throw new Error('Du hast nicht genug Coins für ' + item.name + '.')
    }

    if (!response.ok) {
      throw new Error('HTTP ' + response.status)
    }

    message.value = item.name + ' gekauft.'
    await loadShop()
    notifyProgressChanged()
  } catch (caughtError) {
    error.value = caughtError instanceof Error ? caughtError.message : 'Kauf fehlgeschlagen.'
  } finally {
    buyingId.value = null
  }
}

async function useXpBoost() {
  if (!nextAvailableBoost.value) {
    return
  }

  usingBoost.value = true
  message.value = ''
  error.value = ''

  try {
    const response = await fetch(API_BASE_URL + '/shop/purchases/' + nextAvailableBoost.value.id + '/use', {
      method: 'POST',
    })

    if (!response.ok) {
      throw new Error('HTTP ' + response.status)
    }

    message.value = 'XP Boost ist jetzt für 24 Stunden aktiv.'
    await loadShop()
    notifyProgressChanged()
  } catch (caughtError) {
    error.value = caughtError instanceof Error ? caughtError.message : 'XP Boost konnte nicht aktiviert werden.'
  } finally {
    usingBoost.value = false
  }
}

onMounted(() => {
  loadShop()
  window.addEventListener('streakflow-progress-updated', loadShop)
})

onBeforeUnmount(() => {
  window.removeEventListener('streakflow-progress-updated', loadShop)
})
</script>

<style scoped>
.shop-card {
  width: min(1100px, 100%);
  margin: 2rem auto;
  padding: 2rem;
  border: 1px solid rgba(148, 163, 184, 0.24);
  border-radius: 28px;
  background: rgba(15, 23, 42, 0.78);
  box-shadow: 0 24px 80px rgba(0, 0, 0, 0.28);
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
  color: #facc15;
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
}

.section-description {
  max-width: 640px;
  margin-top: 0.6rem;
  color: #94a3b8;
}

.wallet {
  display: grid;
  min-width: 130px;
  padding: 1rem;
  border-radius: 20px;
  color: #f8fafc;
  background: rgba(250, 204, 21, 0.12);
  text-align: center;
}

.wallet span,
.inventory span {
  color: #cbd5e1;
  font-weight: 700;
}

.wallet strong {
  font-size: 2rem;
}

.shop-message {
  color: #bbf7d0;
  font-weight: 800;
}

.shop-message.error {
  color: #fecaca;
}

.shop-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

.shop-item {
  display: flex;
  min-height: 220px;
  flex-direction: column;
  justify-content: space-between;
  gap: 1.2rem;
  padding: 1.25rem;
  border: 1px solid rgba(148, 163, 184, 0.22);
  border-radius: 24px;
  background: rgba(30, 41, 59, 0.85);
}

.item-tag {
  display: inline-flex;
  margin-bottom: 0.8rem;
  border-radius: 999px;
  padding: 0.35rem 0.7rem;
  color: #fef3c7;
  background: rgba(250, 204, 21, 0.14);
  font-weight: 800;
}

h3 {
  margin: 0 0 0.5rem;
  color: #f8fafc;
  font-size: 1.35rem;
}

.shop-item p {
  color: #cbd5e1;
}

.buy-button {
  border: 0;
  border-radius: 999px;
  padding: 0.85rem 1rem;
  color: #052e16;
  background: linear-gradient(135deg, #fde68a, #22c55e);
  font-weight: 900;
  cursor: pointer;
}

.use-button {
  width: 100%;
  margin-top: 0.8rem;
  border: 0;
  border-radius: 999px;
  padding: 0.7rem 0.9rem;
  color: #052e16;
  background: linear-gradient(135deg, #86efac, #22c55e);
  font-weight: 900;
  cursor: pointer;
}

.buy-button:disabled,
.use-button:disabled {
  cursor: default;
  opacity: 0.58;
}

.inventory-note {
  margin: 0.45rem 0 0;
  color: #bbf7d0;
  font-size: 0.9rem;
  font-weight: 800;
}

.inventory {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  margin-top: 1rem;
}

.inventory div {
  padding: 1rem;
  border-radius: 20px;
  background: rgba(15, 23, 42, 0.72);
}

.inventory strong {
  display: block;
  color: #f8fafc;
  font-size: 1.7rem;
}

@media (max-width: 860px) {
  .section-header {
    flex-direction: column;
  }

  .shop-grid,
  .inventory {
    grid-template-columns: 1fr;
  }
}
</style>
