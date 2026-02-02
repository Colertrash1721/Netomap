export type PositionType = {
  idPosition: number;
  deviceId: number;

  latitude: string;
  longitude: string;

  speed: number | null;
  batteryPercentage: number | null;
  course: number | null;

  serverTime: Date | null;
  deviceTime: Date | null;

  accuracy: number | null;
  satellites: number | null;

  blocked: boolean;
  creationDate: Date;
};