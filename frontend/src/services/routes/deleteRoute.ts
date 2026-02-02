import axios from 'axios';

export async function deleteRouteByDeviceName(deviceName: string) {
  const response = await axios.put(`${process.env.NEXT_PUBLIC_MY_BACKEND_API}/routes/${deviceName}`, null, {
    withCredentials: true,
  });
  return response.data;
}