<template>
  <section class="page">
    <div class="page-header">
      <h1>Welcome back, {{ user.first_name }}</h1>
      <p class="page-subhead">Your Coffee Club dashboard.</p>
    </div>

    <div class="account-grid">
      <div class="account-card">
        <div class="account-card-label">Email</div>
        <div class="account-card-value">{{ user.email }}</div>
      </div>
      <div class="account-card">
        <div class="account-card-label">Home store</div>
        <div class="account-card-value" v-if="user.home_store">{{ user.home_store }}</div>
        <div class="account-card-value account-card-muted" v-else>Not set</div>
      </div>
      <div class="account-card">
        <div class="account-card-label">Member ID</div>
        <div class="account-card-value account-card-muted">{{ user.id || user.member_id }}</div>
      </div>
    </div>

    <div class="account-links">
      <router-link to="/points" class="account-link">
        <div class="account-link-title">Loyalty points</div>
        <div class="account-link-sub">See your total balance and recent activity.</div>
      </router-link>
      <router-link to="/orders" class="account-link">
        <div class="account-link-title">Order history</div>
        <div class="account-link-sub">Review every order you've ever placed.</div>
      </router-link>
      <router-link to="/menu" class="account-link account-link-accent">
        <div class="account-link-title">Place a new order</div>
        <div class="account-link-sub">Browse the menu and earn more points.</div>
      </router-link>
    </div>

    <div class="account-actions">
      <button type="button" class="btn btn-ghost" @click="signOut">Sign out</button>
    </div>
  </section>
</template>

<script>
import { auth } from '../stores/auth';

export default {
  name: 'AccountView',
  computed: {
    user() { return auth.user || {}; }
  },
  methods: {
    signOut() {
      auth.clear();
      this.$router.push('/');
    }
  }
};
</script>

<style scoped>
.account-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}
.account-card {
  background: var(--color-cream-100);
  border: 1px solid var(--color-cream-200);
  border-radius: var(--radius-md);
  padding: 1.25rem;
}
.account-card-label {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: var(--color-coffee-600);
  margin-bottom: 0.4rem;
  font-weight: 600;
}
.account-card-value {
  font-size: 1.05rem;
  color: var(--color-coffee-900);
  word-break: break-word;
}
.account-card-muted {
  font-family: ui-monospace, "SF Mono", Menlo, monospace;
  font-size: 0.85rem;
  color: var(--color-coffee-600);
}
.account-links {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}
.account-link {
  display: block;
  background: var(--color-cream-50);
  border: 1px solid var(--color-cream-200);
  border-radius: var(--radius-md);
  padding: 1.5rem;
  color: var(--color-coffee-900);
  transition: border-color 0.15s ease, transform 0.15s ease, box-shadow 0.15s ease;
}
.account-link:hover {
  border-color: var(--color-coffee-500);
  transform: translateY(-2px);
  box-shadow: var(--shadow-sm);
  color: var(--color-coffee-900);
}
.account-link-accent {
  background: var(--color-sage-100);
  border-color: var(--color-sage-300);
}
.account-link-title {
  font-family: var(--font-display);
  font-size: 1.15rem;
  color: var(--color-coffee-900);
  font-weight: 600;
  margin-bottom: 0.25rem;
}
.account-link-sub {
  color: var(--color-coffee-700);
  font-size: 0.92rem;
}
.account-actions { display: flex; gap: 1rem; }
</style>
