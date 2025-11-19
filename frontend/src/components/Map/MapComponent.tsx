'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Location } from '@/types';

// Fix pour les icônes Leaflet avec Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface MapComponentProps {
  currentLocation?: Location | null;
  locations?: Location[];
  center?: [number, number];
  zoom?: number;
  height?: string;
}

function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap();
  
  useEffect(() => {
    if (center) {
      map.setView(center, map.getZoom());
    }
  }, [center, map]);

  return null;
}

export default function MapComponent({
  currentLocation,
  locations = [],
  center = [48.8566, 2.3522], // Paris par défaut
  zoom = 13,
  height = '500px',
}: MapComponentProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    return () => setIsClient(false);
  }, []);

  if (!isClient) {
    return <div style={{ height, width: '100%', borderRadius: '0.75rem', overflow: 'hidden' }} />;
  }

  const mapCenter = currentLocation
    ? [Number(currentLocation.latitude), Number(currentLocation.longitude)] as [number, number]
    : center;

  // Créer les points pour la polyligne (historique)
  const polylinePositions = locations
    .map(loc => [Number(loc.latitude), Number(loc.longitude)] as [number, number])
    .reverse();

  // Créer une icône personnalisée pour la position actuelle
  const currentIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  });

  return (
    <div style={{ height, width: '100%', borderRadius: '0.75rem', overflow: 'hidden' }}>
      <MapContainer
        center={mapCenter}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <MapUpdater center={mapCenter} />

        {/* Afficher la position actuelle */}
        {currentLocation && (
          <Marker
            position={[Number(currentLocation.latitude), Number(currentLocation.longitude)]}
            icon={currentIcon}
          >
            <Popup>
              <div>
                <strong>Position actuelle</strong>
                <br />
                {currentLocation.address || 'Adresse non disponible'}
                <br />
                {currentLocation.speed && `Vitesse: ${Number(currentLocation.speed).toFixed(1)} km/h`}
                <br />
                {new Date(currentLocation.timestamp).toLocaleString('fr-FR')}
              </div>
            </Popup>
          </Marker>
        )}

        {/* Afficher le tracé de l'historique */}
        {polylinePositions.length > 1 && (
          <Polyline
            positions={polylinePositions}
            color="#2563eb"
            weight={3}
            opacity={0.7}
          />
        )}

        {/* Afficher les autres positions de l'historique */}
        {locations.slice(0, -1).map((location) => (
          <Marker
            key={location.id}
            position={[Number(location.latitude), Number(location.longitude)]}
          >
            <Popup>
              <div>
                <strong>Position historique</strong>
                <br />
                {new Date(location.timestamp).toLocaleString('fr-FR')}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
