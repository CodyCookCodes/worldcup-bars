// ─── Build a single bar card ──────────────────────────────────────────────────
function buildCard(bar) {
  return `
    <a class="bar-card" href="${buildMapsUrl(bar)}" target="_blank">
      <div class="bar-name">${esc(bar.name)}</div>
      <div class="bar-address">${esc(bar.address || '').replace(/([A-Za-z]+)\s+(Oakland|Emeryville|Berkeley|San Leandro|San Francisco)/, '$1, $2')}</div>
      <div class="bar-spacer"></div>
      <div class="bar-meta">
        ${bar.type  ? `<span class="pill pill-type">${esc(bar.type)}</span>` : ''}
        ${bar.hours ? `<span class="pill pill-hours">${esc(bar.hours)}</span>` : ''}
      </div>
      <span class="map-link">Open in Maps</span>
    </a>`;
}

// ─── Render filter buttons + grouped bar list ─────────────────────────────────
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

  // Render nation filter buttons
  const filterContainer = document.getElementById('filterButtons');
  sorted.forEach(nation => {
    const btn = document.createElement('button');
    btn.className = 'filter-btn';
    btn.innerHTML = `${getFlag(nation)} ${esc(nation)}`;
    btn.onclick = function() { filterBars(nation.toLowerCase(), this); };
    filterContainer.appendChild(btn);
  });

  // Add Watch Parties tab button — appended after nation filters
  const wpBtn = document.createElement('button');
  wpBtn.className = 'filter-btn filter-btn--watch-party';
  wpBtn.id = 'watchPartyTabBtn';
  wpBtn.innerHTML = `⚽ Watch Parties`;
  wpBtn.onclick = function() { filterWatchParties(this); };
  filterContainer.appendChild(wpBtn);

  // Render category blocks
  document.getElementById('barList').innerHTML = sorted.map(nation => `
    <div class="category-block" data-nation="${esc(nation.toLowerCase())}">
      <div class="category-header">
        <span class="cat-flag">${getFlag(nation)}</span>
        <span class="cat-title">${esc(nation)}</span>
      </div>
      <div class="bar-grid">${groups[nation].map(buildCard).join('')}</div>
    </div>
  `).join('');

  // Watch parties section — hidden by default, shown when tab is active
  const wpSection = document.createElement('div');
  wpSection.id = 'watchPartyList';
  wpSection.className = 'hidden';
  wpSection.innerHTML = `
    <div class="category-block">
      <div class="category-header">
        <span class="cat-title" style="color:var(--green)">⚽ Official Watch Parties</span>
      </div>
      <div id="watchPartyCards" class="bar-grid">
        <div style="color:var(--muted);font-size:0.9rem;padding:10px 0;">Loading watch parties…</div>
      </div>
    </div>`;
  document.getElementById('barList').after(wpSection);
}

// ─── Build a watch party card ─────────────────────────────────────────────────
function buildWatchPartyCard(wp) {
  const matchLine = (wp.home_team && wp.away_team)
    ? `<div class="bar-address" style="color:var(--green);">${esc(wp.home_team)} vs ${esc(wp.away_team)}</div>`
    : '';
  const dateLine = (wp.match_date || wp.match_time)
    ? `<div class="bar-address">${esc(wp.match_date || '')}${wp.match_time ? ' · ' + esc(wp.match_time) : ''}</div>`
    : '';

  return `
    <a class="bar-card bar-card--watch-party" href="${buildMapsUrl(wp)}" target="_blank">
      <div class="wp-badge">⚽ Watch Party</div>
      <div class="bar-name">${esc(wp.name)}</div>
      ${matchLine}
      ${dateLine}
      <div class="bar-spacer"></div>
      <span class="map-link map-link--green">Open in Maps</span>
    </a>`;
}

// ─── Populate watch party cards (called once data is ready) ───────────────────
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

// ─── Switch to Watch Parties view ────────────────────────────────────────────
function filterWatchParties(btn) {
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');

  // Clear match row highlight
  document.querySelectorAll('.match-row--active').forEach(r => r.classList.remove('match-row--active'));

  // Hide bar list, show watch party list
  document.getElementById('barList').classList.add('hidden');
  const wpList = document.getElementById('watchPartyList');
  if (wpList) wpList.classList.remove('hidden');

  // Render cards if not yet done
  renderWatchPartyCards();

  // Map: show only green pins
  if (window.filterMapWatchParties) window.filterMapWatchParties();
}

// ─── Filter the visible category blocks and map pins ─────────────────────────
function filterBars(nation, btn) {
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');

  // Clear match row highlight
  document.querySelectorAll('.match-row--active').forEach(r => r.classList.remove('match-row--active'));

  // Show bar list, hide watch party list
  document.getElementById('barList').classList.remove('hidden');
  const wpList = document.getElementById('watchPartyList');
  if (wpList) wpList.classList.add('hidden');

  // Restore all map pins before filtering
  if (window.restoreMapPins) window.restoreMapPins();

  document.querySelectorAll('.category-block').forEach(block => {
    nation === 'all'
      ? block.classList.remove('hidden')
      : block.dataset.nation === nation
        ? block.classList.remove('hidden')
        : block.classList.add('hidden');
  });

  if (window.filterMapPins) window.filterMapPins(nation);
}