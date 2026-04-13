// ─── Fetch CSV, parse bars, kick off rendering ────────────────────────────────
async function loadBars() {
  const LS_KEY = 'wc_bars_cache';
  const LS_TS  = 'wc_bars_ts';
  const TTL    = 24 * 60 * 60 * 1000; // 24 hours

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(SHEET_CSV_URL, { signal: controller.signal });
    clearTimeout(timeout);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const text = await res.text();
    const bars = parseCSV(text);
    if (!bars.length) throw new Error('Sheet appears empty');

    // Save to localStorage for offline fallback
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(bars));
      localStorage.setItem(LS_TS, Date.now().toString());
    } catch (e) { /* storage full — ignore */ }

    buildPage(bars);
    window._barsData = bars;
    if (window._mapReady) {
      window.buildMap(bars);
    } else {
      window._barsReady = true;
    }
  } catch (err) {
    console.warn('Bars fetch failed, trying localStorage cache:', err);

    // Try localStorage fallback
    try {
      const cached = localStorage.getItem(LS_KEY);
      const ts     = localStorage.getItem(LS_TS);
      if (cached && ts && (Date.now() - Number(ts)) < TTL) {
        const bars = JSON.parse(cached);
        if (bars.length) {
          buildPage(bars);
          window._barsData = bars;
          // Don't try to build map — offline
          document.getElementById('barList').insertAdjacentHTML('beforebegin', `
            <div style="max-width:960px;margin:12px auto 0;padding:0 16px;font-size:0.78rem;color:#65C2EE;">
              Showing cached bar data from your last visit.
            </div>`);
          return;
        }
      }
    } catch (e) { /* bad cache — ignore */ }

    // No cache available — show error
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
  const LS_KEY = 'wc_hotels_cache';
  const LS_TS  = 'wc_hotels_ts';
  const TTL    = 24 * 60 * 60 * 1000; // 24 hours

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(HOTELS_CSV_URL, { signal: controller.signal });
    clearTimeout(timeout);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const text = await res.text();
    const hotels = parseHotelsCSV(text);

    // Save to localStorage for offline fallback
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(hotels));
      localStorage.setItem(LS_TS, Date.now().toString());
    } catch (e) { /* storage full — ignore */ }

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
    console.warn('Hotels fetch failed, trying localStorage cache:', err);

    // Try localStorage fallback
    try {
      const cached = localStorage.getItem(LS_KEY);
      const ts     = localStorage.getItem(LS_TS);
      if (cached && ts && (Date.now() - Number(ts)) < TTL) {
        const hotels = JSON.parse(cached);
        if (hotels.length) {
          window._hotelsData = hotels;
          console.log('Hotels loaded from localStorage cache');
          return;
        }
      }
    } catch (e) { /* bad cache — ignore */ }

    // No cache available
    console.warn('No hotels cache available:', err);
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

Promise.all([loadBars(), loadMatchesAndWatchParties()]).then(dismissLoader);

// Dynamically load Maps script
const script = document.createElement('script');
script.src = `https://maps.googleapis.com/maps/api/js?key=${MAPS_API_KEY}&callback=initMap`;
script.async = true;
script.defer = true;
document.head.appendChild(script);