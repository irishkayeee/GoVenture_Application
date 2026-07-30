/**
 * LeafletMap.tsx
 * Real interactive map (pan/zoom/OpenStreetMap tiles) for the itinerary's
 * "View on map" pins — rendered via Leaflet inside a WebView, since RN has
 * no native DOM for Leaflet to mount into. Markers are generated from real
 * data, not a hardcoded pixel layout; tapping a different activity updates
 * the active marker in place via injectJavaScript instead of reloading.
 */

import React, { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { C } from '../theme';

export type MapPin = { lat: number; lng: number; label: string };

type Props = {
  pins: MapPin[];
  activeIndex: number;
  height?: number;
};

function buildHtml(pins: MapPin[]): string {
  const pinsJson = JSON.stringify(pins);
  return `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <style>
    html, body, #map { height: 100%; margin: 0; padding: 0; background: ${C.lightBg}; }
    .pin-icon {
      display: flex; align-items: center; justify-content: center;
      width: 24px; height: 24px; border-radius: 50%;
      background: ${C.brownMid}; color: #FFFFFF; font-weight: 800; font-size: 11px;
      border: 2px solid #FFFFFF; box-shadow: 0 1px 4px rgba(0,0,0,0.35);
      font-family: -apple-system, Roboto, sans-serif;
    }
    .pin-icon.active { background: ${C.amber}; width: 30px; height: 30px; font-size: 13px; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script>
    var pins = ${pinsJson};
    var map = L.map('map', { zoomControl: false, attributionControl: false });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map);

    function makeIcon(i, active) {
      var size = active ? 30 : 24;
      return L.divIcon({
        className: '',
        html: '<div class="pin-icon' + (active ? ' active' : '') + '">' + (i + 1) + '</div>',
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
      });
    }

    var markers = pins.map(function (p, i) {
      return L.marker([p.lat, p.lng], { icon: makeIcon(i, i === 0) })
        .addTo(map)
        .bindTooltip(p.label);
    });

    if (pins.length > 1) {
      map.fitBounds(L.latLngBounds(pins.map(function (p) { return [p.lat, p.lng]; })), { padding: [28, 28] });
    } else if (pins.length === 1) {
      map.setView([pins[0].lat, pins[0].lng], 14);
    }

    window.setActivePin = function (idx) {
      markers.forEach(function (m, i) { m.setIcon(makeIcon(i, i === idx)); });
      if (markers[idx]) map.panTo(markers[idx].getLatLng());
    };
  </script>
</body>
</html>`;
}

export default function LeafletMap({ pins, activeIndex, height = 160 }: Props) {
  const webviewRef = useRef<WebView>(null);
  const html = React.useMemo(() => buildHtml(pins), [pins]);

  useEffect(() => {
    webviewRef.current?.injectJavaScript(`window.setActivePin && window.setActivePin(${activeIndex}); true;`);
  }, [activeIndex]);

  if (pins.length === 0) return null;

  return (
    <View style={[s.wrap, { height }]}>
      <WebView
        ref={webviewRef}
        originWhitelist={['*']}
        source={{ html }}
        style={{ backgroundColor: 'transparent' }}
        scrollEnabled={false}
        javaScriptEnabled
        domStorageEnabled
      />
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: C.divider },
});
