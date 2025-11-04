'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Locker, Employee, Assignment } from '@/types'
import { ArrowLeft, BarChart3, Download, Filter, Users, Package } from 'lucide-react'

export default function Reports() {
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [lockers, setLockers] = useState<Locker[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedShift, setSelectedShift] = useState<number | 'all'>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const router = useRouter()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [assignmentsRes, employeesRes, lockersRes] = await Promise.all([
        supabase.from('assignments').select('*'),
        supabase.from('employees').select('*'),
        supabase.from('lockers').select('*')
      ])

      if (assignmentsRes.data) setAssignments(assignmentsRes.data)
      if (employeesRes.data) setEmployees(employeesRes.data)
      if (lockersRes.data) setLockers(lockersRes.data)
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getFilteredAssignments = () => {
    return assignments.filter(assignment => {
      const employee = employees.find(e => e.id === assignment.employee_id)
      if (!employee) return false

      if (selectedShift !== 'all' && employee.shift !== selectedShift) return false
      if (selectedStatus !== 'all' && assignment.status !== selectedStatus) return false

      return true
    })
  }

  const getShiftStats = () => {
    const activeAssignments = assignments.filter(a => a.status === 'active')
    
    return {
      shift1: activeAssignments.filter(a => {
        const emp = employees.find(e => e.id === a.employee_id)
        return emp?.shift === 1
      }).length,
      shift2: activeAssignments.filter(a => {
        const emp = employees.find(e => e.id === a.employee_id)
        return emp?.shift === 2
      }).length,
      shift3: activeAssignments.filter(a => {
        const emp = employees.find(e => e.id === a.employee_id)
        return emp?.shift === 3
      }).length,
    }
  }

  const getGeneralStats = () => {
    const activeAssignments = assignments.filter(a => a.status === 'active')
    
    return {
      totalLockers: lockers.length,
      occupiedLockers: lockers.filter(l => l.status === 'occupied').length,
      availableLockers: lockers.filter(l => l.status === 'available').length,
      maintenanceLockers: lockers.filter(l => l.status === 'maintenance').length,
      activeEmployees: employees.filter(e => e.status === 'active').length,
      totalAssignments: activeAssignments.length,
      releasedAssignments: assignments.filter(a => a.status === 'released').length
    }
  }

  const exportToCSV = () => {
    const filteredAssignments = getFilteredAssignments()
    const csvData = filteredAssignments.map(assignment => {
      const employee = employees.find(e => e.id === assignment.employee_id)
      const locker = lockers.find(l => l.id === assignment.locker_id)
      
      return {
        'Locker': locker?.number || 'N/A',
        'Empleado': employee?.name || 'N/A',
        'DNI': employee?.dni || 'N/A',
        'Área': employee?.area || 'N/A',
        'Turno': employee?.shift || 'N/A',
        'Estado Asignación': assignment.status === 'active' ? 'Activa' : 'Liberada',
        'Fecha Asignación': new Date(assignment.assigned_at).toLocaleDateString('es-PE'),
        'Fecha Liberación': assignment.released_at ? new Date(assignment.released_at).toLocaleDateString('es-PE') : 'N/A'
      }
    })

    const csvContent = [
      Object.keys(csvData[0] || {}).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `reporte_lockers_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  const shiftStats = getShiftStats()
  const generalStats = getGeneralStats()
  const filteredAssignments = getFilteredAssignments()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Cargando reportes...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <button
                onClick={() => router.push('/dashboard')}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Dashboard</span>
              </button>
              <h1 className="ml-4 text-xl font-semibold text-gray-900">
                Reportes y Análisis
              </h1>
            </div>
            <button
              onClick={exportToCSV}
              className="btn-primary flex items-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>Exportar CSV</span>
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 px-4">
        {/* Estadísticas Generales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="card">
            <div className="flex items-center">
              <Package className="w-8 h-8 text-mondelez-purple" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Lockers</p>
                <p className="text-2xl font-bold text-gray-900">{generalStats.totalLockers}</p>
              </div>
            </div>
          </div>
          
          <div className="card">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">O</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Ocupados</p>
                <p className="text-2xl font-bold text-red-600">{generalStats.occupiedLockers}</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">D</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Disponibles</p>
                <p className="text-2xl font-bold text-green-600">{generalStats.availableLockers}</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center">
              <Users className="w-8 h-8 text-mondelez-blue" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Empleados Activos</p>
                <p className="text-2xl font-bold text-gray-900">{generalStats.activeEmployees}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Estadísticas por Turno */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="card">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Turno 1 (Mañana)</h3>
            <p className="text-3xl font-bold text-mondelez-purple">{shiftStats.shift1}</p>
            <p className="text-sm text-gray-600">Lockers asignados</p>
          </div>
          
          <div className="card">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Turno 2 (Tarde)</h3>
            <p className="text-3xl font-bold text-mondelez-blue">{shiftStats.shift2}</p>
            <p className="text-sm text-gray-600">Lockers asignados</p>
          </div>
          
          <div className="card">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Turno 3 (Noche)</h3>
            <p className="text-3xl font-bold text-mondelez-green">{shiftStats.shift3}</p>
            <p className="text-sm text-gray-600">Lockers asignados</p>
          </div>
        </div>

        {/* Filtros y Tabla */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <BarChart3 className="w-8 h-8 text-mondelez-green" />
              <h2 className="ml-3 text-xl font-bold text-gray-900">Detalle de Asignaciones</h2>
            </div>
            <div className="flex items-center space-x-4">
              <Filter className="w-5 h-5 text-gray-400" />
              <select
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mondelez-purple focus:border-transparent"
                value={selectedShift}
                onChange={(e) => setSelectedShift(e.target.value === 'all' ? 'all' : parseInt(e.target.value) as 1 | 2 | 3)}
              >
                <option value="all">Todos los turnos</option>
                <option value={1}>Turno 1</option>
                <option value={2}>Turno 2</option>
                <option value={3}>Turno 3</option>
              </select>
              <select
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mondelez-purple focus:border-transparent"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
              >
                <option value="all">Todos los estados</option>
                <option value="active">Activas</option>
                <option value="released">Liberadas</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Locker</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Empleado</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Área</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Turno</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha Asignación</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAssignments.map((assignment) => {
                  const employee = employees.find(e => e.id === assignment.employee_id)
                  const locker = lockers.find(l => l.id === assignment.locker_id)
                  
                  return (
                    <tr key={assignment.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        #{locker?.number || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {employee?.name || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {employee?.area || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        Turno {employee?.shift || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          assignment.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {assignment.status === 'active' ? 'Activa' : 'Liberada'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(assignment.assigned_at).toLocaleDateString('es-PE')}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {filteredAssignments.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <BarChart3 className="w-12 h-12 text-gray-300 mx-auto mb-2" />
              <p>No hay datos que coincidan con los filtros seleccionados</p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}