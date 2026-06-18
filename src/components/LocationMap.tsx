import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix leafet icon paths
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
import iconRetina from 'leaflet/dist/images/marker-icon-2x.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconRetinaUrl: iconRetina,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

// Child component to update map view when coordinates change
function ChangeView({ center, zoom }: { center: [number, number], zoom: number }) {
  const map = useMap();
  map.setView(center, zoom);
  return null;
}

function ClickHandler({ onLocationSelect }: { onLocationSelect?: (lat: number, lon: number) => void }) {
  useMapEvents({
    click(e) {
      if (onLocationSelect) {
        onLocationSelect(e.latlng.lat, e.latlng.lng);
      }
    },
  });
  return null;
}

export function LocationMap({ lat, lon, name, onLocationSelect }: { lat: number, lon: number, name: string, onLocationSelect?: (lat: number, lon: number) => void }) {
  return (
    <div className="w-full h-full rounded-[2rem] overflow-hidden border border-slate-700/50 relative z-0">
      <MapContainer center={[lat, lon]} zoom={12} scrollWheelZoom={false} style={{ height: '100%', width: '100%', minHeight: '200px' }} attributionControl={false}>
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />
        <ChangeView center={[lat, lon]} zoom={13} />
        <ClickHandler onLocationSelect={onLocationSelect} />
        <Marker position={[lat, lon]}>
          <Popup>
            <div className="text-center font-bold text-slate-800">
              {name}
            </div>
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}
