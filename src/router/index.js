import { createRouter, createWebHistory } from 'vue-router';
import MenuView from '../views/MenuView.vue';
import LoginView from '../views/LoginView.vue';

const routes = [
  { path: '/', redirect: '/login' },
  { path: '/login', name: 'Login', component: LoginView },
  { path: '/menu', name: 'Menu', component: MenuView }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

export default router;
