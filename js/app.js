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

function initMap() {
  if (window._barsReady) {
    window.buildMap(window._barsData);
  } else {
    window._mapReady = true;
  }
}

// Dynamically load Maps script using key from config.js
const script = document.createElement('script');
script.src = `https://maps.googleapis.com/maps/api/js?key=${window.MAPS_API_KEY}&callback=initMap`;
script.async = true;
script.defer = true;
document.head.appendChild(script);

loadBars();