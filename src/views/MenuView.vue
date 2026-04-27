<template>
  <section class="page">
    <div class="page-header">
      <h1>Menu</h1>
      <p class="page-subhead">
        The full Uncle Joe's lineup. Prices, sizes, and nutrition, all in one place.
      </p>
    </div>

    <div class="toolbar">
      <div class="toolbar-group">
        <label for="filter-category">Category</label>
        <select id="filter-category" v-model="selectedCategory">
          <option value="">All categories</option>
          <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
        </select>
      </div>
      <div class="toolbar-group">
        <label for="filter-size">Size</label>
        <select id="filter-size" v-model="selectedSize">
          <option value="">All sizes</option>
          <option v-for="size in sizes" :key="size" :value="size">{{ size }}</option>
        </select>
      </div>
      <div class="toolbar-group toolbar-group-grow">
        <label for="search-menu">Search</label>
        <input id="search-menu" type="search" v-model="searchQuery" placeholder="Find an item" />
      </div>
      <button type="button" class="btn btn-ghost" @click="resetFilters" :disabled="!hasActiveFilters">
        Reset
      </button>
    </div>

    <div v-if="loading" class="status-note">Loading menu...</div>
    <div v-else-if="error" class="status-note status-error">{{ error }}</div>
    <div v-else-if="!filteredItems.length" class="status-note">No items match your filters.</div>

    <div v-else class="menu-groups">
      <div v-for="(items, category) in groupedItems" :key="category" class="menu-group">
        <h2 class="menu-group-title">{{ category }}</h2>
        <div class="menu-grid">
          <article v-for="item in items" :key="item.id" class="menu-card">
            <header class="menu-card-head">
              <h3>{{ item.name }}</h3>
              <span class="menu-price">${{ formatPrice(item.price) }}</span>
            </header>
            <div class="menu-meta">
              <span class="tag" v-if="item.size">{{ item.size }}</span>
              <span class="tag tag-muted" v-if="item.calories != null">{{ item.calories }} cal</span>
            </div>
            <button
              type="button"
              class="btn btn-secondary btn-small btn-add"
              @click="addToCart(item)"
            >
              Add to cart
            </button>
          </article>
        </div>
      </div>
    </div>

    <transition name="fade">
      <div v-if="toast" class="toast">{{ toast }}</div>
    </transition>
  </section>
</template>

<script>
import { fetchJSON } from '../api.js';
import { cart } from '../stores/cart';

const SIZE_ORDER = { Small: 1, Medium: 2, Large: 3 };

export default {
  name: 'MenuView',
  data() {
    return {
      items: [],
      loading: true,
      error: null,
      selectedCategory: '',
      selectedSize: '',
      searchQuery: '',
      toast: ''
    };
  },
  computed: {
    categories() {
      const set = new Set(this.items.map(i => i.category).filter(Boolean));
      return Array.from(set).sort();
    },
    sizes() {
      const set = new Set(this.items.map(i => i.size).filter(Boolean));
      return Array.from(set).sort((a, b) => (SIZE_ORDER[a] || 99) - (SIZE_ORDER[b] || 99));
    },
    filteredItems() {
      const q = this.searchQuery.trim().toLowerCase();
      return this.items.filter(item => {
        if (this.selectedCategory && item.category !== this.selectedCategory) return false;
        if (this.selectedSize && item.size !== this.selectedSize) return false;
        if (q && !(item.name || '').toLowerCase().includes(q)) return false;
        return true;
      });
    },
    groupedItems() {
      const groups = {};
      for (const item of this.filteredItems) {
        const cat = item.category || 'Other';
        if (!groups[cat]) groups[cat] = [];
        groups[cat].push(item);
      }
      for (const cat in groups) {
        groups[cat].sort((a, b) => {
          const n = (a.name || '').localeCompare(b.name || '');
          if (n !== 0) return n;
          return (SIZE_ORDER[a.size] || 99) - (SIZE_ORDER[b.size] || 99);
        });
      }
      return groups;
    },
    hasActiveFilters() {
      return !!(this.selectedCategory || this.selectedSize || this.searchQuery);
    }
  },
  async mounted() {
    try {
      const data = await fetchJSON('/filter/menu_items');
      this.items = Array.isArray(data) ? data : (data.results || []);
    } catch (e) {
      this.error = e.message;
    } finally {
      this.loading = false;
    }
  },
  methods: {
    resetFilters() {
      this.selectedCategory = '';
      this.selectedSize = '';
      this.searchQuery = '';
    },
    formatPrice(price) {
      if (price == null) return '—';
      return Number(price).toFixed(2);
    },
    addToCart(item) {
      cart.add(item, 1);
      this.showToast(`Added ${item.name} (${item.size}) to cart`);
    },
    showToast(msg) {
      this.toast = msg;
      clearTimeout(this._toastTimer);
      this._toastTimer = setTimeout(() => { this.toast = ''; }, 2200);
    }
  }
};
</script>

<style scoped>
.menu-groups { display: flex; flex-direction: column; gap: 3rem; }
.menu-group-title {
  font-size: 1.6rem;
  color: var(--color-coffee-800);
  padding-bottom: 0.5rem;
  border-bottom: 2px solid var(--color-cream-200);
  margin-bottom: 1.25rem;
}
.menu-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 1rem;
}
.menu-card {
  background: var(--color-cream-50);
  border: 1px solid var(--color-cream-200);
  border-radius: var(--radius-md);
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  transition: border-color 0.15s ease, transform 0.15s ease, box-shadow 0.15s ease;
}
.menu-card:hover {
  border-color: var(--color-coffee-500);
  transform: translateY(-2px);
  box-shadow: var(--shadow-sm);
}
.menu-card-head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 0.75rem;
}
.menu-card-head h3 {
  font-size: 1.05rem;
  margin: 0;
  color: var(--color-coffee-900);
}
.menu-price {
  font-family: var(--font-display);
  font-size: 1.1rem;
  color: var(--color-sage-700);
  font-weight: 600;
  white-space: nowrap;
}
.menu-meta { display: flex; flex-wrap: wrap; gap: 0.4rem; }
.btn-add { align-self: flex-start; margin-top: auto; }

.toast {
  position: fixed;
  bottom: 2rem;
  left: 50%;
  transform: translateX(-50%);
  background: var(--color-coffee-900);
  color: var(--color-cream-50);
  padding: 0.75rem 1.5rem;
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
  font-size: 0.95rem;
  z-index: 1000;
}
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
