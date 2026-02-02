import axios from "axios";
import { TraccarGeofence } from "@/utils/geofences";

export async function fetchGeofences(): Promise<TraccarGeofence[]> {
  try {
    const response = await axios.get(
      `${process.env.NEXT_PUBLIC_MY_BACKEND_API}/geofence`,
      { withCredentials: true }
    );
    console.log(response.data);
    return response.data;
  } catch (error) {
    console.error("❌ Error al obtener geocercas:", error);
    throw error;
  }
}