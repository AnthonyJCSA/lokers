'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Locker, Employee, Assignment } from '@/types'
import { ArrowLeft, Package, User, Calendar, Clock, AlertCircle } from 'lucide-react'

export default function LockerDetail() {
  const params = useParams()
  const router = useRouter()
  const [locker, setLocker] = useState<Locker | null>(null)
  const [assignment, setAssignment] = useState<Assignment | null>(null)
  const [employee, setEmployee] = useState<Employee | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    checkAuth()
    loadLockerData()
  }, [params.id])

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      router.push('/auth/login')
    }
  }

  const loadLockerData = async () => {
    try {
      setLoading(true)
      
      // Cargar datos del locker
      const { data: lockerData, error: lockerError } = await supabase
        .from('lockers')
        .select('*')
        .eq('id', params.id)
        .single()

      if (lockerError) throw lockerError
      setLocker(lockerData)

      // Cargar asignación activa si existe
      const { data: assignmentData } = await supabase
        .from('assignments')
        .select('*')
        .eq('locker_id', params.id)
        .eq('status', 'active')
        .single()

      if (assignmentData) {
        setAssignment(assignmentData)
        
        // Cargar datos del empleado
        const { data: employeeData } = await supabase
          .from('employees')
          .select('*')
          .eq('id', assignmentData.employee_id)
          .single()

        if (employeeData) {
          setEmployee(employeeData)
        }
      }
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const releaseLocker = async () => {
    if (!assignment || !confirm('¿Estás seguro de liberar este locker?')) return

    try {
      // Actualizar asignación
      await supabase
        .from('assignments')
        .update({ 
          status: 'released', 
          released_at: new Date().toISOString() 
        })
        .eq('id', assignment.id)

      // Actualizar estado del locker
      await supabase
        .from('lockers')
        .update({ status: 'available' })
        .eq('id', params.id)

      // Crear log de auditoría
      await supabase
        .from('audit_logs')
        .insert({
          locker_id: params.id,
          employee_id: assignment.employee_id,
          action: 'release',
          details: { reason: 'Manual release' }
        })

      // Recargar datos
      loadLockerData()
    } catch (error: any) {
      setError('Error al liberar el locker: ' + error.message)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Cargando información del locker...</div>
      </div>
    )
  }

  if (error || !locker) {
    return (
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center h-16">
              <button
                onClick={() => router.back()}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Volver</span>
              </button>
            </div>
          </div>
        </nav>
        <div className="max-w-2xl mx-auto py-6 px-4">
          <div className="card text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Error</h2>
            <p className="text-gray-600">{error || 'Locker no encontrado'}</p>
          </div>
        </div>
      </div>
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'text-green-600 bg-green-100'
      case 'occupied': return 'text-red-600 bg-red-100'
      case 'maintenance': return 'text-yellow-600 bg-yellow-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'available': return 'Disponible'
      case 'occupied': return 'Ocupado'
      case 'maintenance': return 'Mantenimiento'
      default: return status
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <button
              onClick={() => router.back()}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Volver</span>
            </button>
            <h1 className="ml-4 text-xl font-semibold text-gray-900">
              Locker #{locker.number}
            </h1>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto py-6 px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Información del Locker */}
          <div className="card">
            <div className="flex items-center mb-6">
              <Package className="w-8 h-8 text-mondelez-purple" />
              <h2 className="ml-3 text-xl font-bold text-gray-900">
                Información del Locker
              </h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Número</label>
                <p className="text-lg font-semibold text-gray-900">#{locker.number}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Estado</label>
                <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(locker.status)}`}>
                  {getStatusText(locker.status)}
                </span>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Código QR</label>
                <p className="text-sm text-gray-600 font-mono">{locker.qr_code}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Creado</label>
                <p className="text-sm text-gray-600">
                  {new Date(locker.created_at).toLocaleDateString('es-PE')}
                </p>
              </div>
            </div>
          </div>

          {/* Información del Empleado Asignado */}
          <div className="card">
            <div className="flex items-center mb-6">
              <User className="w-8 h-8 text-mondelez-blue" />
              <h2 className="ml-3 text-xl font-bold text-gray-900">
                Empleado Asignado
              </h2>
            </div>

            {employee && assignment ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nombre</label>
                  <p className="text-lg font-semibold text-gray-900">{employee.name}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">DNI</label>
                  <p className="text-sm text-gray-600">{employee.dni}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Área</label>
                  <p className="text-sm text-gray-600">{employee.area}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Turno</label>
                  <p className="text-sm text-gray-600">Turno {employee.shift}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Estado Laboral</label>
                  <span className={`inline-flex px-2 py-1 rounded text-xs font-medium ${
                    employee.status === 'active' ? 'bg-green-100 text-green-800' : 
                    employee.status === 'retired' ? 'bg-red-100 text-red-800' : 
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {employee.status === 'active' ? 'Activo' : 
                     employee.status === 'retired' ? 'Retirado' : 'Sin asignación'}
                  </span>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Fecha de Asignación</label>
                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar className="w-4 h-4 mr-1" />
                    {new Date(assignment.assigned_at).toLocaleDateString('es-PE')}
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    onClick={releaseLocker}
                    className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                  >
                    Liberar Locker
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">No hay empleado asignado</p>
                <button
                  onClick={() => router.push(`/dashboard/assign/${locker.id}`)}
                  className="btn-primary"
                >
                  Asignar Empleado
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Historial de Auditoría */}
        <div className="mt-8 card">
          <div className="flex items-center mb-6">
            <Clock className="w-8 h-8 text-mondelez-green" />
            <h2 className="ml-3 text-xl font-bold text-gray-900">
              Historial de Auditoría
            </h2>
          </div>
          
          <div className="text-center py-8 text-gray-500">
            <p>Funcionalidad de auditoría en desarrollo</p>
          </div>
        </div>
      </main>
    </div>
  )
}