// ─── Build a single bar card ──────────────────────────────────────────────────
function buildCard(bar) {
  return `
    <a class="bar-card" href="${buildMapsUrl(bar)}" target="_blank">
      <div class="bar-name">${esc(bar.name)}</div>
      <div class="bar-address">${esc(bar.address || '').replace(/([A-Za-z]+)\s+(Oakland|Emeryville|Berkeley|San Leandro|San Francisco)/, '$1, $2')}</div>
      <div class="bar-meta">
        ${bar.type  ? `<span class="pill pill-type">${esc(bar.type)}</span>` : ''}
        ${bar.hours ? `<span class="pill pill-hours">${esc(bar.hours)}</span>` : ''}
      </div>
      <span class="map-link">📍 Open in Maps</span>
    </a>`;
}

// ─── Render filter buttons + grouped bar list ─────────────────────────────────
function buildPage(bars) {
  // Group bars by nation
  const groups = {};
  bars.forEach(bar => {
    const nation = (bar.nation || 'All Nations').trim();
    if (!groups[nation]) groups[nation] = [];
    groups[nation].push(bar);
  });

  // Sort nations alphabetically; keep "All Nations" last
  const sorted = Object.keys(groups).sort((a, b) => {
    if (a.toLowerCase() === 'all nations') return 1;
    if (b.toLowerCase() === 'all nations') return -1;
    return a.localeCompare(b);
  });

  // Render filter buttons
  const filterContainer = document.getElementById('filterButtons');
  sorted.forEach(nation => {
    const btn = document.createElement('button');
    btn.className = 'filter-btn';
    btn.innerHTML = `${getFlag(nation)} ${esc(nation)}`;
    btn.onclick = function() { filterBars(nation.toLowerCase(), this); };
    filterContainer.appendChild(btn);
  });

  // Render category blocks + bar cards
  document.getElementById('barList').innerHTML = sorted.map(nation => `
    <div class="category-block" data-nation="${esc(nation.toLowerCase())}">
      <div class="category-header">
        <span class="cat-flag">${getFlag(nation)}</span>
        <span class="cat-title">${esc(nation)}</span>
        <span class="cat-count">${groups[nation].length} bar${groups[nation].length !== 1 ? 's' : ''}</span>
      </div>
      <div class="bar-grid">${groups[nation].map(buildCard).join('')}</div>
    </div>
  `).join('');
}

// ─── Filter the visible category blocks and map pins ─────────────────────────
function filterBars(nation, btn) {
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');

  // Clear any active match row highlight
  document.querySelectorAll('.match-row--active').forEach(r => r.classList.remove('match-row--active'));

  document.querySelectorAll('.category-block').forEach(block => {
    nation === 'all'
      ? block.classList.remove('hidden')
      : block.dataset.nation === nation
        ? block.classList.remove('hidden')
        : block.classList.add('hidden');
  });

  if (window.filterMapPins) window.filterMapPins(nation);
}