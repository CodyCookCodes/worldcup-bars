// ─── HTML-escape a string ─────────────────────────────────────────────────────
function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ─── Return a flag <img> or emoji fallback for a nation string ────────────────
function getFlag(nation) {
  const key = nation.toLowerCase().trim();
  if (!(key in FLAGS)) return '<span style="font-size:1.3rem">🏳</span>';
  const code = FLAGS[key];
  if (code === null) return '<span style="font-size:1.3rem">🌍</span>';
  return `<img src="https://flagcdn.com/40x30/${code}.png" width="28" height="21" style="border-radius:2px" alt="${esc(nation)}">`;
}

// ─── Larger flag for match rows ───────────────────────────────────────────────
function getMatchFlag(nation) {
  const key = (nation || '').toLowerCase().trim();
  if (!(key in FLAGS)) return '<span style="font-size:1.5rem">🏳</span>';
  const code = FLAGS[key];
  if (code === null) return '<span style="font-size:1.5rem">🌍</span>';
  return `<img src="https://flagcdn.com/48x36/${code}.png" width="36" height="27" style="border-radius:2px" alt="${esc(nation)}">`;
}

// ─── Parse CSV text into an array of row objects ──────────────────────────────
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

// ─── Build a Google Maps URL from a bar row ───────────────────────────────────
function buildMapsUrl(row) {
  const id = row.place_id ? row.place_id.replace(/[^a-zA-Z0-9_-]/g, '') : null;
  if (id) return `https://www.google.com/maps/place/?q=place_id:${id}`;
  return `https://www.google.com/maps/search/${encodeURIComponent((row.name || '') + ' ' + (row.address || ''))}`;
}