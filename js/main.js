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