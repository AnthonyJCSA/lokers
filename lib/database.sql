-- Crear tablas en Supabase
-- Ejecutar estos comandos en el SQL Editor de Supabase

-- Tabla de lockers
CREATE TABLE lockers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  number VARCHAR(10) UNIQUE NOT NULL,
  qr_code VARCHAR(255) UNIQUE NOT NULL,
  status VARCHAR(20) DEFAULT 'available' CHECK (status IN ('available', 'occupied', 'maintenance')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de empleados
CREATE TABLE employees (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  dni VARCHAR(20) UNIQUE NOT NULL,
  area VARCHAR(100) NOT NULL,
  shift INTEGER CHECK (shift IN (1, 2, 3)),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'retired', 'unassigned')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de asignaciones
CREATE TABLE assignments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  locker_id UUID REFERENCES lockers(id) ON DELETE CASCADE,
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  released_at TIMESTAMP WITH TIME ZONE,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'released')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de auditoría
CREATE TABLE audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  locker_id UUID REFERENCES lockers(id) ON DELETE CASCADE,
  employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
  action VARCHAR(50) NOT NULL,
  details JSONB,
  performed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para optimización
CREATE INDEX idx_lockers_status ON lockers(status);
CREATE INDEX idx_employees_status ON employees(status);
CREATE INDEX idx_assignments_status ON assignments(status);
CREATE INDEX idx_assignments_locker ON assignments(locker_id);
CREATE INDEX idx_audit_logs_locker ON audit_logs(locker_id);

-- Función para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para updated_at
CREATE TRIGGER update_lockers_updated_at BEFORE UPDATE ON lockers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON employees FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_assignments_updated_at BEFORE UPDATE ON assignments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS (Row Level Security) - Habilitar para todas las tablas
ALTER TABLE lockers ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Políticas RLS - Solo usuarios autenticados pueden acceder
CREATE POLICY "Authenticated users can view lockers" ON lockers FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can modify lockers" ON lockers FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view employees" ON employees FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can modify employees" ON employees FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view assignments" ON assignments FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can modify assignments" ON assignments FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view audit_logs" ON audit_logs FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can insert audit_logs" ON audit_logs FOR INSERT WITH CHECK (auth.role() = 'authenticated');