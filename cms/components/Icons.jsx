// Small hand-rolled line-icon set — avoids pulling in an icon package for a handful of glyphs.

function Svg({ children, className }) {
  return (
    <svg
      className={className || 'w-4 h-4'}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </svg>
  );
}

export function IconGrid(props) {
  return (
    <Svg {...props}>
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </Svg>
  );
}

export function IconImage(props) {
  return (
    <Svg {...props}>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <circle cx="8.5" cy="9.5" r="1.5" />
      <path d="M21 16l-5.5-5.5a2 2 0 0 0-2.8 0L3 20" />
    </Svg>
  );
}

export function IconMapPin(props) {
  return (
    <Svg {...props}>
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="2.5" />
    </Svg>
  );
}

export function IconRoute(props) {
  return (
    <Svg {...props}>
      <circle cx="5.5" cy="18.5" r="2" />
      <circle cx="18.5" cy="5.5" r="2" />
      <path d="M7.3 17 16.7 7.5M18.5 7.5v3a3 3 0 0 1-3 3h-7a3 3 0 0 0-3 3" />
    </Svg>
  );
}

export function IconDocument(props) {
  return (
    <Svg {...props}>
      <path d="M7 3h7l5 5v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" />
      <path d="M14 3v5h5M9 13h6M9 17h6" />
    </Svg>
  );
}

export function IconPhoto(props) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="3.2" />
      <path d="M4.5 8.5 7 6M19.5 8.5 17 6" />
    </Svg>
  );
}

export function IconFolder(props) {
  return (
    <Svg {...props}>
      <path d="M3 6.5a1.5 1.5 0 0 1 1.5-1.5h4.4a1.5 1.5 0 0 1 1.2.6l1 1.4h8.4A1.5 1.5 0 0 1 21 8.5v9A1.5 1.5 0 0 1 19.5 19h-15A1.5 1.5 0 0 1 3 17.5v-11Z" />
    </Svg>
  );
}

export const GROUP_ICONS = {
  Banners: IconImage,
  Destinations: IconMapPin,
  Itineraries: IconRoute,
  Blog: IconDocument,
  Media: IconPhoto,
};

export function GroupIcon({ group, className }) {
  const Cmp = GROUP_ICONS[group] || IconFolder;
  return <Cmp className={className} />;
}
