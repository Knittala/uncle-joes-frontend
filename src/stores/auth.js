// Reactive auth store, backed by localStorage.
// Any component can import { auth } and auth.user will stay in sync.
import { reactive } from 'vue';

const STORAGE_KEY = 'uj_user';

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

export const auth = reactive({
  user: load(),

  setUser(user) {
    this.user = user;
    if (user) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  },

  clear() {
    this.setUser(null);
  },

  get isLoggedIn() {
    return !!this.user;
  }
});
