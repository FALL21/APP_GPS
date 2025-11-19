export interface GpsActivity {
  userId: number;
  userName: string;
  isTracking: boolean;
  lastUpdate?: Date;
  totalLocations?: number;
}
