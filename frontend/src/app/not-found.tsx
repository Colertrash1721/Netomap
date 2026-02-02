import {redirect} from 'next/navigation'

export default function NotFound() {
  // Redirigir a la página de inicio
  redirect('/')

  return (
    <div className="flex items-center justify-center h-screen">
      <h1 className="text-4xl font-bold">404 - Página no encontrada</h1>
    </div>
  )
}