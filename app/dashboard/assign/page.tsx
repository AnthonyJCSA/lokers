'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Locker, Employee, Assignment } from '@/types'
import { ArrowLeft, Package, User, Link, Unlink } from 'lucide-react'

export default function AssignLocker() {
  const [lockers, setLockers] = useState<Locker[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [selectedLocker, setSelectedLocker] = useState('')
  const [selectedEmployee, setSelectedEmployee] = useState('')
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [lockersRes, employeesRes, assignmentsRes] = await Promise.all([
        supabase.from('lockers').select('*').order('number'),
        supabase.from('employees').select('*').eq('status', 'active').order('name'),
        supabase.from('assignments').select('*').eq('status', 'active')
      ])

      if (lockersRes.data) setLockers(lockersRes.data)
      if (employeesRes.data) setEmployees(employeesRes.data)
      if (assignmentsRes.data) setAssignments(assignmentsRes.data)
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const assignLocker = async () => {
    if (!selectedLocker || !selectedEmployee) return

    try {
      // Crear asignación
      const { error: assignError } = await supabase
        .from('assignments')
        .insert({
          locker_id: selectedLocker,
          employee_id: selectedEmployee,
          status: 'active'
        })

      if (assignError) throw assignError

      // Actualizar estado del locker
      await supabase
        .from('lockers')
        .update({ status: 'occupied' })
        .eq('id', selectedLocker)

      // Crear log de auditoría
      await supabase
        .from('audit_logs')
        .insert({
          locker_id: selectedLocker,
          employee_id: selectedEmployee,
          action: 'assign',
          details: { type: 'manual_assignment' }
        })

      alert('Locker asignado exitosamente')
      setSelectedLocker('')
      setSelectedEmployee('')
      loadData()
    } catch (error: any) {
      alert('Error: ' + error.message)
    }
  }

  const unassignLocker = async (assignmentId: string, lockerId: string) => {
    if (!confirm('¿Estás seguro de desasignar este locker?')) return

    try {
      // Actualizar asignación
      await supabase
        .from('assignments')
        .update({ 
          status: 'released', 
          released_at: new Date().toISOString() 
        })
        .eq('id', assignmentId)

      // Actualizar estado del locker
      await supabase
        .from('lockers')
        .update({ status: 'available' })
        .eq('id', lockerId)

      // Crear log de auditoría
      await supabase
        .from('audit_logs')
        .insert({
          locker_id: lockerId,
          action: 'release',
          details: { type: 'manual_release' }
        })

      loadData()
    } catch (error: any) {
      alert('Error: ' + error.message)
    }
  }

  const getAvailableLockers = () => {
    const assignedLockerIds = assignments.map(a => a.locker_id)
    return lockers.filter(l => l.status === 'available' && !assignedLockerIds.includes(l.id))
  }

  const getUnassignedEmployees = () => {
    const assignedEmployeeIds = assignments.map(a => a.employee_id)
    return employees.filter(e => !assignedEmployeeIds.includes(e.id))
  }

  const getAssignmentDetails = (assignment: Assignment) => {
    const locker = lockers.find(l => l.id === assignment.locker_id)
    const employee = employees.find(e => e.id === assignment.employee_id)
    return { locker, employee }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Cargando datos...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <button
              onClick={() => router.push('/dashboard')}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Dashboard</span>
            </button>
            <h1 className="ml-4 text-xl font-semibold text-gray-900">
              Asignación de Lockers
            </h1>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Formulario de Asignación */}
          <div className="card">
            <div className="flex items-center mb-6">
              <Link className="w-8 h-8 text-mondelez-purple" />
              <h2 className="ml-3 text-xl font-bold text-gray-900">Nueva Asignación</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Seleccionar Locker Disponible
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mondelez-purple focus:border-transparent"
                  value={selectedLocker}
                  onChange={(e) => setSelectedLocker(e.target.value)}
                >
                  <option value="">-- Seleccionar Locker --</option>
                  {getAvailableLockers().map((locker) => (
                    <option key={locker.id} value={locker.id}>
                      Locker #{locker.number}
                    </option>
                  ))}
                </select>
              </div>

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
                  {getUnassignedEmployees().map((employee) => (
                    <option key={employee.id} value={employee.id}>
                      {employee.name} - {employee.area} (Turno {employee.shift})
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={assignLocker}
                disabled={!selectedLocker || !selectedEmployee}
                className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Asignar Locker
              </button>
            </div>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h3 className="font-medium text-blue-900 mb-2">Estadísticas:</h3>
              <div className="text-sm text-blue-800 space-y-1">
                <p>• Lockers disponibles: {getAvailableLockers().length}</p>
                <p>• Empleados sin locker: {getUnassignedEmployees().length}</p>
                <p>• Asignaciones activas: {assignments.length}</p>
              </div>
            </div>
          </div>

          {/* Lista de Asignaciones Activas */}
          <div className="card">
            <div className="flex items-center mb-6">
              <Unlink className="w-8 h-8 text-mondelez-blue" />
              <h2 className="ml-3 text-xl font-bold text-gray-900">Asignaciones Activas</h2>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {assignments.map((assignment) => {
                const { locker, employee } = getAssignmentDetails(assignment)
                if (!locker || !employee) return null

                return (
                  <div key={assignment.id} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center space-x-2 mb-1">
                          <Package className="w-4 h-4 text-mondelez-purple" />
                          <span className="font-medium">Locker #{locker.number}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <User className="w-4 h-4" />
                          <span>{employee.name}</span>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {employee.area} - Turno {employee.shift}
                        </div>
                        <div className="text-xs text-gray-500">
                          Asignado: {new Date(assignment.assigned_at).toLocaleDateString('es-PE')}
                        </div>
                      </div>
                      <button
                        onClick={() => unassignLocker(assignment.id, locker.id)}
                        className="text-red-600 hover:text-red-700 text-sm font-medium"
                      >
                        Desasignar
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>

            {assignments.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Package className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                <p>No hay asignaciones activas</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}