// ─── Map state ────────────────────────────────────────────────────────────────
let gMap = null;
let gMarkers = []; // { marker, nation }

// ─── Build a Google Maps pin icon (orange = active, grey = inactive) ──────────
function makePinIcon(grey = false) {
  const svg = grey ? GREY_PIN_SVG : ORANGE_PIN_SVG;
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

  gMap = new google.maps.Map(mapEl, {
    zoom: 13,
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
        if (gMap.getZoom() > 15) gMap.setZoom(15);
      });
    }
  };

  // One shared InfoWindow so only one is open at a time
  const infoWindow = new google.maps.InfoWindow({
    disableAutoPan: false,
    maxWidth: 280,
  });

  mappable.forEach(bar => {
    const request = bar.place_id
      ? { placeId: bar.place_id }
      : { address: bar.address };

    geocoder.geocode(request, (results, status) => {
      resolved++;
      if (status === 'OK' && results[0]) {
        const pos = results[0].geometry.location;
        bounds.extend(pos);

        const marker = new google.maps.Marker({
          position: pos,
          map: gMap,
          title: bar.name,
          icon: makePinIcon(false),
          optimized: false,
        });

        marker.addListener('click', () => {
          infoWindow.setContent(`
            <div style="
              font-family: 'Inter', sans-serif;
              background: #1a1a1a;
              color: #f0f0f0;
              padding: 10px 12px;
              border-radius: 6px;
            ">
              <div style="font-weight: 700; white-space: normal; word-break:break-word; font-size: 0.95rem; color: #ffffff; margin-bottom: 3px;">
                ${escape(bar.name)}
              </div>
              <div style="font-size: 0.75rem; color: #F79621; margin-bottom: 8px;">
                ${escape(bar.nation || '')}
              </div>
              <a href="${buildMapsUrl(bar)}" target="_blank" style="
                display: inline-block;
                font-size: 0.72rem;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                color: #111;
                background: #F79621;
                border-radius: 4px;
                padding: 4px 10px;
                text-decoration: none;
              ">📍 Open in Maps</a>
            </div>
          `);
          infoWindow.setOptions({ maxWidth: 350, minWidth: 250 });
          infoWindow.open(gMap, marker);
        });

        gMarkers.push({
          marker,
          nation: (bar.nation || 'all nations').toLowerCase().trim(),
        });
      } else {
        console.warn(`Geocode failed for ${bar.name}: ${status}`);
      }
      checkDone();
    });
  });
};

// ─── Show/grey-out pins based on the active nation filter ────────────────────
window.filterMapPins = function(nation) {
  gMarkers.forEach(({ marker, nation: pinNation }) => {
    const isMatch = nation === 'all' || pinNation === nation;
    marker.setIcon(makePinIcon(!isMatch));
    marker.setZIndex(isMatch ? 10 : 1);
  });
};

// ─── Highlight pins for multiple nations (used by match row click) ────────────
window.filterMapPinsMulti = function(nations) {
  gMarkers.forEach(({ marker, nation: pinNation }) => {
    const isMatch = nations.includes(pinNation);
    marker.setIcon(makePinIcon(!isMatch));
    marker.setZIndex(isMatch ? 10 : 1);
  });
};