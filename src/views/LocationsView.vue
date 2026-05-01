<template>
  <section class="page">
    <div class="page-header">
      <h1>Find a café</h1>
      <p class="page-subhead">
        Filter by state or city to find the Uncle Joe's closest to you.
      </p>
    </div>

    <div class="toolbar">
      <div class="toolbar-group">
        <label for="filter-state">State</label>
        <select id="filter-state" v-model="selectedState" @change="loadLocations">
          <option value="">All states</option>
          <option v-for="s in states" :key="s" :value="s">{{ s }}</option>
        </select>
      </div>
      <div class="toolbar-group toolbar-group-grow">
        <label for="filter-city">City</label>
        <input
          id="filter-city"
          type="search"
          v-model="cityQuery"
          @keyup.enter="loadLocations"
          placeholder="Type a city, then press Enter"
        />
      </div>
      <div class="toolbar-group toolbar-group-checkbox">
        <label>
          <input type="checkbox" v-model="openOnly" @change="loadLocations" />
          Open for business only
        </label>
      </div>
      <button type="button" class="btn btn-primary" @click="loadLocations">Search</button>
      <button type="button" class="btn btn-ghost" @click="resetFilters" :disabled="!hasActiveFilters">
        Reset
      </button>
    </div>

    <div class="toolbar toolbar-sort">
      <div class="toolbar-group">
        <label for="sort-by">Sort by</label>
        <select id="sort-by" v-model="sortBy">
          <option v-for="opt in sortOptions" :key="opt.value" :value="opt.value">
            {{ opt.label }}
          </option>
        </select>
      </div>
    </div>

    <div v-if="loading" class="status-note">Loading locations...</div>
    <div v-else-if="error" class="status-note status-error">{{ error }}</div>
    <div v-else-if="!sortedLocations.length" class="status-note">
      No locations match your filters. Try broadening your search.
    </div>

    <div v-else>
      <div class="results-bar">
        Showing {{ sortedLocations.length }} location<span v-if="sortedLocations.length !== 1">s</span>
      </div>
      <div class="location-grid">
        <article v-for="loc in sortedLocations" :key="loc.id" class="location-card">
          <header class="location-head">
            <h3>{{ loc.city }}, {{ loc.state }}</h3>
            <span class="status-pill" :class="loc.open_for_business ? 'status-open' : 'status-closed'">
              {{ loc.open_for_business ? 'Open' : 'Closed' }}
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

            <div class="location-amenities" v-if="loc.wifi || loc.drive_thru || loc.door_dash">
              <span class="tag" v-if="loc.wifi">Wi-Fi</span>
              <span class="tag" v-if="loc.drive_thru">Drive-thru</span>
              <span class="tag" v-if="loc.door_dash">DoorDash</span>
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
  </section>
</template>

<script>
import { fetchJSON } from '../api.js';

const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA',
  'KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT',
  'VA','WA','WV','WI','WY'
];
const DAYS = [
  { key: 'monday',    label: 'Mon' },
  { key: 'tuesday',   label: 'Tue' },
  { key: 'wednesday', label: 'Wed' },
  { key: 'thursday',  label: 'Thu' },
  { key: 'friday',    label: 'Fri' },
  { key: 'saturday',  label: 'Sat' },
  { key: 'sunday',    label: 'Sun' }
];

const DEFAULT_SORT = 'city_asc';
const SORT_OPTIONS = [
  { value: 'city_asc',  label: 'City: A–Z' },
  { value: 'city_desc', label: 'City: Z–A' }
];

// Case-sensitive locale compare. Uppercase letters sort before lowercase
// in standard locale order, so "Austin" precedes "austin".
function compareStrings(a, b) {
  return (a || '').localeCompare(b || '');
}

// Stable, deterministic comparator: city, then state, then street address.
// Returns a comparator function for the given direction.
function makeCityComparator(direction) {
  const dir = direction === 'desc' ? -1 : 1;
  return (a, b) => {
    const cityCmp = compareStrings(a.city, b.city);
    if (cityCmp !== 0) return cityCmp * dir;
    // Ties break on state, then address — these stay ascending so that
    // even in Z–A mode, ties within a city read naturally.
    const stateCmp = compareStrings(a.state, b.state);
    if (stateCmp !== 0) return stateCmp;
    return compareStrings(a.address_one, b.address_one);
  };
}

export default {
  name: 'LocationsView',
  data() {
    return {
      locations: [],
      loading: false,
      error: null,
      selectedState: '',
      cityQuery: '',
      openOnly: false,
      sortBy: DEFAULT_SORT,
      states: US_STATES,
      days: DAYS,
      sortOptions: SORT_OPTIONS
    };
  },
  computed: {
    hasActiveFilters() {
      return !!(
        this.selectedState ||
        this.cityQuery ||
        this.openOnly ||
        this.sortBy !== DEFAULT_SORT
      );
    },
    sortedLocations() {
      // Copy the array so we don't mutate the source from the API.
      const copy = this.locations.slice();
      const direction = this.sortBy === 'city_desc' ? 'desc' : 'asc';
      return copy.sort(makeCityComparator(direction));
    }
  },
  async mounted() {
    await this.loadLocations();
  },
  methods: {
    async loadLocations() {
      this.loading = true;
      this.error = null;
      try {
        const params = new URLSearchParams();
        if (this.selectedState) params.set('state', this.selectedState);
        if (this.cityQuery.trim()) params.set('city', this.cityQuery.trim());
        if (this.openOnly) params.set('open_only', 'true');
        params.set('limit', '200');
        const data = await fetchJSON(`/locations?${params.toString()}`);
        this.locations = data.results || data || [];
      } catch (e) {
        this.error = e.message;
        this.locations = [];
      } finally {
        this.loading = false;
      }
    },
    resetFilters() {
      this.selectedState = '';
      this.cityQuery = '';
      this.openOnly = false;
      this.sortBy = DEFAULT_SORT;
      this.loadLocations();
    },
    formatHours(loc, key) {
      const open = loc[`hours_${key}_open`];
      const close = loc[`hours_${key}_close`];
      if (!open && !close) return 'Closed';
      if (!open || !close) return '—';
      return `${open} – ${close}`;
    }
  }
};
</script>

<style scoped>
.toolbar-sort {
  margin-top: 0.75rem;
}
.results-bar {
  color: var(--color-coffee-600);
  font-size: 0.9rem;
  margin-bottom: 1.5rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid var(--color-cream-200);
}
.location-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1.25rem;
}
.location-card {
  background: var(--color-cream-50);
  border: 1px solid var(--color-cream-200);
  border-radius: var(--radius-md);
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.location-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.75rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid var(--color-cream-200);
}
.location-head h3 { margin: 0; font-size: 1.15rem; color: var(--color-coffee-900); }
.location-body { display: flex; flex-direction: column; gap: 0.85rem; font-size: 0.95rem; }
.location-address { color: var(--color-coffee-800); line-height: 1.45; }
.location-contact { color: var(--color-coffee-700); font-size: 0.9rem; }
.location-contact .muted { color: var(--color-coffee-600); }
.location-amenities { display: flex; flex-wrap: wrap; gap: 0.4rem; }

.hours { margin-top: 0.25rem; }
.hours summary {
  cursor: pointer;
  color: var(--color-sage-700);
  font-weight: 600;
  font-size: 0.9rem;
  padding: 0.25rem 0;
  user-select: none;
}
.hours summary:hover { color: var(--color-sage-600); }
.hours-table {
  width: 100%;
  margin-top: 0.5rem;
  border-collapse: collapse;
  font-size: 0.88rem;
}
.hours-table th, .hours-table td {
  text-align: left;
  padding: 0.35rem 0.5rem;
  border-bottom: 1px solid var(--color-cream-200);
}
.hours-table th {
  font-weight: 500;
  color: var(--color-coffee-600);
  width: 40%;
}
.hours-table tr:last-child th,
.hours-table tr:last-child td { border-bottom: none; }
</style>
