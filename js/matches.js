// ─── Matches Module ───────────────────────────────────────────────────────────
// Matches sheet columns: match_id | date | time | home_team | away_team | home_score | away_score | stage | group
// Watch Parties sheet columns: name | address | place_id | match_id

// ─── Parse CSV for matches ────────────────────────────────────────────────────
function parseMatchesCSV(text) {
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
  }).filter(row => row.date || row.home_team);
}

// ─── Parse CSV for watch parties ─────────────────────────────────────────────
function parseWatchPartiesCSV(text) {
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

// ─── Date helpers ─────────────────────────────────────────────────────────────
function parseLocalDate(str) {
  if (!str) return null;
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function getDayState(date) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const weekFromNow = new Date(today);
  weekFromNow.setDate(weekFromNow.getDate() + 7);
  if (!date) return 'future';
  if (date.getTime() === today.getTime()) return 'today';
  if (date < today) return 'past';
  if (date <= weekFromNow) return 'soon';
  return 'future';
}

function formatDayHeader(date) {
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function stageLabel(stage) {
  const map = {
    'group stage': 'Group Stage', 'round of 32': 'R32', 'round of 16': 'R16',
    'quarter-final': 'QF', 'semi-final': 'SF', 'bronze final': '3rd Place', 'final': 'FINAL',
  };
  return map[(stage || '').toLowerCase().trim()] || stage || '';
}

// ─── Single match row ─────────────────────────────────────────────────────────
function buildMatchRow(match, watchPartyMatchIds) {
  const hasScore = match.home_score !== '' && match.away_score !== '';
  const homeWon = hasScore && Number(match.home_score) > Number(match.away_score);
  const awayWon = hasScore && Number(match.away_score) > Number(match.home_score);

  const scoreOrTime = hasScore
    ? `<span class="mr-score">
         <span class="${homeWon ? 'score-win' : awayWon ? 'score-loss' : ''}">${esc(match.home_score)}</span>
         <span class="score-sep">–</span>
         <span class="${awayWon ? 'score-win' : homeWon ? 'score-loss' : ''}">${esc(match.away_score)}</span>
       </span>`
    : `<span class="mr-time">${esc(match.time || 'TBD')}</span>`;

  const groupInfo = match.group
    ? `<span class="mr-stage">${esc(stageLabel(match.stage))} · Grp ${esc(match.group)}</span>`
    : `<span class="mr-stage">${esc(stageLabel(match.stage))}</span>`;

  const homeKey = (match.home_team || '').toLowerCase().trim();
  const awayKey = (match.away_team || '').toLowerCase().trim();

  const hasWatchParty = watchPartyMatchIds && watchPartyMatchIds.has(match.match_id);
  const watchPartyBadge = hasWatchParty
    ? `<span class="mr-watch-party">Official Watch Party</span>`
    : '';

  const clickable = !hasScore;

  return `
    <div class="match-row${hasScore ? ' match-row--past' : ''}${clickable ? '' : ' match-row--no-click'}"
         ${clickable ? `data-home="${homeKey}" data-away="${awayKey}" data-match-id="${esc(match.match_id || '')}" title="Filter bars for this match"` : ''}>
      <div class="mr-teams">
        <span class="mr-team">
          ${getMatchFlag(match.home_team)}
          <span class="mr-name ${homeWon ? 'team--winner' : ''}">${esc(match.home_team || 'TBD')}</span>
        </span>
        <span class="mr-middle">${scoreOrTime}</span>
        <span class="mr-team mr-team--away">
          <span class="mr-name ${awayWon ? 'team--winner' : ''}">${esc(match.away_team || 'TBD')}</span>
          ${getMatchFlag(match.away_team)}
        </span>
      </div>
      ${groupInfo}
      ${watchPartyBadge}
    </div>`;
}

// ─── Day column card ──────────────────────────────────────────────────────────
function buildDayCard(dateStr, matchesForDay, state, watchPartyMatchIds) {
  const date = parseLocalDate(dateStr);
  const stateClass = { past: 'day-card--past', today: 'day-card--today', soon: 'day-card--soon', future: 'day-card--future' }[state] || '';
  const badge = state === 'today'
    ? `<span class="match-badge match-badge--today">TODAY</span>`
    : state === 'soon'
    ? `<span class="match-badge match-badge--soon">THIS WEEK</span>`
    : '';

  return `
    <div class="day-card ${stateClass}">
      ${badge}
      <div class="day-header">${formatDayHeader(date)}</div>
      <div class="day-matches">
        ${matchesForDay.map(m => buildMatchRow(m, watchPartyMatchIds)).join('')}
      </div>
    </div>`;
}

// ─── Click handler ────────────────────────────────────────────────────────────
function handleMatchRowClick(e) {
  const row = e.currentTarget;
  const home = row.dataset.home;
  const away = row.dataset.away;
  const matchId = row.dataset.matchId || null;

  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));

  // Show bar list, filter its category blocks (scoped — don't touch watchPartyList's block)
  document.getElementById('barList').classList.remove('hidden');
  document.querySelectorAll('#barList .category-block').forEach(block => {
    const blockNations = (block.dataset.nations || '').split(',');
    const isMatch = blockNations.includes(home) || blockNations.includes(away) || blockNations.includes('all nations');
    block.classList.toggle('hidden', !isMatch);
  });

  // Show watch parties for this match (if any), hidden otherwise
  const allWPs = window._watchPartiesData || [];
  const matchWPs = allWPs.filter(wp => {
    const wpHome = (wp.home_team || '').toLowerCase().trim();
    const wpAway = (wp.away_team || '').toLowerCase().trim();
    return (matchId && wp.match_id && wp.match_id.trim() === matchId.trim())
        || (wpHome && wpAway && wpHome === home && wpAway === away);
  });
  const wpList = document.getElementById('watchPartyList');
  if (wpList) {
    if (matchWPs.length) {
      const container = document.getElementById('watchPartyCards');
      if (container) container.innerHTML = matchWPs.map(buildWatchPartyCard).join('');
      wpList.classList.remove('hidden');
    } else {
      wpList.classList.add('hidden');
    }
  }

  if (window.filterMapPinsMulti) window.filterMapPinsMulti([home, away], matchId);

  const mapSection = document.querySelector('.map-section');
  if (mapSection) mapSection.scrollIntoView({ behavior: 'smooth', block: 'start' });

  document.querySelectorAll('.match-row').forEach(r => r.classList.remove('match-row--active'));
  row.classList.add('match-row--active');
}

// ─── Build and render the carousel ───────────────────────────────────────────
function buildMatchCarousel(matches, watchParties) {
  const section = document.getElementById('matchCarousel');
  if (!section) return;

  const watchPartyMatchIds = new Set(
    (watchParties || []).map(wp => wp.match_id).filter(Boolean)
  );

  const matchById = {};
  matches.forEach(m => { if (m.match_id) matchById[m.match_id] = m; });
  window._matchById = matchById;

  if (!matches.length) {
    const track = document.getElementById('matchTrack');
    if (track) track.innerHTML = '<div style="color:#555;font-size:0.8rem;padding:20px 0;">Match schedule coming soon.</div>';
    return;
  }

  matches.sort((a, b) => {
    const da = parseLocalDate(a.date), db = parseLocalDate(b.date);
    if (da && db && da.getTime() !== db.getTime()) return da - db;
    return (a.time || '').localeCompare(b.time || '');
  });

  const byDate = {};
  matches.forEach(m => {
    const key = m.date || 'unknown';
    if (!byDate[key]) byDate[key] = [];
    byDate[key].push(m);
  });

  const track = document.getElementById('matchTrack');
  track.innerHTML = Object.entries(byDate).map(([dateStr, dayMatches]) => {
    const date = parseLocalDate(dateStr);
    const state = date ? getDayState(date) : 'future';
    return buildDayCard(dateStr, dayMatches, state, watchPartyMatchIds);
  }).join('');

  track.querySelectorAll('.match-row:not(.match-row--no-click)').forEach(row => {
    row.addEventListener('click', handleMatchRowClick);
  });

  requestAnimationFrame(() => {
    const todayCard = track.querySelector('.day-card--today, .day-card--soon');
    if (todayCard) {
      const scrollLeft = todayCard.offsetLeft - (track.parentElement.getBoundingClientRect().width / 2) + (todayCard.getBoundingClientRect().width / 2);
      track.parentElement.scrollTo({ left: Math.max(0, scrollLeft), behavior: 'smooth' });
    }
  });

  document.getElementById('matchPrev').addEventListener('click', () => {
    track.parentElement.scrollBy({ left: -300, behavior: 'smooth' });
  });
  document.getElementById('matchNext').addEventListener('click', () => {
    track.parentElement.scrollBy({ left: 300, behavior: 'smooth' });
  });
}

// ─── Load matches + watch parties together ────────────────────────────────────
async function loadMatchesAndWatchParties() {
  const fetchCSV = async (url) => {
    if (!url) throw new Error('No URL');
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    try {
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeout);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.text();
    } catch (e) {
      clearTimeout(timeout);
      throw e;
    }
  };

  let matches = [];
  let watchParties = [];

  try {
    const [matchText, wpText] = await Promise.all([
      fetchCSV(MATCHES_CSV_URL),
      fetchCSV(WATCH_PARTIES_CSV_URL).catch(() => null),
    ]);
    matches = parseMatchesCSV(matchText);
    if (wpText) watchParties = parseWatchPartiesCSV(wpText);
  } catch (err) {
    console.warn('Match schedule could not be loaded:', err);
  }

  buildMatchCarousel(matches, watchParties);

  // Enrich watch parties with match data derived from match_id
  const matchById = window._matchById || {};
  const enrichedWatchParties = watchParties.map(wp => {
    const match = matchById[wp.match_id];
    if (match) {
      return {
        ...wp,
        home_team:  match.home_team,
        away_team:  match.away_team,
        match_date: match.date,
        match_time: match.time,
      };
    }
    return wp;
  });

  window._watchPartiesData = enrichedWatchParties;

  // Poll for gMap to be initialized before placing watch party markers
  // Poll until gMap is ready, then place markers
  const tryPlaceWatchParties = () => {
    if (window._gMapReady) {
      window.buildWatchPartyMarkers(enrichedWatchParties);
    } else {
      setTimeout(tryPlaceWatchParties, 200);
    }
  };
  setTimeout(tryPlaceWatchParties, 200);
}