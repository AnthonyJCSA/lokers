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
          {/* KPIs Principales */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="card bg-gradient-to-r from-mondelez-purple to-purple-600 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium">Total Lockers</p>
                  <p className="text-3xl font-bold">{stats.totalLockers}</p>
                  <p className="text-purple-200 text-xs mt-1">Sistema completo</p>
                </div>
                <Package className="w-12 h-12 text-purple-200" />
              </div>
            </div>
            
            <div className="card bg-gradient-to-r from-green-500 to-green-600 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium">Disponibles</p>
                  <p className="text-3xl font-bold">{stats.availableLockers}</p>
                  <p className="text-green-200 text-xs mt-1">{Math.round((stats.availableLockers / stats.totalLockers) * 100)}% del total</p>
                </div>
                <div className="w-12 h-12 bg-green-400 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-lg">✓</span>
                </div>
              </div>
            </div>

            <div className="card bg-gradient-to-r from-red-500 to-red-600 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-100 text-sm font-medium">Ocupados</p>
                  <p className="text-3xl font-bold">{stats.occupiedLockers}</p>
                  <p className="text-red-200 text-xs mt-1">{Math.round((stats.occupiedLockers / stats.totalLockers) * 100)}% ocupación</p>
                </div>
                <div className="w-12 h-12 bg-red-400 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-lg">●</span>
                </div>
              </div>
            </div>

            <div className="card bg-gradient-to-r from-mondelez-blue to-blue-600 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">Empleados Activos</p>
                  <p className="text-3xl font-bold">{stats.activeEmployees}</p>
                  <p className="text-blue-200 text-xs mt-1">Personal registrado</p>
                </div>
                <Users className="w-12 h-12 text-blue-200" />
              </div>
            </div>
          </div>

          {/* Acciones Principales */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <button
              onClick={() => router.push('/dashboard/lockers')}
              className="group card hover:shadow-xl hover:scale-105 transition-all duration-200 cursor-pointer text-left border-2 border-transparent hover:border-mondelez-purple"
            >
              <div className="flex items-center mb-4">
                <div className="w-14 h-14 bg-mondelez-purple rounded-xl flex items-center justify-center group-hover:bg-purple-700 transition-colors">
                  <Package className="w-8 h-8 text-white" />
                </div>
                <div className="ml-4">
                  <h3 className="text-xl font-bold text-gray-900 group-hover:text-mondelez-purple transition-colors">Gestionar Lockers</h3>
                </div>
              </div>
              <p className="text-gray-600 group-hover:text-gray-700">Crear, editar, eliminar y generar códigos QR de lockers</p>
              <div className="mt-4 flex items-center text-mondelez-purple font-medium">
                <span>Ir a gestión</span>
                <span className="ml-2 group-hover:translate-x-1 transition-transform">→</span>
              </div>
            </button>

            <button
              onClick={() => router.push('/dashboard/employees')}
              className="group card hover:shadow-xl hover:scale-105 transition-all duration-200 cursor-pointer text-left border-2 border-transparent hover:border-mondelez-blue"
            >
              <div className="flex items-center mb-4">
                <div className="w-14 h-14 bg-mondelez-blue rounded-xl flex items-center justify-center group-hover:bg-blue-700 transition-colors">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <div className="ml-4">
                  <h3 className="text-xl font-bold text-gray-900 group-hover:text-mondelez-blue transition-colors">Gestionar Empleados</h3>
                </div>
              </div>
              <p className="text-gray-600 group-hover:text-gray-700">Registrar, editar y administrar información de empleados</p>
              <div className="mt-4 flex items-center text-mondelez-blue font-medium">
                <span>Ir a gestión</span>
                <span className="ml-2 group-hover:translate-x-1 transition-transform">→</span>
              </div>
            </button>

            <button
              onClick={() => router.push('/dashboard/assign')}
              className="group card hover:shadow-xl hover:scale-105 transition-all duration-200 cursor-pointer text-left border-2 border-transparent hover:border-mondelez-orange"
            >
              <div className="flex items-center mb-4">
                <div className="w-14 h-14 bg-mondelez-orange rounded-xl flex items-center justify-center group-hover:bg-orange-600 transition-colors">
                  <span className="text-white font-bold text-2xl">⚡</span>
                </div>
                <div className="ml-4">
                  <h3 className="text-xl font-bold text-gray-900 group-hover:text-mondelez-orange transition-colors">Asignar Lockers</h3>
                </div>
              </div>
              <p className="text-gray-600 group-hover:text-gray-700">Asignar y desasignar lockers a empleados activos</p>
              <div className="mt-4 flex items-center text-mondelez-orange font-medium">
                <span>Ir a asignación</span>
                <span className="ml-2 group-hover:translate-x-1 transition-transform">→</span>
              </div>
            </button>

            <button
              onClick={() => router.push('/dashboard/reports')}
              className="group card hover:shadow-xl hover:scale-105 transition-all duration-200 cursor-pointer text-left border-2 border-transparent hover:border-mondelez-green"
            >
              <div className="flex items-center mb-4">
                <div className="w-14 h-14 bg-mondelez-green rounded-xl flex items-center justify-center group-hover:bg-green-600 transition-colors">
                  <BarChart3 className="w-8 h-8 text-white" />
                </div>
                <div className="ml-4">
                  <h3 className="text-xl font-bold text-gray-900 group-hover:text-mondelez-green transition-colors">Reportes</h3>
                </div>
              </div>
              <p className="text-gray-600 group-hover:text-gray-700">Análisis visual, estadísticas y exportación de datos</p>
              <div className="mt-4 flex items-center text-mondelez-green font-medium">
                <span>Ver reportes</span>
                <span className="ml-2 group-hover:translate-x-1 transition-transform">→</span>
              </div>
            </button>

            <button
              onClick={() => router.push('/dashboard/audit')}
              className="group card hover:shadow-xl hover:scale-105 transition-all duration-200 cursor-pointer text-left border-2 border-transparent hover:border-gray-600"
            >
              <div className="flex items-center mb-4">
                <div className="w-14 h-14 bg-gray-600 rounded-xl flex items-center justify-center group-hover:bg-gray-700 transition-colors">
                  <span className="text-white font-bold text-2xl">📋</span>
                </div>
                <div className="ml-4">
                  <h3 className="text-xl font-bold text-gray-900 group-hover:text-gray-600 transition-colors">Auditoría</h3>
                </div>
              </div>
              <p className="text-gray-600 group-hover:text-gray-700">Historial completo de cambios y actividades del sistema</p>
              <div className="mt-4 flex items-center text-gray-600 font-medium">
                <span>Ver historial</span>
                <span className="ml-2 group-hover:translate-x-1 transition-transform">→</span>
              </div>
            </button>

            <button
              onClick={() => router.push('/dashboard/scanner')}
              className="group card hover:shadow-xl hover:scale-105 transition-all duration-200 cursor-pointer text-left border-2 border-transparent hover:border-indigo-600"
            >
              <div className="flex items-center mb-4">
                <div className="w-14 h-14 bg-indigo-600 rounded-xl flex items-center justify-center group-hover:bg-indigo-700 transition-colors">
                  <QrCode className="w-8 h-8 text-white" />
                </div>
                <div className="ml-4">
                  <h3 className="text-xl font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">Escáner QR</h3>
                </div>
              </div>
              <p className="text-gray-600 group-hover:text-gray-700">Escanear códigos QR de lockers con la cámara</p>
              <div className="mt-4 flex items-center text-indigo-600 font-medium">
                <span>Abrir escáner</span>
                <span className="ml-2 group-hover:translate-x-1 transition-transform">→</span>
              </div>
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}