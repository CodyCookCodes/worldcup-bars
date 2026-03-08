// ─── Matches Module ───────────────────────────────────────────────────────────
// Reads from a separate "Matches" tab in the same Google Sheet.
// Set MATCHES_GID to the gid= value of your Matches tab.
// The sheet columns (row 1 = headers) should be:
//   match_id | date       | time  | home_team | away_team | home_score | away_score | stage       | group
//   M1       | 2026-06-11 | 19:00 | Mexico    | TBD       |            |            | Group Stage | A
//
// Scores: leave home_score / away_score blank for unplayed matches.
// The "stage" column accepts: Group Stage, Round of 32, Round of 16,
//   Quarter-Final, Semi-Final, Bronze Final, Final
// ─────────────────────────────────────────────────────────────────────────────

// MATCHES_CSV_URL is defined in constants.js

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
  }).filter(row => row.date || row.home_team); // keep rows that have a date or home_team
}

// Parse a YYYY-MM-DD string as a local date (no timezone shift)
function parseLocalDate(str) {
  if (!str) return null;
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function getMatchState(match) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const matchDate = parseLocalDate(match.date);
  if (!matchDate) return 'future';

  const hasScore = match.home_score !== '' && match.away_score !== '';
  if (hasScore) return 'past';

  const weekFromNow = new Date(today);
  weekFromNow.setDate(weekFromNow.getDate() + 7);

  if (matchDate.getTime() === today.getTime()) return 'today';
  if (matchDate < today) return 'past';
  if (matchDate <= weekFromNow) return 'soon';
  return 'future';
}

function formatMatchDate(dateStr, timeStr) {
  const d = parseLocalDate(dateStr);
  if (!d) return '';
  const dateLabel = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', weekday: 'short' });
  return timeStr ? `${dateLabel} · ${timeStr}` : dateLabel;
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

function buildMatchCard(match, state) {
  const hasScore = match.home_score !== '' && match.away_score !== '';
  const homeWon = hasScore && Number(match.home_score) > Number(match.away_score);
  const awayWon = hasScore && Number(match.away_score) > Number(match.home_score);

  const stateClass = {
    past:   'match-card--past',
    today:  'match-card--today',
    soon:   'match-card--soon',
    future: 'match-card--future',
  }[state] || '';

  const badge = state === 'today'
    ? `<span class="match-badge match-badge--today">TODAY</span>`
    : state === 'soon'
    ? `<span class="match-badge match-badge--soon">THIS WEEK</span>`
    : '';

  const scoreOrTime = hasScore
    ? `<div class="match-score">
         <span class="${homeWon ? 'score-win' : awayWon ? 'score-loss' : ''}">${escape(match.home_score)}</span>
         <span class="score-sep">–</span>
         <span class="${awayWon ? 'score-win' : homeWon ? 'score-loss' : ''}">${escape(match.away_score)}</span>
       </div>`
    : `<div class="match-time">${escape(match.time || 'TBD')}</div>`;

  const groupInfo = match.group ? `<span class="match-group">Group ${escape(match.group)}</span>` : '';

  return `
    <div class="match-card ${stateClass}" data-state="${state}" data-match-id="${escape(match.match_id)}">
      ${badge}
      <div class="match-stage-row">
        <span class="match-stage">${escape(stageLabel(match.stage))}</span>
        ${groupInfo}
      </div>
      <div class="match-teams">
        <div class="match-team ${homeWon ? 'team--winner' : ''}">
          <span class="team-flag">${getFlag(match.home_team)}</span>
          <span class="team-name">${escape(match.home_team || 'TBD')}</span>
        </div>
        <div class="match-vs-col">
          ${scoreOrTime}
        </div>
        <div class="match-team match-team--away ${awayWon ? 'team--winner' : ''}">
          <span class="team-name">${escape(match.away_team || 'TBD')}</span>
          <span class="team-flag">${getFlag(match.away_team)}</span>
        </div>
      </div>
      <div class="match-meta">
        <span class="match-date">${formatMatchDate(match.date, '')}</span>
      </div>
    </div>`;
}

function buildMatchCarousel(matches) {
  const section = document.getElementById('matchCarousel');
  if (!section) return;

  if (!matches.length) {
    section.style.display = 'none';
    return;
  }

  // Sort by date then match_id
  matches.sort((a, b) => {
    const da = parseLocalDate(a.date), db = parseLocalDate(b.date);
    if (da && db && da.getTime() !== db.getTime()) return da - db;
    return (a.match_id || '').localeCompare(b.match_id || '', undefined, { numeric: true });
  });

  const track = document.getElementById('matchTrack');
  track.innerHTML = matches.map(m => buildMatchCard(m, getMatchState(m))).join('');

  // Scroll so today/soon cards are visible, centered
  requestAnimationFrame(() => {
    const todayCard = track.querySelector('.match-card--today, .match-card--soon');
    if (todayCard) {
      const trackRect = track.parentElement.getBoundingClientRect();
      const cardRect = todayCard.getBoundingClientRect();
      const scrollLeft = todayCard.offsetLeft - (trackRect.width / 2) + (cardRect.width / 2);
      track.parentElement.scrollTo({ left: Math.max(0, scrollLeft), behavior: 'smooth' });
    }
  });

  // Arrow nav
  document.getElementById('matchPrev').addEventListener('click', () => {
    track.parentElement.scrollBy({ left: -320, behavior: 'smooth' });
  });
  document.getElementById('matchNext').addEventListener('click', () => {
    track.parentElement.scrollBy({ left: 320, behavior: 'smooth' });
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
    const section = document.getElementById('matchCarousel');
    if (section) section.style.display = 'none';
  }
}