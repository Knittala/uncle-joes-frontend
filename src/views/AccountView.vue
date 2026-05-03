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

    <div v-if="showMap" class="map-wrapper">
      <h2>Select Your Home Store</h2>

      <div class="home-store-toolbar">
        <div class="toolbar-group toolbar-grow">
          <label class="toolbar-label">City</label>
          <input
            type="search"
            v-model="cityQuery"
            placeholder="Search city..."
            class="search-input"
          />
        </div>

        <div class="toolbar-group">
          <label class="toolbar-label">State</label>
          <select v-model="selectedState" class="filter-control">
            <option value="">All states</option>
            <option v-for="s in availableStates" :key="s" :value="s">
              {{ s }}
            </option>
          </select>
        </div>

        <div class="toolbar-group">
          <label class="toolbar-label">Sort by</label>
          <select v-model="sortBy" class="filter-control">
            <option value="city_asc">City A-Z</option>
            <option value="city_desc">City Z-A</option>
          </select>
        </div>

        <div class="toolbar-group toolbar-actions">
          <label class="toolbar-label invisible-label">.</label>
          <button class="btn btn-ghost btn-small" @click="resetMapFilters">
            Reset
          </button>
        </div>
      </div>

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
          v-for="location in filteredLocations"
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

const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA',
  'KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT',
  'VA','WA','WV','WI','WY'
];

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

      cityQuery: '',
      selectedState: '',
      sortBy: 'city_asc',
      states: US_STATES,

      tileUrl: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      mapCenter: [20, 0],
      mapZoom: 2
    };
  },

  computed: {
    user() {
      return auth.user || {};
    },

    availableStates() {
      const set = new Set(
        this.locations
          .filter(location => location.open_for_business)
          .map(location => location.state)
          .filter(Boolean)
      );

      return Array.from(set).sort();
    },

    filteredLocations() {
      const query = this.cityQuery.trim().toLowerCase();

      return this.locations
        .filter(location => {
          if (!location.open_for_business) return false;

          if (query && !(location.city || '').toLowerCase().includes(query)) {
            return false;
          }

          if (this.selectedState && location.state !== this.selectedState) {
            return false;
          }

          return true;
        })
        .sort((a, b) => {
          const result = (a.city || '').localeCompare(b.city || '');
          return this.sortBy === 'city_desc' ? -result : result;
        });
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
            open_for_business: location.open_for_business,
            address:
              location.location_map_address ||
              location.address_one ||
              'Unknown address'
          }));
      } catch (e) {
        console.error('Failed to load locations', e);
      }
    },

    resetMapFilters() {
      this.cityQuery = '';
      this.selectedState = '';
      this.sortBy = 'city_asc';
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
  position: relative;
}

.map-wrapper h2 {
  margin-bottom: 1rem;
  color: var(--color-coffee-900);
}

.home-store-toolbar {
  background: var(--color-cream-100);
  border: 1px solid var(--color-cream-300);
  border-radius: 16px;
  padding: 1rem;
  margin-bottom: 1rem;

  display: flex;
  align-items: flex-end;
  gap: 1rem;
  flex-wrap: wrap;

  box-shadow: var(--shadow-sm);
}

.toolbar-group {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.toolbar-grow {
  flex: 1;
  min-width: 240px;
}

.toolbar-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-coffee-600);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.invisible-label {
  visibility: hidden;
}

.search-input {
  width: 100%;
}

.filter-control {
  min-width: 140px;
}

.toolbar-actions {
  justify-content: flex-end;
}

.map-tooltip {
  font-size: 0.85rem;
  line-height: 1.35;
}

.map-home-button {
  position: absolute;
  top: 250px;
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
</style>