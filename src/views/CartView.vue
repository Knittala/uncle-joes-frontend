<template>
  <section class="page">
    <div class="page-header">
      <h1>Your cart</h1>
      <p class="page-subhead" v-if="items.length">
        Review your order before heading to checkout.
      </p>
      <p class="page-subhead" v-else>
        Your cart is empty. Browse the menu to start an order.
      </p>
    </div>

    <div v-if="!items.length" class="empty-state">
      <router-link to="/menu" class="btn btn-primary">Browse the menu</router-link>
    </div>

    <div v-else class="cart-layout">
      <div class="cart-lines">
        <article v-for="line in items" :key="line.menu_item_id" class="cart-line">
          <div class="cart-line-body">
            <div class="cart-line-head">
              <h3>{{ line.name }}</h3>
              <span class="cart-line-price">${{ formatPrice(line.price * line.quantity) }}</span>
            </div>
            <div class="cart-line-meta">
              <span class="tag" v-if="line.size">{{ line.size }}</span>
              <span class="tag tag-muted" v-if="line.category">{{ line.category }}</span>
              <span class="cart-unit">${{ formatPrice(line.price) }} each</span>
            </div>
            <div class="cart-line-actions">
              <div class="qty-control">
                <button type="button" class="qty-btn" @click="decrement(line)" :aria-label="`Decrease quantity of ${line.name}`">−</button>
                <input
                  type="number"
                  class="qty-input"
                  min="1"
                  :value="line.quantity"
                  @change="onQtyInput(line, $event)"
                />
                <button type="button" class="qty-btn" @click="increment(line)" :aria-label="`Increase quantity of ${line.name}`">+</button>
              </div>
              <button type="button" class="btn-link-danger" @click="remove(line)">Remove</button>
            </div>
          </div>
        </article>
      </div>

      <aside class="cart-summary">
        <h3 class="summary-title">Order summary</h3>
        <dl class="summary-rows">
          <div class="summary-row">
            <dt>Subtotal</dt>
            <dd>${{ formatPrice(subtotal) }}</dd>
          </div>
          <div class="summary-row">
            <dt>Estimated tax (6%)</dt>
            <dd>${{ formatPrice(estimatedTax) }}</dd>
          </div>
          <div class="summary-row summary-row-total">
            <dt>Estimated total</dt>
            <dd>${{ formatPrice(estimatedTotal) }}</dd>
          </div>
        </dl>
        <p class="summary-note" v-if="user">
          You'll earn roughly <strong>{{ estimatedPoints }} points</strong> on this order.
        </p>
        <p class="summary-note" v-else>
          <router-link to="/login">Sign in</router-link> to earn Coffee Club points on this order.
        </p>
        <button type="button" class="btn btn-primary btn-block" @click="goToCheckout">
          Continue to checkout
        </button>
        <button type="button" class="btn btn-ghost btn-block btn-clear" @click="confirmClear">
          Clear cart
        </button>
      </aside>
    </div>
  </section>
</template>

<script>
import { cart } from '../stores/cart';
import { auth } from '../stores/auth';

export default {
  name: 'CartView',
  computed: {
    items() { return cart.state.items; },
    subtotal() { return cart.subtotal.value; },
    estimatedTax() { return cart.estimatedTax.value; },
    estimatedTotal() { return cart.estimatedTotal.value; },
    estimatedPoints() { return Math.floor(cart.estimatedTotal.value); },
    user() { return auth.user; }
  },
  methods: {
    formatPrice(n) { return Number(n || 0).toFixed(2); },
    increment(line) { cart.setQuantity(line.menu_item_id, line.quantity + 1); },
    decrement(line) { cart.setQuantity(line.menu_item_id, line.quantity - 1); },
    onQtyInput(line, event) {
      const next = parseInt(event.target.value, 10);
      if (Number.isNaN(next) || next < 1) {
        event.target.value = line.quantity;
        return;
      }
      cart.setQuantity(line.menu_item_id, next);
    },
    remove(line) { cart.remove(line.menu_item_id); },
    confirmClear() {
      if (confirm('Clear your entire cart?')) cart.clear();
    },
    goToCheckout() { this.$router.push('/checkout'); }
  }
};
</script>

<style scoped>
.empty-state {
  padding: 3rem 1.5rem;
  background: var(--color-cream-100);
  border: 1px solid var(--color-cream-200);
  border-radius: var(--radius-lg);
  text-align: center;
}

.cart-layout {
  display: grid;
  grid-template-columns: 1fr 340px;
  gap: 2rem;
  align-items: start;
}
@media (max-width: 820px) {
  .cart-layout { grid-template-columns: 1fr; }
}

.cart-lines { display: flex; flex-direction: column; gap: 1rem; }
.cart-line {
  background: var(--color-cream-50);
  border: 1px solid var(--color-cream-200);
  border-radius: var(--radius-md);
  padding: 1.25rem;
}
.cart-line-head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 1rem;
  margin-bottom: 0.5rem;
}
.cart-line-head h3 { margin: 0; font-size: 1.05rem; }
.cart-line-price {
  font-family: var(--font-display);
  font-weight: 600;
  color: var(--color-coffee-900);
  white-space: nowrap;
}
.cart-line-meta {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  flex-wrap: wrap;
  margin-bottom: 0.75rem;
}
.cart-unit {
  color: var(--color-coffee-600);
  font-size: 0.85rem;
  margin-left: 0.25rem;
}
.cart-line-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.qty-control {
  display: inline-flex;
  align-items: center;
  border: 1px solid var(--color-cream-300);
  border-radius: var(--radius-md);
  overflow: hidden;
  background: var(--color-cream-50);
}
.qty-btn {
  width: 36px;
  height: 36px;
  background: var(--color-cream-100);
  color: var(--color-coffee-800);
  border: none;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s ease;
}
.qty-btn:hover { background: var(--color-cream-200); }
.qty-input {
  width: 48px;
  height: 36px;
  border: none;
  border-left: 1px solid var(--color-cream-300);
  border-right: 1px solid var(--color-cream-300);
  background: var(--color-cream-50);
  text-align: center;
  font-weight: 600;
  color: var(--color-coffee-900);
  padding: 0;
  border-radius: 0;
  -moz-appearance: textfield;
}
.qty-input::-webkit-outer-spin-button,
.qty-input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
.qty-input:focus { outline: none; box-shadow: none; }

.btn-link-danger {
  background: none;
  border: none;
  color: var(--color-danger);
  font-weight: 500;
  cursor: pointer;
  padding: 0.25rem 0.5rem;
  border-radius: var(--radius-sm);
  font-size: 0.9rem;
}
.btn-link-danger:hover { background: var(--color-danger-bg); }

.cart-summary {
  background: var(--color-cream-100);
  border: 1px solid var(--color-cream-200);
  border-radius: var(--radius-lg);
  padding: 1.5rem;
  position: sticky;
  top: 1rem;
}
.summary-title { margin-bottom: 1rem; font-size: 1.2rem; }
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
.btn-clear { margin-top: 0.5rem; }
</style>
