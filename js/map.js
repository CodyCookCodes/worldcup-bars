// ─── Map state ────────────────────────────────────────────────────────────────
let gMap = null;
let gBounds = null;
let gMarkers = [];   // { marker, nations, placeId }
let wMarkers = [];   // { marker, wp }
let gInfoWindow = null;

// ─── Build a Google Maps pin icon ─────────────────────────────────────────────
function makePinIcon(mode = 'orange') {
  const svg = mode === 'grey'  ? GREY_PIN_SVG
            : mode === 'red'   ? RED_PIN_SVG
            : mode === 'green' ? GREEN_PIN_SVG
            : ORANGE_PIN_SVG;
  return {
    url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg),
    scaledSize: new google.maps.Size(20, 26),
    anchor: new google.maps.Point(10, 26),
  };
}

function makeWatchPartyPinIcon(large = false) {
  const size = large ? 32 : 26;
  return {
    url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(GREEN_PIN_SVG),
    scaledSize: new google.maps.Size(size, Math.round(size * 1.3)),
    anchor: new google.maps.Point(size / 2, Math.round(size * 1.3)),
  };
}

// ─── Refits the map bounds to include all markers ─────────────────────────────
function refitBounds() {
  if (!gMap || !gBounds || gBounds.isEmpty()) return;
  gMap.fitBounds(gBounds);
  google.maps.event.addListenerOnce(gMap, 'bounds_changed', () => {
    if (gMap.getZoom() > 14) gMap.setZoom(14);
  });
}

// ─── Initialise the map and geocode/place all bars ────────────────────────────
window.buildMap = function(bars) {
  const loadingEl = document.getElementById('map-loading');
  const mappable = bars.filter(b => b.address);

  if (!mappable.length) {
    if (loadingEl) loadingEl.style.display = 'none';
    document.querySelector('.map-section').style.display = 'none';
    return;
  }

  const mapEl = document.getElementById('map');
  if (loadingEl) loadingEl.style.display = 'none';
  mapEl.style.display = 'block';

  gMap = new google.maps.Map(mapEl, {
    zoom: 15,
    center: { lat: 37.8044, lng: -122.2712 },
    styles: MAP_STYLE,
    disableDefaultUI: false,
    zoomControl: true,
    mapTypeControl: false,
    streetViewControl: false,
    fullscreenControl: true,
  });

  gBounds = new google.maps.LatLngBounds();
  window._gMapReady = true;

  if (window._watchPartiesReady && window._watchPartiesData && window._watchPartiesData.length) {
    window.buildWatchPartyMarkers(window._watchPartiesData);
  }

  const geocoder = new google.maps.Geocoder();
  let resolved = 0;

  const checkDone = () => {
    if (resolved === mappable.length) refitBounds();
  };

  gInfoWindow = new google.maps.InfoWindow({
    disableAutoPan: false,
  });

  const cacheKey = bar => 'geo:' + (bar.place_id || bar.address || bar.name);

  const placeMarker = (bar, pos) => {
    gBounds.extend(pos);
    const marker = new google.maps.Marker({
      position: pos,
      map: gMap,
      title: bar.name,
      icon: makePinIcon('orange'),
      optimized: false,
    });

    marker.addListener('click', () => {
      gInfoWindow.setContent(`
        <div style="background:#1a1a1a;color:#f0f0f0;padding:10px 12px;border-radius:6px;min-width:180px;max-width:240px;">
          <div style="font-weight:600;white-space:normal;padding-right:50px;overflow-wrap:break-word;font-size:1.35rem;color:#ffffff;margin-bottom:3px;">
            ${esc(bar.name)}
          </div>
          <div style="font-size:1rem;color:#F79621;margin-bottom:8px;">
            ${esc(bar.nation || '')}
          </div>
          <a href="${buildMapsUrl(bar)}" target="_blank" style="display:inline-block;font-size:.85rem;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:#111;background:#F79621;border-radius:4px;padding:4px 10px;text-decoration:none;">Open in Maps</a>
        </div>
      `);
      gInfoWindow.setOptions({ maxWidth: 350, minWidth: 250 });
      gInfoWindow.open(gMap, marker);
    });

    const safePlaceId = bar.place_id ? bar.place_id.replace(/[^a-zA-Z0-9_-]/g, '') : null;
    gMarkers.push({
      marker,
      nations: (bar.nation || 'all nations').split(',').map(n => n.toLowerCase().trim()),
      placeId: safePlaceId || null,
    });
    return marker;
  };

  mappable.forEach(bar => {
    const key = cacheKey(bar);
    try {
      const cached = localStorage.getItem(key);
      if (cached) {
        const { lat, lng, ts } = JSON.parse(cached);
        const sevenDays = 7 * 24 * 60 * 60 * 1000;
        if (ts && Date.now() - ts < sevenDays) {
          placeMarker(bar, new google.maps.LatLng(lat, lng));
          resolved++;
          checkDone();
          return;
        }
      }
    } catch (e) { /* ignore bad cache */ }

    const safePlaceId = bar.place_id ? bar.place_id.replace(/[^a-zA-Z0-9_-]/g, '') : null;
    const request = safePlaceId ? { placeId: safePlaceId } : { address: bar.address };

    geocoder.geocode(request, (results, status) => {
      resolved++;
      if (status === 'OK' && results[0]) {
        const pos = results[0].geometry.location;
        try {
          localStorage.setItem(key, JSON.stringify({ lat: pos.lat(), lng: pos.lng(), ts: Date.now() }));
        } catch (e) { /* storage full */ }
        placeMarker(bar, pos);
      } else {
        console.warn(`Geocode failed for ${bar.name}: ${status}`);
      }
      checkDone();
    });
  });
};

// ─── Place watch party markers (green pins, hidden until Watch Party filter active) ──
window.buildWatchPartyMarkers = function(watchParties) {
  if (!gMap || !watchParties.length) return;

  const geocoder = new google.maps.Geocoder();

  watchParties.forEach(wp => {
    if (!wp.address && !wp.place_id) return;

    const safePlaceId = wp.place_id ? wp.place_id.replace(/[^a-zA-Z0-9_-]/g, '') : null;

    const createHiddenMarker = (pos) => {
      const marker = new google.maps.Marker({
        position: pos,
        map: null,  // hidden by default — only shown when Watch Party filter is active
        title: wp.name,
        icon: makeWatchPartyPinIcon(false),
        optimized: false,
        zIndex: 20,
      });
      marker.addListener('click', () => buildWatchPartyInfoWindow(wp, marker));
      wMarkers.push({ marker, wp });
    };

    // If this watch party matches an existing bar pin, reuse its position
    if (safePlaceId) {
      const existing = gMarkers.find(m => m.placeId === safePlaceId);
      if (existing) {
        createHiddenMarker(existing.marker.getPosition());
        return;
      }
    }

    const request = safePlaceId ? { placeId: safePlaceId } : { address: wp.address };

    geocoder.geocode(request, (results, status) => {
      if (status !== 'OK' || !results[0]) {
        console.warn(`Watch party geocode failed for ${wp.name}: ${status}`);
        return;
      }
      createHiddenMarker(results[0].geometry.location);
    });
  });
};

// ─── Watch party InfoWindow content ──────────────────────────────────────────
function buildWatchPartyInfoWindow(wp, marker) {
  const matchLine = (wp.home_team && wp.away_team)
    ? `<div style="display:flex;align-items:center;gap:6px;margin-bottom:6px;">
         ${getMatchFlag(wp.home_team)}
         <span style="font-size:0.85rem;color:#ccc;">${esc(wp.home_team)} vs ${esc(wp.away_team)}</span>
         ${getMatchFlag(wp.away_team)}
       </div>`
    : '';

  const dateLine = (wp.match_date || wp.match_time)
    ? `<div style="font-size:0.78rem;color:#888;margin-bottom:8px;">${esc(wp.match_date || '')}${wp.match_time ? ' · ' + esc(wp.match_time) : ''}</div>`
    : '';

  gInfoWindow.setContent(`
    <div style="background:#0d1f16;color:#f0f0f0;padding:10px 12px;border-radius:6px;min-width:180px;max-width:240px;">
      <div style="font-size:0.65rem;font-weight:800;letter-spacing:1.5px;text-transform:uppercase;color:#25B67C;margin-bottom:5px;">Watch Party</div>
      <div style="font-weight:700;white-space:normal;padding-right:50px;overflow-wrap:break-word;font-size:1.35rem;color:#ffffff;margin-bottom:6px;">${esc(wp.name)}</div>
      ${matchLine}
      ${dateLine}
      <a href="${buildMapsUrl(wp)}" target="_blank" style="display:inline-block;font-size:.8rem;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:#111;background:#25B67C;border-radius:4px;padding:4px 10px;text-decoration:none;">Open in Maps</a>
    </div>
  `);
  gInfoWindow.setOptions({ maxWidth: 350, minWidth: 250 });
  gInfoWindow.open(gMap, marker);
}

// ─── Show only watch party pins, hide all bar pins ────────────────────────────
window.filterMapWatchParties = function() {
  if (gInfoWindow) gInfoWindow.close();
  // Hide all regular bar pins
  gMarkers.forEach(({ marker }) => marker.setMap(null));
  // Show all watch party green pins
  wMarkers.forEach(({ marker }) => marker.setMap(gMap));
};

// ─── Restore all bar pins (called when leaving watch party view) ──────────────
window.restoreMapPins = function() {
  if (gInfoWindow) gInfoWindow.close();
  // Hide watch party pins
  wMarkers.forEach(({ marker }) => marker.setMap(null));
  // Show all bar pins
  gMarkers.forEach(({ marker }) => marker.setMap(gMap));
};

// ─── Show/grey-out bar pins based on the active nation filter ─────────────────
window.filterMapPins = function(nation) {
  if (gInfoWindow) gInfoWindow.close();
  // Hide watch party pins — they only appear in Watch Party filter mode
  wMarkers.forEach(({ marker }) => marker.setMap(null));
  // Restore all bar markers to map
  gMarkers.forEach(({ marker }) => marker.setMap(gMap));
  gMarkers.forEach(({ marker, nations }) => {
    const isMatch = nation === 'all' || nations.includes(nation);
    marker.setIcon(makePinIcon(isMatch ? 'orange' : 'grey'));
    marker.setZIndex(isMatch ? 10 : 1);
  });
};

// ─── Highlight pins for multiple nations (match row click) ────────────────────
window.filterMapPinsMulti = function(nations, matchId) {
  if (gInfoWindow) gInfoWindow.close();
  // Restore all bar markers first
  gMarkers.forEach(({ marker }) => marker.setMap(gMap));
  gMarkers.forEach(({ marker, nations: pinNations }) => {
    const isAllNations = pinNations.includes('all nations');
    const isMatch = nations.some(n => pinNations.includes(n));
    const mode = isMatch ? 'red' : isAllNations ? 'orange' : 'grey';
    marker.setIcon(makePinIcon(mode));
    marker.setZIndex(isMatch ? 10 : isAllNations ? 5 : 1);
  });
  // Show watch party pins for this specific match (match by ID, or fall back to both team names)
  wMarkers.forEach(({ marker, wp }) => {
    const home = (wp.home_team || '').toLowerCase().trim();
    const away = (wp.away_team || '').toLowerCase().trim();
    const matchesById   = matchId && wp.match_id && wp.match_id.trim() === matchId.trim();
    const matchesByTeam = home && away && nations.includes(home) && nations.includes(away);
    if (matchesById || matchesByTeam) {
      marker.setMap(gMap);
      marker.setZIndex(30);
    } else {
      marker.setMap(null);
    }
  });
};