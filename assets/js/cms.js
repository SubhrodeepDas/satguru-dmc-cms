'use strict';
/* =========================================================
   SATGURU DMC — Payload CMS Client
   Local dev: CMS at http://localhost:3002 (npm run dev -w cms)
   Production: API via same origin (server.js proxies /api + /media → :10054)
========================================================= */
(function (window) {
  // ▼▼▼ AFTER DEPLOYING THE CMS TO VERCEL, put its URL here ▼▼▼
  //   e.g. 'https://satguru-cms.vercel.app'  (no trailing slash)
  //   Leave '' to fall back to same-origin (only correct if the CMS API is
  //   proxied under the frontend's own domain).
  var PRODUCTION_CMS_URL = '';
  // ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲

  // Payload admin origin — used only to rewrite media URLs in API responses
  var CMS_ADMIN_ORIGIN = 'https://satgurudmcadmin.excellisit.net';

  var host = window.location.hostname;
  var isLocal = host === 'localhost' || host === '127.0.0.1';
  var CMS_URL = isLocal
    ? 'http://localhost:3002'
    : (PRODUCTION_CMS_URL || window.location.origin);

  function rewriteCmsOrigin(url) {
    if (isLocal || !url) return url;
    // IP staging: CMS on :10054
    url = url.replace(/^https?:\/\/[^/:]+:10054/, window.location.origin);
    // Domain: media URLs may point at the admin subdomain
    if (CMS_ADMIN_ORIGIN) {
      url = url.replace(new RegExp('^' + CMS_ADMIN_ORIGIN.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), window.location.origin);
    }
    return url;
  }

  function resolveUrl(url) {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return rewriteCmsOrigin(url);
    }
    return CMS_URL + url;
  }

  var satguruCMS = {
    url: CMS_URL,

    /* ── Core fetch ──────────────────────────────────── */
    get: async function (endpoint) {
      try {
        var res = await fetch(CMS_URL + endpoint, { cache: 'no-store' });
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return await res.json();
      } catch (e) {
        console.error(
          '[Satguru CMS] fetch FAILED (' + e.message + ') for ' + CMS_URL + endpoint +
          ' — ensure satguru-frontend proxies /api to CMS (port 10054) and satguru-cms is running.'
        );
        return null;
      }
    },

    /* ── Home Page ───────────────────────────────────── */
    getHomeBannerSlides: async function () {
      return this.get('/api/home-banner-slides?where[active][equals]=true&sort=order&limit=20&depth=2');
    },

    /* ── Explore Page ────────────────────────────────── */
    getExploreBannerSlides: async function () {
      return this.get('/api/explore-banner-slides?where[active][equals]=true&sort=order&limit=20&depth=2');
    },

    getExploreListings: async function (limit) {
      return this.get('/api/explore-listings?where[active][equals]=true&sort=order&limit=' + (limit || 10));
    },

    getHomeExploreListings: async function () {
      return this.get('/api/explore-listings?where[homeFeature][equals]=true&where[active][equals]=true&sort=order&limit=5');
    },

    /* ── Popular Itineraries Page ────────────────────── */
    getItinerariesBannerSlides: async function () {
      return this.get('/api/itineraries-banner-slides?where[active][equals]=true&sort=order&limit=20&depth=2');
    },

    /* ── Package Detail Pages ────────────────────────── */
    getPackageBannerSlides: async function (packageSlug) {
      return this.get('/api/package-banner-slides?where[packageSlug][equals]=' + encodeURIComponent(packageSlug) + '&where[active][equals]=true&sort=order&limit=20');
    },

    getTourPackages: async function () {
      return this.get('/api/tour-packages?where[featured][equals]=true&sort=order&limit=5');
    },

    /* ── Destinations ────────────────────────────────── */
    getDestinations: async function (opts) {
      var qs = 'sort=order&limit=' + (opts && opts.limit ? opts.limit : 20);
      if (opts && opts.homeFeature) qs += '&where[homeFeature][equals]=true';
      if (opts && opts.active !== false) qs += '&where[active][equals]=true';
      return this.get('/api/destinations?' + qs);
    },

    getDestination: async function (slug) {
      return this.get('/api/destinations?where[slug][equals]=' + encodeURIComponent(slug) + '&limit=1');
    },

    /* ── Excursions ──────────────────────────────────── */
    getExploreExcursions: async function (limit) {
      return this.get('/api/excursions?where[homeFeature][equals]=true&sort=destinationOrder&limit=' + (limit || 6));
    },

    getExcursions: async function (destinationSlug) {
      return this.get('/api/excursions?where[destinationSlug][equals]=' + encodeURIComponent(destinationSlug) + '&where[homeFeature][not_equals]=true&sort=order&limit=20');
    },

    /* ── Itineraries / Packages ──────────────────────── */
    getItineraries: async function (opts) {
      var qs = 'sort=order&limit=50';
      if (opts && opts.featured) qs += '&where[featured][equals]=true';
      return this.get('/api/itineraries?' + qs);
    },

    getItinerary: async function (slug) {
      return this.get('/api/itineraries?where[slug][equals]=' + encodeURIComponent(slug) + '&limit=1');
    },

    /* ── Blog Categories ─────────────────────────────── */
    getBlogCategories: async function () {
      return this.get('/api/blog-categories?where[active][equals]=true&sort=order&limit=20');
    },

    /* ── Blog Posts ──────────────────────────────────── */
    getBlogPosts: async function (category, limit) {
      var qs = 'sort=-publishedDate&limit=' + (limit || 20);
      if (category) qs += '&where[category][equals]=' + encodeURIComponent(category);
      return this.get('/api/blog-posts?' + qs);
    },

    /* ── Gallery ─────────────────────────────────────── */
    getGalleryItems: async function (limit) {
      return this.get('/api/gallery-items?sort=order&limit=' + (limit || 20));
    },

    /* ── Testimonials ────────────────────────────────── */
    getTestimonials: async function (limit) {
      return this.get('/api/testimonials?where[featured][equals]=true&sort=order&limit=' + (limit || 20));
    },

    /* ── Bloggers ────────────────────────────────────── */
    getBloggers: async function (limit) {
      return this.get('/api/bloggers?sort=order&limit=' + (limit || 10));
    },

    /* ── Page Banners ────────────────────────────────── */
    getMediaBanner: async function (page) {
      return this.get('/api/media-banners?where[page][equals]=' + encodeURIComponent(page) + '&limit=1');
    },

    /* ── Image URL helper ────────────────────────────── */
    imgUrl: function (imgField) {
      if (!imgField) return '';
      if (typeof imgField === 'string') return resolveUrl(imgField);
      if (imgField.url) return resolveUrl(imgField.url);
      if (imgField.sizes && imgField.sizes.card) return resolveUrl(imgField.sizes.card.url);
      return '';
    },
  };

  if (!isLocal) {
    console.log('[Satguru CMS] API base →', CMS_URL);
  }

  window.satguruCMS = satguruCMS;
})(window);
