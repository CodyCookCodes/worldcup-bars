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
  if (code === null) return '';
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
  }).filter(row => row.name || row['event name']);
}

// ─── Build a Maps URL combining Name and Address for a premium look ───────────
function buildMapsUrl(row) {
  const name = (row.name || '').trim();
  const address = (row.address || '').trim();
  
  // Combine them cleanly: "Bar Name, Street Address"
  // If one is somehow missing, fall back to what's available
  let combinedQuery = name;
  if (address) {
    combinedQuery = name ? `${name}, ${address}` : address;
  }

  // Safety net: If the combined string doesn't include the local city, anchor it
  if (combinedQuery && !combinedQuery.toLowerCase().includes('oakland')) {
    combinedQuery += ' Oakland, CA';
  }

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isAndroid = /Android/i.test(navigator.userAgent);

  // 1. iOS — Hand off Name + Address to native Apple Maps
  if (isIOS) {
    return `https://maps.apple.com/?q=${encodeURIComponent(combinedQuery)}`;
  }

  // 2. Android — Open in default maps app via geo: scheme
  if (isAndroid) {
    return `geo:0,0?q=${encodeURIComponent(combinedQuery)}`;
  }

  // 3. Desktop / General Fallback — Clean universal Google Maps search link
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(combinedQuery)}`;
}