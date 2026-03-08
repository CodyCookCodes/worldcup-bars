// ─── Matches Module ───────────────────────────────────────────────────────────
// MATCHES_CSV_URL is defined in constants.js
// Sheet columns: date | time | home_team | away_team | home_score | away_score | stage | group

// ─── Parse CSV for matches (no 'name' column filter) ─────────────────────────
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
    'group stage': 'Group Stage',
    'round of 32': 'R32',
    'round of 16': 'R16',
    'quarter-final': 'QF',
    'semi-final': 'SF',
    'bronze final': '3rd Place',
    'final': 'FINAL',
  };
  return map[(stage || '').toLowerCase().trim()] || stage || '';
}

// ─── Single match row within a day card ──────────────────────────────────────
function buildMatchRow(match) {
  const hasScore = match.home_score !== '' && match.away_score !== '';
  const homeWon = hasScore && Number(match.home_score) > Number(match.away_score);
  const awayWon = hasScore && Number(match.away_score) > Number(match.home_score);

  const scoreOrTime = hasScore
    ? `<span class="mr-score">
         <span class="${homeWon ? 'score-win' : awayWon ? 'score-loss' : ''}">${escape(match.home_score)}</span>
         <span class="score-sep">–</span>
         <span class="${awayWon ? 'score-win' : homeWon ? 'score-loss' : ''}">${escape(match.away_score)}</span>
       </span>`
    : `<span class="mr-time">${escape(match.time || 'TBD')}</span>`;

  const groupInfo = match.group
    ? `<span class="mr-stage">${escape(stageLabel(match.stage))} · Grp ${escape(match.group)}</span>`
    : `<span class="mr-stage">${escape(stageLabel(match.stage))}</span>`;

  const homeKey = (match.home_team || '').toLowerCase().trim();
  const awayKey = (match.away_team || '').toLowerCase().trim();

  return `
    <div class="match-row" data-home="${homeKey}" data-away="${awayKey}" title="Filter bars for this match">
      <div class="mr-teams">
        <span class="mr-team">
          ${getFlag(match.home_team)}
          <span class="mr-name ${homeWon ? 'team--winner' : ''}">${escape(match.home_team || 'TBD')}</span>
        </span>
        <span class="mr-middle">${scoreOrTime}</span>
        <span class="mr-team mr-team--away">
          <span class="mr-name ${awayWon ? 'team--winner' : ''}">${escape(match.away_team || 'TBD')}</span>
          ${getFlag(match.away_team)}
        </span>
      </div>
      ${groupInfo}
    </div>`;
}

// ─── Day column card ──────────────────────────────────────────────────────────
function buildDayCard(dateStr, matchesForDay, state) {
  const date = parseLocalDate(dateStr);
  const stateClass = {
    past:   'day-card--past',
    today:  'day-card--today',
    soon:   'day-card--soon',
    future: 'day-card--future',
  }[state] || '';

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
        ${matchesForDay.map(buildMatchRow).join('')}
      </div>
    </div>`;
}

// ─── Click handler: filter bars by the two nations in a match row ─────────────
function handleMatchRowClick(e) {
  const row = e.currentTarget;
  const home = row.dataset.home;
  const away = row.dataset.away;

  // Deactivate all filter buttons
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));

  // Show blocks matching home, away, or all nations
  document.querySelectorAll('.category-block').forEach(block => {
    const n = block.dataset.nation;
    if (n === home || n === away || n === 'all nations') {
      block.classList.remove('hidden');
    } else {
      block.classList.add('hidden');
    }
  });

  // Update map pins — highlight both nations
  if (window.filterMapPinsMulti) window.filterMapPinsMulti([home, away]);

  // Scroll down to bar list
  const barList = document.getElementById('barList');
  const mapSection = document.querySelector('.map-section');
    if (mapSection) mapSection.scrollIntoView({ behavior: 'smooth', block: 'start' });

  // Visual feedback: highlight selected row
  document.querySelectorAll('.match-row').forEach(r => r.classList.remove('match-row--active'));
  row.classList.add('match-row--active');
}

// ─── Build and render the carousel ───────────────────────────────────────────
function buildMatchCarousel(matches) {
  const section = document.getElementById('matchCarousel');
  if (!section) return;

  if (!matches.length) {
    const track = document.getElementById('matchTrack');
    if (track) track.innerHTML = '<div style="color:#555;font-size:0.8rem;padding:20px 0;">Match schedule coming soon.</div>';
    return;
  }

  // Sort by date
  matches.sort((a, b) => {
    const da = parseLocalDate(a.date), db = parseLocalDate(b.date);
    if (da && db && da.getTime() !== db.getTime()) return da - db;
    return (a.time || '').localeCompare(b.time || '');
  });

  // Group by date
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
    return buildDayCard(dateStr, dayMatches, state);
  }).join('');

  // Attach click handlers to every match row
  track.querySelectorAll('.match-row').forEach(row => {
    row.addEventListener('click', handleMatchRowClick);
  });

  // Scroll to today/soon
  requestAnimationFrame(() => {
    const todayCard = track.querySelector('.day-card--today, .day-card--soon');
    if (todayCard) {
      const scrollLeft = todayCard.offsetLeft - (track.parentElement.getBoundingClientRect().width / 2) + (todayCard.getBoundingClientRect().width / 2);
      track.parentElement.scrollTo({ left: Math.max(0, scrollLeft), behavior: 'smooth' });
    }
  });

  // Arrow nav
  document.getElementById('matchPrev').addEventListener('click', () => {
    track.parentElement.scrollBy({ left: -300, behavior: 'smooth' });
  });
  document.getElementById('matchNext').addEventListener('click', () => {
    track.parentElement.scrollBy({ left: 300, behavior: 'smooth' });
  });
}

async function loadMatches() {
  try {
    const res = await fetch(MATCHES_CSV_URL);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const text = await res.text();
    const matches = parseMatchesCSV(text);
    buildMatchCarousel(matches);
  } catch (err) {
    console.warn('Match schedule could not be loaded:', err);
    const track = document.getElementById('matchTrack');
    if (track) track.innerHTML = '<div style="color:#555;font-size:0.8rem;padding:20px 0;">Match schedule coming soon.</div>';
  }
}