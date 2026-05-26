// ─── Active filter state ──────────────────────────────────────────────────────
// activeTypes: Set of 'watchparties' | 'osgevents' | 'hotels' | 'restaurants'
// activeNations: Set of nation strings (lowercase)
window._activeTypes   = new Set(['watchparties']);
window._activeNations = new Set();

// ─── Build a single bar card ──────────────────────────────────────────────────
function buildCard(bar) {
  const nations = (bar.nation || '').split(',').map(n => n.trim()).filter(Boolean);
  const nationLine = nations.length > 1
    ? `<div class="bar-nations">${nations.map(n => esc(n)).join(' / ')}</div>`
    : '';
  return `
    <a class="venue-card" href="${buildMapsUrl(bar)}" target="_blank">
      <div class="venue-name">${esc(bar.name)}</div>
      ${nationLine}
      <div class="venue-detail">${esc(bar.address || '').replace(/([A-Za-z]+)\s+(Oakland|Emeryville|Berkeley|San Leandro|San Francisco)/, '$1, $2')}</div>
      <div class="venue-spacer"></div>
      <div class="venue-meta">
        ${bar.type  ? `<span class="pill pill-type">${esc(bar.type)}</span>` : ''}
        ${bar.hours ? `<span class="pill pill-hours">${esc(bar.hours)}</span>` : ''}
      </div>
      <span class="map-link">Open in Maps</span>
    </a>`;
}

// ─── Update dropdown label ────────────────────────────────────────────────────
function updateDropdownLabel() {
  const btn = document.getElementById('filterDropdownBtn');
  if (!btn) return;

  const types   = window._activeTypes;
  const nations = window._activeNations;

  const typeLabels = {
    watchparties: 'Watch Parties',
    osgevents:    'OSG Events',
    hotels:       'Hotels',
    restaurants:  'Restaurants',
  };

  const activeLabels = [];
  types.forEach(t => { if (typeLabels[t]) activeLabels.push(typeLabels[t]); });
  nations.forEach(n => activeLabels.push(n.split(' ').map(w => w[0].toUpperCase() + w.slice(1)).join(' ')));

  if (activeLabels.length === 0) {
    btn.textContent = 'Watch Parties ▾';
  } else if (activeLabels.length === 1) {
    btn.textContent = activeLabels[0] + ' ▾';
  } else if (activeLabels.length === 2) {
    btn.textContent = activeLabels.join(' + ') + ' ▾';
  } else {
    btn.textContent = activeLabels.length + ' filters active ▾';
  }
}

// ─── Apply all active filters to lists and map ───────────────────────────────
function applyFilters() {
  const types   = window._activeTypes;
  const nations = window._activeNations;

  document.querySelectorAll('.match-row--active').forEach(r => r.classList.remove('match-row--active'));

  // Show/hide bar list
  const showBars = types.has('watchparties') || nations.size > 0;
  document.getElementById('barList').classList.toggle('hidden', !showBars);

  // Show/hide OSG Events
  const wpList = document.getElementById('watchPartyList');
  if (wpList) {
    if (types.has('osgevents')) {
      wpList.classList.remove('hidden');
      renderWatchPartyCards();
    } else {
      wpList.classList.add('hidden');
    }
  }

  // Show/hide Hotels
  const hotelList = document.getElementById('hotelList');
  if (hotelList) hotelList.classList.toggle('hidden', !types.has('hotels'));

  // Show/hide Restaurants
  const restaurantList = document.getElementById('restaurantList');
  if (restaurantList) restaurantList.classList.toggle('hidden', !types.has('restaurants'));

  // Filter bar category blocks by nation
  if (showBars) {
    document.querySelectorAll('#barList .category-block').forEach(block => {
      const blockNations = (block.dataset.nations || '').split(',');
      const isAllNations = blockNations.includes('all nations');
      let show = false;
      if (nations.size === 0 && types.has('watchparties')) {
        show = true; // show all bars when Watch Parties is on with no nation filter
      } else if (nations.size > 0) {
        show = isAllNations || [...nations].some(n => blockNations.includes(n));
      }
      block.classList.toggle('hidden', !show);
    });
  }

  // Update map
  if (window.filterMapMulti) window.filterMapMulti(types, nations);

  updateDropdownLabel();
}

// ─── Build dropdown ───────────────────────────────────────────────────────────
function buildPage(bars) {
  const groups = {};
  bars.forEach(bar => {
    const nations = (bar.nation || 'All Nations').split(',').map(n => n.trim()).filter(Boolean);
    nations.forEach(nation => {
      if (!groups[nation]) groups[nation] = [];
      groups[nation].push(bar);
    });
  });

  const sorted = Object.keys(groups).sort((a, b) => {
    if (a.toLowerCase() === 'all nations') return 1;
    if (b.toLowerCase() === 'all nations') return -1;
    return a.localeCompare(b);
  });

  // Store sorted nations for match row click use
  window._sortedNations = sorted.map(n => n.toLowerCase());

  const filterContainer = document.getElementById('filterButtons');
  filterContainer.innerHTML = '';

  // ── Dropdown button ──
  const wrapper = document.createElement('div');
  wrapper.className = 'filter-dropdown-wrapper';
  wrapper.innerHTML = `
    <button class="filter-dropdown-btn" id="filterDropdownBtn">Watch Parties ▾</button>
    <div class="filter-dropdown-menu hidden" id="filterDropdownMenu">
      <div class="filter-dropdown-section">VIEWS</div>
      <label class="filter-dropdown-item">
        <input type="checkbox" data-type="watchparties" checked> Watch Parties
      </label>
      <label class="filter-dropdown-item">
        <input type="checkbox" data-type="osgevents"> OSG Events
      </label>
      <label class="filter-dropdown-item">
        <input type="checkbox" data-type="hotels"> Hotels
      </label>
      <label class="filter-dropdown-item">
        <input type="checkbox" data-type="restaurants"> Restaurants
      </label>
      <div class="filter-dropdown-section">NATIONS</div>
      ${sorted.map(nation => `
        <label class="filter-dropdown-item">
          <input type="checkbox" data-nation="${esc(nation.toLowerCase())}">
          ${getFlag(nation)} ${esc(nation)}
        </label>
      `).join('')}
    </div>
  `;
  filterContainer.appendChild(wrapper);

  // Toggle dropdown open/close
  const btn = wrapper.querySelector('#filterDropdownBtn');
  const menu = wrapper.querySelector('#filterDropdownMenu');
  btn.addEventListener('click', e => {
    e.stopPropagation();
    menu.classList.toggle('hidden');
  });
  document.addEventListener('click', () => menu.classList.add('hidden'));
  menu.addEventListener('click', e => e.stopPropagation());

  // Handle checkbox changes
  menu.querySelectorAll('input[type="checkbox"]').forEach(cb => {
    cb.addEventListener('change', () => {
      if (cb.dataset.type) {
        if (cb.checked) window._activeTypes.add(cb.dataset.type);
        else window._activeTypes.delete(cb.dataset.type);
      }
      if (cb.dataset.nation) {
        if (cb.checked) window._activeNations.add(cb.dataset.nation);
        else window._activeNations.delete(cb.dataset.nation);
      }
      applyFilters();
    });
  });

  // Render category blocks
  document.getElementById('barList').innerHTML = sorted.map(nation => `
    <div class="category-block" data-nations="${esc(nation.toLowerCase())}">
      <div class="category-header">
        <span class="cat-flag">${getFlag(nation)}</span>
        <span class="cat-title">${esc(nation)}</span>
      </div>
      <div class="venue-grid">${groups[nation].map(buildCard).join('')}</div>
    </div>
  `).join('');

  // Watch parties section
  const wpSection = document.createElement('div');
  wpSection.id = 'watchPartyList';
  wpSection.className = 'hidden';
  wpSection.innerHTML = `
    <div class="category-block">
      <div class="category-header">
        <span class="cat-title" style="color:var(--green)">Official OSG Events</span>
      </div>
      <div id="watchPartyCards" class="venue-grid">
        <div style="color:var(--muted);font-size:0.9rem;padding:10px 0;">Loading watch parties…</div>
      </div>
    </div>`;
  document.getElementById('barList').before(wpSection);

  // Apply initial state
  applyFilters();
}

// ─── Build a OSG Events card ─────────────────────────────────────────────────
function buildWatchPartyCard(wp) {
  const isCatchAll = !wp.match_id || !wp.match_id.trim();
  let matchLine = '', dateLine = '';

  if (isCatchAll) {
    const matchById = window._matchById || {};
    const allMatches = Object.values(matchById);
    const upcoming = allMatches
      .filter(m => !m.home_score || m.home_score === '')
      .sort((a, b) => {
        const da = a.date || '', db = b.date || '';
        if (da !== db) return da.localeCompare(db);
        return (a.time || '').localeCompare(b.time || '');
      })[0] || allMatches.sort((a, b) => (a.date || '').localeCompare(b.date || ''))[0];

    if (upcoming) {
      matchLine = (upcoming.home_team && upcoming.away_team)
        ? `<div class="venue-detail" style="color:var(--green);">${esc(upcoming.home_team)} vs ${esc(upcoming.away_team)}</div>`
        : '';
      dateLine = (upcoming.date || upcoming.time)
        ? `<div class="venue-detail">${esc(upcoming.date || '')}${upcoming.time ? ' · ' + esc(upcoming.time) : ''}</div>`
        : '';
    }
  } else {
    matchLine = (wp.home_team && wp.away_team)
      ? `<div class="venue-detail" style="color:var(--green);">${esc(wp.home_team)} vs ${esc(wp.away_team)}</div>`
      : '';
    dateLine = (wp.match_date || wp.match_time)
      ? `<div class="venue-detail">${esc(wp.match_date || '')}${wp.match_time ? ' · ' + esc(wp.match_time) : ''}</div>`
      : '';
  }

  const ticketBtn = wp.url
    ? `<a class="map-link map-link--green" href="${esc(wp.url)}" target="_blank">Tickets</a>`
    : '';

  return `
    <div class="venue-card venue-card--watch-party">
      <div class="wp-badge">Oakland Sports Group Events</div>
      <div class="venue-name">${esc(wp.name)}</div>
      ${matchLine}
      ${dateLine}
      <div class="venue-spacer"></div>
      <div class="venue-card-actions">
        ${ticketBtn}
        <a class="map-link map-link--green" href="${buildMapsUrl(wp)}" target="_blank">Open in Maps</a>
      </div>
    </div>`;
}

// ─── Populate OSG Events cards ───────────────────────────────────────────────
function renderWatchPartyCards() {
  const container = document.getElementById('watchPartyCards');
  if (!container) return;
  const wps = window._watchPartiesData || [];
  if (!wps.length) {
    container.innerHTML = '<div style="color:var(--muted);font-size:0.9rem;padding:10px 0;">No watch parties listed yet.</div>';
    return;
  }
  container.innerHTML = wps.map(buildWatchPartyCard).join('');
}

// ─── Legacy shims — called by matches.js match row click ─────────────────────
function filterWatchParties(btn) {
  window._activeTypes = new Set(['osgevents']);
  window._activeNations = new Set();
  syncDropdownCheckboxes();
  applyFilters();
}

function filterBars(nation, btn) {
  if (nation === 'all') {
    window._activeTypes = new Set(['watchparties']);
    window._activeNations = new Set();
  } else {
    window._activeTypes = new Set(['watchparties']);
    window._activeNations = new Set([nation]);
  }
  syncDropdownCheckboxes();
  applyFilters();
}

function filterHotels(btn) {
  window._activeTypes = new Set(['hotels']);
  window._activeNations = new Set();
  syncDropdownCheckboxes();
  applyFilters();
}

function filterRestaurants(btn) {
  window._activeTypes = new Set(['restaurants']);
  window._activeNations = new Set();
  syncDropdownCheckboxes();
  applyFilters();
}

function syncDropdownCheckboxes() {
  const menu = document.getElementById('filterDropdownMenu');
  if (!menu) return;
  menu.querySelectorAll('input[data-type]').forEach(cb => {
    cb.checked = window._activeTypes.has(cb.dataset.type);
  });
  menu.querySelectorAll('input[data-nation]').forEach(cb => {
    cb.checked = window._activeNations.has(cb.dataset.nation);
  });
}

// ─── Build hotel card ─────────────────────────────────────────────────────────
function buildHotelCard(hotel) {
  const priceLine = hotel.price_range
    ? `<div class="venue-detail" style="color:#65C2EE;">${esc(hotel.price_range)}</div>` : '';
  return `
    <a class="venue-card venue-card--hotel" href="${buildMapsUrl(hotel)}" target="_blank">
      <div class="venue-name">${esc(hotel.name)}</div>
      ${hotel.neighborhood ? `<div class="venue-detail">${esc(hotel.neighborhood)}</div>` : ''}
      ${priceLine}
      <div class="venue-spacer"></div>
      <span class="map-link map-link--blue">Open in Maps</span>
    </a>`;
}

// ─── Build restaurant card ────────────────────────────────────────────────────
function buildRestaurantCard(restaurant) {
  const cuisineLine = restaurant.cuisine
    ? `<div class="venue-detail">${esc(restaurant.cuisine)}</div>` : '';
  const priceLine = restaurant.price_range
    ? `<div class="venue-detail" style="color:var(--yellow);">${esc(restaurant.price_range)}</div>` : '';
  return `
    <a class="venue-card venue-card--restaurant" href="${buildMapsUrl(restaurant)}" target="_blank">
      <div class="venue-name">${esc(restaurant.name)}</div>
      ${restaurant.neighborhood ? `<div class="venue-detail">${esc(restaurant.neighborhood)}</div>` : ''}
      ${cuisineLine}
      ${priceLine}
      <div class="venue-spacer"></div>
      <span class="map-link map-link--yellow">Open in Maps</span>
    </a>`;
}

function renderHotelCards(hotels) {
  let section = document.getElementById('hotelList');
  if (!section) {
    section = document.createElement('div');
    section.id = 'hotelList';
    section.className = 'hidden';
    section.innerHTML = `
      <div class="category-block">
        <div class="category-header">
          <span class="cat-title" style="color:#65C2EE">Hotels</span>
        </div>
        <div id="hotelCards" class="venue-grid"></div>
      </div>`;
    document.getElementById('barList').before(section);
  }
  const container = document.getElementById('hotelCards');
  if (container) container.innerHTML = hotels.map(buildHotelCard).join('');
}

function renderRestaurantCards(restaurants) {
  let section = document.getElementById('restaurantList');
  if (!section) {
    section = document.createElement('div');
    section.id = 'restaurantList';
    section.className = 'hidden';
    section.innerHTML = `
      <div class="category-block">
        <div class="category-header">
          <span class="cat-title" style="color:var(--yellow)">Restaurants</span>
        </div>
        <div id="restaurantCards" class="venue-grid"></div>
      </div>`;
    document.getElementById('barList').before(section);
  }
  const container = document.getElementById('restaurantCards');
  if (container) container.innerHTML = restaurants.map(buildRestaurantCard).join('');
}