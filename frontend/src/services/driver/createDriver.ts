import { Driver } from "@/types/driver";
import axios from "axios";

export const createDriverService = async (driver: Driver) => {
    const response = await axios.post(
        `${process.env.NEXT_PUBLIC_MY_BACKEND_API}/driver`,
        driver,
        {
            headers: {
                "Content-Type": "application/json",
            },
            withCredentials: true
        }
    );
    return response.data;
}