// Reactive cart store, backed by localStorage.
// Cart is purely client-side until the user places the order, at which point
// we POST everything to the backend in one atomic call.
import { reactive, computed } from 'vue';

const STORAGE_KEY = 'uj_cart';

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    if (parsed && Array.isArray(parsed.items)) return parsed;
  } catch (e) { /* fall through */ }
  return { items: [], fulfillment: 'pickup', store_id: null, store_label: '' };
}

const state = reactive(load());

function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export const cart = {
  state,

  // --- totals ---------------------------------------------------------------
  count: computed(() => state.items.reduce((n, i) => n + i.quantity, 0)),
  subtotal: computed(() =>
    state.items.reduce((sum, i) => sum + (Number(i.price) || 0) * i.quantity, 0)
  ),
  // Kept in sync with backend's SALES_TAX_RATE. Display purposes only —
  // the backend always recomputes on POST /orders.
  taxRate: 0.06,
  estimatedTax: computed(() => {
    const sub = state.items.reduce((s, i) => s + (Number(i.price) || 0) * i.quantity, 0);
    return Math.round(sub * 0.06 * 100) / 100;
  }),
  estimatedTotal: computed(() => {
    const sub = state.items.reduce((s, i) => s + (Number(i.price) || 0) * i.quantity, 0);
    return Math.round((sub + sub * 0.06) * 100) / 100;
  }),

  // --- mutations ------------------------------------------------------------
  add(menuItem, qty = 1) {
    const existing = state.items.find(i => i.menu_item_id === menuItem.id);
    if (existing) {
      existing.quantity += qty;
    } else {
      state.items.push({
        menu_item_id: menuItem.id,
        name: menuItem.name,
        size: menuItem.size,
        category: menuItem.category,
        price: Number(menuItem.price) || 0,
        quantity: qty
      });
    }
    persist();
  },

  setQuantity(menu_item_id, qty) {
    const line = state.items.find(i => i.menu_item_id === menu_item_id);
    if (!line) return;
    if (qty <= 0) {
      this.remove(menu_item_id);
    } else {
      line.quantity = qty;
      persist();
    }
  },

  remove(menu_item_id) {
    const idx = state.items.findIndex(i => i.menu_item_id === menu_item_id);
    if (idx >= 0) {
      state.items.splice(idx, 1);
      persist();
    }
  },

  clear() {
    state.items = [];
    state.store_id = null;
    state.store_label = '';
    state.fulfillment = 'pickup';
    persist();
  },

  setStore(store_id, store_label) {
    state.store_id = store_id;
    state.store_label = store_label || '';
    persist();
  },

  setFulfillment(mode) {
    state.fulfillment = mode === 'delivery' ? 'delivery' : 'pickup';
    persist();
  }
};
