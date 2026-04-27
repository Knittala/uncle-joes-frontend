<template>
  <section class="page page-narrow">
    <div class="login-card">
      <div class="login-heading">
        <h1>Coffee Club Sign In</h1>
        <p class="page-subhead">
          Sign in to track your points and review your past orders.
        </p>
      </div>

      <form @submit.prevent="submitLogin" class="login-form">
        <div class="form-group">
          <label for="email">Email</label>
          <input
            id="email"
            type="email"
            v-model="email"
            required
            autocomplete="email"
            :disabled="loading"
          />
        </div>
        <div class="form-group">
          <label for="password">Password</label>
          <input
            id="password"
            type="password"
            v-model="password"
            required
            autocomplete="current-password"
            :disabled="loading"
          />
        </div>

        <div v-if="error" class="status-note status-error">{{ error }}</div>

        <button type="submit" class="btn btn-primary btn-block" :disabled="loading">
          <span v-if="!loading">Sign in</span>
          <span v-else>Signing in...</span>
        </button>
      </form>

      <p class="login-helper">
        For the classroom pilot, every Coffee Club member's password is
        <code>Coffee123!</code>
      </p>
    </div>
  </section>
</template>

<script>
import { fetchJSON } from '../api.js';
import { auth } from '../stores/auth';

export default {
  name: 'LoginView',
  data() {
    return {
      email: '',
      password: '',
      loading: false,
      error: null
    };
  },
  methods: {
    async submitLogin() {
      this.loading = true;
      this.error = null;
      try {
        const data = await fetchJSON('/login', {
          method: 'POST',
          body: JSON.stringify({
            email: this.email.trim(),
            password: this.password
          })
        });
        auth.setUser({
          id: data.id,
          member_id: data.id,
          first_name: data.first_name || (data.name || '').split(' ')[0] || 'Member',
          last_name: data.last_name || '',
          name: data.name || '',
          email: data.email,
          home_store: data.home_store || null
        });
        const redirect = this.$route.query.redirect;
        this.$router.push(redirect && typeof redirect === 'string' ? redirect : '/account');
      } catch (e) {
        this.error = e.message;
      } finally {
        this.loading = false;
      }
    }
  }
};
</script>

<style scoped>
.login-card {
  background: var(--color-cream-50);
  border: 1px solid var(--color-cream-200);
  border-radius: var(--radius-lg);
  padding: 2.5rem;
  box-shadow: var(--shadow-md);
}
.login-heading { margin-bottom: 1.5rem; }
.login-heading h1 { font-size: 1.75rem; margin-bottom: 0.5rem; }
.login-form { display: flex; flex-direction: column; gap: 1.25rem; margin-bottom: 1.5rem; }
.form-group { display: flex; flex-direction: column; gap: 0.4rem; }
.form-group label {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--color-coffee-700);
}
.login-helper {
  font-size: 0.85rem;
  color: var(--color-coffee-600);
  text-align: center;
  margin: 0;
}
@media (max-width: 520px) {
  .login-card { padding: 1.75rem 1.25rem; }
}
</style>
