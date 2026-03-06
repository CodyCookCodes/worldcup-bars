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
<div class="bar-address">${escape(bar.address || '').replace(/([A-Za-z]+)\s+(Oakland|Emeryville|Berkeley|San Leandro|San Francisco)/, '$1, $2')}</div>      <div class="bar-meta">
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
}

async function loadBars() {
  try {
    const res = await fetch(SHEET_CSV_URL);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const text = await res.text();
    const bars = parseCSV(text);
    if (!bars.length) throw new Error('Sheet appears empty');
    buildPage(bars);
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
    console.error(err);
  }
}

loadBars();