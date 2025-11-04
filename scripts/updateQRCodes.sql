-- Script para actualizar códigos QR existentes con datos reales
-- Ejecutar después de implementar la nueva funcionalidad

-- Actualizar QR codes con hash basado en datos del locker
UPDATE lockers 
SET qr_code = CONCAT('QR_', id, '_', number, '_', EXTRACT(EPOCH FROM NOW())::text)
WHERE qr_code LIKE 'LOCKER_%';

-- Crear logs de auditoría para la regeneración de QR
INSERT INTO audit_logs (locker_id, action, details, created_at)
SELECT 
  id,
  'qr_regenerated',
  json_build_object(
    'type', 'bulk_qr_update',
    'locker_number', number,
    'reason', 'system_upgrade'
  ),
  NOW()
FROM lockers;