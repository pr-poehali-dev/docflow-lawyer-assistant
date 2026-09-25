export type Section = "dashboard" | "cases" | "clients" | "documents" | "tasks" | "calendar" | "reviewed" | "payments" | "users";

export interface SystemUser {
  id: number; name: string; email: string; role: "admin" | "lawyer" | "assistant" | "readonly";
  status: "active" | "inactive" | "blocked"; lastLogin: string; cases: number; avatar: string;
}

export interface Client {
  id: number; name: string; phone: string; email: string; type: string;
  cases: number; lastContact: string; status: "active" | "new" | "closed";
}

export interface Case {
  id: number; title: string; client: string; category: string;
  status: "active" | "pending" | "closed" | "urgent"; deadline: string; court?: string; priority: "high" | "medium" | "low";
  // Истец
  fullName: string; birthDate: string; address: string;
  passportSeries: string; passportNumber: string; passportIssued: string; passportDate: string;
  vehicle: string; vehiclePlate: string;
  policyNumber: string; insuranceCompany: string;
  // Водитель ТС клиента
  driverFullName: string; driverBirthDate: string; driverAddress: string; driverInsuranceCompany: string;
  // ДТП
  dtpDate: string; dtpPlace: string;
  // Виновник ДТП
  guiltFullName: string; guiltBirthDate: string; guiltAddress: string; guiltPhone: string;
  guiltOwnerName: string; guiltOwnerAddress: string;
  guiltVehicle: string; guiltVehiclePlate: string; guiltInsuranceCompany: string; guiltPolicyNumber: string;
}

export interface Document {
  id: number; title: string; case: string; type: string; version: number;
  updated: string; size: string; status: "final" | "draft" | "review";
}

export interface Task {
  id: number; title: string; case: string; deadline: string;
  priority: "high" | "medium" | "low"; done: boolean; category: string;
}

export interface CalEvent {
  id: number; title: string; type: "court" | "meeting" | "deadline" | "call";
  date: string; time: string; client: string; location?: string;
}

export interface Notification {
  id: number; text: string; type: "urgent" | "warning" | "info"; time: string;
}

export interface ReviewedCase {
  id: number; title: string; client: string; category: string;
  closedDate: string; result: "won" | "lost" | "settled" | "withdrawn";
  court?: string; duration: string; amount?: string;
}

export interface Payment {
  id: number; client: string; case: string; amount: number;
  date: string; status: "paid" | "pending" | "overdue" | "partial";
  type: "retainer" | "hourly" | "success_fee" | "consultation";
  comment?: string;
}

// ───────── Реальные данные CRM (backend) ─────────
export interface ClientRecord {
  id: number;
  name: string;
  client_type: string;
  phone: string;
  email: string;
  status: "active" | "new" | "closed";
  birth_date: string | null;
  address: string;
  passport_series: string;
  passport_number: string;
  passport_issued: string;
  passport_date: string | null;
  inn: string;
  ogrn: string;
  kpp: string;
  bank_details: string;
  last_contact: string | null;
  cases_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface CaseRecord {
  id: number;
  client_id: number;
  title: string;
  category: string;
  status: "active" | "pending" | "closed" | "urgent";
  priority: "high" | "medium" | "low";
  deadline: string | null;
  court: string;
  vehicle: string;
  vehicle_plate: string;
  policy_number: string;
  insurance_company: string;
  driver_full_name: string;
  driver_birth_date: string | null;
  driver_address: string;
  driver_insurance_company: string;
  incident_date: string | null;
  incident_place: string;
  guilt_full_name: string;
  guilt_birth_date: string | null;
  guilt_address: string;
  guilt_phone: string;
  guilt_owner_name: string;
  guilt_owner_address: string;
  guilt_vehicle: string;
  guilt_vehicle_plate: string;
  guilt_insurance_company: string;
  guilt_policy_number: string;
  amount: number | null;
  contract_number: string;
  contract_date: string | null;
  circumstances: string;
  desired_result: string;
  created_at?: string;
  updated_at?: string;
}

export type DocTypeKey = "zayavlenie" | "pretenziya" | "utochnenie" | "dogovor";

export interface GeneratedDocument {
  id: number;
  case_id: number;
  client_id: number;
  doc_type: DocTypeKey;
  title: string;
  docx_url: string;
  pdf_url: string;
  created_at: string;
}