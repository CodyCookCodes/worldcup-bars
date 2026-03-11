// ─── Map state ────────────────────────────────────────────────────────────────
let gMap = null;
let gMarkers = []; // { marker, nation }

// ─── Build a Google Maps pin icon (orange = active, grey = inactive) ──────────
function makePinIcon(mode = 'orange') {
  const svg = mode === 'grey' ? GREY_PIN_SVG : mode === 'red' ? RED_PIN_SVG : ORANGE_PIN_SVG;
  return {
    url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg),
    scaledSize: new google.maps.Size(28, 36),
    anchor: new google.maps.Point(14, 36),
  };
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

  const isMobile = window.matchMedia('(pointer: coarse)').matches;
  gMap = new google.maps.Map(mapEl, {
    zoom: isMobile ? 15 : 15,
    center: { lat: 37.8044, lng: -122.2712 },
    styles: MAP_STYLE,
    disableDefaultUI: false,
    zoomControl: true,
    mapTypeControl: false,
    streetViewControl: false,
    fullscreenControl: true,
  });

  const bounds = new google.maps.LatLngBounds();
  const geocoder = new google.maps.Geocoder();
  let resolved = 0;

  const checkDone = () => {
    if (resolved === mappable.length && !bounds.isEmpty()) {
      gMap.fitBounds(bounds);
      google.maps.event.addListenerOnce(gMap, 'bounds_changed', () => {
        if (gMap.getZoom() > 14) gMap.setZoom(14);
      });
    }
  };

  // One shared InfoWindow so only one is open at a time
  const infoWindow = new google.maps.InfoWindow({
    disableAutoPan: false,
    maxWidth: 280,
  });

  // ── localStorage cache key for a bar ──────────────────────────────────────
  const cacheKey = bar => 'geo:' + (bar.place_id || bar.address || bar.name);

  const placeMarker = (bar, pos) => {
    bounds.extend(pos);
    const marker = new google.maps.Marker({
      position: pos,
      map: gMap,
      title: bar.name,
      icon: makePinIcon('orange'),
      optimized: false,
    });

        marker.addListener('click', () => {
          infoWindow.setContent(`
            <div style="
              background: #1a1a1a;
              color: #f0f0f0;
              padding: 10px 12px;
              border-radius: 6px;
            ">
              <div style="font-weight: 700; white-space: normal; word-break:break-word; font-size: 2.3rem; color: #ffffff; margin-bottom: 3px;">
                ${esc(bar.name)}
              </div>
              <div style="font-size: 2rem; color: #F79621; margin-bottom: 8px;">
                ${esc(bar.nation || '')}
              </div>
              <a href="${buildMapsUrl(bar)}" target="_blank" style="
                display: inline-block;
                font-size: 1.3rem;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                color: #111;
                background: #F79621;
                border-radius: 4px;
                padding: 4px 10px;
                text-decoration: none;
              ">Open in Maps</a>
            </div>
          `);
          infoWindow.setOptions({ maxWidth: 350, minWidth: 250 });
          infoWindow.open(gMap, marker);
        });

        gMarkers.push({
          marker,
          nations: (bar.nation || 'all nations').split(',').map(n => n.toLowerCase().trim()),
        });
    return marker;
  };

  mappable.forEach(bar => {
    // ── Check localStorage cache first ──────────────────────────────────────
    const key = cacheKey(bar);
    try {
      const cached = localStorage.getItem(key);
      if (cached) {
        const { lat, lng, ts } = JSON.parse(cached);
        const sevenDays = 7 * 24 * 60 * 60 * 1000;
        if (ts && Date.now() - ts < sevenDays) {
          const pos = new google.maps.LatLng(lat, lng);
          placeMarker(bar, pos);
          resolved++;
          checkDone();
          return;
        }
      }
    } catch (e) { /* ignore bad cache entries */ }

    // ── Fall back to geocoder ───────────────────────────────────────────────
    const safePlaceId = bar.place_id ? bar.place_id.replace(/[^a-zA-Z0-9_-]/g, '') : null;
    const request = safePlaceId
      ? { placeId: safePlaceId }
      : { address: bar.address };

    geocoder.geocode(request, (results, status) => {
      resolved++;
      if (status === 'OK' && results[0]) {
        const pos = results[0].geometry.location;
        // Save to cache for next time
        try {
          localStorage.setItem(key, JSON.stringify({ lat: pos.lat(), lng: pos.lng(), ts: Date.now() }));
        } catch (e) { /* storage full or unavailable */ }
        placeMarker(bar, pos);
      } else {
        console.warn(`Geocode failed for ${bar.name}: ${status}`);
      }
      checkDone();
    });
  });
};

// ─── Show/grey-out pins based on the active nation filter ────────────────────
window.filterMapPins = function(nation) {
  gMarkers.forEach(({ marker, nations }) => {
    const isMatch = nation === 'all' || nations.includes(nation);
    marker.setIcon(makePinIcon(isMatch ? 'orange' : 'grey'));
    marker.setZIndex(isMatch ? 10 : 1);
  });
};

// ─── Highlight pins for multiple nations (match row click) ────────────────────
window.filterMapPinsMulti = function(nations) {
  gMarkers.forEach(({ marker, nations: pinNations }) => {
    const isAllNations = pinNations.includes('all nations');
    const isMatch = nations.some(n => pinNations.includes(n));
    const mode = isMatch ? 'red' : isAllNations ? 'orange' : 'grey';
    marker.setIcon(makePinIcon(mode));
    marker.setZIndex(isMatch ? 10 : isAllNations ? 5 : 1);
  });
};