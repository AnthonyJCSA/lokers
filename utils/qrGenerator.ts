import QRCode from 'qrcode'
import { supabase } from '@/lib/supabase'

export const generateQRCode = async (data: string): Promise<string> => {
  try {
    const qrCodeDataURL = await QRCode.toDataURL(data, {
      width: 256,
      margin: 2,
      color: {
        dark: '#663399', // Mondelez purple
        light: '#FFFFFF'
      }
    })
    return qrCodeDataURL
  } catch (error) {
    console.error('Error generating QR code:', error)
    throw error
  }
}

export const generateLockerQRData = (lockerId: string, lockerNumber: string): string => {
  // Detectar URL actual del navegador o usar variable de entorno
  const baseUrl = typeof window !== 'undefined' 
    ? `${window.location.protocol}//${window.location.host}`
    : process.env.NEXT_PUBLIC_APP_URL || 'https://lokers.vercel.app'
  
  // Retornar solo la URL para el QR (más simple para escanear)
  return `${baseUrl}/locker/${lockerId}`
}

export const generateAndUpdateQRCode = async (lockerId: string, lockerNumber: string): Promise<string> => {
  try {
    const qrData = generateLockerQRData(lockerId, lockerNumber)
    const qrHash = `QR_${lockerId}_${Date.now()}` // Hash único basado en ID y timestamp
    
    // Actualizar QR code en la base de datos
    await supabase
      .from('lockers')
      .update({ qr_code: qrHash })
      .eq('id', lockerId)
    
    // Crear log de auditoría
    await supabase
      .from('audit_logs')
      .insert({
        locker_id: lockerId,
        action: 'qr_regenerated',
        details: { 
          new_qr_hash: qrHash, 
          locker_number: lockerNumber,
          qr_url: qrData
        }
      })
    
    return qrData
  } catch (error) {
    console.error('Error updating QR code:', error)
    throw error
  }
}

export const downloadQRCode = (dataURL: string, filename: string) => {
  const link = document.createElement('a')
  link.download = filename
  link.href = dataURL
  link.click()
}