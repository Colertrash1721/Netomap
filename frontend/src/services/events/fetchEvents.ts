import axios from "axios";

export async function fetchEventFromDeviceName(deviceName: string){
    const response = await axios.get(`${process.env.NEXT_PUBLIC_MY_BACKEND_API}/traccar/device/${deviceName}`, { withCredentials: true });
  console.log(response.data);
  return response.data;
}