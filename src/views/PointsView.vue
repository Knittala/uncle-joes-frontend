<template>
  <section class="page page-narrow">
    <div class="page-header">
      <h1>Loyalty points</h1>
      <p class="page-subhead">One point for every whole dollar spent. No tiers, no expirations.</p>
    </div>

    <div v-if="loading" class="status-note">Loading your points...</div>
    <div v-else-if="error" class="status-note status-error">{{ error }}</div>
    <div v-else>
      <div class="points-hero">
        <div class="points-hero-label">Your Coffee Club balance</div>
        <div class="points-hero-value">{{ formatNumber(summary.total_points) }}</div>
        <div class="points-hero-unit">points</div>
      </div>

      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-label">Orders placed</div>
          <div class="stat-value">{{ formatNumber(summary.order_count) }}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Lifetime spend</div>
          <div class="stat-value">${{ formatPrice(summary.lifetime_spend) }}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Avg. points / order</div>
          <div class="stat-value">
            {{ summary.order_count ? formatPrice(summary.total_points / summary.order_count) : '0' }}
          </div>
        </div>
      </div>

      <div class="points-cta">
        <router-link to="/menu" class="btn btn-primary">Earn more points</router-link>
        <router-link to="/orders" class="btn btn-ghost">View order history</router-link>
      </div>
    </div>
  </section>
</template>

<script>
import { fetchJSON } from '../api.js';
import { auth } from '../stores/auth';

export default {
  name: 'PointsView',
  data() {
    return {
      summary: { total_points: 0, order_count: 0, lifetime_spend: 0 },
      loading: true,
      error: null
    };
  },
  async mounted() {
    if (!auth.user) {
      this.error = 'Please sign in to view your points.';
      this.loading = false;
      return;
    }
    try {
      this.summary = await fetchJSON(`/members/${encodeURIComponent(auth.user.member_id)}/points`);
    } catch (e) {
      this.error = e.message;
    } finally {
      this.loading = false;
    }
  },
  methods: {
    formatPrice(n) { return Number(n || 0).toFixed(2); },
    formatNumber(n) { return new Intl.NumberFormat().format(Number(n || 0)); }
  }
};
</script>

<style scoped>
.points-hero {
  background: linear-gradient(135deg, var(--color-coffee-800) 0%, var(--color-coffee-900) 100%);
  color: var(--color-cream-50);
  border-radius: var(--radius-lg);
  padding: 3rem 2rem;
  text-align: center;
  box-shadow: var(--shadow-lg);
  margin-bottom: 2rem;
}
.points-hero-label {
  color: var(--color-sage-300);
  text-transform: uppercase;
  letter-spacing: 0.14em;
  font-size: 0.75rem;
  font-weight: 600;
  margin-bottom: 1rem;
}
.points-hero-value {
  font-family: var(--font-display);
  font-size: 5rem;
  font-weight: 700;
  line-height: 1;
  color: var(--color-cream-50);
}
.points-hero-unit {
  color: var(--color-cream-300);
  font-size: 1rem;
  margin-top: 0.5rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin-bottom: 2rem;
}
@media (max-width: 520px) { .stats-grid { grid-template-columns: 1fr; } }
.stat-card {
  background: var(--color-cream-100);
  border: 1px solid var(--color-cream-200);
  border-radius: var(--radius-md);
  padding: 1.25rem;
  text-align: center;
}
.stat-label {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--color-coffee-600);
  font-weight: 600;
  margin-bottom: 0.5rem;
}
.stat-value {
  font-family: var(--font-display);
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-coffee-900);
}
.points-cta {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
}
</style>
