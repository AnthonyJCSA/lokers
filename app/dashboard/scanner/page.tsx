'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import QrScanner from 'qr-scanner'
import { Camera, ArrowLeft } from 'lucide-react'

export default function Scanner() {
  const [scanning, setScanning] = useState(false)
  const [error, setError] = useState('')
  const videoRef = useRef<HTMLVideoElement>(null)
  const qrScannerRef = useRef<QrScanner | null>(null)
  const router = useRouter()

  useEffect(() => {
    return () => {
      if (qrScannerRef.current) {
        qrScannerRef.current.destroy()
      }
    }
  }, [])

  const startScanning = async () => {
    if (!videoRef.current) return

    try {
      setError('')
      setScanning(true)

      qrScannerRef.current = new QrScanner(
        videoRef.current,
        (result) => {
          // Extraer ID del locker del QR
          const lockerId = result.data
          qrScannerRef.current?.destroy()
          router.push(`/locker/${lockerId}`)
        },
        {
          highlightScanRegion: true,
          highlightCodeOutline: true,
        }
      )

      await qrScannerRef.current.start()
    } catch (err: any) {
      setError('Error al acceder a la cámara: ' + err.message)
      setScanning(false)
    }
  }

  const stopScanning = () => {
    if (qrScannerRef.current) {
      qrScannerRef.current.destroy()
      qrScannerRef.current = null
    }
    setScanning(false)
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
              <p className="text-red-600">{error}</p>
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
              <button
                onClick={startScanning}
                className="btn-primary w-full max-w-xs mx-auto flex items-center justify-center space-x-2"
              >
                <Camera className="w-5 h-5" />
                <span>Iniciar Escaneo</span>
              </button>
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
              <li>• Asegúrate de tener buena iluminación</li>
              <li>• Mantén el código QR dentro del marco</li>
              <li>• Espera a que se detecte automáticamente</li>
              <li>• El escaneo te llevará a la información del locker</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  )
}