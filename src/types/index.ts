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
