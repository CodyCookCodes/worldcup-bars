// ─── Fetch CSV, parse bars, kick off rendering ────────────────────────────────
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

// ─── Google Maps async callback ───────────────────────────────────────────────
function initMap() {
  if (window._barsReady) {
    window.buildMap(window._barsData);
  } else {
    window._mapReady = true;
  }
}

// ─── Bootstrap ────────────────────────────────────────────────────────────────
loadBars();

// Dynamically load Maps script using key from config.js
const script = document.createElement('script');
script.src = `https://maps.googleapis.com/maps/api/js?key=${window.MAPS_API_KEY}&callback=initMap`;
script.async = true;
script.defer = true;
document.head.appendChild(script);