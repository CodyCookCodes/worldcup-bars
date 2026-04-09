// ─── Fetch CSV, parse bars, kick off rendering ────────────────────────────────
async function loadBars() {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(SHEET_CSV_URL, { signal: controller.signal });
    clearTimeout(timeout);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const text = await res.text();
    const bars = parseCSV(text);
    if (!bars.length) throw new Error('Sheet appears empty');

    buildPage(bars);

    window._barsData = bars;
    if (window._mapReady) {
      window.buildMap(bars);
    } else {
      window._barsReady = true;
    }
  } catch (err) {
    if (err.name === 'AbortError') {
      document.getElementById('barList').innerHTML = `
        <div class="state-box">
          <div class="icon">⏱️</div>
          <p>Request timed out. Please check your connection and refresh.</p>
        </div>`;
    } else {
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
    }
    console.error(err);
  }
}

// ─── Parse CSV for hotels ─────────────────────────────────────────────────────
function parseHotelsCSV(text) {
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

// ─── Fetch hotels CSV and place markers ───────────────────────────────────────
async function loadHotels() {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(HOTELS_CSV_URL, { signal: controller.signal });
    clearTimeout(timeout);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const text = await res.text();
    const hotels = parseHotelsCSV(text);

    window._hotelsData = hotels;

    const tryPlaceHotels = () => {
      if (window._gMapReady) {
        window.buildHotelMarkers(hotels);
      } else {
        window._hotelsReady = true;
      }
    };
    setTimeout(tryPlaceHotels, 1000);
  } catch (err) {
    console.warn('Hotels could not be loaded:', err);
    window._hotelsData = [];
  }
}

// ─── Google Maps async callback ───────────────────────────────────────────────
function initMap() {
  if (window._barsReady) {
    window.buildMap(window._barsData);
  } else {
    window._mapReady = true;
  }

  // Place Roots Events markers if they loaded before the map was ready
  if (window._watchPartiesReady && window._watchPartiesData && window._watchPartiesData.length) {
    window.buildWatchPartyMarkers(window._watchPartiesData);
  }

  // Place hotel markers if they loaded before the map was ready
  if (window._hotelsReady && window._hotelsData && window._hotelsData.length) {
    window.buildHotelMarkers(window._hotelsData);
  }
}

// ─── Bootstrap ────────────────────────────────────────────────────────────────
function dismissLoader() {
  const loader = document.getElementById('page-loader');
  if (!loader) return;
  loader.classList.add('fade-out');
  setTimeout(() => loader.classList.add('hidden'), 400);
}

// ─── Offline detection — hide map if no network ───────────────────────────────
function handleOfflineMap() {
  const mapSection = document.querySelector('.map-section');
  const mapDivider = document.querySelector('.map-section + .mosaic-divider');
  if (!mapSection) return;

  if (!navigator.onLine) {
    mapSection.style.display = 'none';
    if (mapDivider) mapDivider.style.display = 'none';
    // Show a friendly offline notice above the filters
    const notice = document.createElement('div');
    notice.id = 'offline-notice';
    notice.style.cssText = `
      max-width: 960px;
      margin: 20px auto 0;
      padding: 12px 20px;
      background: #1a1a1a;
      border: 1px solid #2a2a2a;
      border-left: 3px solid #65C2EE;
      font-size: 0.82rem;
      color: #888;
      font-family: 'TeX Gyre Heros Cn', sans-serif;
    `;
    notice.innerHTML = `📡 You're offline — map unavailable. Bar and match info loaded from cache.`;
    document.querySelector('.filters').before(notice);
  }

  // If they come back online, reload to restore the map
  window.addEventListener('online', () => window.location.reload());
}

Promise.all([loadBars(), loadMatchesAndWatchParties(), loadHotels()]).then(dismissLoader);

// ─── Handle offline map before loading Maps script ────────────────────────────
handleOfflineMap();

// Only load Google Maps if online
if (navigator.onLine) {
  const script = document.createElement('script');
  script.src = `https://maps.googleapis.com/maps/api/js?key=${MAPS_API_KEY}&callback=initMap`;
  script.async = true;
  script.defer = true;
  document.head.appendChild(script);
}

// ─── Register service worker ──────────────────────────────────────────────────
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/worldcup-bars/sw.js', { scope: '/worldcup-bars/' })
      .catch(err => console.warn('Service worker registration failed:', err));
  });
}