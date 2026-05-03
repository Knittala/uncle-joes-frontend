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

    <div class="toolbar toolbar-sort">
      <div class="toolbar-group">
        <label for="sort-by">Sort by</label>
        <select id="sort-by" v-model="sortBy">
          <option v-for="opt in sortOptions" :key="opt.value" :value="opt.value">
            {{ opt.label }}
          </option>
        </select>
      </div>
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

// --- Sort config ---------------------------------------------------------
//
// To add a new sort option later: add an entry here and a matching <option>
// in the template. Each strategy is a comparator function (a, b) => number.
// Tiebreakers are baked into each strategy so order is deterministic.
//
// NaN prices are pushed to the end of price-sorted lists.
//
const DEFAULT_SORT = 'name_asc';

function priceNum(item) {
  const n = parseFloat(item.price);
  return Number.isFinite(n) ? n : NaN;
}

function compareNames(a, b) {
  return (a.name || '').localeCompare(b.name || '', undefined, { sensitivity: 'base' });
}

function compareSizes(a, b) {
  return (SIZE_ORDER[a.size] || 99) - (SIZE_ORDER[b.size] || 99);
}

function compareIds(a, b) {
  // Final tiebreaker so order is fully deterministic across renders.
  if (a.id === b.id) return 0;
  return a.id < b.id ? -1 : 1;
}

function comparePrices(a, b, direction) {
  const pa = priceNum(a);
  const pb = priceNum(b);
  // NaN always sorts to the end, regardless of direction.
  const aNaN = Number.isNaN(pa);
  const bNaN = Number.isNaN(pb);
  if (aNaN && bNaN) return 0;
  if (aNaN) return 1;
  if (bNaN) return -1;
  return direction === 'desc' ? pb - pa : pa - pb;
}

const SORT_STRATEGIES = {
  name_asc: {
    label: 'Name: A–Z',
    compare: (a, b) =>
      compareNames(a, b) ||
      compareSizes(a, b) ||
      comparePrices(a, b, 'asc') ||
      compareIds(a, b)
  },
  name_desc: {
    label: 'Name: Z–A',
    compare: (a, b) =>
      -compareNames(a, b) ||
      compareSizes(a, b) ||
      comparePrices(a, b, 'asc') ||
      compareIds(a, b)
  },
  price_asc: {
    label: 'Price: Low to High',
    compare: (a, b) =>
      comparePrices(a, b, 'asc') ||
      compareNames(a, b) ||
      compareIds(a, b)
  },
  price_desc: {
    label: 'Price: High to Low',
    compare: (a, b) =>
      comparePrices(a, b, 'desc') ||
      compareNames(a, b) ||
      compareIds(a, b)
  }
};

const SORT_OPTIONS = Object.keys(SORT_STRATEGIES).map(value => ({
  value,
  label: SORT_STRATEGIES[value].label
}));

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
      sortBy: DEFAULT_SORT,
      sortOptions: SORT_OPTIONS,
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
    // Items grouped by category, with the active sort applied within each group.
    // Headings are preserved (Option A) — the sort reorders items inside each
    // category but does not flatten or reorder the sections themselves.
    groupedItems() {
      const strategy = SORT_STRATEGIES[this.sortBy] || SORT_STRATEGIES[DEFAULT_SORT];
      const groups = {};
      for (const item of this.filteredItems) {
        const cat = item.category || 'Other';
        if (!groups[cat]) groups[cat] = [];
        groups[cat].push(item);
      }
      for (const cat in groups) {
        groups[cat].sort(strategy.compare);
      }
      return groups;
    },
    hasActiveFilters() {
      return !!(
        this.selectedCategory ||
        this.selectedSize ||
        this.searchQuery ||
        this.sortBy !== DEFAULT_SORT
      );
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
      this.sortBy = DEFAULT_SORT;
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
.toolbar-sort {
  margin-top: 0.75rem;
}
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