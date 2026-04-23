<template>
  <div>
    <section class="hero">
      <div class="hero-inner">
        <div class="hero-copy">
          <p class="hero-eyebrow">Neighborhood coffee, done right.</p>
          <h1>Good coffee.<br />Good people.<br />Good mornings.</h1>
          <p class="hero-lede">
            Nearly 500 neighborhood cafés across the upper Midwest, one simple menu,
            and a Coffee Club that quietly rewards you for showing up.
          </p>
          <div class="hero-actions">
            <router-link to="/menu" class="btn btn-primary">Browse the menu</router-link>
            <router-link to="/locations" class="btn btn-secondary">Find a café</router-link>
          </div>
        </div>
        <div class="hero-card">
          <div class="hero-card-inner">
            <div class="hero-card-label">Coffee Club member?</div>
            <div class="hero-card-title">Track your points, see your past orders.</div>
            <router-link v-if="!user" to="/login" class="btn btn-accent">Sign in</router-link>
            <router-link v-else to="/account" class="btn btn-accent">Go to my account</router-link>
          </div>
        </div>
      </div>
    </section>

    <section class="features">
      <div class="features-inner">
        <div class="feature-card">
          <div class="feature-title">Simple menu</div>
          <p>Coffee, espresso, tea, and the classics. No gimmicks, no surprises.</p>
          <router-link to="/menu" class="btn-text">See the menu</router-link>
        </div>
        <div class="feature-card feature-card-alt">
          <div class="feature-title">A café near you</div>
          <p>Hundreds of locations across Michigan, Wisconsin, Minnesota, and beyond.</p>
          <router-link to="/locations" class="btn-text">Find one</router-link>
        </div>
        <div class="feature-card">
          <div class="feature-title">Earn points, keep it simple</div>
          <p>One point for every whole dollar spent. That's it. No tiers, no expirations.</p>
          <router-link to="/login" class="btn-text" v-if="!user">Join the Club</router-link>
          <router-link to="/points" class="btn-text" v-else>View my points</router-link>
        </div>
      </div>
    </section>
  </div>
</template>

<script>
import { auth } from '../stores/auth';

export default {
  name: 'HomeView',
  computed: {
    user() { return auth.user; }
  }
};
</script>

<style scoped>
.hero {
  background: linear-gradient(180deg, var(--color-cream-100) 0%, var(--color-cream-50) 100%);
  padding: 5rem 1.5rem 4rem;
  position: relative;
  overflow: hidden;
}
.hero::before {
  content: "";
  position: absolute;
  top: -10%;
  right: -10%;
  width: 40vw;
  max-width: 500px;
  aspect-ratio: 1;
  background: radial-gradient(circle, var(--color-sage-100) 0%, transparent 70%);
  opacity: 0.8;
  pointer-events: none;
}
.hero-inner {
  max-width: 1200px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1.5fr 1fr;
  gap: 3rem;
  align-items: center;
  position: relative;
}
.hero-eyebrow {
  color: var(--color-sage-700);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  font-size: 0.85rem;
  margin-bottom: 1rem;
}
.hero h1 {
  font-size: clamp(2.5rem, 5vw, 4rem);
  line-height: 1.05;
  margin-bottom: 1.5rem;
}
.hero-lede {
  font-size: 1.15rem;
  color: var(--color-coffee-700);
  max-width: 540px;
  margin-bottom: 2rem;
}
.hero-actions { display: flex; gap: 1rem; flex-wrap: wrap; }

.hero-card {
  background: var(--color-coffee-800);
  color: var(--color-cream-100);
  border-radius: var(--radius-lg);
  padding: 2.5rem 2rem;
  box-shadow: var(--shadow-lg);
}
.hero-card-inner { display: flex; flex-direction: column; gap: 1rem; }
.hero-card-label {
  color: var(--color-sage-300);
  text-transform: uppercase;
  letter-spacing: 0.14em;
  font-size: 0.75rem;
  font-weight: 600;
}
.hero-card-title {
  font-family: var(--font-display);
  font-size: 1.5rem;
  line-height: 1.25;
  color: var(--color-cream-50);
  margin-bottom: 0.5rem;
}

.features {
  max-width: 1200px;
  margin: 0 auto;
  padding: 3.5rem 1.5rem;
}
.features-inner {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.5rem;
}
.feature-card {
  background: var(--color-cream-100);
  border: 1px solid var(--color-cream-200);
  border-radius: var(--radius-lg);
  padding: 2rem 1.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  transition: border-color 0.15s ease, transform 0.15s ease;
}
.feature-card:hover {
  border-color: var(--color-coffee-500);
  transform: translateY(-2px);
}
.feature-card-alt { background: var(--color-sage-100); border-color: var(--color-sage-300); }
.feature-title {
  font-family: var(--font-display);
  font-size: 1.25rem;
  color: var(--color-coffee-900);
  font-weight: 600;
}
.feature-card p { color: var(--color-coffee-700); margin: 0; }

@media (max-width: 820px) {
  .hero-inner { grid-template-columns: 1fr; }
  .features-inner { grid-template-columns: 1fr; }
  .hero { padding: 3rem 1.5rem 2.5rem; }
}
</style>
