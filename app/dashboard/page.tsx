'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Locker, Employee, Assignment } from '@/types'
import { QrCode, Users, Package, BarChart3, LogOut } from 'lucide-react'

export default function Dashboard() {
  const [lockers, setLockers] = useState<Locker[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    checkAuth()
    loadData()
  }, [])

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      router.push('/auth/login')
    }
  }

  const loadData = async () => {
    try {
      const [lockersRes, employeesRes, assignmentsRes] = await Promise.all([
        supabase.from('lockers').select('*'),
        supabase.from('employees').select('*'),
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

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  const stats = {
    totalLockers: lockers.length,
    occupiedLockers: lockers.filter(l => l.status === 'occupied').length,
    availableLockers: lockers.filter(l => l.status === 'available').length,
    maintenanceLockers: lockers.filter(l => l.status === 'maintenance').length,
    activeEmployees: employees.filter(e => e.status === 'active').length,
    shift1: assignments.filter(a => {
      const emp = employees.find(e => e.id === a.employee_id)
      return emp?.shift === 1
    }).length,
    shift2: assignments.filter(a => {
      const emp = employees.find(e => e.id === a.employee_id)
      return emp?.shift === 2
    }).length,
    shift3: assignments.filter(a => {
      const emp = employees.find(e => e.id === a.employee_id)
      return emp?.shift === 3
    }).length,
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Cargando...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">
                Mondelez Lockers - Dashboard
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/dashboard/scanner')}
                className="btn-primary flex items-center space-x-2"
              >
                <QrCode className="w-4 h-4" />
                <span>Escanear QR</span>
              </button>
              <button
                onClick={handleLogout}
                className="btn-secondary flex items-center space-x-2"
              >
                <LogOut className="w-4 h-4" />
                <span>Salir</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="card">
              <div className="flex items-center">
                <Package className="w-8 h-8 text-mondelez-purple" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Lockers</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalLockers}</p>
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
                  <p className="text-2xl font-bold text-green-600">{stats.availableLockers}</p>
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
                  <p className="text-2xl font-bold text-red-600">{stats.occupiedLockers}</p>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-center">
                <Users className="w-8 h-8 text-mondelez-blue" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Empleados Activos</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.activeEmployees}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Turnos */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <div className="card">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Turno 1</h3>
              <p className="text-3xl font-bold text-mondelez-purple">{stats.shift1}</p>
              <p className="text-sm text-gray-600">Lockers asignados</p>
            </div>
            
            <div className="card">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Turno 2</h3>
              <p className="text-3xl font-bold text-mondelez-blue">{stats.shift2}</p>
              <p className="text-sm text-gray-600">Lockers asignados</p>
            </div>
            
            <div className="card">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Turno 3</h3>
              <p className="text-3xl font-bold text-mondelez-green">{stats.shift3}</p>
              <p className="text-sm text-gray-600">Lockers asignados</p>
            </div>
          </div>

          {/* Acciones rápidas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <button
              onClick={() => router.push('/dashboard/lockers')}
              className="card hover:shadow-lg transition-shadow cursor-pointer text-left"
            >
              <Package className="w-12 h-12 text-mondelez-purple mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Gestionar Lockers</h3>
              <p className="text-gray-600">Ver, crear y administrar lockers</p>
            </button>

            <button
              onClick={() => router.push('/dashboard/employees')}
              className="card hover:shadow-lg transition-shadow cursor-pointer text-left"
            >
              <Users className="w-12 h-12 text-mondelez-blue mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Gestionar Empleados</h3>
              <p className="text-gray-600">Registrar y administrar empleados</p>
            </button>

            <button
              onClick={() => router.push('/dashboard/reports')}
              className="card hover:shadow-lg transition-shadow cursor-pointer text-left"
            >
              <BarChart3 className="w-12 h-12 text-mondelez-green mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Reportes</h3>
              <p className="text-gray-600">Ver reportes y auditoría</p>
            </button>
          </div>

          {/* Acciones adicionales */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
            <button
              onClick={() => router.push('/dashboard/assign')}
              className="card hover:shadow-lg transition-shadow cursor-pointer text-left"
            >
              <div className="w-12 h-12 bg-mondelez-orange rounded-lg flex items-center justify-center mb-4">
                <span className="text-white font-bold text-lg">A</span>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Asignar Lockers</h3>
              <p className="text-gray-600">Asignar y desasignar lockers</p>
            </button>

            <button
              onClick={() => router.push('/dashboard/audit')}
              className="card hover:shadow-lg transition-shadow cursor-pointer text-left"
            >
              <div className="w-12 h-12 bg-gray-600 rounded-lg flex items-center justify-center mb-4">
                <span className="text-white font-bold text-lg">H</span>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Auditoría</h3>
              <p className="text-gray-600">Historial completo de cambios</p>
            </button>

            <button
              onClick={() => router.push('/dashboard/scanner')}
              className="card hover:shadow-lg transition-shadow cursor-pointer text-left"
            >
              <div className="w-12 h-12 bg-indigo-600 rounded-lg flex items-center justify-center mb-4">
                <span className="text-white font-bold text-lg">QR</span>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Escáner QR</h3>
              <p className="text-gray-600">Escanear códigos de lockers</p>
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}