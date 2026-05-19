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

// ─── Build a Maps URL from a bar row ───────────────────────────────────
function buildMapsUrl(row) {
  // Safeguard: Ensure we can read the place_id even if spacing/formatting varies
  const id = row.place_id ? row.place_id.replace(/[^a-zA-Z0-9_-]/g, '') : null;
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isAndroid = /Android/i.test(navigator.userAgent);

  // Check for 'cords' or 'coords' spelling variations in the data
  const rawCords = row.cords || row.coords || '';
  let lat = null, lng = null;
  
  if (rawCords && rawCords.trim()) {
    const split = rawCords.split(',').map(s => s.trim());
    if (!isNaN(parseFloat(split[0])) && !isNaN(parseFloat(split[1]))) {
      [lat, lng] = split;
    }
  }

  // 1. iOS — Force Apple Maps App via coordinates
  if (isIOS && lat && lng) {
    return `https://maps.apple.com/?q=${encodeURIComponent(row.name || '')}&ll=${lat},${lng}`;
  }

  // 2. Android — Universal "geo:" URI scheme to open default system map
  if (isAndroid && lat && lng) {
    return `geo:${lat},${lng}?q=${encodeURIComponent(row.name || '')}`;
  }

  // 3. Desktop / General Fallback — Official Google Maps Links
  // Priority A: Use Place ID if it exists (highly accurate)
  if (id) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(row.name || '')}&query_place_id=${id}`;
  }
  
  // Priority B: Use precise Coordinates if Place ID failed
  if (lat && lng) {
    return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
  }

  // Priority C: Text Search Fallback (Anchored strictly to local city context)
  let searchQuery = `${row.name || ''} ${row.address || ''}`.trim();
  
  // Explicitly inject the city modifier if the string doesn't include it
  const cityModifier = row.city || 'Oakland';
  if (!searchQuery.toLowerCase().includes(cityModifier.toLowerCase())) {
    searchQuery += ` ${cityModifier}`;
  }

  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(searchQuery)}`;
}