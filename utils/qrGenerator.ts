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
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  return JSON.stringify({
    url: `${baseUrl}/locker/${lockerId}`,
    locker_id: lockerId,
    locker_number: lockerNumber,
    company: 'Mondelez Peru',
    generated_at: new Date().toISOString()
  })
}

export const generateAndUpdateQRCode = async (lockerId: string, lockerNumber: string): Promise<string> => {
  try {
    const qrData = generateLockerQRData(lockerId, lockerNumber)
    const qrHash = btoa(qrData).substring(0, 32) // Hash único basado en datos
    
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
        details: { new_qr_hash: qrHash, locker_number: lockerNumber }
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