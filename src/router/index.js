import { createRouter, createWebHistory } from 'vue-router';
import { auth } from '../stores/auth';

import HomeView         from '../views/HomeView.vue';
import MenuView         from '../views/MenuView.vue';
import LocationsView    from '../views/LocationsView.vue';
import LoginView        from '../views/LoginView.vue';
import AccountView      from '../views/AccountView.vue';
import CartView         from '../views/CartView.vue';
import CheckoutView     from '../views/CheckoutView.vue';
import ReceiptView      from '../views/ReceiptView.vue';
import OrderHistoryView from '../views/OrderHistoryView.vue';
import PointsView       from '../views/PointsView.vue';

const routes = [
  { path: '/',              name: 'Home',         component: HomeView },
  { path: '/menu',          name: 'Menu',         component: MenuView },
  { path: '/locations',     name: 'Locations',    component: LocationsView },
  { path: '/login',         name: 'Login',        component: LoginView },
  { path: '/cart',          name: 'Cart',         component: CartView },
  { path: '/checkout',      name: 'Checkout',     component: CheckoutView },
  { path: '/receipt/:orderId', name: 'Receipt',   component: ReceiptView, props: true },

  // Member-only pages — redirect to /login if not signed in
  { path: '/account',       name: 'Account',      component: AccountView,      meta: { requiresAuth: true } },
  { path: '/orders',        name: 'OrderHistory', component: OrderHistoryView, meta: { requiresAuth: true } },
  { path: '/points',        name: 'Points',       component: PointsView,       meta: { requiresAuth: true } },

  // Catch-all
  { path: '/:pathMatch(.*)*', redirect: '/' }
];

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() { return { top: 0 }; }
});

router.beforeEach((to) => {
  if (to.meta.requiresAuth && !auth.user) {
    return { name: 'Login', query: { redirect: to.fullPath } };
  }
});

export default router;
