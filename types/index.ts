export interface Locker {
  id: string;
  number: string;
  qr_code: string;
  status: 'available' | 'occupied' | 'maintenance';
  created_at: string;
  updated_at: string;
}

export interface Employee {
  id: string;
  name: string;
  dni: string;
  area: string;
  shift: 1 | 2 | 3;
  status: 'active' | 'retired' | 'unassigned';
  created_at: string;
  updated_at: string;
}

export interface Assignment {
  id: string;
  locker_id: string;
  employee_id: string;
  assigned_at: string;
  released_at?: string;
  status: 'active' | 'released';
  created_at: string;
  updated_at: string;
}

export interface AuditLog {
  id: string;
  locker_id: string;
  employee_id?: string;
  action: 'assign' | 'release' | 'status_change' | 'create' | 'update';
  details: Record<string, any>;
  performed_by: string;
  created_at: string;
}