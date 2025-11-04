# Mondelez Lockers - Sistema de Gestión de Lockers Corporativos

Sistema web y móvil para la administración de lockers corporativos mediante códigos QR para Mondelez Perú.

## 🚀 Características

- **Autenticación segura** - Solo administradores autorizados
- **Escaneo QR** - Acceso rápido a información de lockers
- **Gestión completa** - Alta, baja y asignación de lockers
- **Reportes por turno** - Análisis de ocupación por turnos
- **Auditoría completa** - Historial de todos los movimientos
- **Dashboard con KPIs** - Métricas en tiempo real
- **Interfaz moderna** - Diseño corporativo responsive

## 🛠️ Tecnologías

- **Frontend**: Next.js 14 + React + TypeScript
- **Styling**: Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth + API)
- **QR**: qr-scanner + qrcode
- **Despliegue**: Vercel

## 📋 Requisitos Previos

- Node.js 18+
- Cuenta de Supabase
- Cuenta de Vercel (para despliegue)

## 🔧 Instalación

1. **Clonar e instalar dependencias**
```bash
npm install
```

2. **Configurar Supabase**
   - Crear proyecto en [Supabase](https://supabase.com)
   - Ejecutar el script SQL en `lib/database.sql`
   - Copiar las credenciales

3. **Variables de entorno**
```bash
cp .env.local.example .env.local
```

Completar con tus credenciales de Supabase:
```env
NEXT_PUBLIC_SUPABASE_URL=tu_url_de_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_clave_anonima
SUPABASE_SERVICE_ROLE_KEY=tu_clave_de_servicio
```

4. **Crear usuario administrador** (en Supabase SQL Editor):
```sql
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, confirmation_token, email_change, email_change_token_new, recovery_token) VALUES ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'admin@mondelez.com', crypt('admin123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider":"email","providers":["email"]}', '{}', FALSE, '', '', '', '');
```

5. **Cargar datos de muestra**:
   - Ejecutar `scripts/seedData.sql`
   - Ejecutar `scripts/createAssignments.sql`

6. **Ejecutar en desarrollo**
```bash
npm run dev
```

## 📊 Estructura de Base de Datos

### Tablas principales:
- `lockers` - Información de lockers
- `employees` - Datos de empleados
- `assignments` - Asignaciones activas/históricas
- `audit_logs` - Registro de auditoría

### Características de seguridad:
- Row Level Security (RLS) habilitado
- Acceso solo para usuarios autenticados
- Auditoría automática de cambios

## 🎯 Funcionalidades Implementadas

### ✅ Completadas
- [x] Autenticación de administradores
- [x] Dashboard con KPIs en tiempo real
- [x] Escáner QR con cámara integrada
- [x] Vista detallada de lockers
- [x] CRUD completo de lockers
- [x] CRUD completo de empleados
- [x] Asignación y desasignación de lockers
- [x] Generación de códigos QR únicos
- [x] Reportes por turno con filtros
- [x] Historial de auditoría completo
- [x] Exportación de reportes CSV
- [x] Estructura de base de datos con RLS
- [x] 100 lockers de muestra generados
- [x] 50 empleados de muestra
- [x] Logs de auditoría automáticos

## 🚀 Despliegue

### Vercel (Recomendado)
```bash
npm run build
vercel --prod
```

### Variables de entorno en producción
Configurar las mismas variables de `.env.local` en el panel de Vercel.

## 📱 Uso de la Aplicación

1. **Login**: Acceso con credenciales de administrador (admin@mondelez.com / admin123)
2. **Dashboard**: Vista general con KPIs y accesos rápidos
3. **Escanear QR**: Usar cámara para leer códigos de lockers
4. **Gestión Lockers**: Crear, editar, eliminar y generar QR
5. **Gestión Empleados**: CRUD completo de empleados
6. **Asignaciones**: Asignar y desasignar lockers a empleados
7. **Reportes**: Análisis por turnos con exportación CSV
8. **Auditoría**: Historial completo con filtros avanzados

## 📊 Datos de Muestra

- **100 Lockers**: 60 disponibles, 30 ocupados, 10 en mantenimiento
- **50 Empleados**: Distribuidos en 3 turnos
- **30 Asignaciones activas**: Con historial de auditoría
- **Logs de ejemplo**: Para demostrar funcionalidad completa

## 🔐 Seguridad

- Autenticación obligatoria para todas las rutas
- RLS en base de datos
- Validación de permisos en cada operación
- Auditoría completa de acciones

## 📞 Soporte

Para soporte técnico o consultas sobre la implementación, contactar al equipo de desarrollo.

## 📄 Licencia

Uso exclusivo para Mondelez Perú. Todos los derechos reservados.