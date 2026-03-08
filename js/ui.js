// ─── Build a single bar card ──────────────────────────────────────────────────
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

// ─── Render filter buttons + grouped bar list ─────────────────────────────────
function buildPage(bars) {
  // Group bars by nation
  const groups = {};
  bars.forEach(bar => {
    const nations = (bar.nation || 'All Nations').split(',').map(n => n.trim());
    nations.forEach(nation => {
      if (!groups[nation]) groups[nation] = [];
      groups[nation].push(bar);
    });
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
    btn.innerHTML = `${getFlag(nation)} ${escape(nation)}`;
    btn.onclick = function() { filterBars(nation.toLowerCase(), this); };
    filterContainer.appendChild(btn);
  });

  // Render category blocks + bar cards
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

// ─── Filter the visible category blocks and map pins ─────────────────────────
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