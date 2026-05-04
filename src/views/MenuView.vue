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
          <option v-for="cat in categories" :key="cat" :value="cat">
            {{ cat }}
          </option>
        </select>
      </div>

      <div class="toolbar-group toolbar-group-grow">
        <label for="search-menu">Search</label>
        <input
          id="search-menu"
          type="search"
          v-model="searchQuery"
          placeholder="Find an item"
        />
      </div>

      <div class="toolbar-group">
        <label for="sort-by">Sort by</label>
        <select id="sort-by" v-model="sortBy">
          <option v-for="opt in sortOptions" :key="opt.value" :value="opt.value">
            {{ opt.label }}
          </option>
        </select>
      </div>

      <button
        type="button"
        class="btn btn-ghost"
        @click="resetFilters"
        :disabled="!hasActiveFilters"
      >
        Reset
      </button>
    </div>

    <div v-if="loading" class="status-note">Loading menu...</div>
    <div v-else-if="error" class="status-note status-error">{{ error }}</div>
    <div v-else-if="!filteredMenuItems.length" class="status-note">
      No items match your filters.
    </div>

    <div v-else class="menu-groups">
      <div
        v-for="(items, category) in groupedItems"
        :key="category"
        class="menu-group"
      >
        <h2 class="menu-group-title">{{ category }}</h2>

        <div class="menu-grid">
          <article v-for="item in items" :key="item.id" class="menu-card">
            <div v-if="getMenuImage(item.name)" class="menu-card-image">
              <img
                :src="getMenuImage(item.name)"
                :alt="item.name"
                loading="lazy"
              />
            </div>

            <header class="menu-card-head">
              <h3>{{ item.name }}</h3>
            </header>

            <div class="size-list">
              <button
                v-for="sizeOption in item.sizes"
                :key="sizeOption.id"
                type="button"
                class="size-option"
                @click="addToCart(sizeOption)"
              >
                <div>
                  <strong>{{ sizeOption.size }}</strong>
                  <div class="size-details">
                    {{ sizeOption.calories }} cal
                  </div>
                </div>

                <span class="size-price">
                  ${{ formatPrice(sizeOption.price) }}
                </span>
              </button>
            </div>
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
import { getMenuImage } from '../menuImages.js';

const SIZE_ORDER = { Small: 1, Medium: 2, Large: 3 };
const DEFAULT_SORT = 'name_asc';

function priceNum(item) {
  const n = parseFloat(item.defaultItem?.price ?? item.price);
  return Number.isFinite(n) ? n : NaN;
}

function compareNames(a, b) {
  return (a.name || '').localeCompare(b.name || '', undefined, {
    sensitivity: 'base'
  });
}

function comparePrices(a, b, direction) {
  const pa = priceNum(a);
  const pb = priceNum(b);

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
    compare: (a, b) => compareNames(a, b) || comparePrices(a, b, 'asc')
  },
  name_desc: {
    label: 'Name: Z–A',
    compare: (a, b) => -compareNames(a, b) || comparePrices(a, b, 'asc')
  },
  price_asc: {
    label: 'Price: Low to High',
    compare: (a, b) => comparePrices(a, b, 'asc') || compareNames(a, b)
  },
  price_desc: {
    label: 'Price: High to Low',
    compare: (a, b) => comparePrices(a, b, 'desc') || compareNames(a, b)
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

    groupedMenuItems() {
      const groups = {};

      for (const item of this.items) {
        const key = `${item.category || 'Other'}-${item.name}`;

        if (!groups[key]) {
          groups[key] = {
            id: key,
            name: item.name,
            category: item.category || 'Other',
            sizes: []
          };
        }

        groups[key].sizes.push(item);
      }

      return Object.values(groups).map(group => {
        group.sizes.sort(
          (a, b) => (SIZE_ORDER[a.size] || 99) - (SIZE_ORDER[b.size] || 99)
        );

        group.defaultItem =
          group.sizes.find(size => size.size === 'Medium') ||
          group.sizes[0];

        return group;
      });
    },

    filteredMenuItems() {
      const q = this.searchQuery.trim().toLowerCase();

      return this.groupedMenuItems.filter(item => {
        if (this.selectedCategory && item.category !== this.selectedCategory) {
          return false;
        }

        if (q && !(item.name || '').toLowerCase().includes(q)) {
          return false;
        }

        return true;
      });
    },

    groupedItems() {
      const strategy =
        SORT_STRATEGIES[this.sortBy] || SORT_STRATEGIES[DEFAULT_SORT];
      const groups = {};

      for (const item of this.filteredMenuItems) {
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
        this.searchQuery ||
        this.sortBy !== DEFAULT_SORT
      );
    }
  },

  async mounted() {
    try {
      const data = await fetchJSON('/filter/menu_items');
      this.items = Array.isArray(data) ? data : data.results || [];
    } catch (e) {
      this.error = e.message;
    } finally {
      this.loading = false;
    }
  },

  methods: {
    resetFilters() {
      this.selectedCategory = '';
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
      this._toastTimer = setTimeout(() => {
        this.toast = '';
      }, 2200);
    },

    getMenuImage
  }
};
</script>

<style scoped>
.menu-groups {
  display: flex;
  flex-direction: column;
  gap: 3rem;
}

.menu-group-title {
  font-size: 1.6rem;
  color: var(--color-coffee-800);
  padding-bottom: 0.5rem;
  border-bottom: 2px solid var(--color-cream-200);
  margin-bottom: 1.25rem;
}

.menu-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(285px, 1fr));
  gap: 1rem;
}

.menu-card {
  background: var(--color-cream-50);
  border: 1px solid var(--color-cream-200);
  border-radius: var(--radius-md);
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
  min-height: 380px;
  transition:
    border-color 0.15s ease,
    transform 0.15s ease,
    box-shadow 0.30s ease;
  overflow: hidden;
}

.menu-card:hover {
  border-color: var(--color-coffee-500);
  transform: translateY(-2px);
  box-shadow: var(--shadow-sm);
}

.menu-card-image {
  margin: -1.25rem -1.25rem 0;
  aspect-ratio: 16 / 10;
  overflow: hidden;
  background: var(--color-cream-200);
}

.menu-card-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transition: transform 0.3s ease;
}

.menu-card:hover .menu-card-image img {
  transform: scale(1.04);
}

.size-list {
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
  margin-top: auto;
}

.size-option {
  width: 100%;
  border: 1px solid var(--color-cream-200);
  background: white;
  border-radius: var(--radius-md);
  padding: 0.75rem;

  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;

  cursor: pointer;
  color: var(--color-coffee-900);
  text-align: left;

  transition:
    border-color 0.15s ease,
    background 0.15s ease,
    transform 0.15s ease,
    box-shadow 0.15s ease;
}

.size-option:hover {
  border-color: var(--color-sage-500);
  background: var(--color-sage-100);
  transform: translateY(-1px);
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.08);
}

.size-option:active {
  transform: scale(0.98);
}

.toast {
  position: fixed;
  bottom: 2rem;
  left: 50%;
  transform: translateX(-50%);
  background: var(--color-coffee-900);
  color: var(--color-cream-50);
  padding: 0.75rem 1.5rem;
  border-radius: var(--radius-md);
}
</style>