<template>
  <div>
    <section class="hero">
      <div class="hero-inner">
        <div class="hero-copy">
          <p class="hero-eyebrow">Neighborhood coffee, done right.</p>
          <h1>Good coffee.<br />Good people.<br />Good mornings.</h1>
          <p class="hero-lede">
            Nearly 500 neighborhood cafés across the upper Midwest, one simple menu,
            and a Coffee Club that quietly rewards you for showing up.
          </p>
          <div class="hero-actions">
            <router-link to="/menu" class="btn btn-primary">Browse the menu</router-link>
            <router-link to="/locations" class="btn btn-secondary">Find a café</router-link>
          </div>
        </div>
        <div class="hero-card">
          <div class="hero-card-inner">
            <div class="hero-card-label">Coffee Club member?</div>
            <div class="hero-card-title">Track your points, see your past orders.</div>
            <router-link v-if="!user" to="/login" class="btn btn-accent">Sign in</router-link>
            <router-link v-else to="/account" class="btn btn-accent">Go to my account</router-link>
          </div>
        </div>
      </div>
    </section>

    <!-- Cafe atmosphere slideshow -------------------------------------- -->
    <!-- Sits between the hero and the feature cards. Auto-advances every -->
    <!-- 5s, pauses on hover, supports manual navigation via the dots,    -->
    <!-- and respects prefers-reduced-motion (no auto-advance for users   -->
    <!-- who've asked the OS for reduced motion).                         -->
    <section
      class="cafe-showcase"
      aria-label="Inside Uncle Joe's"
      @mouseenter="pauseSlideshow"
      @mouseleave="resumeSlideshow"
    >
      <div class="cafe-showcase-inner">
        <div class="cafe-slides">
          <div
            v-for="(slide, idx) in slides"
            :key="slide.src"
            class="cafe-slide"
            :class="{ 'is-active': idx === activeSlide }"
            :aria-hidden="idx !== activeSlide"
          >
            <img :src="slide.src" :alt="slide.alt" loading="lazy" />
            <div class="cafe-slide-caption">{{ slide.caption }}</div>
          </div>
        </div>

        <div class="cafe-dots" role="tablist">
          <button
            v-for="(slide, idx) in slides"
            :key="`dot-${idx}`"
            type="button"
            class="cafe-dot"
            :class="{ 'is-active': idx === activeSlide }"
            :aria-label="`Show photo ${idx + 1}: ${slide.caption}`"
            :aria-selected="idx === activeSlide"
            role="tab"
            @click="goToSlide(idx)"
          ></button>
        </div>
      </div>
    </section>
    <!-- End slideshow --------------------------------------------------- -->

    <section class="features">
      <div class="features-inner">
        <div class="feature-card">
          <div class="feature-title">Simple menu</div>
          <p>Coffee, espresso, tea, and the classics. No gimmicks, no surprises.</p>
          <router-link to="/menu" class="btn-text">See the menu</router-link>
        </div>
        <div class="feature-card feature-card-alt">
          <div class="feature-title">A café near you</div>
          <p>Hundreds of locations across Michigan, Wisconsin, Minnesota, and beyond.</p>
          <router-link to="/locations" class="btn-text">Find one</router-link>
        </div>
        <div class="feature-card">
          <div class="feature-title">Earn points, keep it simple</div>
          <p>One point for every whole dollar spent. That's it. No tiers, no expirations.</p>
          <router-link to="/login" class="btn-text" v-if="!user">Join the Club</router-link>
          <router-link to="/points" class="btn-text" v-else>View my points</router-link>
        </div>
      </div>
    </section>
  </div>
</template>

<script>
import { auth } from '../stores/auth';

import entrance from '../assets/cafe/entrance.png';
import baristaCounter from '../assets/cafe/barista-counter.png';
import mainSeating from '../assets/cafe/main-seating-area.png';
import communityTable from '../assets/cafe/community-table.png';
import readingNook from '../assets/cafe/reading-nook.png';
import windowView from '../assets/cafe/window-view.png';

// --- Slideshow config ----------------------------------------------------
//
// Slides are intentionally curated and ordered for narrative flow:
// arrival -> heart of the cafe -> social spaces -> quiet moments.
// To add or remove slides, edit this array and add/remove the matching
// import above. Captions are short on purpose — they're decorative, not
// alt text. (Alt text is set per slide for screen readers.)
//
const SLIDES = [
  { src: entrance,        alt: "Entrance to an Uncle Joe's cafe",         caption: "Step inside" },
  { src: baristaCounter,  alt: "Uncle Joe's barista counter and menu",    caption: "Behind the counter" },
  { src: mainSeating,     alt: "Main seating area with bookshelves",      caption: "A place to settle in" },
  { src: communityTable,  alt: "A guest reading at a community table",    caption: "Stay awhile" },
  { src: readingNook,     alt: "Leather chairs and books in a quiet nook",caption: "Quiet corners" },
  { src: windowView,      alt: "A window-side bar with plants and stools",caption: "Watch the day go by" }
];

const ADVANCE_INTERVAL_MS = 5000;

function prefersReducedMotion() {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export default {
  name: 'HomeView',
  data() {
    return {
      slides: SLIDES,
      activeSlide: 0,
      // Internal: not reactive on purpose — these are just timer handles
      _timer: null,
      _paused: false
    };
  },
  computed: {
    user() { return auth.user; }
  },
  mounted() {
    // Respect users who've asked for reduced motion: show the first slide
    // and let them advance manually via the dots, but don't auto-rotate.
    if (!prefersReducedMotion()) {
      this.startSlideshow();
    }
  },
  beforeUnmount() {
    this.stopSlideshow();
  },
  methods: {
    startSlideshow() {
      this.stopSlideshow();
      this._timer = setInterval(() => {
        if (!this._paused) {
          this.activeSlide = (this.activeSlide + 1) % this.slides.length;
        }
      }, ADVANCE_INTERVAL_MS);
    },
    stopSlideshow() {
      if (this._timer) {
        clearInterval(this._timer);
        this._timer = null;
      }
    },
    pauseSlideshow() { this._paused = true; },
    resumeSlideshow() { this._paused = false; },
    goToSlide(idx) {
      this.activeSlide = idx;
      // Restart the timer so the user gets a full interval to look at
      // the slide they just clicked, rather than it advancing immediately.
      if (!prefersReducedMotion()) {
        this.startSlideshow();
      }
    }
  }
};
</script>

<style scoped>
.hero {
  background: linear-gradient(180deg, var(--color-cream-100) 0%, var(--color-cream-50) 100%);
  padding: 5rem 1.5rem 4rem;
  position: relative;
  overflow: hidden;
}
.hero::before {
  content: "";
  position: absolute;
  top: -10%;
  right: -10%;
  width: 40vw;
  max-width: 500px;
  aspect-ratio: 1;
  background: radial-gradient(circle, var(--color-sage-100) 0%, transparent 70%);
  opacity: 0.8;
  pointer-events: none;
}
.hero-inner {
  max-width: 1200px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1.5fr 1fr;
  gap: 3rem;
  align-items: center;
  position: relative;
}
.hero-eyebrow {
  color: var(--color-sage-700);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  font-size: 0.85rem;
  margin-bottom: 1rem;
}
.hero h1 {
  font-size: clamp(2.5rem, 5vw, 4rem);
  line-height: 1.05;
  margin-bottom: 1.5rem;
}
.hero-lede {
  font-size: 1.15rem;
  color: var(--color-coffee-700);
  max-width: 540px;
  margin-bottom: 2rem;
}
.hero-actions { display: flex; gap: 1rem; flex-wrap: wrap; }

.hero-card {
  background: var(--color-coffee-800);
  color: var(--color-cream-100);
  border-radius: var(--radius-lg);
  padding: 2.5rem 2rem;
  box-shadow: var(--shadow-lg);
}
.hero-card-inner { display: flex; flex-direction: column; gap: 1rem; }
.hero-card-label {
  color: var(--color-sage-300);
  text-transform: uppercase;
  letter-spacing: 0.14em;
  font-size: 0.75rem;
  font-weight: 600;
}
.hero-card-title {
  font-family: var(--font-display);
  font-size: 1.5rem;
  line-height: 1.25;
  color: var(--color-cream-50);
  margin-bottom: 0.5rem;
}

/* --- Slideshow ------------------------------------------------------- */
.cafe-showcase {
  background: var(--color-coffee-900);
  padding: 3rem 1.5rem;
}
.cafe-showcase-inner {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}
.cafe-slides {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 7;
  overflow: hidden;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  background: var(--color-coffee-800);
}
.cafe-slide {
  position: absolute;
  inset: 0;
  opacity: 0;
  transition: opacity 1s ease-in-out;
  pointer-events: none;
}
.cafe-slide.is-active {
  opacity: 1;
  pointer-events: auto;
}
.cafe-slide img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.cafe-slide-caption {
  position: absolute;
  left: 1.5rem;
  bottom: 1.5rem;
  padding: 0.5rem 1rem;
  background: rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(4px);
  color: var(--color-cream-50);
  font-family: var(--font-display);
  font-size: 1.05rem;
  border-radius: var(--radius-md);
  letter-spacing: 0.02em;
}

.cafe-dots {
  display: flex;
  justify-content: center;
  gap: 0.6rem;
}
.cafe-dot {
  width: 0.6rem;
  height: 0.6rem;
  border-radius: 50%;
  border: none;
  background: rgba(255, 255, 255, 0.3);
  cursor: pointer;
  padding: 0;
  transition: background 0.2s ease, transform 0.2s ease;
}
.cafe-dot:hover { background: rgba(255, 255, 255, 0.55); }
.cafe-dot.is-active {
  background: var(--color-sage-300);
  transform: scale(1.25);
}
.cafe-dot:focus-visible {
  outline: 2px solid var(--color-sage-300);
  outline-offset: 2px;
}

/* For users who prefer reduced motion: no fade transition either. */
@media (prefers-reduced-motion: reduce) {
  .cafe-slide { transition: none; }
}
/* --- End slideshow --------------------------------------------------- */

.features {
  max-width: 1200px;
  margin: 0 auto;
  padding: 3.5rem 1.5rem;
}
.features-inner {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.5rem;
}
.feature-card {
  background: var(--color-cream-100);
  border: 1px solid var(--color-cream-200);
  border-radius: var(--radius-lg);
  padding: 2rem 1.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  transition: border-color 0.15s ease, transform 0.15s ease;
}
.feature-card:hover {
  border-color: var(--color-coffee-500);
  transform: translateY(-2px);
}
.feature-card-alt { background: var(--color-sage-100); border-color: var(--color-sage-300); }
.feature-title {
  font-family: var(--font-display);
  font-size: 1.25rem;
  color: var(--color-coffee-900);
  font-weight: 600;
}
.feature-card p { color: var(--color-coffee-700); margin: 0; }

@media (max-width: 820px) {
  .hero-inner { grid-template-columns: 1fr; }
  .features-inner { grid-template-columns: 1fr; }
  .hero { padding: 3rem 1.5rem 2.5rem; }
  .cafe-slides { aspect-ratio: 4 / 3; }
  .cafe-slide-caption {
    left: 1rem;
    bottom: 1rem;
    font-size: 0.95rem;
  }
}
</style>