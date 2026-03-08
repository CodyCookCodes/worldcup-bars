// ─── Sheet URL ────────────────────────────────────────────────────────────────
const SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTkHOkygOrrQTtoGTP5ivH6Fe-U_Ym1cqrt7TymLNEHyTSOE1KQJOnCLqi0KpuUEA_UVkXvL8a5OQoe/pub?gid=0&single=true&output=csv';

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
  'ireland':        'ie', 'all nations':    null,
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