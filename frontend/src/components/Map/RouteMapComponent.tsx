'use client';

import { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Location, User } from '@/types';

// Fix Leaflet icons (nécessaire avec Next.js)
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface RouteMapComponentProps {
  locations: Location[];
  user?: User | null;
  height?: string;
}

export default function RouteMapComponent({ locations, user, height = '500px' }: RouteMapComponentProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const polylinePositions = useMemo(() => {
    return locations.map((location) => [
      Number(location.latitude),
      Number(location.longitude),
    ]) as [number, number][];
  }, [locations]);

  const firstLocation = locations[0];
  const lastLocation = locations[locations.length - 1];

  const center = polylinePositions.length > 0
    ? polylinePositions[Math.floor(polylinePositions.length / 2)]
    : ([14.7167, -17.4677] as [number, number]);

  if (!isClient) {
    return <div style={{ height, width: '100%', borderRadius: '0.75rem', overflow: 'hidden' }} />;
  }

  return (
    <div style={{ height, width: '100%', borderRadius: '0.75rem', overflow: 'hidden' }}>
      <MapContainer
        center={center}
        zoom={polylinePositions.length > 0 ? 13 : 10}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {polylinePositions.length > 1 && (
          <Polyline
            positions={polylinePositions}
            color="#2563eb"
            weight={4}
            opacity={0.7}
          />
        )}

        {firstLocation && (
          <Marker position={[Number(firstLocation.latitude), Number(firstLocation.longitude)]}>
            <Popup>
              <div>
                <strong>Départ</strong>
                <br />
                {user?.name}
                <br />
                {new Date(firstLocation.timestamp).toLocaleString('fr-FR')}
                <br />
                {firstLocation.address || 'Adresse non disponible'}
              </div>
            </Popup>
          </Marker>
        )}

        {lastLocation && lastLocation !== firstLocation && (
          <Marker position={[Number(lastLocation.latitude), Number(lastLocation.longitude)]}>
            <Popup>
              <div>
                <strong>Arrivée</strong>
                <br />
                {user?.name}
                <br />
                {new Date(lastLocation.timestamp).toLocaleString('fr-FR')}
                <br />
                {lastLocation.address || 'Adresse non disponible'}
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
}


