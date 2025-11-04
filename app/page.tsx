import { redirect } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default async function Home() {
  // Verificar si Supabase está configurado
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL === 'https://placeholder.supabase.co') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
          <div className="w-16 h-16 bg-mondelez-purple rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-xl">M</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Mondelez Lockers</h1>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <h2 className="text-lg font-semibold text-yellow-800 mb-2">⚠️ Configuración Requerida</h2>
            <p className="text-yellow-700 text-sm mb-4">
              Para usar la aplicación, necesitas configurar Supabase:
            </p>
            <ol className="text-left text-sm text-yellow-700 space-y-2">
              <li>1. Crea un proyecto en <a href="https://supabase.com" target="_blank" className="underline">supabase.com</a></li>
              <li>2. Ejecuta el script <code className="bg-yellow-100 px-1 rounded">lib/database.sql</code></li>
              <li>3. Configura las variables en <code className="bg-yellow-100 px-1 rounded">.env.local</code></li>
              <li>4. Ejecuta los scripts de datos de muestra</li>
            </ol>
          </div>
          <div className="text-xs text-gray-500">
            <p>Ver <code>SETUP.md</code> para instrucciones detalladas</p>
          </div>
        </div>
      </div>
    )
  }

  try {
    // Verificar si hay usuario autenticado
    const { data: { session } } = await supabase.auth.getSession()
    
    if (session) {
      redirect('/dashboard')
    } else {
      redirect('/auth/login')
    }
  } catch (error) {
    redirect('/auth/login')
  }
}