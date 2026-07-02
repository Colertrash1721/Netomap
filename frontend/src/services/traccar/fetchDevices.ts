import axios from 'axios';

export async function fetchDevices() {
  const response = await axios.get(`${process.env.NEXT_PUBLIC_MY_BACKEND_API}/devices/all/BD`, { withCredentials: true });
  return response.data;
}

export async function fetchAssignedDevices() {
  const response = await axios.get(`${process.env.NEXT_PUBLIC_MY_BACKEND_API}/devices/assigned/BD`, { withCredentials: true });
  return response.data;
}

export async function fetchDrivers() {
  const response = await axios.get(`${process.env.NEXT_PUBLIC_MY_BACKEND_API}/driver`, { withCredentials: true });
  console.log(response.data);
  return response.data;
}

export async function fetchDriverByUserId(userId: number) {
  const response = await axios.get(`${process.env.NEXT_PUBLIC_MY_BACKEND_API}/driver/user/${userId}`, { withCredentials: true });
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

export async function asignUsertoDeviceService(deviceName: string, userId: number){
  const response = await axios.post(`${process.env.NEXT_PUBLIC_MY_BACKEND_API}/devices/asignUserToDevice`, {deviceName, userId}, {withCredentials: true})
  return response.data;
}

export async function asignDriverToUser(driverId: number) {
  const response = await axios.post(`${process.env.NEXT_PUBLIC_MY_BACKEND_API}/devices/asignDriverToUser`, {driverId}, {withCredentials: true})
  return response.data;
}

export async function fetchAllUsers(){
  const response = await axios.get(`${process.env.NEXT_PUBLIC_MY_BACKEND_API}/traccar/users`, {withCredentials: true})
  return response.data;
}