<template>
  <section class="page">
    <div class="page-header">
      <h1>Checkout</h1>
      <p class="page-subhead">Choose how you'll get your order, then place it.</p>
    </div>

    <div v-if="!items.length" class="status-note">
      Your cart is empty. <router-link to="/menu">Browse the menu</router-link> to add something.
    </div>

    <div v-else class="checkout-layout">
      <div class="checkout-main">

        <!-- Fulfillment -->
        <section class="checkout-section">
          <h2>How would you like it?</h2>
          <div class="fulfillment-options">
            <label class="fulfillment-option" :class="{ active: fulfillment === 'pickup' }">
              <input type="radio" value="pickup" v-model="fulfillment" />
              <div>
                <div class="fulfillment-title">Pickup</div>
                <div class="fulfillment-sub">Pay at the counter when you arrive.</div>
              </div>
            </label>
            <label class="fulfillment-option" :class="{ active: fulfillment === 'delivery' }">
              <input type="radio" value="delivery" v-model="fulfillment" />
              <div>
                <div class="fulfillment-title">Delivery</div>
                <div class="fulfillment-sub">We'll bring it to you. Pay on arrival.</div>
              </div>
            </label>
          </div>
          <p class="fine-print">
            No card needed — Uncle Joe's runs a classic pay-on-arrival model for the pilot.
          </p>
        </section>

        <!-- Store -->
        <section class="checkout-section">
          <h2>Pick a store</h2>
          <p v-if="storeError" class="status-note status-error">{{ storeError }}</p>
          <div class="store-filters">
            <div class="toolbar-group">
              <label for="store-state">State</label>
              <select id="store-state" v-model="selectedState" @change="loadStores">
                <option value="">All states</option>
                <option v-for="s in US_STATES" :key="s" :value="s">{{ s }}</option>
              </select>
            </div>
            <div class="toolbar-group toolbar-group-grow">
              <label for="store-city">City (optional)</label>
              <input id="store-city" type="search" v-model="cityQuery" @keyup.enter="loadStores" placeholder="Search by city" />
            </div>
            <button type="button" class="btn btn-secondary btn-small" @click="loadStores">Search stores</button>
          </div>

          <div v-if="loadingStores" class="status-note">Loading stores...</div>
          <div v-else-if="!stores.length" class="status-note">No stores match. Try a different filter.</div>
          <div v-else class="store-list">
            <label
              v-for="store in stores"
              :key="store.id"
              class="store-option"
              :class="{ active: selectedStoreId === store.id }"
            >
              <input type="radio" :value="store.id" v-model="selectedStoreId" />
              <div class="store-info">
                <div class="store-name">{{ store.city }}, {{ store.state }}</div>
                <div class="store-addr">{{ store.address_one }} · {{ store.zip_code }}</div>
              </div>
            </label>
          </div>
        </section>

      </div>

      <aside class="checkout-summary">
        <h3 class="summary-title">Your order</h3>
        <ul class="summary-items">
          <li v-for="line in items" :key="line.menu_item_id">
            <span class="line-name">{{ line.quantity }} × {{ line.name }} <span v-if="line.size">({{ line.size }})</span></span>
            <span class="line-total">${{ formatPrice(line.price * line.quantity) }}</span>
          </li>
        </ul>
        <dl class="summary-rows">
          <div class="summary-row"><dt>Subtotal</dt><dd>${{ formatPrice(subtotal) }}</dd></div>
          <div class="summary-row"><dt>Estimated tax</dt><dd>${{ formatPrice(estimatedTax) }}</dd></div>
          <div class="summary-row summary-row-total">
            <dt>Estimated total</dt><dd>${{ formatPrice(estimatedTotal) }}</dd>
          </div>
        </dl>
        <p class="summary-note" v-if="user">
          You'll earn roughly <strong>{{ estimatedPoints }} points</strong>.
        </p>

        <div v-if="placeError" class="status-note status-error">{{ placeError }}</div>

        <button
          type="button"
          class="btn btn-primary btn-block"
          :disabled="!canPlaceOrder || placing"
          @click="placeOrder"
        >
          <span v-if="!placing">Place order</span>
          <span v-else>Placing order...</span>
        </button>
        <router-link to="/cart" class="btn btn-ghost btn-block btn-back">Back to cart</router-link>
      </aside>
    </div>
  </section>
</template>

<script>
import { fetchJSON } from '../api.js';
import { cart } from '../stores/cart';
import { auth } from '../stores/auth';

const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA',
  'KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT',
  'VA','WA','WV','WI','WY'
];

export default {
  name: 'CheckoutView',
  data() {
    return {
      US_STATES,
      stores: [],
      selectedState: '',
      cityQuery: '',
      selectedStoreId: cart.state.store_id || '',
      fulfillment: cart.state.fulfillment || 'pickup',
      loadingStores: false,
      storeError: null,
      placing: false,
      placeError: null
    };
  },
  computed: {
    items() { return cart.state.items; },
    subtotal() { return cart.subtotal.value; },
    estimatedTax() { return cart.estimatedTax.value; },
    estimatedTotal() { return cart.estimatedTotal.value; },
    estimatedPoints() { return Math.floor(cart.estimatedTotal.value); },
    user() { return auth.user; },
    canPlaceOrder() {
      return this.items.length > 0 && !!this.selectedStoreId;
    }
  },
  watch: {
    fulfillment(v)     { cart.setFulfillment(v); },
    selectedStoreId(id) {
      const s = this.stores.find(x => x.id === id);
      cart.setStore(id, s ? `${s.city}, ${s.state}` : '');
    }
  },
  async mounted() {
    // Preload a default list (the user's home state if they have one)
    if (auth.user && auth.user.home_store) {
      // Try to load their home store's state if we can fetch it
      try {
        const home = await fetchJSON(`/locations/${auth.user.home_store}`);
        if (home && home.state) this.selectedState = home.state;
      } catch (_) { /* ignore */ }
    }
    await this.loadStores();
  },
  methods: {
    formatPrice(n) { return Number(n || 0).toFixed(2); },
    async loadStores() {
      this.loadingStores = true;
      this.storeError = null;
      try {
        const params = new URLSearchParams();
        if (this.selectedState) params.set('state', this.selectedState);
        if (this.cityQuery.trim()) params.set('city', this.cityQuery.trim());
        params.set('open_only', 'true');
        params.set('limit', '100');
        const data = await fetchJSON(`/locations?${params.toString()}`);
        this.stores = data.results || [];
      } catch (e) {
        this.storeError = e.message;
        this.stores = [];
      } finally {
        this.loadingStores = false;
      }
    },
    async placeOrder() {
      this.placeError = null;
      if (!this.canPlaceOrder) {
        this.placeError = 'Please choose a store to continue.';
        return;
      }
      this.placing = true;
      try {
        const payload = {
          member_id: auth.user ? auth.user.member_id : null,
          store_id: this.selectedStoreId,
          items: this.items.map(i => ({
            menu_item_id: i.menu_item_id,
            quantity: i.quantity
          }))
        };
        const order = await fetchJSON('/orders', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        // Stash fulfillment for the receipt screen (not persisted in DB)
        sessionStorage.setItem('uj_last_fulfillment', this.fulfillment);
        cart.clear();
        this.$router.push(`/receipt/${order.order_id}`);
      } catch (e) {
        this.placeError = e.message;
      } finally {
        this.placing = false;
      }
    }
  }
};
</script>

<style scoped>
.checkout-layout {
  display: grid;
  grid-template-columns: 1fr 360px;
  gap: 2rem;
  align-items: start;
}
@media (max-width: 820px) {
  .checkout-layout { grid-template-columns: 1fr; }
}

.checkout-main { display: flex; flex-direction: column; gap: 1.5rem; }
.checkout-section {
  background: var(--color-cream-50);
  border: 1px solid var(--color-cream-200);
  border-radius: var(--radius-lg);
  padding: 1.5rem;
}
.checkout-section h2 { font-size: 1.2rem; margin-bottom: 1rem; }

.fulfillment-options {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}
@media (max-width: 520px) { .fulfillment-options { grid-template-columns: 1fr; } }
.fulfillment-option {
  display: flex;
  gap: 0.75rem;
  align-items: flex-start;
  padding: 1rem;
  border: 1px solid var(--color-cream-300);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: border-color 0.15s ease, background 0.15s ease;
  background: var(--color-cream-50);
}
.fulfillment-option.active {
  border-color: var(--color-sage-600);
  background: var(--color-sage-100);
}
.fulfillment-option input[type="radio"] { margin-top: 0.25rem; }
.fulfillment-title { font-weight: 600; color: var(--color-coffee-900); }
.fulfillment-sub { font-size: 0.88rem; color: var(--color-coffee-600); margin-top: 0.15rem; }
.fine-print {
  font-size: 0.85rem;
  color: var(--color-coffee-600);
  margin-top: 0.75rem;
  margin-bottom: 0;
}

.store-filters {
  display: flex;
  gap: 0.75rem;
  align-items: end;
  flex-wrap: wrap;
  margin-bottom: 1rem;
}
.store-filters .toolbar-group {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  min-width: 140px;
}
.store-filters label {
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--color-coffee-600);
  font-weight: 600;
}

.store-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-height: 320px;
  overflow-y: auto;
  padding-right: 0.5rem;
}
.store-option {
  display: flex;
  gap: 0.75rem;
  align-items: flex-start;
  padding: 0.85rem 1rem;
  border: 1px solid var(--color-cream-300);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: border-color 0.15s ease, background 0.15s ease;
  background: var(--color-cream-50);
}
.store-option.active {
  border-color: var(--color-sage-600);
  background: var(--color-sage-100);
}
.store-option input[type="radio"] { margin-top: 0.25rem; }
.store-info { flex: 1; }
.store-name { font-weight: 600; color: var(--color-coffee-900); }
.store-addr { font-size: 0.88rem; color: var(--color-coffee-600); margin-top: 0.15rem; }

.checkout-summary {
  background: var(--color-cream-100);
  border: 1px solid var(--color-cream-200);
  border-radius: var(--radius-lg);
  padding: 1.5rem;
  position: sticky;
  top: 1rem;
}
.summary-title { margin-bottom: 1rem; font-size: 1.2rem; }
.summary-items {
  list-style: none;
  padding: 0;
  margin: 0 0 1rem 0;
  border-bottom: 1px solid var(--color-cream-300);
  padding-bottom: 1rem;
}
.summary-items li {
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
  font-size: 0.92rem;
  color: var(--color-coffee-800);
  padding: 0.3rem 0;
}
.line-name { flex: 1; }
.line-total { font-weight: 600; white-space: nowrap; }
.summary-rows { margin: 0 0 1rem 0; padding: 0; }
.summary-row {
  display: flex;
  justify-content: space-between;
  padding: 0.4rem 0;
  color: var(--color-coffee-700);
}
.summary-row dt, .summary-row dd { margin: 0; }
.summary-row-total {
  border-top: 1px solid var(--color-cream-300);
  margin-top: 0.5rem;
  padding-top: 0.75rem;
  font-weight: 700;
  color: var(--color-coffee-900);
  font-size: 1.05rem;
}
.summary-note {
  font-size: 0.88rem;
  color: var(--color-coffee-600);
  background: var(--color-sage-100);
  padding: 0.75rem;
  border-radius: var(--radius-sm);
  margin-bottom: 1rem;
}
.btn-back { margin-top: 0.5rem; }
</style>
