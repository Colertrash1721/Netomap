import axios from "axios";

export async function postReport(formData: FormData) {
    console.log('Contenido de FormData a enviar:', Array.from(formData.entries()));
    
    try {
        const response = await axios.post(
            `${process.env.NEXT_PUBLIC_MY_BACKEND_API}/report/generate`,
            formData,
            {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
                responseType: 'blob',
            }
        );
        return response.data;
    } catch (error) {
        console.error('Error en postReport:', error);
        throw error;
    }
}