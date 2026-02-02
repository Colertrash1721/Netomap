'use client'
// hooks/useLogout.ts
import { useRouter } from "next/navigation";
import { logoutService } from "@/services/auth/logout";

export default function useLogout() {
  const router = useRouter();

  const logout = async () => {
    try {
      const username = localStorage.getItem("username");
      const token = localStorage.getItem("token");
      await logoutService(username!, token!);

      // Limpiar localStorage por si acaso
      localStorage.removeItem("username");
      localStorage.removeItem("token");
      localStorage.removeItem("rol");

      // Redirigir al login
      router.push("/");
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };

  return {logout};
}
