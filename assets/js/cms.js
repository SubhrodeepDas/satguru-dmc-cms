'use strict';
/* =========================================================
   SATGURU DMC — CMS Client
   Local dev:  http://localhost:10006
   Server IP:  http://194.67.119.189:10006
   Domain:     https://satgurutravel.ru/dmc
========================================================= */
(function (window) {
  var host = window.location.hostname;
  var isLocal = host === 'localhost' || host === '127.0.0.1';
  var CMS_URL = (typeof window.getCmsUrl === 'function')
    ? window.getCmsUrl()
    : (isLocal ? 'http://localhost:10006' : 'http://194.67.119.189:10006');

  var CMS_ORIGIN = CMS_URL;

  function rewriteCmsOrigin(url) {
    if (!url) return url;
    if (isLocal) return url;
    url = url.replace(/^https?:\/\/[^/:]+:10054/, CMS_ORIGIN);
    url = url.replace(/^https?:\/\/satgurudmcadmin\.excellisit\.net/, CMS_ORIGIN);
    url = url.replace(/^https?:\/\/satguru-cms\.vercel\.app/, CMS_ORIGIN);
    if (CMS_ORIGIN && url.indexOf(CMS_ORIGIN) !== 0) {
      url = url.replace(/^https?:\/\/194\.67\.119\.189:10006/, CMS_ORIGIN);
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

    get: async function (endpoint) {
      try {
        var res = await fetch(CMS_URL + endpoint, { cache: 'no-store' });
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return await res.json();
      } catch (e) {
        console.error(
          '[Satguru CMS] fetch FAILED (' + e.message + ') for ' + CMS_URL + endpoint +
          ' — ensure the CMS is running on port 10006.'
        );
        return null;
      }
    },

    getHomeBannerSlides: async function () {
      return this.get('/api/home-banner-slides?where[active][equals]=true&sort=order&limit=20&depth=2');
    },

    getExploreBannerSlides: async function () {
      return this.get('/api/explore-banner-slides?where[active][equals]=true&sort=order&limit=20&depth=2');
    },

    getExploreListings: async function (limit) {
      return this.get('/api/explore-listings?where[active][equals]=true&sort=order&limit=' + (limit || 10));
    },

    getHomeExploreListings: async function () {
      return this.get('/api/explore-listings?where[homeFeature][equals]=true&where[active][equals]=true&sort=order&limit=5');
    },

    getItinerariesBannerSlides: async function () {
      return this.get('/api/itineraries-banner-slides?where[active][equals]=true&sort=order&limit=20&depth=2');
    },

    getPackageBannerSlides: async function (packageSlug) {
      return this.get('/api/package-banner-slides?where[packageSlug][equals]=' + encodeURIComponent(packageSlug) + '&where[active][equals]=true&sort=order&limit=20');
    },

    getTourPackages: async function () {
      return this.get('/api/tour-packages?where[featured][equals]=true&sort=order&limit=5');
    },

    getDestinations: async function (opts) {
      var qs = 'sort=order&limit=' + (opts && opts.limit ? opts.limit : 20);
      if (opts && opts.homeFeature) qs += '&where[homeFeature][equals]=true';
      if (opts && opts.active !== false) qs += '&where[active][equals]=true';
      return this.get('/api/destinations?' + qs);
    },

    getDestination: async function (slug) {
      return this.get('/api/destinations?where[slug][equals]=' + encodeURIComponent(slug) + '&limit=1');
    },

    getExploreExcursions: async function (limit) {
      return this.get('/api/excursions?where[homeFeature][equals]=true&sort=destinationOrder&limit=' + (limit || 6));
    },

    getExcursions: async function (destinationSlug) {
      return this.get('/api/excursions?where[destinationSlug][equals]=' + encodeURIComponent(destinationSlug) + '&where[homeFeature][not_equals]=true&sort=order&limit=20');
    },

    getItineraries: async function (opts) {
      var qs = 'sort=order&limit=50';
      if (opts && opts.featured) qs += '&where[featured][equals]=true';
      return this.get('/api/itineraries?' + qs);
    },

    getItinerary: async function (slug) {
      return this.get('/api/itineraries?where[slug][equals]=' + encodeURIComponent(slug) + '&limit=1');
    },

    getBlogCategories: async function () {
      return this.get('/api/blog-categories?where[active][equals]=true&sort=order&limit=20');
    },

    getBlogPosts: async function (category, limit) {
      var qs = 'sort=-publishedDate&limit=' + (limit || 20);
      if (category) qs += '&where[category][equals]=' + encodeURIComponent(category);
      return this.get('/api/blog-posts?' + qs);
    },

    getGalleryItems: async function (limit) {
      return this.get('/api/gallery-items?sort=order&limit=' + (limit || 20));
    },

    getTestimonials: async function (limit) {
      return this.get('/api/testimonials?where[featured][equals]=true&sort=order&limit=' + (limit || 20));
    },

    getBloggers: async function (limit) {
      return this.get('/api/bloggers?sort=order&limit=' + (limit || 10));
    },

    getMediaBanner: async function (page) {
      return this.get('/api/media-banners?where[page][equals]=' + encodeURIComponent(page) + '&limit=1');
    },

    getBrochure: async function () {
      return this.get('/api/brochures?where[active][equals]=true&sort=-updatedAt&limit=1');
    },

    imgUrl: function (imgField) {
      if (!imgField) return '';
      if (typeof imgField === 'string') return resolveUrl(imgField);
      if (imgField.url) return resolveUrl(imgField.url);
      if (imgField.sizes && imgField.sizes.card) return resolveUrl(imgField.sizes.card.url);
      return '';
    },
  };

  console.log('[Satguru CMS] API base →', CMS_URL);
  window.satguruCMS = satguruCMS;
})(window);
