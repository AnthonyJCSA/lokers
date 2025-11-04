-- Script para crear asignaciones y logs de auditoría
-- Ejecutar DESPUÉS del script seedData.sql

-- Crear asignaciones para los primeros 30 empleados activos con los 30 lockers ocupados
WITH occupied_lockers AS (
  SELECT id, number, ROW_NUMBER() OVER (ORDER BY number) as rn
  FROM lockers 
  WHERE status = 'occupied'
),
active_employees AS (
  SELECT id, name, ROW_NUMBER() OVER (ORDER BY created_at) as rn
  FROM employees 
  WHERE status = 'active'
  LIMIT 30
)
INSERT INTO assignments (locker_id, employee_id, status, assigned_at)
SELECT 
  ol.id,
  ae.id,
  'active',
  NOW() - INTERVAL '1 day' * (RANDOM() * 30)
FROM occupied_lockers ol
JOIN active_employees ae ON ol.rn = ae.rn;

-- Crear logs de auditoría para las asignaciones
INSERT INTO audit_logs (locker_id, employee_id, action, details, created_at)
SELECT 
  a.locker_id,
  a.employee_id,
  'assign',
  json_build_object(
    'type', 'manual_assignment',
    'locker_number', l.number,
    'employee_name', e.name
  ),
  a.assigned_at
FROM assignments a
JOIN lockers l ON a.locker_id = l.id
JOIN employees e ON a.employee_id = e.id
WHERE a.status = 'active';

-- Crear logs de creación para todos los lockers
INSERT INTO audit_logs (locker_id, action, details, created_at)
SELECT 
  id,
  'create',
  json_build_object(
    'type', 'locker_creation',
    'locker_number', number,
    'initial_status', status
  ),
  created_at
FROM lockers;

-- Crear algunos logs de liberación históricos (simulando actividad pasada)
INSERT INTO audit_logs (locker_id, employee_id, action, details, created_at)
SELECT 
  l.id,
  e.id,
  'release',
  json_build_object(
    'type', 'manual_release',
    'reason', 'employee_change',
    'locker_number', l.number
  ),
  NOW() - INTERVAL '1 day' * (RANDOM() * 60 + 30)
FROM lockers l
CROSS JOIN employees e
WHERE l.status = 'available' 
AND e.status = 'retired'
LIMIT 15;

-- Crear algunos logs de cambio de estado
INSERT INTO audit_logs (locker_id, action, details, created_at)
SELECT 
  id,
  'status_change',
  json_build_object(
    'type', 'maintenance_mode',
    'locker_number', number,
    'old_status', 'available',
    'new_status', 'maintenance'
  ),
  NOW() - INTERVAL '1 day' * (RANDOM() * 15)
FROM lockers
WHERE status = 'maintenance'
LIMIT 5;