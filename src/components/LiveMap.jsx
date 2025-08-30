// src/components/LiveMap.jsx
import { useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { useSearch } from "../context/SearchContext";

// Simple helper: make a tiny plane SVG and rotate it by heading
function makePlaneIcon(heading = 0) {
  const size = 28;
  const svg = `
  <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24">
    <g transform="rotate(${heading} 12 12)">
      <path fill="%230c1a4b" d="M11 2l2 0 0 7 7 3 0 2-7-1 0 6-2 0 0-6-7 1 0-2 7-3z"/>
      <circle cx="12" cy="12" r="1.3" fill="%23ffffff"/>
    </g>
  </svg>`;
  return L.icon({
    iconUrl: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });
}

// Fit bounds to markers when they change
function FitToMarkers({ points }) {
  const map = useMap();
  useMemo(() => {
    if (!points?.length) return;
    const valid = points.filter(p => Number.isFinite(p.latitude) && Number.isFinite(p.longitude));
    if (!valid.length) return;
    const bounds = L.latLngBounds(valid.map(p => [p.latitude, p.longitude]));
    map.fitBounds(bounds.pad(0.15), { animate: false });
  }, [points, map]);
  return null;
}

export default function LiveMap() {
  const { liveFlights } = useSearch();

  // Nigeria-ish fallback center (middle of the country)
  const center = [9.08, 8.68];
  const zoom = 6;

  // Only plot aircraft with lat/lon
  const planes = useMemo(
    () => (liveFlights || []).filter(p =>
      Number.isFinite(p.latitude) && Number.isFinite(p.longitude)
    ),
    [liveFlights]
  );

  return (
    <div className="w-full h-[480px] rounded-lg overflow-hidden border">
      <MapContainer center={center} zoom={zoom} style={{ width: "100%", height: "100%" }}>
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <FitToMarkers points={planes} />

        {planes.map(p => (
          <Marker
            key={p.icao24}
            position={[p.latitude, p.longitude]}
            icon={makePlaneIcon(Math.round((p.heading || 0) % 360))}
          >
            <Popup>
              <div className="text-sm">
                <div className="font-semibold">{p.callsign || "Unknown"}</div>
                <div>ICAO24: <span className="font-mono">{p.icao24}</span></div>
                <div>Country: {p.originCountry}</div>
                <div>Lat: {p.latitude?.toFixed(3)} / Lon: {p.longitude?.toFixed(3)}</div>
                <div>Alt: {p.baroAltitude ? `${Math.round(p.baroAltitude)} m` : "N/A"}</div>
                <div>Speed: {p.velocity ? `${Math.round(p.velocity)} m/s` : "N/A"}</div>
                <div>Heading: {p.heading ? `${Math.round(p.heading)}°` : "N/A"}</div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
