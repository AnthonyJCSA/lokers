-- Script para verificar y mostrar códigos QR existentes
-- Ejecutar en Supabase para ver los QR codes actuales

SELECT 
  id,
  number,
  qr_code,
  status,
  created_at
FROM lockers 
ORDER BY number
LIMIT 10;

-- Ver si hay QR codes que necesitan actualización
SELECT 
  COUNT(*) as total_lockers,
  COUNT(CASE WHEN qr_code LIKE 'LOCKER_%' THEN 1 END) as old_format,
  COUNT(CASE WHEN qr_code LIKE 'QR_%' THEN 1 END) as new_format
FROM lockers;