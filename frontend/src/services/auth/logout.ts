import axios from "axios";

export const logoutService = async (username: string, token: any) => {
  const response = await axios.post(
    `${process.env.NEXT_PUBLIC_MY_BACKEND_API}/auth/logout`,
    {
        username,
        token
    },
    {
        headers: {
            'Content-Type': 'application/json'
        },
        withCredentials: true
    }
  );
  console.log(response);
  return response.data; 
};
