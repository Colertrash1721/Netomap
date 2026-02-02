import axios from 'axios';

export async function fetchDevices() {
  const response = await axios.get(`${process.env.NEXT_PUBLIC_MY_BACKEND_API}/devices`, { withCredentials: true });
  return response.data;
}

export async function fetchDrivers() {
  const response = await axios.get(`${process.env.NEXT_PUBLIC_MY_BACKEND_API}/devices/drivers`, { withCredentials: true });
  return response.data;
}

export async function fetchAssignedDrivers() {
  const response = await axios.get(`${process.env.NEXT_PUBLIC_MY_BACKEND_API}/devices/assigned-drivers`, { withCredentials: true });
  return response.data.deviceDrivers;
}

export async function fetchPositions(){
  const response = await axios.get(`${process.env.NEXT_PUBLIC_MY_BACKEND_API}/devices/positions`, { withCredentials: true });
  return response.data;
}

export async function asignDriver(driverName: string, deviceName: string) {
  const response = await axios.post(`${process.env.NEXT_PUBLIC_MY_BACKEND_API}/devices/asignDriverToDevice`, {driverName, deviceName}, {withCredentials: true})
  return response.data;
}

export async function fetchdifferentDevices() {
  const response = await axios.get(`${process.env.NEXT_PUBLIC_MY_BACKEND_API}/devices/different/devices`, {withCredentials: true})  
  return response.data;
}

export async function fetchdifferentDrivers() {
  const response = await axios.get(`${process.env.NEXT_PUBLIC_MY_BACKEND_API}/devices/different/drivers`, {withCredentials: true})  
  return response.data;
}

export async function asignDeviceToUser(deviceId: number) {
  const response = await axios.post(`${process.env.NEXT_PUBLIC_MY_BACKEND_API}/devices/asignDeviceToUser`, {deviceId}, {withCredentials: true})
  return response.data;
}

export async function asignDriverToUser(driverId: number) {
  const response = await axios.post(`${process.env.NEXT_PUBLIC_MY_BACKEND_API}/devices/asignDriverToUser`, {driverId}, {withCredentials: true})
  return response.data;
}