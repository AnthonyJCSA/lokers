# Guía de Configuración - Mondelez Lockers

## 🚀 Configuración Inicial

### 1. Instalar Dependencias
```bash
npm install
```

### 2. Configurar Supabase

#### Crear Proyecto
1. Ve a [supabase.com](https://supabase.com)
2. Crea una nueva cuenta o inicia sesión
3. Crea un nuevo proyecto
4. Espera a que se complete la configuración

#### Configurar Base de Datos
1. Ve a **SQL Editor** en tu proyecto de Supabase
2. Ejecuta el script `lib/database.sql` completo
3. Ejecuta el script `scripts/seedData.sql` para datos de muestra
4. Ejecuta el script `scripts/createAssignments.sql` para asignaciones

#### Obtener Credenciales
1. Ve a **Settings > API**
2. Copia la **Project URL**
3. Copia la **anon/public key**
4. Ve a **Settings > API > Service Role** y copia la **service_role key**

### 3. Variables de Entorno
```bash
cp .env.local.example .env.local
```

Edita `.env.local` con tus credenciales:
```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_clave_anonima
SUPABASE_SERVICE_ROLE_KEY=tu_clave_de_servicio
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Crear Usuario Administrador

En Supabase SQL Editor:
```sql
-- Crear usuario administrador (cambiar email y password)
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'admin@mondelez.com',
  crypt('admin123', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  FALSE,
  '',
  '',
  '',
  ''
);
```

### 5. Ejecutar Aplicación
```bash
npm run dev
```

## 📊 Datos de Muestra Incluidos

- **100 Lockers**: 60 disponibles, 30 ocupados, 10 en mantenimiento
- **50 Empleados**: Distribuidos en 3 turnos con diferentes estados
- **30 Asignaciones activas**: Lockers ocupados con empleados asignados
- **Historial de auditoría**: Logs de ejemplo para demostrar funcionalidad

## 🔐 Credenciales de Prueba

- **Email**: admin@mondelez.com
- **Password**: admin123

## 🎯 Funcionalidades Implementadas

### ✅ Completadas
- [x] Autenticación de administradores
- [x] Dashboard con KPIs en tiempo real
- [x] Escáner QR con cámara
- [x] Vista detallada de lockers
- [x] CRUD completo de lockers
- [x] CRUD completo de empleados
- [x] Asignación y desasignación de lockers
- [x] Generación de códigos QR únicos
- [x] Reportes por turno con filtros
- [x] Historial de auditoría completo
- [x] Exportación de reportes CSV
- [x] Estructura de base de datos con RLS
- [x] Logs de auditoría automáticos

### 🎨 Características de UI/UX
- [x] Diseño corporativo responsive
- [x] Colores de marca Mondelez
- [x] Navegación intuitiva
- [x] Modales para acciones
- [x] Filtros y búsqueda
- [x] Estados visuales claros
- [x] Feedback de acciones

## 🔧 Estructura del Proyecto

```
lokersApp/
├── app/                    # Páginas Next.js 14
│   ├── auth/login/        # Autenticación
│   ├── dashboard/         # Panel principal
│   │   ├── employees/     # Gestión empleados
│   │   ├── lockers/       # Gestión lockers
│   │   ├── assign/        # Asignaciones
│   │   ├── reports/       # Reportes
│   │   ├── audit/         # Auditoría
│   │   └── scanner/       # Escáner QR
│   └── locker/[id]/       # Vista detalle locker
├── components/            # Componentes reutilizables
├── lib/                   # Configuración Supabase
├── types/                 # Tipos TypeScript
├── utils/                 # Utilidades (QR, etc.)
└── scripts/               # Scripts SQL de datos
```

## 🚀 Despliegue en Producción

### Vercel (Recomendado)
1. Conecta tu repositorio a Vercel
2. Configura las variables de entorno
3. Despliega automáticamente

### Variables de Producción
- Actualiza `NEXT_PUBLIC_APP_URL` con tu dominio
- Mantén las credenciales de Supabase seguras
- Configura RLS apropiadamente

## 📞 Soporte

Para dudas técnicas o problemas de configuración, revisa:
1. Los logs de Supabase
2. La consola del navegador
3. Los archivos de configuración

## 🔐 Seguridad

- RLS habilitado en todas las tablas
- Autenticación obligatoria
- Validación de permisos
- Auditoría completa de acciones
- Datos sensibles protegidos