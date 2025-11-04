'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { AuditLog, Locker, Employee } from '@/types'
import { ArrowLeft, Clock, Search, Filter, Eye, Download } from 'lucide-react'

export default function AuditHistory() {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [lockers, setLockers] = useState<Locker[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [actionFilter, setActionFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('all')
  const router = useRouter()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [auditRes, lockersRes, employeesRes] = await Promise.all([
        supabase.from('audit_logs').select('*').order('created_at', { ascending: false }),
        supabase.from('lockers').select('*'),
        supabase.from('employees').select('*')
      ])

      if (auditRes.data) setAuditLogs(auditRes.data)
      if (lockersRes.data) setLockers(lockersRes.data)
      if (employeesRes.data) setEmployees(employeesRes.data)
    } catch (error) {
      console.error('Error loading audit data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getFilteredLogs = () => {
    let filtered = auditLogs

    if (searchTerm) {
      filtered = filtered.filter(log => {
        const locker = lockers.find(l => l.id === log.locker_id)
        const employee = employees.find(e => e.id === log.employee_id)
        
        return (
          locker?.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
          employee?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.action.toLowerCase().includes(searchTerm.toLowerCase())
        )
      })
    }

    if (actionFilter !== 'all') {
      filtered = filtered.filter(log => log.action === actionFilter)
    }

    if (dateFilter !== 'all') {
      const now = new Date()
      const filterDate = new Date()
      
      switch (dateFilter) {
        case 'today':
          filterDate.setHours(0, 0, 0, 0)
          break
        case 'week':
          filterDate.setDate(now.getDate() - 7)
          break
        case 'month':
          filterDate.setMonth(now.getMonth() - 1)
          break
      }
      
      filtered = filtered.filter(log => new Date(log.created_at) >= filterDate)
    }

    return filtered
  }

  const getActionText = (action: string) => {
    switch (action) {
      case 'assign': return 'Asignación'
      case 'release': return 'Liberación'
      case 'status_change': return 'Cambio de Estado'
      case 'create': return 'Creación'
      case 'update': return 'Actualización'
      default: return action
    }
  }

  const getActionColor = (action: string) => {
    switch (action) {
      case 'assign': return 'bg-green-100 text-green-800'
      case 'release': return 'bg-red-100 text-red-800'
      case 'status_change': return 'bg-yellow-100 text-yellow-800'
      case 'create': return 'bg-blue-100 text-blue-800'
      case 'update': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const exportAuditLog = () => {
    const filteredLogs = getFilteredLogs()
    const csvData = filteredLogs.map(log => {
      const locker = lockers.find(l => l.id === log.locker_id)
      const employee = employees.find(e => e.id === log.employee_id)
      
      return {
        'Fecha': new Date(log.created_at).toLocaleString('es-PE'),
        'Acción': getActionText(log.action),
        'Locker': locker?.number || 'N/A',
        'Empleado': employee?.name || 'N/A',
        'Detalles': JSON.stringify(log.details || {}),
        'ID Usuario': log.performed_by || 'Sistema'
      }
    })

    const csvContent = [
      Object.keys(csvData[0] || {}).join(','),
      ...csvData.map(row => Object.values(row).map(val => `"${val}"`).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `auditoria_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  const filteredLogs = getFilteredLogs()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Cargando historial de auditoría...</div>
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
                Historial de Auditoría
              </h1>
            </div>
            <button
              onClick={exportAuditLog}
              className="btn-primary flex items-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>Exportar</span>
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 px-4">
        {/* Filtros */}
        <div className="card mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Buscar por locker, empleado o acción..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mondelez-purple focus:border-transparent"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            
            <div className="lg:w-48">
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mondelez-purple focus:border-transparent"
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
              >
                <option value="all">Todas las acciones</option>
                <option value="assign">Asignaciones</option>
                <option value="release">Liberaciones</option>
                <option value="status_change">Cambios de Estado</option>
                <option value="create">Creaciones</option>
                <option value="update">Actualizaciones</option>
              </select>
            </div>

            <div className="lg:w-48">
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mondelez-purple focus:border-transparent"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              >
                <option value="all">Todas las fechas</option>
                <option value="today">Hoy</option>
                <option value="week">Última semana</option>
                <option value="month">Último mes</option>
              </select>
            </div>
          </div>
        </div>

        {/* Estadísticas rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="card">
            <div className="text-center">
              <p className="text-2xl font-bold text-mondelez-purple">
                {auditLogs.filter(l => l.action === 'assign').length}
              </p>
              <p className="text-sm text-gray-600">Asignaciones</p>
            </div>
          </div>
          
          <div className="card">
            <div className="text-center">
              <p className="text-2xl font-bold text-mondelez-blue">
                {auditLogs.filter(l => l.action === 'release').length}
              </p>
              <p className="text-sm text-gray-600">Liberaciones</p>
            </div>
          </div>
          
          <div className="card">
            <div className="text-center">
              <p className="text-2xl font-bold text-mondelez-green">
                {auditLogs.filter(l => l.action === 'create').length}
              </p>
              <p className="text-sm text-gray-600">Creaciones</p>
            </div>
          </div>
          
          <div className="card">
            <div className="text-center">
              <p className="text-2xl font-bold text-mondelez-orange">
                {filteredLogs.length}
              </p>
              <p className="text-sm text-gray-600">Registros Filtrados</p>
            </div>
          </div>
        </div>

        {/* Lista de Auditoría */}
        <div className="card">
          <div className="flex items-center mb-6">
            <Clock className="w-8 h-8 text-mondelez-green" />
            <h2 className="ml-3 text-xl font-bold text-gray-900">Registro de Actividades</h2>
          </div>

          <div className="space-y-4 max-h-96 overflow-y-auto">
            {filteredLogs.map((log) => {
              const locker = lockers.find(l => l.id === log.locker_id)
              const employee = employees.find(e => e.id === log.employee_id)
              
              return (
                <div key={log.id} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getActionColor(log.action)}`}>
                          {getActionText(log.action)}
                        </span>
                        <span className="text-sm text-gray-500">
                          {new Date(log.created_at).toLocaleString('es-PE')}
                        </span>
                      </div>
                      
                      <div className="text-sm text-gray-900 mb-1">
                        <span className="font-medium">Locker #{locker?.number || 'N/A'}</span>
                        {employee && (
                          <span className="text-gray-600"> - {employee.name}</span>
                        )}
                      </div>
                      
                      {log.details && Object.keys(log.details).length > 0 && (
                        <div className="text-xs text-gray-500 mt-2">
                          <details>
                            <summary className="cursor-pointer hover:text-gray-700">Ver detalles</summary>
                            <pre className="mt-1 p-2 bg-gray-100 rounded text-xs overflow-x-auto">
                              {JSON.stringify(log.details, null, 2)}
                            </pre>
                          </details>
                        </div>
                      )}
                    </div>
                    
                    <button
                      onClick={() => router.push(`/locker/${log.locker_id}`)}
                      className="text-mondelez-purple hover:text-purple-700 ml-4"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          {filteredLogs.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <Clock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No hay registros</h3>
              <p className="text-gray-600">
                {searchTerm || actionFilter !== 'all' || dateFilter !== 'all'
                  ? 'No se encontraron registros con los filtros aplicados'
                  : 'Aún no hay actividad registrada'
                }
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}