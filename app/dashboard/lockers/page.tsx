'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Locker } from '@/types'
import { ArrowLeft, Plus, Package, Search, Filter } from 'lucide-react'
import { generateQRCode, generateLockerQRData, generateAndUpdateQRCode, downloadQRCode } from '@/utils/qrGenerator'

export default function LockersManagement() {
  const [lockers, setLockers] = useState<Locker[]>([])
  const [filteredLockers, setFilteredLockers] = useState<Locker[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showQRModal, setShowQRModal] = useState(false)
  const [newLockerNumber, setNewLockerNumber] = useState('')
  const [editingLocker, setEditingLocker] = useState<Locker | null>(null)
  const [qrLocker, setQrLocker] = useState<Locker | null>(null)
  const [qrCodeURL, setQrCodeURL] = useState('')
  const router = useRouter()

  useEffect(() => {
    loadLockers()
  }, [])

  useEffect(() => {
    filterLockers()
  }, [lockers, searchTerm, statusFilter])

  const loadLockers = async () => {
    try {
      const { data, error } = await supabase
        .from('lockers')
        .select('*')
        .order('number')

      if (error) throw error
      setLockers(data || [])
    } catch (error) {
      console.error('Error loading lockers:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterLockers = () => {
    let filtered = lockers

    if (searchTerm) {
      filtered = filtered.filter(locker =>
        locker.number.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(locker => locker.status === statusFilter)
    }

    setFilteredLockers(filtered)
  }

  const createLocker = async () => {
    if (!newLockerNumber.trim()) return

    try {
      const { data, error } = await supabase
        .from('lockers')
        .insert({
          number: newLockerNumber,
          qr_code: `LOCKER_${newLockerNumber}_${Date.now()}`,
          status: 'available'
        })
        .select()
        .single()

      if (error) throw error

      // Crear log de auditoría
      await supabase
        .from('audit_logs')
        .insert({
          locker_id: data.id,
          action: 'create',
          details: { locker_number: newLockerNumber }
        })

      setShowCreateModal(false)
      setNewLockerNumber('')
      loadLockers()
    } catch (error: any) {
      alert('Error al crear locker: ' + error.message)
    }
  }

  const updateLocker = async () => {
    if (!editingLocker || !newLockerNumber.trim()) return

    try {
      const { error } = await supabase
        .from('lockers')
        .update({ number: newLockerNumber })
        .eq('id', editingLocker.id)

      if (error) throw error

      // Regenerar QR con nuevos datos
      await generateAndUpdateQRCode(editingLocker.id, newLockerNumber)

      // Crear log de auditoría
      await supabase
        .from('audit_logs')
        .insert({
          locker_id: editingLocker.id,
          action: 'update',
          details: { old_number: editingLocker.number, new_number: newLockerNumber }
        })

      setShowEditModal(false)
      setEditingLocker(null)
      setNewLockerNumber('')
      loadLockers()
    } catch (error: any) {
      alert('Error al actualizar locker: ' + error.message)
    }
  }

  const deleteLocker = async (locker: Locker) => {
    if (!confirm(`¿Estás seguro de eliminar el locker #${locker.number}?`)) return

    try {
      const { error } = await supabase
        .from('lockers')
        .delete()
        .eq('id', locker.id)

      if (error) throw error
      loadLockers()
    } catch (error: any) {
      alert('Error al eliminar locker: ' + error.message)
    }
  }

  const openEditModal = (locker: Locker) => {
    setEditingLocker(locker)
    setNewLockerNumber(locker.number)
    setShowEditModal(true)
  }

  const showQRCode = async (locker: Locker) => {
    try {
      const qrData = await generateAndUpdateQRCode(locker.id, locker.number)
      const qrURL = await generateQRCode(qrData)
      setQrLocker(locker)
      setQrCodeURL(qrURL)
      setShowQRModal(true)
      // Recargar lockers para mostrar QR actualizado
      loadLockers()
    } catch (error) {
      alert('Error al generar código QR')
    }
  }

  const downloadQR = () => {
    if (qrCodeURL && qrLocker) {
      downloadQRCode(qrCodeURL, `locker_${qrLocker.number}_qr.png`)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-800'
      case 'occupied': return 'bg-red-100 text-red-800'
      case 'maintenance': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Cargando lockers...</div>
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
                Gestión de Lockers
              </h1>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn-primary flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Nuevo Locker</span>
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 px-4">
        {/* Filtros */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar por número de locker..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mondelez-purple focus:border-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="sm:w-48">
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mondelez-purple focus:border-transparent"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">Todos los estados</option>
              <option value="available">Disponible</option>
              <option value="occupied">Ocupado</option>
              <option value="maintenance">Mantenimiento</option>
            </select>
          </div>
        </div>

        {/* Lista de Lockers */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredLockers.map((locker) => (
            <div key={locker.id} className="card hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <Package className="w-6 h-6 text-mondelez-purple" />
                  <span className="ml-2 font-semibold text-gray-900">
                    #{locker.number}
                  </span>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(locker.status)}`}>
                  {getStatusText(locker.status)}
                </span>
              </div>
              
              <div className="space-y-2 text-sm text-gray-600 mb-4">
                <p>
                  <span className="font-medium">QR:</span> {locker.qr_code.substring(0, 20)}...
                </p>
                <p>
                  <span className="font-medium">Creado:</span> {new Date(locker.created_at).toLocaleDateString('es-PE')}
                </p>
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={() => router.push(`/locker/${locker.id}`)}
                  className="flex-1 text-xs bg-mondelez-purple text-white py-1 px-2 rounded hover:bg-purple-700"
                >
                  Ver
                </button>
                <button
                  onClick={() => showQRCode(locker)}
                  className="flex-1 text-xs bg-mondelez-blue text-white py-1 px-2 rounded hover:bg-blue-700"
                >
                  QR
                </button>
                <button
                  onClick={() => openEditModal(locker)}
                  className="flex-1 text-xs bg-mondelez-green text-white py-1 px-2 rounded hover:bg-green-700"
                >
                  Editar
                </button>
                <button
                  onClick={() => deleteLocker(locker)}
                  className="flex-1 text-xs bg-red-600 text-white py-1 px-2 rounded hover:bg-red-700"
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>

        {filteredLockers.length === 0 && (
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No se encontraron lockers
            </h3>
            <p className="text-gray-600">
              {searchTerm || statusFilter !== 'all' 
                ? 'Intenta ajustar los filtros de búsqueda'
                : 'Crea tu primer locker para comenzar'
              }
            </p>
          </div>
        )}
      </main>

      {/* Modal Crear Locker */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Crear Nuevo Locker
            </h2>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Número del Locker
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mondelez-purple focus:border-transparent"
                placeholder="Ej: 001, A-01, etc."
                value={newLockerNumber}
                onChange={(e) => setNewLockerNumber(e.target.value)}
              />
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => { setShowCreateModal(false); setNewLockerNumber('') }}
                className="flex-1 btn-secondary"
              >
                Cancelar
              </button>
              <button
                onClick={createLocker}
                className="flex-1 btn-primary"
                disabled={!newLockerNumber.trim()}
              >
                Crear Locker
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Editar Locker */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Editar Locker
            </h2>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Número del Locker
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mondelez-purple focus:border-transparent"
                value={newLockerNumber}
                onChange={(e) => setNewLockerNumber(e.target.value)}
              />
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => { setShowEditModal(false); setEditingLocker(null); setNewLockerNumber('') }}
                className="flex-1 btn-secondary"
              >
                Cancelar
              </button>
              <button
                onClick={updateLocker}
                className="flex-1 btn-primary"
                disabled={!newLockerNumber.trim()}
              >
                Actualizar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal QR Code */}
      {showQRModal && qrLocker && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Código QR - Locker #{qrLocker.number}
            </h2>
            
            <div className="text-center mb-6">
              {qrCodeURL && (
                <img src={qrCodeURL} alt="QR Code" className="mx-auto mb-4" />
              )}
              <p className="text-sm text-gray-600">
                Escanea este código para acceder directamente al locker
              </p>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => { setShowQRModal(false); setQrLocker(null); setQrCodeURL('') }}
                className="flex-1 btn-secondary"
              >
                Cerrar
              </button>
              <button
                onClick={downloadQR}
                className="flex-1 btn-primary"
              >
                Descargar QR
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}