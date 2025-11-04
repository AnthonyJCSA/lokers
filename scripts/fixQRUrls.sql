-- Script para regenerar todos los QR codes con URLs correctas
-- Ejecutar en Supabase después del despliegue

-- Actualizar todos los QR codes para forzar regeneración
UPDATE lockers 
SET qr_code = CONCAT('QR_', id, '_', EXTRACT(EPOCH FROM NOW())::text)
WHERE qr_code IS NOT NULL;

-- Crear log de auditoría para la actualización masiva
INSERT INTO audit_logs (locker_id, action, details, created_at)
SELECT 
  id,
  'qr_regenerated',
  json_build_object(
    'type', 'url_fix_update',
    'locker_number', number,
    'reason', 'fix_production_urls'
  ),
  NOW()
FROM lockers;