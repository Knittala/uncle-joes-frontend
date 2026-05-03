<template>
  <section class="page">
    <div class="page-header">
      <h1>Welcome Back, {{ user.first_name }}</h1>
      <p class="page-subhead">Your Coffee Club Dashboard.</p>
    </div>

    <div class="account-grid">
      <div class="account-card">
        <div class="account-card-label">Email</div>
        <div class="account-card-value">{{ user.email }}</div>
      </div>

      <div class="account-card">
        <div class="account-card-label">Home store</div>

        <div class="account-card-value" v-if="user.home_store">
          {{ user.home_store }}
        </div>
        <div class="account-card-value account-card-muted" v-else>
          Not set
        </div>

        <button
          class="btn btn-secondary btn-small edit-store-btn"
          @click="showMap = !showMap"
        >
          {{ showMap ? 'Close Map' : 'Edit Home Store' }}
        </button>
      </div>

      <div class="account-card">
        <div class="account-card-label">Member ID</div>
        <div class="account-card-value account-card-muted">
          {{ user.id || user.member_id }}
        </div>
      </div>
    </div>

    <!-- Map -->
    <div v-if="showMap" class="map-wrapper">
      <h2>Select Your Home Store</h2>
      <LMap
        :zoom="mapZoom"
        :center="mapCenter"
        style="height: 420px; width: 100%; border-radius: 12px;"
      >
        <LTileLayer
          :url="tileUrl"
          layer-type="base"
          name="OpenStreetMap"
        />
        <LMarker
          v-for="location in locations"
          :key="location.id"
          :lat-lng="[location.lat, location.lng]"
          @click="confirmStore(location)"
        >
          <LTooltip :options="{ direction: 'top', offset: [0, -10] }">
            <div class="map-tooltip">
              <strong>{{ location.id }}</strong><br />
              {{ location.address }}<br />
              {{ location.city }}, {{ location.state }}
            </div>
          </LTooltip>
        </LMarker>
      </LMap>
      <div
        class="map-home-button"
        @click="goToHomeStore"
        :class="{ disabled: !user.home_store }"
        title="Go to My Home Store"
      >
        ➤
      </div>
    </div>

    <div class="account-links">
      <router-link to="/points" class="account-link">
        <div class="account-link-title">Loyalty points</div>
        <div class="account-link-sub">
          See your total balance and recent activity.
        </div>
      </router-link>

      <router-link to="/orders" class="account-link">
        <div class="account-link-title">Order history</div>
        <div class="account-link-sub">
          Review every order you've ever placed.
        </div>
      </router-link>

      <router-link to="/menu" class="account-link account-link-accent">
        <div class="account-link-title">Place a new order</div>
        <div class="account-link-sub">
          Browse the menu and earn more points.
        </div>
      </router-link>
    </div>

    <div class="account-actions">
      <button type="button" class="btn btn-ghost" @click="signOut">
        Sign out
      </button>
    </div>
  </section>
</template>

<script>
import { auth } from '../stores/auth';
import { cart } from '../stores/cart';
import { fetchJSON } from '../api';

import 'leaflet/dist/leaflet.css';
import {
  LMap,
  LTileLayer,
  LMarker,
  LTooltip
} from '@vue-leaflet/vue-leaflet';

export default {
  name: 'AccountView',

  components: {
    LMap,
    LTileLayer,
    LMarker,
    LTooltip
  },

  data() {
    return {
      showMap: false,
      locations: [],
      tileUrl: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      mapCenter: [20, 0],
      mapZoom: 2
    };
  },

  computed: {
    user() {
      return auth.user || {};
    }
  },

  async mounted() {
    await this.fetchLocations();
  },

  methods: {
    async fetchLocations() {
      try {
        const data = await fetchJSON('/locations?open_only=true&limit=500');

        this.locations = (data.results || [])
          .filter(
            location =>
              location.location_map_lat != null &&
              location.location_map_lng != null
          )
          .map(location => ({
            id: location.id,
            lat: Number(location.location_map_lat),
            lng: Number(location.location_map_lng),
            city: location.city,
            state: location.state,
            address:
              location.location_map_address ||
              location.address_one ||
              'Unknown address'
          }));
      } catch (e) {
        console.error('Failed to load locations', e);
      }
    },

    goToHomeStore() {
      if (!this.user.home_store) return;

      const store = this.locations.find(
        location => location.id === this.user.home_store
      );

      if (!store) {
        alert('Could not find your home store location');
        return;
      }

      this.mapCenter = [store.lat, store.lng];
      this.mapZoom = 13;
    },

    async confirmStore(location) {
      const confirmed = window.confirm(
        `Set ${location.id} as your home store?`
      );

      if (!confirmed) return;

      try {
        await fetchJSON(
          `/update_profile/${this.user.id}/home_store`,
          {
            method: 'PUT',
            body: JSON.stringify({
              home_store: location.id
            })
          }
        );

        auth.setUser({
          ...this.user,
          home_store: location.id
        });

        this.mapCenter = [location.lat, location.lng];
        this.mapZoom = 13;

        alert('Home store updated successfully');
        this.showMap = false;
      } catch (e) {
        console.error(e);
        alert(e.message || 'Failed to update home store');
      }
    },

    signOut() {
      auth.clear();
      cart.clear();
      this.$router.push('/');
    }
  }
};
</script>

<style scoped>
.account-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.map-tooltip {
  font-size: 0.85rem;
  line-height: 1.35;
}

.account-card {
  background: var(--color-cream-100);
  border: 1px solid var(--color-cream-200);
  border-radius: var(--radius-md);
  padding: 1.25rem;
}

.account-card-label {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: var(--color-coffee-600);
  margin-bottom: 0.4rem;
  font-weight: 600;
}

.account-card-value {
  font-size: 1.05rem;
  color: var(--color-coffee-900);
}

.account-card-muted {
  color: var(--color-coffee-600);
}

.edit-store-btn {
  margin-top: 1rem;
}

.map-wrapper {
  margin-bottom: 2rem;
}

.map-wrapper h2 {
  margin-bottom: 1rem;
  color: var(--color-coffee-900);
}

.account-links {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.account-link {
  display: block;
  background: var(--color-cream-50);
  border: 1px solid var(--color-cream-200);
  border-radius: var(--radius-md);
  padding: 1.5rem;
  color: var(--color-coffee-900);
}

.account-link-accent {
  background: var(--color-sage-100);
  border-color: var(--color-sage-300);
}

.account-actions {
  display: flex;
  gap: 1rem;
}

.map-actions {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.map-wrapper {
  margin-bottom: 2rem;
  position: relative;
}

.map-home-button {
  position: absolute;
  top: 140px;
  left: 12px;

  width: 46px;
  height: 46px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.18);

  display: flex;
  align-items: center;
  justify-content: center;

  cursor: pointer;
  font-size: 1.35rem;
  font-weight: bold;
  color: #2f6f57;
  z-index: 1000;

  transition: transform 0.15s ease, box-shadow 0.15s ease;
  user-select: none;
}

.map-home-button:hover {
  transform: scale(1.06);
  box-shadow: 0 5px 14px rgba(0, 0, 0, 0.22);
}

.map-home-button.disabled {
  opacity: 0.45;
  cursor: not-allowed;
  pointer-events: none;
}
</style>