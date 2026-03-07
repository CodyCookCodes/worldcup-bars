const SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTkHOkygOrrQTtoGTP5ivH6Fe-U_Ym1cqrt7TymLNEHyTSOE1KQJOnCLqi0KpuUEA_UVkXvL8a5OQoe/pub?gid=0&single=true&output=csv';
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

// Dark map style matching site aesthetic
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
];

// Orange pin SVG
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

function makePinIcon(grey = false) {
  const svg = grey ? GREY_PIN_SVG : ORANGE_PIN_SVG;
  return {
    url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg),
    scaledSize: new google.maps.Size(28, 36),
    anchor: new google.maps.Point(14, 36),
  };
}

// Map state
let gMap = null;
let gMarkers = []; // { marker, nation }

window.buildMap = function(bars) {
  const loadingEl = document.getElementById('map-loading');
  const mappable = bars.filter(b => b.address);

  if (!mappable.length) {
    if (loadingEl) loadingEl.style.display = 'none';
    document.querySelector('.map-section').style.display = 'none';
    return;
  }

  const mapEl = document.getElementById('map');
  if (loadingEl) loadingEl.style.display = 'none';
  mapEl.style.display = 'block';

  gMap = new google.maps.Map(mapEl, {
    zoom: 13,
    center: { lat: 37.8044, lng: -122.2712 },
    styles: MAP_STYLE,
    disableDefaultUI: false,
    zoomControl: true,
    mapTypeControl: false,
    streetViewControl: false,
    fullscreenControl: true,
  });

  const bounds = new google.maps.LatLngBounds();
  const geocoder = new google.maps.Geocoder();
  let resolved = 0;

  const checkDone = () => {
    if (resolved === mappable.length && !bounds.isEmpty()) {
      gMap.fitBounds(bounds);
      google.maps.event.addListenerOnce(gMap, 'bounds_changed', () => {
        if (gMap.getZoom() > 15) gMap.setZoom(15);
      });
    }
  };

  // One shared InfoWindow so only one is open at a time
  const infoWindow = new google.maps.InfoWindow({
    disableAutoPan: false,
    maxWidth: 280,
  });

  mappable.forEach(bar => {
    const request = bar.place_id
      ? { placeId: bar.place_id }
      : { address: bar.address };

    geocoder.geocode(request, (results, status) => {
      resolved++;
      if (status === 'OK' && results[0]) {
        const pos = results[0].geometry.location;
        bounds.extend(pos);

        const marker = new google.maps.Marker({
          position: pos,
          map: gMap,
          title: bar.name,
          icon: makePinIcon(false),
          optimized: false,
        });

        marker.addListener('click', () => {
          infoWindow.setContent(`
            <div style="
              font-family: 'Inter', sans-serif;
              background: #1a1a1a;
              color: #f0f0f0;
              padding: 10px 12px;
              border-radius: 6px;
            ">
              <div style="font-weight: 700; white-space: normal; word-break:break-word; font-size: 0.95rem; color: #ffffff; margin-bottom: 3px;">
                ${escape(bar.name)}
              </div>
              <div style="font-size: 0.75rem; color: #F79621; margin-bottom: 8px;">
                ${escape(bar.nation || '')}
              </div>
              <a href="${buildMapsUrl(bar)}" target="_blank" style="
                display: inline-block;
                font-size: 0.72rem;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                color: #111;
                background: #F79621;
                border-radius: 4px;
                padding: 4px 10px;
                text-decoration: none;
              ">📍 Open in Maps</a>
            </div>
          `);
          infoWindow.open(gMap, marker);
        });

        gMarkers.push({
          marker,
          nation: (bar.nation || 'all nations').toLowerCase().trim(),
        });
      } else {
        console.warn(`Geocode failed for ${bar.name}: ${status}`);
      }
      checkDone();
    });
  });
};

// Called by filterBars to update pin visibility
window.filterMapPins = function(nation) {
  gMarkers.forEach(({ marker, nation: pinNation }) => {
    const isMatch = nation === 'all' || pinNation === nation;
    marker.setIcon(makePinIcon(!isMatch));
    marker.setZIndex(isMatch ? 10 : 1);
  });
};

function escape(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function getFlag(nation) {
  const key = nation.toLowerCase().trim();
  if (!(key in FLAGS)) return '<span style="font-size:1.3rem">🏳</span>';
  const code = FLAGS[key];
  if (code === null) return '<span style="font-size:1.3rem">🌍</span>';
  return `<img src="https://flagcdn.com/40x30/${code}.png" width="28" height="21" style="border-radius:2px" alt="${escape(nation)}">`;
}

function parseCSV(text) {
  const lines = text.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, '').toLowerCase());
  return lines.slice(1).map(line => {
    const cols = [];
    let cur = '', inQ = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') { inQ = !inQ; }
      else if (c === ',' && !inQ) { cols.push(cur.trim()); cur = ''; }
      else { cur += c; }
    }
    cols.push(cur.trim());
    const row = {};
    headers.forEach((h, i) => row[h] = (cols[i] || '').replace(/^"|"$/g, '').trim());
    return row;
  }).filter(row => row.name);
}

function buildMapsUrl(row) {
  const id = row.place_id ? row.place_id.replace(/[^a-zA-Z0-9_-]/g, '') : null;
  if (id) return `https://www.google.com/maps/place/?q=place_id:${id}`;
  return `https://www.google.com/maps/search/${encodeURIComponent((row.name || '') + ' ' + (row.address || ''))}`;
}

function buildCard(bar) {
  return `
    <a class="bar-card" href="${buildMapsUrl(bar)}" target="_blank">
      <div class="bar-name">${escape(bar.name)}</div>
      <div class="bar-address">${escape(bar.address || '').replace(/([A-Za-z]+)\s+(Oakland|Emeryville|Berkeley|San Leandro|San Francisco)/, '$1, $2')}</div>
      <div class="bar-meta">
        ${bar.type  ? `<span class="pill pill-type">${escape(bar.type)}</span>` : ''}
        ${bar.hours ? `<span class="pill pill-hours">${escape(bar.hours)}</span>` : ''}
      </div>
      <span class="map-link">📍 Open in Maps</span>
    </a>`;
}

function buildPage(bars) {
  const groups = {};
  bars.forEach(bar => {
    const nation = (bar.nation || 'All Nations').trim();
    if (!groups[nation]) groups[nation] = [];
    groups[nation].push(bar);
  });

  const sorted = Object.keys(groups).sort((a, b) => {
    if (a.toLowerCase() === 'all nations') return 1;
    if (b.toLowerCase() === 'all nations') return -1;
    return a.localeCompare(b);
  });

  const filterContainer = document.getElementById('filterButtons');
  sorted.forEach(nation => {
    const btn = document.createElement('button');
    btn.className = 'filter-btn';
    btn.innerHTML = `${getFlag(nation)} ${escape(nation)}`;
    btn.onclick = function() { filterBars(nation.toLowerCase(), this); };
    filterContainer.appendChild(btn);
  });

  document.getElementById('barList').innerHTML = sorted.map(nation => `
    <div class="category-block" data-nation="${escape(nation.toLowerCase())}">
      <div class="category-header">
        <span class="cat-flag">${getFlag(nation)}</span>
        <span class="cat-title">${escape(nation)}</span>
        <span class="cat-count">${groups[nation].length} bar${groups[nation].length !== 1 ? 's' : ''}</span>
      </div>
      <div class="bar-grid">${groups[nation].map(buildCard).join('')}</div>
    </div>
  `).join('');
}

function filterBars(nation, btn) {
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  document.querySelectorAll('.category-block').forEach(block => {
    nation === 'all'
      ? block.classList.remove('hidden')
      : block.dataset.nation === nation
        ? block.classList.remove('hidden')
        : block.classList.add('hidden');
  });
  // Update map pins
  if (window.filterMapPins) window.filterMapPins(nation);
}

async function loadBars() {
  try {
    const res = await fetch(SHEET_CSV_URL);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const text = await res.text();
    const bars = parseCSV(text);
    if (!bars.length) throw new Error('Sheet appears empty');
    buildPage(bars);

    // Hand bars to map — either map is already ready or we store for when it loads
    window._barsData = bars;
    if (window._mapReady) {
      window.buildMap(bars);
    } else {
      window._barsReady = true;
    }
  } catch (err) {
    document.getElementById('barList').innerHTML = `
      <div class="state-box">
        <div class="icon">⚠️</div>
        <p>Couldn't load the bar list.<br><br>
        Make sure your Google Sheet is published as a CSV.<br><br>
        <a href="https://support.google.com/docs/answer/183965" target="_blank">
          How to publish a Google Sheet as CSV →
        </a></p>
      </div>`;
    document.querySelector('.map-section').style.display = 'none';
    console.error(err);
  }
}

loadBars();