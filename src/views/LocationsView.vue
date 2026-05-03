<template>
  <section class="page">
    <div class="page-header">
      <h1>Find a café</h1>
      <p class="page-subhead">
        Filter by state or city to find the Uncle Joe's closest to you.
      </p>
    </div>

    <div class="toolbar-card">
      <div class="search-toolbar">
        <div class="toolbar-group toolbar-grow">
          <label class="toolbar-label">City</label>
          <input
            type="search"
            v-model="cityQuery"
            @keyup.enter="loadLocations"
            placeholder="Search city..."
            class="search-input"
          />
        </div>

        <div class="toolbar-group">
          <label class="toolbar-label">State</label>
          <select v-model="selectedState" class="filter-control">
            <option value="">All states</option>
            <option v-for="s in states" :key="s" :value="s">{{ s }}</option>
          </select>
        </div>

        <div class="toolbar-group">
          <label class="toolbar-label">Sort by</label>
          <select v-model="sortBy" class="filter-control">
            <option value="city_asc">City A-Z</option>
            <option value="city_desc">City Z-A</option>
          </select>
        </div>

        <div class="toolbar-group">
          <label class="toolbar-label">Store status</label>
          <select v-model="storeStatus" class="filter-control">
            <option value="">All stores</option>
            <option value="open">Open for business only</option>
            <option value="opening_soon">Opening soon</option>
          </select>
        </div>

        <div class="toolbar-group toolbar-actions">
          <label class="toolbar-label invisible-label">.</label>
          <div class="action-buttons">
            <button class="btn btn-primary" @click="loadLocations">
              Search
            </button>
            <button class="btn btn-ghost" @click="resetFilters">
              Reset
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="locations-layout">
      <div class="locations-panel">
        <div v-if="loading" class="status-note">Loading...</div>
        <div v-else-if="error" class="status-note status-error">{{ error }}</div>

        <div v-else class="location-grid">
          <article
            v-for="loc in sortedLocations"
            :key="loc.id"
            :id="`location-card-${loc.id}`"
            class="location-card"
            :class="{ selected: selectedLocation?.id === loc.id }"
            @click="focusLocation(loc)"
          >
            <header class="location-head">
              <h3>{{ loc.city }}, {{ loc.state }}</h3>
              <span
                class="status-pill"
                :class="loc.open_for_business ? 'status-open' : 'status-closed'"
              >
                {{ loc.open_for_business ? 'Open' : 'Opening soon' }}
              </span>
            </header>

            <div class="location-body">
              <div class="location-address">
                <div>{{ loc.address_one }}</div>
                <div v-if="loc.address_two">{{ loc.address_two }}</div>
                <div>{{ loc.city }}, {{ loc.state }} {{ loc.zip_code }}</div>
              </div>

              <div class="location-contact" v-if="loc.phone_number || loc.email">
                <div v-if="loc.phone_number">{{ loc.phone_number }}</div>
                <div v-if="loc.email" class="muted">{{ loc.email }}</div>
              </div>

              <div class="location-amenities">
                <span v-if="loc.wifi" class="tag">Wi-Fi</span>
                <span v-if="loc.drive_thru" class="tag">Drive-thru</span>
                <span v-if="loc.door_dash" class="tag">DoorDash</span>
              </div>

              <details class="hours">
                <summary>Hours</summary>
                <table class="hours-table">
                  <tbody>
                    <tr v-for="day in days" :key="day.key">
                      <th>{{ day.label }}</th>
                      <td>{{ formatHours(loc, day.key) }}</td>
                    </tr>
                  </tbody>
                </table>
              </details>
            </div>
          </article>
        </div>
      </div>

      <div class="map-panel">
        <div v-if="mapReady" class="map-wrapper">
          <LMap
            ref="map"
            v-model:zoom="mapZoom"
            :center="mapCenter"
            style="height: 100%; width: 100%;"
          >
            <LTileLayer :url="tileUrl" />

            <LMarker
              v-for="loc in sortedLocations"
              :key="loc.id"
              :lat-lng="[Number(loc.location_map_lat), Number(loc.location_map_lng)]"
              :icon="selectedLocation?.id === loc.id ? redIcon : defaultIcon"
              @click="focusLocation(loc)"
            >
              <LTooltip>
                <strong>{{ loc.city }}, {{ loc.state }}</strong><br />
                {{ loc.address_one }}
              </LTooltip>
            </LMarker>
          </LMap>
        </div>
      </div>
    </div>
  </section>
</template>

<script>
import { nextTick } from 'vue';
import { fetchJSON } from '../api';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

import {
  LMap,
  LTileLayer,
  LMarker,
  LTooltip
} from '@vue-leaflet/vue-leaflet';

const redIcon = new L.Icon({
  iconUrl:
    'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  shadowUrl:
    'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA',
  'KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT',
  'VA','WA','WV','WI','WY'
];

export default {
  name: 'LocationsView',

  components: {
    LMap,
    LTileLayer,
    LMarker,
    LTooltip
  },

  data() {
    return {
      locations: [],
      loading: false,
      error: null,

      cityQuery: '',
      selectedState: '',
      storeStatus: '',
      sortBy: 'city_asc',

      mapReady: false,
      mapCenter: [39.5, -98.35],
      mapZoom: 4,

      selectedLocation: null,

      tileUrl: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',

      redIcon,
      defaultIcon: new L.Icon.Default(),

      states: US_STATES,

      days: [
        { key: 'monday', label: 'Mon' },
        { key: 'tuesday', label: 'Tue' },
        { key: 'wednesday', label: 'Wed' },
        { key: 'thursday', label: 'Thu' },
        { key: 'friday', label: 'Fri' },
        { key: 'saturday', label: 'Sat' },
        { key: 'sunday', label: 'Sun' }
      ]
    };
  },

  computed: {
    sortedLocations() {
      let copy = [...this.locations];

      copy = copy.filter(loc => {
        if (this.storeStatus === 'open') {
          return loc.open_for_business === true;
        }

        if (this.storeStatus === 'opening_soon') {
          return loc.open_for_business === false;
        }

        return true;
      });

      copy.sort((a, b) =>
        (this.sortBy === 'city_desc' ? -1 : 1) *
        (a.city || '').localeCompare(b.city || '')
      );

      return copy;
    }
  },

  async mounted() {
    await this.loadLocations();
    await nextTick();
    this.mapReady = true;
  },

  methods: {
    async loadLocations() {
      this.loading = true;
      this.error = null;

      try {
        const params = new URLSearchParams();

        if (this.cityQuery.trim()) params.set('city', this.cityQuery.trim());
        if (this.selectedState) params.set('state', this.selectedState);

        params.set('limit', '500');

        const data = await fetchJSON(`/locations?${params.toString()}`);
        this.locations = data.results || [];
      } catch (e) {
        this.error = e.message;
        this.locations = [];
      } finally {
        this.loading = false;
      }
    },

    focusLocation(loc) {
      this.selectedLocation = loc;

      this.mapCenter = [
        Number(loc.location_map_lat),
        Number(loc.location_map_lng)
      ];
      this.mapZoom = 14;

      this.$nextTick(() => {
        const el = document.getElementById(`location-card-${loc.id}`);
        el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
    },

    resetFilters() {
      this.cityQuery = '';
      this.selectedState = '';
      this.storeStatus = '';
      this.sortBy = 'city_asc';
      this.loadLocations();
    },

    formatTime(value) {
      if (value === null || value === undefined || value === '') return null;

      const num = Number(value);
      if (Number.isNaN(num)) return value;

      const hours = Math.floor(num / 100);
      const minutes = num % 100;

      const period = hours >= 12 ? 'PM' : 'AM';
      const displayHour = hours % 12 || 12;
      const displayMinutes = String(minutes).padStart(2, '0');

      return `${displayHour}:${displayMinutes} ${period}`;
    },

    formatHours(loc, key) {
      const open = loc[`hours_${key}_open`];
      const close = loc[`hours_${key}_close`];

      if (
        (open === null || open === undefined || open === '') &&
        (close === null || close === undefined || close === '')
      ) {
        return 'Closed';
      }

      if (
        open === null || open === undefined || open === '' ||
        close === null || close === undefined || close === ''
      ) {
        return '—';
      }

      return `${this.formatTime(open)} – ${this.formatTime(close)}`;
    }
  }
};
</script>

<style scoped>
.locations-layout {
  display: flex;
  justify-content: center;
  gap: 1.5rem;
  max-width: 1500px;
  margin: auto;
  padding: 1rem;
  border-radius: 18px;
  max-height: 3000px;
}

.locations-panel {
  flex: 0 0 350px;
  max-height: 85vh;
  overflow-y: auto;
}

.map-panel {
  flex: 0 0 900px;
  min-width: 750px;
  max-width: 1000px;
  max-height: 85vh;
  position: sticky;
  top: 1rem;
}

.map-wrapper {
  height: 100%;
  width: 100%;
  border-radius: 14px;
  overflow: hidden;
  border: 1.5px solid var(--color-cream-300);
  background: var(--color-cream-50);
  box-shadow: var(--shadow-sm);
}

.location-card {
  padding: 1.25rem;
  border: 1.5px solid var(--color-cream-300);
  border-radius: 14px;
  cursor: pointer;
  background: var(--color-cream-50);
  transition: all 0.2s ease;
  margin-bottom: 1rem;
}

.location-card:hover {
  transform: translateY(-2px);
  border-color: var(--color-coffee-400);
  box-shadow: var(--shadow-sm);
}

.location-card.selected {
  border: 2px solid #d32f2f;
}

.location-head {
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}

.location-head h3 {
  margin: 0;
  color: var(--color-coffee-900);
}

.location-body {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.location-contact {
  color: var(--color-coffee-700);
  font-size: 0.9rem;
}

.location-contact .muted {
  color: var(--color-coffee-600);
}

.location-amenities {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.tag {
  background: #dce8cf;
  padding: 0.3rem 0.6rem;
  border-radius: 999px;
  font-size: 0.8rem;
  color: var(--color-sage-800);
}

.hours {
  margin-top: 0.25rem;
}

.hours summary {
  cursor: pointer;
  color: var(--color-sage-700);
  font-weight: 600;
  font-size: 0.9rem;
  padding: 0.25rem 0;
}

.hours-table {
  width: 100%;
  margin-top: 0.5rem;
  border-collapse: collapse;
  font-size: 0.88rem;
}

.hours-table th,
.hours-table td {
  text-align: left;
  padding: 0.35rem 0.5rem;
  border-bottom: 1px solid var(--color-cream-200);
}

.hours-table th {
  font-weight: 500;
  color: var(--color-coffee-600);
  width: 40%;
}

.toolbar-card {
  background: var(--color-cream-100);
  border: 1px solid var(--color-cream-300);
  border-radius: 16px;
  padding: 1.25rem;
  margin-bottom: 1.25rem;
  box-shadow: var(--shadow-sm);
}

.search-toolbar {
  display: flex;
  align-items: flex-end;
  gap: 1rem;
  flex-wrap: wrap;
}

.toolbar-group {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.toolbar-grow {
  flex: 1;
  min-width: 260px;
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
  min-width: 240px;
}

.filter-control {
  min-width: 140px;
}

.toolbar-actions {
  justify-content: flex-end;
}

.action-buttons {
  display: flex;
  gap: 0.5rem;
}

@media (max-width: 900px) {
  .locations-layout {
    flex-direction: column;
  }

  .locations-panel,
  .map-panel {
    width: 100%;
    max-width: 100%;
    min-width: 0;
    position: static;
  }

  .locations-panel {
    max-height: 500px;
  }

  .map-panel {
    height: 500px;
  }
}
</style>