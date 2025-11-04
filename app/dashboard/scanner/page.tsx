'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import QrScanner from 'qr-scanner'
import { Camera, ArrowLeft, Upload } from 'lucide-react'

export default function Scanner() {
  const [scanning, setScanning] = useState(false)
  const [error, setError] = useState('')
  const [isIOS, setIsIOS] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const qrScannerRef = useRef<QrScanner | null>(null)
  const router = useRouter()

  useEffect(() => {
    // Detectar iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
    setIsIOS(iOS)
    
    return () => {
      if (qrScannerRef.current) {
        qrScannerRef.current.destroy()
      }
    }
  }, [])

  const processQRData = (qrData: string) => {
    try {
      console.log('QR Data:', qrData)
      
      let lockerId = null
      
      // Formato 1: URL completa (https://domain.com/locker/id)
      if (qrData.includes('/locker/')) {
        const urlParts = qrData.split('/locker/')
        if (urlParts.length > 1) {
          lockerId = urlParts[1].split('?')[0] // Remover query params si existen
        }
      }
      // Formato 2: Solo ID del locker
      else if (qrData.match(/^[a-f0-9-]{36}$/i)) {
        lockerId = qrData
      }
      // Formato 3: JSON con datos del locker
      else if (qrData.startsWith('{')) {
        try {
          const parsed = JSON.parse(qrData)
          if (parsed.locker_id) {
            lockerId = parsed.locker_id
          } else if (parsed.url && parsed.url.includes('/locker/')) {
            const urlParts = parsed.url.split('/locker/')
            lockerId = urlParts[1]
          }
        } catch (e) {
          console.error('Error parsing JSON QR:', e)
        }
      }
      // Formato 4: Buscar por QR code en base de datos
      else {
        searchLockerByQRCode(qrData)
        return
      }
      
      if (lockerId) {
        router.push(`/locker/${lockerId}`)
      } else {
        alert('Código QR no válido o no reconocido')
        setScanning(false)
      }
    } catch (error) {
      console.error('Error processing QR:', error)
      alert('Error al procesar el código QR')
      setScanning(false)
    }
  }

  const startScanning = async () => {
    if (isIOS) {
      // En iOS, usar input de archivo
      fileInputRef.current?.click()
      return
    }

    if (!videoRef.current) return

    try {
      setError('')
      setScanning(true)

      // Verificar permisos de cámara primero
      if (!await QrScanner.hasCamera()) {
        throw new Error('No se detectó ninguna cámara en el dispositivo')
      }

      // Solicitar permisos explícitamente
      try {
        await navigator.mediaDevices.getUserMedia({ video: true })
      } catch (permissionError: any) {
        throw new Error('Permisos de cámara denegados. Por favor, permite el acceso a la cámara.')
      }

      qrScannerRef.current = new QrScanner(
        videoRef.current,
        (result) => {
          qrScannerRef.current?.destroy()
          processQRData(result.data)
        },
        {
          highlightScanRegion: true,
          highlightCodeOutline: true,
          preferredCamera: 'environment' // Usar cámara trasera si está disponible
        }
      )

      await qrScannerRef.current.start()
    } catch (err: any) {
      console.error('Camera error:', err)
      let errorMessage = 'Error desconocido al acceder a la cámara'
      
      if (err.name === 'NotAllowedError') {
        errorMessage = 'Permisos de cámara denegados. Permite el acceso en la configuración del navegador.'
      } else if (err.name === 'NotFoundError') {
        errorMessage = 'No se encontró ninguna cámara en el dispositivo.'
      } else if (err.name === 'NotSupportedError') {
        errorMessage = 'El navegador no soporta acceso a la cámara.'
      } else if (err.message) {
        errorMessage = err.message
      }
      
      setError(errorMessage)
      setScanning(false)
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      setError('')
      const result = await QrScanner.scanImage(file)
      processQRData(result)
    } catch (error) {
      setError('No se pudo leer el código QR de la imagen')
    }
  }

  const stopScanning = () => {
    if (qrScannerRef.current) {
      qrScannerRef.current.destroy()
      qrScannerRef.current = null
    }
    setScanning(false)
  }

  const searchLockerByQRCode = async (qrCode: string) => {
    try {
      const { data, error } = await supabase
        .from('lockers')
        .select('id')
        .eq('qr_code', qrCode)
        .single()

      if (error || !data) {
        alert('Locker no encontrado con este código QR')
        setScanning(false)
        return
      }

      router.push(`/locker/${data.id}`)
    } catch (error) {
      console.error('Error searching locker:', error)
      alert('Error al buscar el locker')
      setScanning(false)
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
              Escanear Código QR
            </h1>
          </div>
        </div>
      </nav>

      <main className="max-w-2xl mx-auto py-6 px-4">
        <div className="card text-center">
          <div className="mb-6">
            <Camera className="w-16 h-16 text-mondelez-purple mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Escanear QR del Locker
            </h2>
            <p className="text-gray-600">
              Apunta la cámara hacia el código QR del locker para ver su información
            </p>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 font-medium mb-2">{error}</p>
              {error.includes('Permisos') && (
                <div className="text-sm text-red-700">
                  <p className="mb-1">Para habilitar la cámara:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Chrome: Click en el ícono de cámara en la barra de direcciones</li>
                    <li>Firefox: Click en "Permitir" cuando aparezca la notificación</li>
                    <li>Safari: Ve a Configuración → Sitios web → Cámara</li>
                  </ul>
                </div>
              )}
              <button
                onClick={() => setError('')}
                className="mt-2 text-sm bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1 rounded"
              >
                Cerrar
              </button>
            </div>
          )}

          <div className="mb-6">
            <video
              ref={videoRef}
              className="w-full max-w-md mx-auto rounded-lg border-2 border-gray-300"
              style={{ display: scanning ? 'block' : 'none' }}
            />
            
            {!scanning && (
              <div className="w-full max-w-md mx-auto h-64 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
                <div className="text-center">
                  <Camera className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">Cámara desactivada</p>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-4">
            {!scanning ? (
              <div className="space-y-4">
                <button
                  onClick={startScanning}
                  className="btn-primary w-full max-w-xs mx-auto flex items-center justify-center space-x-2"
                >
                  <Camera className="w-5 h-5" />
                  <span>{isIOS ? 'Seleccionar Imagen QR' : 'Iniciar Escaneo'}</span>
                </button>
                
                {/* Opción alternativa para PC también */}
                {!isIOS && (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="btn-secondary w-full max-w-xs mx-auto flex items-center justify-center space-x-2"
                  >
                    <Upload className="w-5 h-5" />
                    <span>Subir Imagen QR</span>
                  </button>
                )}
                
                {isIOS && (
                  <p className="text-sm text-blue-600 text-center">
                    En iOS: Toma una foto del QR o selecciona desde galería
                  </p>
                )}
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>
            ) : (
              <button
                onClick={stopScanning}
                className="btn-secondary w-full max-w-xs mx-auto"
              >
                Detener Escaneo
              </button>
            )}
          </div>

          <div className="mt-8 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-medium text-blue-900 mb-2">Instrucciones:</h3>
            <ul className="text-sm text-blue-800 space-y-1 text-left">
              {isIOS ? (
                <>
                  <li>• Toca "Seleccionar Imagen QR" para abrir la cámara</li>
                  <li>• Toma una foto del código QR o selecciona desde galería</li>
                  <li>• Asegúrate de que el QR esté bien enfocado</li>
                  <li>• La app procesará automáticamente el código</li>
                </>
              ) : (
                <>
                  <li>• Asegúrate de tener buena iluminación</li>
                  <li>• Mantén el código QR dentro del marco</li>
                  <li>• Espera a que se detecte automáticamente</li>
                  <li>• El escaneo te llevará a la información del locker</li>
                </>
              )}
            </ul>
          </div>
        </div>
      </main>
    </div>
  )
}