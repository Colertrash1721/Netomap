import axios from "axios";

type ConcurrentParams = {
  routeName: string;
  latStart: number;
  lonStart: number;
  latEnd: number;
  lonEnd: number;
};

type AsignConcurrentParams = {
  deviceName: string;
  rute_name: string,
  latStart: number;
  lonStart: number;
  latEnd: number;
  lonEnd: number;
};

export async function postConcurrent(params: ConcurrentParams) {
  const response = await axios.post(
    `${process.env.NEXT_PUBLIC_MY_BACKEND_API}/routes/concurrent`,
    {
      routeName: params.routeName,
      Startlatitud: params.latStart,
      Startlongitud: params.lonStart,
      Endlatitud: params.latEnd,
      Endlongitud: params.lonEnd,
    }
  );
  return response.data;
}

export async function asignConcurrent(params: AsignConcurrentParams) {
  const response = await axios.post(
    `${process.env.NEXT_PUBLIC_MY_BACKEND_API}/routes`,
    {
      rute_Name: params.rute_name,
      device_Name: params.deviceName,
      Startlatitud: params.latStart,
      Startlongitud: params.lonStart,
      Endlatitud: params.latEnd,
      Endlongitud: params.lonEnd,
    }
  );
  return response.data;
}

export async function getAllConcurrentRoutes() {
  const response = await axios.get(`${process.env.NEXT_PUBLIC_MY_BACKEND_API}/routes/concurrent`);
  return response.data;
}

export async function deleteConcurrent(routeName: string) {
  const response = await axios.delete(
    `${process.env.NEXT_PUBLIC_MY_BACKEND_API}/routes/concurrent/${routeName}`
  );
  return response.data;
}

