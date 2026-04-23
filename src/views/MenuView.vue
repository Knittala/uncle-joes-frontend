<template>
  <div class="menu">
    <h1>Our Menu</h1>
    <div v-if="loading">Loading menu...</div>
    <div v-else-if="error">{{ error }}</div>
    <div v-else class="menu-grid">
      <div v-for="item in menuItems" :key="item.id" class="menu-card">
        <h3>{{ item.name }}</h3>
        <p>{{ item.category }} — {{ item.size }}</p>
        <p>{{ item.calories }} cal</p>
        <p>${{ item.price }}</p>
      </div>
    </div>
  </div>
</template>

<script>
import BASE_URL from '../api.js';

export default {
  name: 'MenuView',
  data() {
    return {
      menuItems: [],
      loading: true,
      error: null
    };
  },
  async mounted() {
    try {
      const response = await fetch(`${BASE_URL}/menu`);
      if (!response.ok) throw new Error('Failed to fetch menu');
      this.menuItems = await response.json();
    } catch (e) {
      this.error = e.message;
    } finally {
      this.loading = false;
    }
  }
};
</script>
