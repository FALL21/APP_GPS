'use client';

import { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Tooltip, useMap, CircleMarker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { GpsActivity, Location } from '@/types';

// Fix pour les icônes Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface AdminMapComponentProps {
  activities: GpsActivity[];
  allLocations: Location[];
  selectedUserId?: number | null;
  onUserSelect?: (userId: number) => void;
  height?: string;
}

const colors = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap();
  
  useEffect(() => {
    if (center) {
      map.setView(center, map.getZoom());
    }
  }, [center, map]);

  return null;
}

export default function AdminMapComponent({
  activities,
  allLocations,
  selectedUserId,
  onUserSelect,
  height = '500px',
}: AdminMapComponentProps) {
  // Cache local: userId -> adresse résolue
  const [addressByUser, setAddressByUser] = useState<Record<number, string>>({});
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);
  // Créer des icônes colorées pour chaque utilisateur
  const getUserIcon = (userId: number, isTracking: boolean) => {
    const colorIndex = userId % colors.length;
    const color = colors[colorIndex];
    
    // Créer une icône SVG personnalisée
    const svgIcon = L.divIcon({
      className: 'custom-marker',
      html: `
        <svg width="25" height="41" viewBox="0 0 25 41" xmlns="http://www.w3.org/2000/svg">
          <path fill="${color}" d="M12.5 0C5.596 0 0 5.596 0 12.5C0 21.5 12.5 41 12.5 41C12.5 41 25 21.5 25 12.5C25 5.596 19.404 0 12.5 0Z"/>
          <circle cx="12.5" cy="12.5" r="5" fill="white"/>
        </svg>
      `,
      iconSize: [25, 41],
      iconAnchor: [12.5, 41],
      popupAnchor: [0, -41],
    });
    
    return svgIcon;
  };

  // Grouper les locations par utilisateur
  const locationsByUser = useMemo(() => {
    const map = new Map<number, Location[]>();
    allLocations.forEach(loc => {
      if (!map.has(loc.userId)) {
        map.set(loc.userId, []);
      }
      map.get(loc.userId)!.push(loc);
    });
    return map;
  }, [allLocations]);

  // Résoudre les adresses manquantes (géocodage inverse côté client)
  useEffect(() => {
    const controller = new AbortController();

    const resolveAddress = async (userId: number, lat: number, lng: number) => {
      try {
        const key = `${lat.toFixed(6)},${lng.toFixed(6)}`;
        // Éviter les requêtes répétées si déjà résolu pour cet utilisateur
        if (addressByUser[userId]) return;
        const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`;
        const res = await fetch(url, {
          headers: { 'User-Agent': 'GPS-Tracking-Frontend/1.0' },
          signal: controller.signal,
        });
        if (!res.ok) return;
        const data = await res.json();
        const displayName: string | undefined = data?.display_name;
        if (displayName) {
          setAddressByUser(prev => ({ ...prev, [userId]: displayName }));
        }
      } catch (_) {
        // no-op (réseau bloqué, quota, etc.)
      }
    };

    for (const activity of activities) {
      if (!activity.lastLocation) continue;
      const userId = activity.userId;
      // Chercher si on a déjà une adresse en base pour cet utilisateur
      const userLocations = locationsByUser.get(userId) || [];
      const lastWithAddr = userLocations
        .filter(loc => loc.address && loc.address.trim() !== '')
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
      if (lastWithAddr?.address) {
        if (!addressByUser[userId]) {
          setAddressByUser(prev => ({ ...prev, [userId]: lastWithAddr.address! }));
        }
        continue;
      }
      // Sinon, tenter de résoudre à la volée
      const lat = Number(activity.lastLocation.latitude);
      const lng = Number(activity.lastLocation.longitude);
      resolveAddress(userId, lat, lng);
    }

    return () => controller.abort();
  }, [activities, locationsByUser, addressByUser]);

  // Calculer le centre de la carte
  const centerLat = activities.length > 0 && activities[0].lastLocation
    ? Number(activities[0].lastLocation.latitude)
    : 48.8566;
  const centerLng = activities.length > 0 && activities[0].lastLocation
    ? Number(activities[0].lastLocation.longitude)
    : 2.3522;

  if (!isClient) {
    return <div style={{ height, width: '100%', borderRadius: '0.75rem', overflow: 'hidden' }} />;
  }

  return (
    <div style={{ height, width: '100%', borderRadius: '0.75rem', overflow: 'hidden' }}>
      <MapContainer
        center={[centerLat, centerLng]}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <MapUpdater center={[centerLat, centerLng]} />

        {/* Afficher les marqueurs pour chaque utilisateur actif */}
        {activities.map((activity) => {
          if (!activity.lastLocation) return null;
          
          const icon = getUserIcon(activity.userId, activity.isTracking);
          const userLocations = locationsByUser.get(activity.userId) || [];

          return (
            <div key={activity.userId}>
              <Marker
                position={[Number(activity.lastLocation.latitude), Number(activity.lastLocation.longitude)]}
                icon={icon}
                eventHandlers={{
                  click: () => {
                    if (onUserSelect) {
                      onUserSelect(activity.userId);
                    }
                  },
                }}
              >
                <Tooltip permanent={true} direction="top" offset={[0, -35]} opacity={0.9}>
                  <div style={{
                    fontWeight: 'bold',
                    fontSize: '13px',
                    textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                    color: '#ffffff',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    backgroundColor: 'rgba(0,0,0,0.6)',
                  }}>
                    {activity.userName}
                    {activity.isTracking ? ' 🟢' : ' 🔴'}
                  </div>
                </Tooltip>
                <Popup>
                  <div>
                    <strong>{activity.userName}</strong>
                    <br />
                    {activity.userEmail}
                    <br />
                    <span style={{ color: activity.isTracking ? '#10b981' : '#ef4444' }}>
                      {activity.isTracking ? '🟢 GPS Actif' : '🔴 GPS Inactif'}
                    </span>
                    <br />
                    {activity.lastUpdate && (
                      <>
                        Dernière mise à jour: {new Date(activity.lastUpdate).toLocaleString('fr-FR')}
                        <br />
                      </>
                    )}
                    {(() => {
                      const resolved = addressByUser[activity.userId];
                      return resolved ? (
                        <>Emplacement: {resolved}</>
                      ) : (
                        <>Emplacement: Chargement…</>
                      );
                    })()}
                  </div>
                </Popup>
              </Marker>

              {/* Cercle pour indiquer la zone de précision (optionnel) */}
              {activity.isTracking && (
                <CircleMarker
                  center={[Number(activity.lastLocation.latitude), Number(activity.lastLocation.longitude)]}
                  radius={50}
                  pathOptions={{
                    color: colors[activity.userId % colors.length],
                    fillColor: colors[activity.userId % colors.length],
                    fillOpacity: 0.2,
                  }}
                />
              )}
            </div>
          );
        })}
      </MapContainer>
    </div>
  );
}
