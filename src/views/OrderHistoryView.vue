<template>
  <section class="page">
    <div class="page-header">
      <h1>Order history</h1>
      <p class="page-subhead">Every order you've placed with Uncle Joe's.</p>
    </div>

    <div v-if="loading" class="status-note">Loading your orders...</div>
    <div v-else-if="error" class="status-note status-error">{{ error }}</div>
    <div v-else-if="!orders.length" class="status-note">
      You haven't placed any orders yet. <router-link to="/menu">Browse the menu</router-link>.
    </div>

    <div v-else>
      <div class="history-summary">
        Showing {{ orders.length }} order<span v-if="orders.length !== 1">s</span>.
        Lifetime spend:
        <strong>${{ formatPrice(totalSpend) }}</strong>
      </div>

      <div class="order-list">
        <details v-for="order in orders" :key="order.order_id" class="order-card">
          <summary class="order-summary">
            <div class="order-summary-main">
              <span class="order-date">{{ formatDate(order.order_date) }}</span>
              <span class="order-items-count">
                {{ orderItemCount(order) }} item<span v-if="orderItemCount(order) !== 1">s</span>
              </span>
            </div>
            <div class="order-summary-right">
              <span class="order-total">${{ formatPrice(order.order_total) }}</span>
              <span class="order-points">+{{ pointsFor(order) }} pts</span>
            </div>
          </summary>

          <div class="order-body">
            <ul class="order-items">
              <li v-for="item in order.items || []" :key="item.line_id || item.id">
                <span>
                  <span class="qty">{{ item.quantity }}×</span>
                  {{ item.item_name }}
                  <span v-if="item.size" class="size">({{ item.size }})</span>
                </span>
                <span class="line-total">${{ formatPrice(item.price * item.quantity) }}</span>
              </li>
            </ul>
            <dl class="order-totals">
              <div class="row"><dt>Subtotal</dt><dd>${{ formatPrice(order.items_subtotal) }}</dd></div>
              <div class="row" v-if="order.order_discount"><dt>Discount</dt><dd>−${{ formatPrice(order.order_discount) }}</dd></div>
              <div class="row"><dt>Sales tax</dt><dd>${{ formatPrice(order.sales_tax) }}</dd></div>
              <div class="row row-total"><dt>Total</dt><dd>${{ formatPrice(order.order_total) }}</dd></div>
            </dl>
            <div class="order-meta-row">
              <span class="mono">Order {{ order.order_id }}</span>
            </div>
          </div>
        </details>
      </div>
    </div>
  </section>
</template>

<script>
import { fetchJSON } from '../api.js';
import { auth } from '../stores/auth';

export default {
  name: 'OrderHistoryView',
  data() {
    return {
      orders: [],
      loading: true,
      error: null
    };
  },
  computed: {
    totalSpend() {
      return this.orders.reduce((sum, o) => sum + Number(o.order_total || 0), 0);
    }
  },
  async mounted() {
    if (!auth.user) {
      this.error = 'Please sign in to view your order history.';
      this.loading = false;
      return;
    }
    try {
      const data = await fetchJSON(`/orders/member/${encodeURIComponent(auth.user.member_id)}?limit=200`);
      this.orders = data.orders || [];
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
      try { return new Date(d).toLocaleString(); }
      catch (_) { return d; }
    },
    orderItemCount(order) {
      if (!order.items) return 0;
      return order.items.reduce((n, i) => n + (Number(i.quantity) || 0), 0);
    },
    pointsFor(order) { return Math.floor(Number(order.order_total || 0)); }
  }
};
</script>

<style scoped>
.history-summary {
  color: var(--color-coffee-600);
  font-size: 0.95rem;
  margin-bottom: 1.5rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid var(--color-cream-200);
}
.history-summary strong { color: var(--color-coffee-900); }

.order-list { display: flex; flex-direction: column; gap: 0.75rem; }
.order-card {
  background: var(--color-cream-50);
  border: 1px solid var(--color-cream-200);
  border-radius: var(--radius-md);
  overflow: hidden;
}
.order-card[open] { border-color: var(--color-coffee-500); }
.order-summary {
  list-style: none;
  padding: 1rem 1.25rem;
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  cursor: pointer;
  user-select: none;
}
.order-summary::-webkit-details-marker { display: none; }
.order-summary-main { display: flex; flex-direction: column; gap: 0.25rem; }
.order-date { font-weight: 600; color: var(--color-coffee-900); }
.order-items-count { color: var(--color-coffee-600); font-size: 0.88rem; }
.order-summary-right { display: flex; flex-direction: column; align-items: flex-end; gap: 0.25rem; }
.order-total {
  font-family: var(--font-display);
  font-weight: 600;
  color: var(--color-coffee-900);
  font-size: 1.1rem;
}
.order-points {
  font-size: 0.78rem;
  color: var(--color-sage-700);
  background: var(--color-sage-100);
  padding: 0.15rem 0.5rem;
  border-radius: 999px;
  border: 1px solid var(--color-sage-300);
  font-weight: 600;
}

.order-body {
  padding: 1rem 1.25rem 1.25rem;
  border-top: 1px solid var(--color-cream-200);
  background: var(--color-cream-100);
}
.order-items { list-style: none; padding: 0; margin: 0 0 1rem 0; }
.order-items li {
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.4rem 0;
  border-bottom: 1px dashed var(--color-cream-300);
  color: var(--color-coffee-800);
  font-size: 0.92rem;
}
.order-items li:last-child { border-bottom: none; }
.qty { display: inline-block; min-width: 2.5rem; font-weight: 600; color: var(--color-coffee-600); }
.size { color: var(--color-coffee-600); font-size: 0.9em; }
.line-total { font-weight: 600; white-space: nowrap; }

.order-totals { margin: 0 0 0.75rem 0; }
.row {
  display: flex;
  justify-content: space-between;
  padding: 0.3rem 0;
  color: var(--color-coffee-700);
  font-size: 0.92rem;
}
.row dt, .row dd { margin: 0; }
.row-total {
  font-weight: 700;
  color: var(--color-coffee-900);
  border-top: 1px solid var(--color-cream-300);
  padding-top: 0.5rem;
  margin-top: 0.25rem;
}

.order-meta-row { font-size: 0.75rem; color: var(--color-coffee-600); margin-top: 0.5rem; }
.mono { font-family: ui-monospace, "SF Mono", Menlo, monospace; word-break: break-all; }
</style>
