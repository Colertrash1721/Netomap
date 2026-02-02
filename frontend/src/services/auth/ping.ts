import axios from "axios"

export const pingService = async () =>{
    const response = await axios.get(`${process.env.NEXT_PUBLIC_MY_BACKEND_API}/auth/ping`, {withCredentials: true})
    return response.data
}