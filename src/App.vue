<template>
  <div class="layout">
    <header class="site-header">
      <div class="header-inner">
        <router-link to="/" class="brand">
          <span class="brand-mark">UJ</span>
          <span class="brand-text">
            <span class="brand-primary">Uncle Joe's</span>
            <span class="brand-secondary">Coffee Company</span>
          </span>
        </router-link>

        <nav class="primary-nav">
          <router-link to="/menu">Menu</router-link>
          <router-link to="/locations">Locations</router-link>
          <router-link to="/cart" class="nav-cart">
            Cart
            <span v-if="cartCount > 0" class="cart-badge">{{ cartCount }}</span>
          </router-link>
          <router-link to="/login" v-if="!user">Sign In</router-link>
          <div class="user-chip" v-else>
            <router-link to="/account" class="user-name">Hi, {{ user.first_name }}</router-link>
            <button type="button" class="btn-link" @click="signOut">Sign out</button>
          </div>
        </nav>
      </div>
    </header>

    <main class="site-main">
      <router-view />
    </main>

    <footer class="site-footer">
      <div class="footer-inner">
        <div>
          <div class="footer-heading">Uncle Joe's Coffee Company</div>
          <div class="footer-tag">Serving the upper Midwest since 1987.</div>
        </div>
        <div class="footer-links">
          <router-link to="/menu">Menu</router-link>
          <router-link to="/locations">Locations</router-link>
          <router-link to="/login" v-if="!user">Coffee Club</router-link>
          <router-link to="/account" v-else>My Account</router-link>
        </div>
        <div class="footer-legal">
          &copy; {{ year }} Uncle Joe's Coffee Company. All rights reserved.
        </div>
      </div>
    </footer>
  </div>
</template>

<script>
import { auth } from './stores/auth';
import { cart } from './stores/cart';

export default {
  name: 'App',
  data() {
    return { year: new Date().getFullYear() };
  },
  computed: {
    user() { return auth.user; },
    cartCount() { return cart.count.value; }
  },
  methods: {
    signOut() {
      auth.clear();
      this.$router.push('/');
    }
  }
};
</script>

<style>
.layout { display: flex; flex-direction: column; min-height: 100vh; }
.site-main { flex: 1; width: 100%; }

/* Header */
.site-header {
  background-color: var(--color-coffee-900);
  color: var(--color-cream-100);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}
.header-inner {
  max-width: 1200px;
  margin: 0 auto;
  padding: 1rem 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 2rem;
  flex-wrap: wrap;
}
.brand {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: var(--color-cream-100) !important;
  font-family: var(--font-display);
}
.brand:hover { color: var(--color-cream-100) !important; }
.brand-mark {
  width: 40px; height: 40px;
  border-radius: 50%;
  background: var(--color-sage-500);
  color: var(--color-cream-50);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-family: var(--font-display);
  font-size: 1rem;
  letter-spacing: 0.02em;
}
.brand-text { display: flex; flex-direction: column; line-height: 1; }
.brand-primary { font-size: 1.25rem; font-weight: 600; }
.brand-secondary {
  font-size: 0.7rem;
  font-family: var(--font-body);
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: var(--color-cream-300);
  margin-top: 0.2rem;
}
.primary-nav {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}
.primary-nav a {
  padding: 0.5rem 1rem;
  color: var(--color-cream-200);
  font-weight: 500;
  border-radius: var(--radius-sm);
  transition: background 0.15s ease, color 0.15s ease;
  position: relative;
}
.primary-nav a:hover {
  color: var(--color-cream-50);
  background: rgba(255, 255, 255, 0.05);
}
.primary-nav a.router-link-active {
  color: var(--color-cream-50);
  background: var(--color-coffee-700);
}
.nav-cart { display: inline-flex; align-items: center; gap: 0.4rem; }
.cart-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 22px;
  height: 22px;
  padding: 0 0.4rem;
  border-radius: 999px;
  background: var(--color-sage-500);
  color: var(--color-cream-50);
  font-size: 0.75rem;
  font-weight: 700;
}
.user-chip {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.5rem 0.25rem 0.25rem;
  background: var(--color-coffee-700);
  border-radius: 999px;
  color: var(--color-cream-100);
  font-size: 0.9rem;
}
.user-chip .user-name {
  color: var(--color-cream-100);
  padding: 0.35rem 0.75rem;
  border-radius: 999px;
}
.user-chip .user-name:hover { background: rgba(255, 255, 255, 0.08); color: var(--color-cream-50); }
.btn-link {
  background: none;
  border: none;
  color: var(--color-sage-300);
  font: inherit;
  cursor: pointer;
  padding: 0.25rem 0.6rem;
  border-radius: var(--radius-sm);
}
.btn-link:hover {
  color: var(--color-cream-50);
  background: rgba(255, 255, 255, 0.08);
}

/* Footer */
.site-footer {
  background: var(--color-coffee-800);
  color: var(--color-cream-200);
  padding: 2.5rem 1.5rem 1.5rem;
  margin-top: 4rem;
}
.footer-inner {
  max-width: 1200px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1.5fr 1fr;
  gap: 2rem;
}
.footer-heading {
  font-family: var(--font-display);
  font-size: 1.1rem;
  color: var(--color-cream-50);
  margin-bottom: 0.25rem;
}
.footer-tag { color: var(--color-cream-300); font-size: 0.9rem; }
.footer-links { display: flex; flex-direction: column; gap: 0.4rem; }
.footer-links a { color: var(--color-cream-200); font-size: 0.95rem; }
.footer-links a:hover { color: var(--color-cream-50); }
.footer-legal {
  grid-column: 1 / -1;
  padding-top: 1.5rem;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  color: var(--color-cream-300);
  font-size: 0.82rem;
}

@media (max-width: 820px) {
  .footer-inner { grid-template-columns: 1fr; }
  .header-inner { gap: 1rem; }
}
@media (max-width: 520px) {
  .primary-nav a { padding: 0.4rem 0.7rem; font-size: 0.9rem; }
  .brand-mark { width: 36px; height: 36px; }
  .brand-primary { font-size: 1.1rem; }
}
</style>
