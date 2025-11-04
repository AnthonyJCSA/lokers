# 🚀 Inicio Rápido - Mondelez Lockers

## Ejecutar Localmente (Sin Supabase)

```bash
# 1. Instalar dependencias
npm install

# 2. Ejecutar en desarrollo
npm run dev
```

La aplicación se ejecutará en `http://localhost:3000` y mostrará instrucciones de configuración.

## Configuración Completa con Supabase

### 1. Crear Proyecto Supabase
- Ve a [supabase.com](https://supabase.com)
- Crea nuevo proyecto
- Espera a que se complete

### 2. Configurar Base de Datos
En **SQL Editor** de Supabase, ejecuta en orden:

1. `lib/database.sql` (estructura)
2. `scripts/seedData.sql` (100 lockers + 50 empleados)
3. `scripts/createAssignments.sql` (asignaciones)

### 3. Crear Usuario Admin
```sql
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, created_at, updated_at,
  raw_app_meta_data, raw_user_meta_data
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'admin@mondelez.com',
  crypt('admin123', gen_salt('bf')),
  NOW(), NOW(), NOW(),
  '{"provider":"email","providers":["email"]}',
  '{}'
);
```

### 4. Obtener Credenciales
En **Settings > API**:
- Project URL
- anon/public key  
- service_role key

### 5. Configurar Variables
Edita `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_clave_publica
SUPABASE_SERVICE_ROLE_KEY=tu_clave_servicio
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 6. Reiniciar Aplicación
```bash
npm run dev
```

## 🔐 Acceso
- **Email**: admin@mondelez.com
- **Password**: admin123

## 📊 Datos Incluidos
- 100 lockers (60 disponibles, 30 ocupados, 10 mantenimiento)
- 50 empleados en 3 turnos
- 30 asignaciones activas
- Historial de auditoría completo

## ⚡ Funcionalidades
- Dashboard con KPIs
- Escáner QR
- CRUD lockers y empleados
- Asignaciones
- Reportes por turno
- Auditoría completa
- Exportación CSV