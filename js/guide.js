// ─── Guide Page — Hotels, Restaurants & Events ───────────────────────────────
// Completely independent from main.js and map.js

let gGuideMap = null;
let gGuideInfoWindow = null;
let gHotelMarkers = [];
let gRestaurantMarkers = [];
let gEventMarkers = [];

// ─── Pin icon builders ────────────────────────────────────────────────────────
function makeGuidePinIcon(color) {
  const svg = color === 'blue'   ? BLUE_PIN_SVG
            : color === 'red'    ? RED_PIN_SVG
            : YELLOW_PIN_SVG;
  return {
    url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg),
    scaledSize: new google.maps.Size(22, 28),
    anchor: new google.maps.Point(11, 28),
  };
}

// ─── Build the guide map ──────────────────────────────────────────────────────
function buildGuideMap() {
  const mapEl = document.getElementById('map');
  const loadingEl = document.getElementById('map-loading');
  if (loadingEl) loadingEl.style.display = 'none';
  mapEl.style.display = 'block';

  gGuideMap = new google.maps.Map(mapEl, {
    zoom: 12,
    center: { lat: 37.82, lng: -122.28 },
    styles: MAP_STYLE,
    disableDefaultUI: false,
    zoomControl: true,
    mapTypeControl: false,
    streetViewControl: false,
    fullscreenControl: true,
  });

  gGuideInfoWindow = new google.maps.InfoWindow({ disableAutoPan: false });
}

// ─── Shared marker placer ─────────────────────────────────────────────────────
// Handles coords → place_id fallback, calls onPosition(latLng) when resolved
function resolvePosition(row, onPosition) {
  if (row.cords && row.cords.trim()) {
    const [latStr, lngStr] = row.cords.split(',');
    const lat = parseFloat(latStr), lng = parseFloat(lngStr);
    if (!isNaN(lat) && !isNaN(lng)) {
      onPosition(new google.maps.LatLng(lat, lng));
      return;
    }
  }
  if (row.place_id) {
    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ placeId: row.place_id.replace(/[^a-zA-Z0-9_-]/g, '') }, (results, status) => {
      if (status === 'OK' && results[0]) onPosition(results[0].geometry.location);
    });
  }
}

// ─── Place hotel markers ──────────────────────────────────────────────────────
function placeHotelMarkers(hotels) {
  if (!gGuideMap) return;
  hotels.forEach(hotel => {
    if (!hotel.cords && !hotel.place_id) return;
    resolvePosition(hotel, (pos) => {
      const marker = new google.maps.Marker({
        position: pos, map: gGuideMap, title: hotel.name,
        icon: makeGuidePinIcon('blue'), optimized: false, zIndex: 10,
      });
      marker.addListener('click', () => {
        const priceLine = hotel.price_range
          ? `<div style="font-size:0.82rem;color:#65C2EE;margin-bottom:4px;">${esc(hotel.price_range)}</div>` : '';
        const neighborhoodLine = hotel.neighborhood
          ? `<div style="font-size:0.78rem;color:#888;margin-bottom:8px;">${esc(hotel.neighborhood)}</div>` : '';
        gGuideInfoWindow.setContent(`
          <div style="background:#0d1620;color:#f0f0f0;padding:10px 12px;border-radius:0;min-width:180px;max-width:240px;">
            <div style="font-size:0.65rem;font-weight:800;letter-spacing:1.5px;text-transform:uppercase;color:#65C2EE;margin-bottom:5px;">Hotel</div>
            <div style="font-weight:700;overflow-wrap:break-word;font-size:1.1rem;color:#fff;margin-bottom:4px;">${esc(hotel.name)}</div>
            ${neighborhoodLine}${priceLine}
            <a href="${buildMapsUrl(hotel)}" target="_blank" style="display:inline-block;font-size:.8rem;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:#111;background:#65C2EE;border-radius:0;padding:4px 10px;text-decoration:none;">Open in Maps</a>
          </div>`);
        gGuideInfoWindow.setOptions({ maxWidth: 300 });
        gGuideInfoWindow.open(gGuideMap, marker);
      });
      gHotelMarkers.push(marker);
    });
  });
}

// ─── Place restaurant markers ─────────────────────────────────────────────────
function placeRestaurantMarkers(restaurants) {
  if (!gGuideMap) return;
  restaurants.forEach(restaurant => {
    if (!restaurant.cords && !restaurant.place_id) return;
    resolvePosition(restaurant, (pos) => {
      const marker = new google.maps.Marker({
        position: pos, map: gGuideMap, title: restaurant.name,
        icon: makeGuidePinIcon('yellow'), optimized: false, zIndex: 10,
      });
      marker.addListener('click', () => {
        const cuisineLine = restaurant.cuisine
          ? `<div style="font-size:0.78rem;color:#888;margin-bottom:4px;">${esc(restaurant.cuisine)}</div>` : '';
        const priceLine = restaurant.price_range
          ? `<div style="font-size:0.82rem;color:#FCE354;margin-bottom:4px;">${esc(restaurant.price_range)}</div>` : '';
        const neighborhoodLine = restaurant.neighborhood
          ? `<div style="font-size:0.78rem;color:#888;margin-bottom:8px;">${esc(restaurant.neighborhood)}</div>` : '';
        gGuideInfoWindow.setContent(`
          <div style="background:#1a1600;color:#f0f0f0;padding:10px 12px;border-radius:0;min-width:180px;max-width:240px;">
            <div style="font-size:0.65rem;font-weight:800;letter-spacing:1.5px;text-transform:uppercase;color:#FCE354;margin-bottom:5px;">Restaurant</div>
            <div style="font-weight:700;overflow-wrap:break-word;font-size:1.1rem;color:#fff;margin-bottom:4px;">${esc(restaurant.name)}</div>
            ${neighborhoodLine}${cuisineLine}${priceLine}
            <a href="${buildMapsUrl(restaurant)}" target="_blank" style="display:inline-block;font-size:.8rem;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:#000;background:#FCE354;border-radius:0;padding:4px 10px;text-decoration:none;">Open in Maps</a>
          </div>`);
        gGuideInfoWindow.setOptions({ maxWidth: 300 });
        gGuideInfoWindow.open(gGuideMap, marker);
      });
      gRestaurantMarkers.push(marker);
    });
  });
}

// ─── Place event markers ──────────────────────────────────────────────────────
function placeEventMarkers(events) {
  if (!gGuideMap) return;
  events.forEach(event => {
    // Events use 'location' as the text field and 'coords' for lat/lng
    // Synthesise a cords-compatible key from coords column
    const rowWithCords = { ...event, cords: event.coords || event.cords || '' };
    if (!rowWithCords.cords && !event.place_id) return;

    resolvePosition(rowWithCords, (pos) => {
      const marker = new google.maps.Marker({
        position: pos, map: null,  // hidden by default — shown when Events filter is active
        title: event['event name'] || event.event_name || event.name || '',
        icon: makeGuidePinIcon('red'), optimized: false, zIndex: 15,
      });
      marker.addListener('click', () => {
        const name      = event['event name'] || event.event_name || event.name || '';
        const hostLine  = event.host
          ? `<div style="font-size:0.78rem;color:#e63946;margin-bottom:4px;">${esc(event.host)}</div>` : '';
        const dateLine  = event['date and time'] || event.date_and_time || event.date
          ? `<div style="font-size:0.78rem;color:#888;margin-bottom:4px;">${esc(event['date and time'] || event.date_and_time || event.date)}</div>` : '';
        const descLine  = event.description
          ? `<div style="font-size:0.78rem;color:#ccc;margin-bottom:8px;">${esc(event.description)}</div>` : '';
        const ctaUrl    = event.url || buildEventMapsUrl(event);
        const ctaLabel  = event.url ? 'More Info' : 'Open in Maps';

        gGuideInfoWindow.setContent(`
          <div style="background:#1a0505;color:#f0f0f0;padding:10px 12px;border-radius:0;min-width:180px;max-width:240px;">
            <div style="font-size:0.65rem;font-weight:800;letter-spacing:1.5px;text-transform:uppercase;color:#e63946;margin-bottom:5px;">Event</div>
            <div style="font-weight:700;overflow-wrap:break-word;font-size:1.1rem;color:#fff;margin-bottom:4px;">${esc(name)}</div>
            ${hostLine}${dateLine}${descLine}
            <a href="${ctaUrl}" target="_blank" style="display:inline-block;font-size:.8rem;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:#fff;background:#e63946;border-radius:0;padding:4px 10px;text-decoration:none;">${ctaLabel}</a>
          </div>`);
        gGuideInfoWindow.setOptions({ maxWidth: 300 });
        gGuideInfoWindow.open(gGuideMap, marker);
      });
      gEventMarkers.push(marker);
    });
  });
}

// ─── Maps URL helper for events (uses location field, not address) ────────────
function buildEventMapsUrl(event) {
  const id = event.place_id ? event.place_id.replace(/[^a-zA-Z0-9_-]/g, '') : null;
  if (id) return `https://www.google.com/maps/place/?q=place_id:${id}`;
  const name     = event['event name'] || event.event_name || event.name || '';
  const location = event.location || '';
  return `https://www.google.com/maps/search/${encodeURIComponent((name + ' ' + location).trim())}`;
}

// ─── Filter functions ─────────────────────────────────────────────────────────
function guideFilterAll(btn) {
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  gHotelMarkers.forEach(m => m.setMap(gGuideMap));
  gRestaurantMarkers.forEach(m => m.setMap(gGuideMap));
  gEventMarkers.forEach(m => m.setMap(null));
  renderGuideList('all');
  if (gGuideInfoWindow) gGuideInfoWindow.close();
}

function guideFilterRestaurants(btn) {
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  gHotelMarkers.forEach(m => m.setMap(null));
  gRestaurantMarkers.forEach(m => m.setMap(gGuideMap));
  gEventMarkers.forEach(m => m.setMap(null));
  renderGuideList('restaurants');
  if (gGuideInfoWindow) gGuideInfoWindow.close();
}

function guideFilterHotels(btn) {
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  gHotelMarkers.forEach(m => m.setMap(gGuideMap));
  gRestaurantMarkers.forEach(m => m.setMap(null));
  gEventMarkers.forEach(m => m.setMap(null));
  renderGuideList('hotels');
  if (gGuideInfoWindow) gGuideInfoWindow.close();
}

function guideFilterEvents(btn) {
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  gHotelMarkers.forEach(m => m.setMap(null));
  gRestaurantMarkers.forEach(m => m.setMap(null));
  gEventMarkers.forEach(m => m.setMap(gGuideMap));
  renderGuideList('events');
  if (gGuideInfoWindow) gGuideInfoWindow.close();
}

// ─── Card builders ────────────────────────────────────────────────────────────
function buildGuideHotelCard(hotel) {
  const priceLine = hotel.price_range
    ? `<div class="bar-address" style="color:#65C2EE;">${esc(hotel.price_range)}</div>` : '';
  return `
    <a class="bar-card bar-card--hotel" href="${buildMapsUrl(hotel)}" target="_blank">
      <div class="hotel-badge" style="font-family:'United Sans Cond','Arial Narrow',Arial,sans-serif;font-size:0.62rem;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#65C2EE;margin-bottom:6px;">Hotel</div>
      <div class="bar-name">${esc(hotel.name)}</div>
      ${hotel.neighborhood ? `<div class="bar-address">${esc(hotel.neighborhood)}</div>` : ''}
      ${priceLine}
      <div class="bar-spacer"></div>
      <span class="map-link map-link--blue">Open in Maps</span>
    </a>`;
}

function buildGuideRestaurantCard(restaurant) {
  const cuisineLine = restaurant.cuisine
    ? `<div class="bar-address">${esc(restaurant.cuisine)}</div>` : '';
  const priceLine = restaurant.price_range
    ? `<div class="bar-address" style="color:var(--yellow);">${esc(restaurant.price_range)}</div>` : '';
  return `
    <a class="bar-card bar-card--restaurant" href="${buildMapsUrl(restaurant)}" target="_blank">
      <div class="restaurant-badge">Restaurant</div>
      <div class="bar-name">${esc(restaurant.name)}</div>
      ${restaurant.neighborhood ? `<div class="bar-address">${esc(restaurant.neighborhood)}</div>` : ''}
      ${cuisineLine}
      ${priceLine}
      <div class="bar-spacer"></div>
      <span class="map-link map-link--yellow">Open in Maps</span>
    </a>`;
}

function buildGuideEventCard(event) {
  const name     = event['event name'] || event.event_name || event.name || '';
  const hostLine = event.host
    ? `<div class="bar-address" style="color:#e63946;">${esc(event.host)}</div>` : '';
  const dateLine = event['date and time'] || event.date_and_time || event.date
    ? `<div class="bar-address">${esc(event['date and time'] || event.date_and_time || event.date)}</div>` : '';
  const descLine = event.description
    ? `<div class="bar-address">${esc(event.description)}</div>` : '';
  const locLine  = event.location
    ? `<div class="bar-address">${esc(event.location)}</div>` : '';
  const ctaUrl   = event.url || buildEventMapsUrl(event);
  const ctaLabel = event.url ? 'More Info' : 'Open in Maps';
  const ctaClass = event.url ? 'map-link map-link--red' : 'map-link map-link--red';

  return `
    <a class="bar-card bar-card--event" href="${esc(ctaUrl)}" target="_blank">
      <div class="event-badge">Event</div>
      <div class="bar-name">${esc(name)}</div>
      ${hostLine}
      ${locLine}
      ${dateLine}
      ${descLine}
      <div class="bar-spacer"></div>
      <span class="${ctaClass}">${ctaLabel}</span>
    </a>`;
}

// ─── Render guide list ────────────────────────────────────────────────────────
function renderGuideList(filter) {
  const container = document.getElementById('guideList');
  if (!container) return;

  const restaurants = window._guideRestaurants || [];
  const hotels      = window._guideHotels      || [];
  const events      = window._guideEvents      || [];
  let html = '';

  if ((filter === 'all' || filter === 'restaurants') && restaurants.length) {
    html += `
      <div class="category-block">
        <div class="category-header">
          <span class="cat-title" style="color:var(--yellow)">Restaurants</span>
        </div>
        <div class="bar-grid">${restaurants.map(buildGuideRestaurantCard).join('')}</div>
      </div>`;
  }

  if ((filter === 'all' || filter === 'hotels') && hotels.length) {
    html += `
      <div class="category-block">
        <div class="category-header">
          <span class="cat-title" style="color:#65C2EE">Hotels</span>
        </div>
        <div class="bar-grid">${hotels.map(buildGuideHotelCard).join('')}</div>
      </div>`;
  }

  if ((filter === 'all' || filter === 'events') && events.length) {
    html += `
      <div class="category-block">
        <div class="category-header">
          <span class="cat-title" style="color:#e63946">Events</span>
        </div>
        <div class="bar-grid">${events.map(buildGuideEventCard).join('')}</div>
      </div>`;
  }

  if (!html) {
    html = '<div class="state-box"><p>Nothing to show yet — check back soon.</p></div>';
  }

  container.innerHTML = html;
}

// ─── CSV parser ───────────────────────────────────────────────────────────────
function parseGuideCSV(text) {
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
  }).filter(row => row.name || row['event name']);
}

// ─── Fetch helper ─────────────────────────────────────────────────────────────
async function fetchGuideCSV(url, lsKey, lsTs) {
  const TTL = 24 * 60 * 60 * 1000;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const text = await res.text();
    const data = parseGuideCSV(text);
    try {
      localStorage.setItem(lsKey, JSON.stringify(data));
      localStorage.setItem(lsTs, Date.now().toString());
    } catch (e) {}
    return data;
  } catch (err) {
    console.warn(`Guide fetch failed for ${lsKey}, trying cache:`, err);
    try {
      const cached = localStorage.getItem(lsKey);
      const ts = localStorage.getItem(lsTs);
      if (cached && ts && (Date.now() - Number(ts)) < TTL) return JSON.parse(cached);
    } catch (e) {}
    return [];
  }
}

// ─── Bootstrap ────────────────────────────────────────────────────────────────
function dismissLoader() {
  const loader = document.getElementById('page-loader');
  if (!loader) return;
  loader.classList.add('fade-out');
  setTimeout(() => loader.classList.add('hidden'), 400);
}

async function initGuide() {
  const [hotels, restaurants, events] = await Promise.all([
    fetchGuideCSV(HOTELS_CSV_URL,      'wc_hotels_cache',      'wc_hotels_ts'),
    fetchGuideCSV(RESTAURANTS_CSV_URL, 'wc_restaurants_cache', 'wc_restaurants_ts'),
    fetchGuideCSV(EVENTS_CSV_URL,      'wc_events_cache',      'wc_events_ts'),
  ]);

  window._guideHotels      = hotels;
  window._guideRestaurants = restaurants;
  window._guideEvents      = events;

  renderGuideList('all');
  dismissLoader();

  // Wait for map then place all markers
  const tryMap = () => {
    if (gGuideMap) {
      placeHotelMarkers(hotels);
      placeRestaurantMarkers(restaurants);
      placeEventMarkers(events);
    } else {
      setTimeout(tryMap, 200);
    }
  };
  tryMap();
}

// ─── Google Maps callback ─────────────────────────────────────────────────────
function initMap() {
  buildGuideMap();
}

// ─── Load Maps script and kick off data fetch ─────────────────────────────────
initGuide();

const script = document.createElement('script');
script.src = `https://maps.googleapis.com/maps/api/js?key=${MAPS_API_KEY}&callback=initMap`;
script.async = true;
script.defer = true;
document.head.appendChild(script);