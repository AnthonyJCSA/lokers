'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Locker, Employee } from '@/types'
import { ArrowLeft, Package, User, Link } from 'lucide-react'

export default function AssignSpecificLocker() {
  const params = useParams()
  const router = useRouter()
  const [locker, setLocker] = useState<Locker | null>(null)
  const [employees, setEmployees] = useState<Employee[]>([])
  const [selectedEmployee, setSelectedEmployee] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [params.id])

  const loadData = async () => {
    try {
      // Cargar datos del locker
      const { data: lockerData, error: lockerError } = await supabase
        .from('lockers')
        .select('*')
        .eq('id', params.id)
        .single()

      if (lockerError) throw lockerError
      setLocker(lockerData)

      // Cargar empleados activos sin locker asignado
      const { data: assignmentsData } = await supabase
        .from('assignments')
        .select('employee_id')
        .eq('status', 'active')

      const assignedEmployeeIds = assignmentsData?.map(a => a.employee_id) || []

      const { data: employeesData } = await supabase
        .from('employees')
        .select('*')
        .eq('status', 'active')
        .not('id', 'in', `(${assignedEmployeeIds.join(',') || 'null'})`)
        .order('name')

      if (employeesData) setEmployees(employeesData)
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const assignLocker = async () => {
    if (!selectedEmployee || !locker) return

    try {
      // Crear asignación
      const { data: newAssignment, error: assignError } = await supabase
        .from('assignments')
        .insert({
          locker_id: locker.id,
          employee_id: selectedEmployee,
          status: 'active'
        })
        .select()
        .single()

      if (assignError) throw assignError

      // Actualizar estado del locker
      await supabase
        .from('lockers')
        .update({ status: 'occupied' })
        .eq('id', locker.id)

      // Obtener datos del empleado para el log
      const { data: employeeData } = await supabase
        .from('employees')
        .select('name')
        .eq('id', selectedEmployee)
        .single()

      // Crear log de auditoría
      await supabase
        .from('audit_logs')
        .insert({
          locker_id: locker.id,
          employee_id: selectedEmployee,
          action: 'assign',
          details: { 
            type: 'manual_assignment',
            locker_number: locker.number,
            employee_name: employeeData?.name
          }
        })

      alert('Locker asignado exitosamente')
      router.push(`/locker/${locker.id}`)
    } catch (error: any) {
      alert('Error: ' + error.message)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Cargando...</div>
      </div>
    )
  }

  if (!locker) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg text-red-600">Locker no encontrado</div>
      </div>
    )
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
              Asignar Locker #{locker.number}
            </h1>
          </div>
        </div>
      </nav>

      <main className="max-w-2xl mx-auto py-6 px-4">
        <div className="card">
          <div className="flex items-center mb-6">
            <Link className="w-8 h-8 text-mondelez-purple" />
            <h2 className="ml-3 text-xl font-bold text-gray-900">
              Asignar Empleado al Locker
            </h2>
          </div>

          {/* Información del Locker */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center">
              <Package className="w-6 h-6 text-mondelez-purple" />
              <div className="ml-3">
                <h3 className="font-medium text-gray-900">Locker #{locker.number}</h3>
                <p className="text-sm text-gray-600">Estado: {locker.status}</p>
              </div>
            </div>
          </div>

          {locker.status === 'available' ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Seleccionar Empleado
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mondelez-purple focus:border-transparent"
                  value={selectedEmployee}
                  onChange={(e) => setSelectedEmployee(e.target.value)}
                >
                  <option value="">-- Seleccionar Empleado --</option>
                  {employees.map((employee) => (
                    <option key={employee.id} value={employee.id}>
                      {employee.name} - {employee.area} (Turno {employee.shift})
                    </option>
                  ))}
                </select>
              </div>

              {employees.length === 0 && (
                <div className="text-center py-4 text-gray-500">
                  <User className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                  <p>No hay empleados disponibles para asignar</p>
                </div>
              )}

              <button
                onClick={assignLocker}
                disabled={!selectedEmployee}
                className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Asignar Locker
              </button>
            </div>
          ) : (
            <div className="text-center py-8">
              <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Locker No Disponible
              </h3>
              <p className="text-gray-600">
                Este locker está {locker.status === 'occupied' ? 'ocupado' : 'en mantenimiento'} y no puede ser asignado.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}