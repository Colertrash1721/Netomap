import axios from "axios";

export async function sendCommand(deviceName: string | undefined) {
    const response = await axios.post(`${process.env.NEXT_PUBLIC_MY_BACKEND_API}/devices/openCommand`, {deviceName}, { withCredentials: true })
    console.log(response.data);
    return response.data
    
}