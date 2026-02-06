
export enum RequestType {
  SALDO_INICIAL = 'Saldo Inicial',
  DESCONTO = 'Desconto do saldo de férias',
  AGENDADAS = 'Férias agendadas no RH'
}

export enum HolidayType {
  NACIONAL = 'Nacional',
  ESTADUAL = 'Estadual',
  MUNICIPAL = 'Municipal'
}

export enum UserRole {
  ADMIN = 'Administrador',
  READONLY = 'Leitura'
}

export interface User {
  id: string;
  name: string;
  email: string;
  unit: string;
  role: UserRole;
  avatarUrl?: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  timestamp: string;
}

export interface Holiday {
  id: string;
  name: string;
  date: string; // ISO format YYYY-MM-DD
  type: HolidayType;
  state?: string;
  unit?: string; // Para feriados municipais/por unidade
}

export interface Collaborator {
  id: string;
  name: string;
  role: string;
  unit: string;
  state: string;
}

export interface VacationRecord {
  id: string;
  collaboratorId: string;
  type: RequestType;
  startDate: string;
  endDate: string;
  calendarDays: number;
  businessDays: number;
  holidaysCount: number;
  attachmentName?: string;
  attachmentData?: string; 
  unit: string;
  state: string;
  observation?: string; 
}

export interface ImportHistory {
  id: string;
  date: string;
  userName: string;
  fileName: string;
  recordsCount: number;
  status: 'Sucesso' | 'Erro';
}
