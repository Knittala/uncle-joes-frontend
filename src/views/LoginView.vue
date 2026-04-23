<template>
  <div class="login">
    <h1>Coffee Club Login</h1>
    <div v-if="error" class="error">{{ error }}</div>
    <div class="login-form">
      <div class="form-group">
        <label>Email</label>
        <input 
          v-model="email" 
          type="email" 
          placeholder="Enter your email"
        />
      </div>
      <div class="form-group">
        <label>Password</label>
        <input 
          v-model="password" 
          type="password" 
          placeholder="Enter your password"
        />
      </div>
      <button :disabled="loading" @click="login">
        {{ loading ? 'Logging in...' : 'Login' }}
      </button>
    </div>
  </div>
</template>

<script>
import BASE_URL from '../api.js';

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
    async login() {
      this.loading = true;
      this.error = null;
      try {
        const response = await fetch(`${BASE_URL}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: this.email, password: this.password })
        });
        if (!response.ok) throw new Error('Invalid email or password');
        const data = await response.json();
        localStorage.setItem('member', JSON.stringify(data));
        this.$router.push('/menu');
      } catch (e) {
        this.error = e.message;
      } finally {
        this.loading = false;
      }
    }
  }
};
</script>
