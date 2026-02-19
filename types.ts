
export enum LogType {
  IN = 'IN',
  OUT = 'OUT'
}

export enum SecurityEventType {
  LOGIN_SUCCESS = 'LOGIN_SUCCESS',
  LOGIN_FAILED = 'LOGIN_FAILED',
  ADMIN_ACCESS_ATTEMPT = 'ADMIN_ACCESS_ATTEMPT',
  ADMIN_ACCESS_GRANTED = 'ADMIN_ACCESS_GRANTED',
  SESSION_TIMEOUT = 'SESSION_TIMEOUT',
  LOCKOUT_TRIGGERED = 'LOCKOUT_TRIGGERED'
}

export interface SecurityLog {
  id: string;
  type: SecurityEventType;
  timestamp: number;
  details: string;
  employeeId?: string;
  ipPlaceholder?: string; // Simulated IP for UI realism
}

export interface Employee {
  id: string;
  name: string;
  role: string;
  department: string;
  avatar: string;
  password?: string;
}

export interface TimeLog {
  id: string;
  employeeId: string;
  type: LogType;
  timestamp: number;
  location?: {
    latitude: number;
    longitude: number;
  };
  note?: string;
}

export interface AppState {
  currentUser: Employee | null;
  logs: TimeLog[];
  securityLogs: SecurityLog[];
}
