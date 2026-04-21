// ─── Sheet URLs ───────────────────────────────────────────────────────────────
const SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTkHOkygOrrQTtoGTP5ivH6Fe-U_Ym1cqrt7TymLNEHyTSOE1KQJOnCLqi0KpuUEA_UVkXvL8a5OQoe/pub?gid=0&single=true&output=csv';

// Matches tab
const MATCHES_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTkHOkygOrrQTtoGTP5ivH6Fe-U_Ym1cqrt7TymLNEHyTSOE1KQJOnCLqi0KpuUEA_UVkXvL8a5OQoe/pub?gid=499767530&single=true&output=csv';

// Watch Parties tab
const WATCH_PARTIES_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTkHOkygOrrQTtoGTP5ivH6Fe-U_Ym1cqrt7TymLNEHyTSOE1KQJOnCLqi0KpuUEA_UVkXvL8a5OQoe/pub?gid=696168736&single=true&output=csv';

// Hotels tab
const HOTELS_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTkHOkygOrrQTtoGTP5ivH6Fe-U_Ym1cqrt7TymLNEHyTSOE1KQJOnCLqi0KpuUEA_UVkXvL8a5OQoe/pub?gid=737220771&single=true&output=csv';

// Restaurants tab
const RESTAURANTS_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTkHOkygOrrQTtoGTP5ivH6Fe-U_Ym1cqrt7TymLNEHyTSOE1KQJOnCLqi0KpuUEA_UVkXvL8a5OQoe/pub?gid=79488506&single=true&output=csv';

// Events tab
const EVENTS_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTkHOkygOrrQTtoGTP5ivH6Fe-U_Ym1cqrt7TymLNEHyTSOE1KQJOnCLqi0KpuUEA_UVkXvL8a5OQoe/pub?gid=1030120265&single=true&output=csv';

// ─── Country → flagcdn code map ───────────────────────────────────────────────
const FLAGS = {
  'canada':         'ca', 'mexico':         'mx', 'usa':            'us',
  'algeria':        'dz', 'argentina':      'ar', 'australia':      'au',
  'austria':        'at', 'belgium':        'be', 'brazil':         'br',
  'cabo verde':     'cv', 'colombia':       'co', 'croatia':        'hr',
  'curaçao':        'cw', 'côte d\'ivoire': 'ci', 'ecuador':        'ec',
  'egypt':          'eg', 'england':        'gb-eng', 'france':      'fr',
  'germany':        'de', 'ghana':          'gh', 'haiti':          'ht',
  'ir iran':        'ir', 'japan':          'jp', 'jordan':         'jo',
  'korea republic': 'kr', 'morocco':        'ma', 'netherlands':    'nl',
  'new zealand':    'nz', 'norway':         'no', 'panama':         'pa',
  'paraguay':       'py', 'portugal':       'pt', 'qatar':          'qa',
  'saudi arabia':   'sa', 'scotland':       'gb-sct', 'senegal':    'sn',
  'south africa':   'za', 'spain':          'es', 'switzerland':    'ch',
  'tunisia':        'tn', 'uruguay':        'uy', 'uzbekistan':     'uz',
  'ireland':        'ie', 'türkiye':        'tr', 'bosnia-herzegovina': 'ba',
  'czechia':        'cz', 'congo dr':       'cd', 'sweden':         'se',
  'iraq':           'iq', 'all nations':    null,
};

// ─── Google Maps dark style ───────────────────────────────────────────────────
const MAP_STYLE = [
  { elementType: 'geometry',        stylers: [{ color: '#111111' }] },
  { elementType: 'labels.text.fill',stylers: [{ color: '#888888' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#111111' }] },
  { featureType: 'road',            elementType: 'geometry',       stylers: [{ color: '#1e1e1e' }] },
  { featureType: 'road',            elementType: 'geometry.stroke', stylers: [{ color: '#2a2a2a' }] },
  { featureType: 'road',            elementType: 'labels.text.fill', stylers: [{ color: '#666666' }] },
  { featureType: 'road.highway',    elementType: 'geometry',       stylers: [{ color: '#2a2a2a' }] },
  { featureType: 'road.highway',    elementType: 'geometry.stroke', stylers: [{ color: '#333333' }] },
  { featureType: 'water',           elementType: 'geometry',       stylers: [{ color: '#0a0a0a' }] },
  { featureType: 'water',           elementType: 'labels.text.fill', stylers: [{ color: '#444444' }] },
  { featureType: 'poi',             elementType: 'geometry',       stylers: [{ color: '#151515' }] },
  { featureType: 'poi',             elementType: 'labels.text.fill', stylers: [{ color: '#555555' }] },
  { featureType: 'poi.park',        elementType: 'geometry',       stylers: [{ color: '#131a14' }] },
  { featureType: 'transit',         elementType: 'geometry',       stylers: [{ color: '#181818' }] },
  { featureType: 'administrative',  elementType: 'geometry.stroke', stylers: [{ color: '#2a2a2a' }] },
  { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#aaaaaa' }] },
  { featureType: 'landscape',       elementType: 'geometry',       stylers: [{ color: '#111111' }] },
  { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi.business', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
];

// ─── Map pin SVGs ─────────────────────────────────────────────────────────────
const ORANGE_PIN_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="28" height="36" viewBox="0 0 28 36">
  <path d="M14 0C6.268 0 0 6.268 0 14c0 9.333 14 22 14 22S28 23.333 28 14C28 6.268 21.732 0 14 0z"
        fill="#F79621" stroke="#c97000" stroke-width="1.5"/>
  <circle cx="14" cy="14" r="5" fill="#ffffff" opacity="0.9"/>
</svg>`;

const GREY_PIN_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="28" height="36" viewBox="0 0 28 36">
  <path d="M14 0C6.268 0 0 6.268 0 14c0 9.333 14 22 14 22S28 23.333 28 14C28 6.268 21.732 0 14 0z"
        fill="#333333" stroke="#222222" stroke-width="1.5"/>
  <circle cx="14" cy="14" r="5" fill="#555555" opacity="0.9"/>
</svg>`;

const RED_PIN_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="28" height="36" viewBox="0 0 28 36">
  <path d="M14 0C6.268 0 0 6.268 0 14c0 9.333 14 22 14 22S28 23.333 28 14C28 6.268 21.732 0 14 0z"
        fill="#e63946" stroke="#b52833" stroke-width="1.5"/>
  <circle cx="14" cy="14" r="5" fill="#ffffff" opacity="0.9"/>
</svg>`;

const BLUE_PIN_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="28" height="36" viewBox="0 0 28 36">
  <path d="M14 0C6.268 0 0 6.268 0 14c0 9.333 14 22 14 22S28 23.333 28 14C28 6.268 21.732 0 14 0z"
        fill="#65C2EE" stroke="#4a9ab5" stroke-width="1.5"/>
  <circle cx="14" cy="14" r="5" fill="#ffffff" opacity="0.9"/>
</svg>`;

const YELLOW_PIN_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="28" height="36" viewBox="0 0 28 36">
  <path d="M14 0C6.268 0 0 6.268 0 14c0 9.333 14 22 14 22S28 23.333 28 14C28 6.268 21.732 0 14 0z"
        fill="#FCE354" stroke="#c9aa00" stroke-width="1.5"/>
  <circle cx="14" cy="14" r="5" fill="#000000" opacity="0.5"/>
</svg>`;

const ROOTS_PIN_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="31" viewBox="0 0 28 36">
  <defs>
    <clipPath id="pinShape">
      <path d="M14 0C6.268 0 0 6.268 0 14c0 9.333 14 22 14 22S28 23.333 28 14C28 6.268 21.732 0 14 0z"/>
    </clipPath>
  </defs>
  <!-- Base fill cream so no dark gaps -->
  <path d="M14 0C6.268 0 0 6.268 0 14c0 9.333 14 22 14 22S28 23.333 28 14C28 6.268 21.732 0 14 0z"
        fill="#f5f0e0"/>
  <g clip-path="url(#pinShape)">
    <!-- Top left — Roots green -->
    <polygon points="15,0 0,0 0,14 8,14" fill="#25B67C"/>
    <!-- Top right — Roots blue -->
    <polygon points="13,0 28,0 28,14 20,14" fill="#EF4859"/>
    <!-- Left — Roots red -->
    <polygon points="0,14 8,14 8,14 4,26 0,22" fill="#EF4859"/>
    <!-- Right — Roots orange -->
    <polygon points="28,14 20,14 24,26 28,22" fill="#F79621"/>
    <!-- Bottom left — Roots yellow, stretches to tip -->
    <polygon points="4,26 8,14 14,20 14,36" fill="#FAE454"/>
    <!-- Bottom right — Roots blue, stretches to tip -->
    <polygon points="24,26 20,14 14,20 14,36" fill="#65C3EF"/>
    <!-- Center diamond — cream white -->
    <polygon points="14,6 20,14 14,20 8,14" fill="#f5f0e0" opacity="0.95"/>
    
    <!-- Lead lines -->
    <line x1="14" y1="4" x2="8" y2="14" stroke="#0d2b1a" stroke-width="0.8"/>
    <line x1="14" y1="4" x2="20" y2="14" stroke="#0d2b1a" stroke-width="0.8"/>
    <line x1="8" y1="14" x2="14" y2="20" stroke="#0d2b1a" stroke-width="0.8"/>
    <line x1="20" y1="14" x2="14" y2="20" stroke="#0d2b1a" stroke-width="0.8"/>
    <line x1="8" y1="14" x2="0" y2="14" stroke="#0d2b1a" stroke-width="0.8"/>
    <line x1="20" y1="14" x2="28" y2="14" stroke="#0d2b1a" stroke-width="0.8"/>
    <line x1="8" y1="14" x2="4" y2="26" stroke="#0d2b1a" stroke-width="0.8"/>
    <line x1="20" y1="14" x2="24" y2="26" stroke="#0d2b1a" stroke-width="0.8"/>
    <line x1="4" y1="26" x2="14" y2="36" stroke="#0d2b1a" stroke-width="0.8"/>
    <line x1="24" y1="26" x2="14" y2="36" stroke="#0d2b1a" stroke-width="0.8"/>
    <line x1="14" y1="20" x2="14" y2="36" stroke="#0d2b1a" stroke-width="0.8"/>
    <line x1="14" y1="0" x2="14" y2="4" stroke="#0d2b1a" stroke-width="0.8"/>
  </g>
  <!-- Outer border -->
  <path d="M14 0C6.268 0 0 6.268 0 14c0 9.333 14 22 14 22S28 23.333 28 14C28 6.268 21.732 0 14 0z"
        fill="none" stroke="#0d2b1a" stroke-width="1.5"/>
</svg> `;