<template>
  <section class="page page-narrow">
    <div v-if="loading" class="status-note">Loading receipt...</div>
    <div v-else-if="error" class="status-note status-error">{{ error }}</div>
    <div v-else-if="order" class="receipt">
      <div class="receipt-head">
        <div class="receipt-badge">Order confirmed</div>
        <h1>Thank you!</h1>
        <p class="receipt-sub" v-if="fulfillment === 'delivery'">
          We'll have it delivered shortly. Pay on arrival.
        </p>
        <p class="receipt-sub" v-else>
          Your order will be ready for pickup. Pay when you arrive at the store.
        </p>
      </div>

      <div class="receipt-card">
        <div class="receipt-meta">
          <div>
            <div class="receipt-meta-label">Order ID</div>
            <div class="receipt-meta-value mono">{{ order.order_id }}</div>
          </div>
          <div>
            <div class="receipt-meta-label">Placed</div>
            <div class="receipt-meta-value">{{ formatDate(order.order_date) }}</div>
          </div>
        </div>

        <ul class="receipt-items">
          <li v-for="item in order.items" :key="item.line_id || item.id">
            <span class="item-main">
              <span class="item-qty">{{ item.quantity }}×</span>
              {{ item.item_name }}
              <span v-if="item.size" class="item-size">({{ item.size }})</span>
            </span>
            <span class="item-total">${{ formatPrice(item.price * item.quantity) }}</span>
          </li>
        </ul>

        <dl class="receipt-totals">
          <div class="row"><dt>Subtotal</dt><dd>${{ formatPrice(order.items_subtotal) }}</dd></div>
          <div class="row" v-if="order.order_discount"><dt>Discount</dt><dd>−${{ formatPrice(order.order_discount) }}</dd></div>
          <div class="row"><dt>Sales tax</dt><dd>${{ formatPrice(order.sales_tax) }}</dd></div>
          <div class="row row-total"><dt>Total</dt><dd>${{ formatPrice(order.order_total) }}</dd></div>
        </dl>

        <div class="receipt-points" v-if="pointsEarned > 0">
          <div class="points-label">Coffee Club points earned</div>
          <div class="points-value">+{{ pointsEarned }}</div>
        </div>
      </div>

      <div class="receipt-actions">
        <router-link to="/menu" class="btn btn-primary">Order something else</router-link>
        <router-link v-if="user" to="/orders" class="btn btn-ghost">View order history</router-link>
      </div>
    </div>
  </section>
</template>

<script>
import { fetchJSON } from '../api.js';
import { auth } from '../stores/auth';

export default {
  name: 'ReceiptView',
  props: { orderId: String },
  data() {
    return {
      order: null,
      loading: true,
      error: null,
      fulfillment: sessionStorage.getItem('uj_last_fulfillment') || 'pickup'
    };
  },
  computed: {
    user() { return auth.user; },
    pointsEarned() {
      if (!this.order) return 0;
      if (this.order.points_earned != null) return this.order.points_earned;
      if (!this.user) return 0;
      return Math.floor(Number(this.order.order_total || 0));
    }
  },
  async mounted() {
    try {
      this.order = await fetchJSON(`/receipt/orders/${this.orderId}`);
    } catch (e) {
      this.error = e.message;
    } finally {
      this.loading = false;
    }
  },
  methods: {
    formatPrice(n) { return Number(n || 0).toFixed(2); },
    formatDate(d) {
      if (!d) return '';
      try {
        return new Date(d).toLocaleString();
      } catch (_) { return d; }
    }
  }
};
</script>

<style scoped>
.receipt-head { text-align: center; margin-bottom: 2rem; }
.receipt-badge {
  display: inline-block;
  background: var(--color-sage-100);
  color: var(--color-sage-700);
  border: 1px solid var(--color-sage-300);
  border-radius: 999px;
  padding: 0.3rem 0.85rem;
  font-size: 0.78rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  margin-bottom: 1rem;
}
.receipt-sub { color: var(--color-coffee-600); font-size: 1rem; }

.receipt-card {
  background: var(--color-cream-50);
  border: 1px solid var(--color-cream-200);
  border-radius: var(--radius-lg);
  padding: 2rem;
  box-shadow: var(--shadow-md);
}
.receipt-meta {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  padding-bottom: 1.25rem;
  margin-bottom: 1.25rem;
  border-bottom: 1px solid var(--color-cream-200);
}
.receipt-meta-label {
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: var(--color-coffee-600);
  font-weight: 600;
  margin-bottom: 0.25rem;
}
.receipt-meta-value { color: var(--color-coffee-900); font-weight: 500; font-size: 0.95rem; }
.mono { font-family: ui-monospace, "SF Mono", Menlo, monospace; font-size: 0.8rem; word-break: break-all; }

.receipt-items { list-style: none; padding: 0; margin: 0 0 1rem 0; }
.receipt-items li {
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.55rem 0;
  border-bottom: 1px dashed var(--color-cream-200);
  color: var(--color-coffee-800);
}
.receipt-items li:last-child { border-bottom: none; }
.item-qty {
  display: inline-block;
  min-width: 2.5rem;
  font-weight: 600;
  color: var(--color-coffee-600);
}
.item-size { color: var(--color-coffee-600); font-size: 0.9em; }
.item-total { font-weight: 600; white-space: nowrap; }

.receipt-totals { margin: 0; padding: 1rem 0 0 0; border-top: 1px solid var(--color-cream-200); }
.row {
  display: flex;
  justify-content: space-between;
  padding: 0.35rem 0;
  color: var(--color-coffee-700);
}
.row dt, .row dd { margin: 0; }
.row-total {
  font-size: 1.15rem;
  font-weight: 700;
  color: var(--color-coffee-900);
  border-top: 1px solid var(--color-cream-300);
  margin-top: 0.5rem;
  padding-top: 0.75rem;
}

.receipt-points {
  margin-top: 1rem;
  padding: 1rem;
  background: var(--color-sage-100);
  border: 1px solid var(--color-sage-300);
  border-radius: var(--radius-md);
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.points-label { color: var(--color-sage-700); font-weight: 600; }
.points-value {
  font-family: var(--font-display);
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-sage-700);
}

.receipt-actions {
  margin-top: 1.5rem;
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  justify-content: center;
}
</style>
