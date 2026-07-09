// Schema config for every collection the public site's assets/js/cms.js expects.
// Pure data only (no Node APIs) so it is safe to import from client components too.

const bannerFields = [
  { name: 'title', type: 'text', label: 'Title' },
  { name: 'subtitle', type: 'text', label: 'Subtitle' },
  { name: 'image', type: 'image', label: 'Desktop Image' },
  { name: 'mobileImage', type: 'image', label: 'Mobile Image (optional)' },
  { name: 'order', type: 'number', label: 'Order', default: 0 },
  { name: 'active', type: 'boolean', label: 'Active', default: true },
];

const highlightFields = [
  { name: 'icon', type: 'text', label: 'Icon (remixicon class, optional)' },
  { name: 'boldText', type: 'text', label: 'Bold lead-in text (optional)' },
  { name: 'text', type: 'text', label: 'Text' },
];

export const collections = {
  'home-banner-slides': {
    label: 'Home Banner Slides',
    group: 'Banners',
    titleField: 'title',
    fields: bannerFields,
  },
  'explore-banner-slides': {
    label: 'Explore Banner Slides',
    group: 'Banners',
    titleField: 'title',
    fields: bannerFields,
  },
  'itineraries-banner-slides': {
    label: 'Itineraries Banner Slides',
    group: 'Banners',
    titleField: 'title',
    fields: bannerFields,
  },
  // Hidden from the admin dashboard + sidebar (not needed there right now), but
  // kept registered — the live frontend still reads these via /api/*
  // (package pages' banner slides, and the media page's hero banner image).
  'package-banner-slides': {
    label: 'Package Banner Slides',
    group: 'Banners',
    hidden: true,
    titleField: 'title',
    fields: [
      { name: 'packageSlug', type: 'text', label: 'Package Slug (matches itinerary slug)', required: true },
      ...bannerFields,
    ],
  },
  'media-banners': {
    label: 'Page Media Banners',
    group: 'Banners',
    hidden: true,
    titleField: 'page',
    fields: [
      { name: 'page', type: 'text', label: 'Page key (e.g. about, contact, media)', required: true },
      { name: 'title', type: 'text', label: 'Title' },
      { name: 'subtitle', type: 'text', label: 'Subtitle' },
      { name: 'description', type: 'textarea', label: 'Description' },
      { name: 'backgroundImage', type: 'image', label: 'Background Image' },
    ],
  },

  'explore-listings': {
    label: 'Explore Listings',
    group: 'Destinations',
    titleField: 'destinationName',
    // At most 5 listings may be shown in the home page "Top Destinations" strip.
    featureLimit: { field: 'homeFeature', max: 5, label: 'home page' },
    // Shows an "N excursions" column in the list — how many Excursions
    // (City Detail Page cards) are linked to each destination.
    relatedCount: { collection: 'excursions', ownField: 'destinationSlug', matchField: 'destinationSlug', label: 'excursions' },
    fields: [
      { name: 'destinationName', type: 'text', label: 'Destination Name', required: true },
      { name: 'destinationSlug', type: 'slug', label: 'Destination Slug', sourceField: 'destinationName', sourceLabel: 'the destination name', required: true },
      { name: 'description', type: 'textarea', label: 'Description' },
      { name: 'image', type: 'image', label: 'Image' },
      { name: 'homeFeature', type: 'boolean', label: 'Show on Home Page (Top Destinations — max 5)', default: false },
      { name: 'order', type: 'number', label: 'Order', default: 0 },
      { name: 'active', type: 'boolean', label: 'Active', default: true },
    ],
  },
  excursions: {
    label: 'Excursions (City Detail Pages)',
    group: 'Destinations',
    titleField: 'title',
    fields: [
      { name: 'title', type: 'text', label: 'Title', required: true },
      { name: 'image', type: 'image', label: 'Image' },
      { name: 'location', type: 'text', label: 'Location' },
      { name: 'duration', type: 'text', label: 'Duration' },
      { name: 'startTour', type: 'text', label: 'Start Tour' },
      { name: 'transportation', type: 'text', label: 'Transportation' },
      { name: 'description', type: 'textarea', label: 'Description (shown on card flip-back)' },
      {
        name: 'destinationSlug', type: 'reference', label: 'Destination (which city page this shows on)', required: true,
        referenceCollection: 'explore-listings', referenceValueField: 'destinationSlug', referenceLabelField: 'destinationName',
      },
      { name: 'order', type: 'number', label: 'Order on Destination Detail Page', default: 0 },
    ],
  },

  itineraries: {
    label: 'Itineraries / Packages',
    group: 'Itineraries',
    titleField: 'title',
    fields: [
      { name: 'title', type: 'text', label: 'Title', required: true },
      { name: 'slug', type: 'slug', label: 'Slug', sourceField: 'title', sourceLabel: 'the title', required: true },
      { name: 'image', type: 'image', label: 'Image (card + hero)' },
      { name: 'duration', type: 'text', label: 'Duration (e.g. 5 Days / 4 Nights)' },
      { name: 'price', type: 'text', label: 'Price (e.g. From $280)' },
      { name: 'heroTitle', type: 'text', label: 'Hero Title (optional override)' },
      { name: 'heroBadge', type: 'text', label: 'Hero Badge Text' },
      { name: 'featured', type: 'boolean', label: 'Featured', default: false },
      { name: 'priceDouble', type: 'text', label: 'Price — Double Room' },
      { name: 'priceSingle', type: 'text', label: 'Price — Single Supplement' },
      { name: 'hotelNotes', type: 'textarea', label: 'Hotel Notes' },
      { name: 'description', type: 'textarea', label: 'Description' },
      { name: 'order', type: 'number', label: 'Order', default: 0 },
      {
        name: 'itinerary', type: 'array', label: 'Day-by-Day Itinerary',
        itemLabel: 'title',
        fields: [
          { name: 'day', type: 'number', label: 'Day #', default: 1 },
          { name: 'title', type: 'text', label: 'Title' },
          { name: 'description', type: 'textarea', label: 'Description' },
          { name: 'highlights', type: 'array', label: 'Highlights', itemLabel: 'text', fields: highlightFields },
        ],
      },
      {
        name: 'gallery', type: 'array', label: 'Photo Gallery',
        itemLabel: 'alt',
        fields: [
          { name: 'image', type: 'image', label: 'Image' },
          { name: 'alt', type: 'text', label: 'Alt Text' },
        ],
      },
      {
        name: 'inclusions', type: 'array', label: 'Package Inclusions',
        itemLabel: 'text',
        fields: [{ name: 'text', type: 'text', label: 'Text' }],
      },
    ],
  },

  'tour-packages': {
    label: 'Tour Package Cards (Home)',
    group: 'Itineraries',
    titleField: 'title',
    fields: [
      { name: 'title', type: 'text', label: 'Title', required: true },
      { name: 'image', type: 'image', label: 'Image' },
      { name: 'link', type: 'text', label: 'Link (e.g. itinerary.html?slug=...)' },
      { name: 'featured', type: 'boolean', label: 'Featured', default: true },
      { name: 'order', type: 'number', label: 'Order', default: 0 },
    ],
  },

  'blog-categories': {
    label: 'Blog Categories',
    group: 'Blog',
    titleField: 'name',
    // Shows an "N posts" column in the list — how many Blog Posts are
    // tagged with each category.
    relatedCount: { collection: 'blog-posts', ownField: 'slug', matchField: 'category', label: 'posts' },
    fields: [
      { name: 'name', type: 'text', label: 'Name', required: true },
      { name: 'slug', type: 'slug', label: 'Slug', sourceField: 'name', sourceLabel: 'the name', required: true },
      { name: 'order', type: 'number', label: 'Order', default: 0 },
      { name: 'active', type: 'boolean', label: 'Active', default: true },
    ],
  },
  'blog-posts': {
    label: 'Blog Posts',
    group: 'Blog',
    titleField: 'title',
    fields: [
      { name: 'title', type: 'text', label: 'Title', required: true },
      {
        name: 'category', type: 'reference', label: 'Category', required: true,
        referenceCollection: 'blog-categories', referenceValueField: 'slug', referenceLabelField: 'name',
      },
      { name: 'excerpt', type: 'textarea', label: 'Excerpt' },
      { name: 'content', type: 'textarea', label: 'Content' },
      { name: 'image', type: 'image', label: 'Cover Image' },
      { name: 'author', type: 'text', label: 'Author' },
      { name: 'publishedDate', type: 'text', label: 'Published Date (YYYY-MM-DD)' },
      { name: 'featured', type: 'boolean', label: 'Featured', default: false },
    ],
  },

  brochures: {
    label: 'Brochure',
    group: 'Media',
    // Exactly one document ever exists — the admin UI skips the normal
    // list/"+ New" flow and always goes straight to editing (or creating)
    // this one record, so there's no way to end up with a second brochure.
    singleton: true,
    fields: [
      { name: 'file', type: 'file', label: 'Brochure PDF', accept: '.pdf,application/pdf', required: true },
      { name: 'active', type: 'boolean', label: 'Active (shown on the Media page)', default: true },
    ],
  },

  'gallery-items': {
    label: 'Gallery Items',
    group: 'Media',
    titleField: 'title',
    fields: [
      { name: 'image', type: 'image', label: 'Image', required: true },
      { name: 'title', type: 'text', label: 'Title' },
      { name: 'description', type: 'textarea', label: 'Description' },
      { name: 'order', type: 'number', label: 'Order', default: 0 },
    ],
  },
  testimonials: {
    label: 'Testimonials',
    group: 'Media',
    titleField: 'author',
    fields: [
      { name: 'author', type: 'text', label: 'Author', required: true },
      { name: 'role', type: 'text', label: 'Role' },
      { name: 'quote', type: 'textarea', label: 'Quote' },
      { name: 'image', type: 'image', label: 'Image' },
      { name: 'rating', type: 'number', label: 'Rating (1-5)', default: 5 },
      { name: 'featured', type: 'boolean', label: 'Featured', default: true },
      { name: 'order', type: 'number', label: 'Order', default: 0 },
    ],
  },
  bloggers: {
    label: 'Bloggers',
    group: 'Media',
    titleField: 'name',
    fields: [
      { name: 'name', type: 'text', label: 'Name', required: true },
      { name: 'role', type: 'text', label: 'Role' },
      { name: 'image', type: 'image', label: 'Image' },
      { name: 'videoUrl', type: 'text', label: 'Video URL (optional)' },
      { name: 'order', type: 'number', label: 'Order', default: 0 },
    ],
  },
};

export const collectionSlugs = Object.keys(collections);

export function getCollection(slug) {
  return collections[slug] || null;
}

// Drives the sidebar nav + dashboard cards only. `hidden` collections stay
// fully registered (their /api/* routes and /admin edit pages keep working) —
// they're just left out of this navigation listing.
export const collectionGroups = collectionSlugs.reduce((groups, slug) => {
  const def = collections[slug];
  if (def.hidden) return groups;
  const group = def.group || 'Other';
  if (!groups[group]) groups[group] = [];
  groups[group].push({ slug, ...def });
  return groups;
}, {});
