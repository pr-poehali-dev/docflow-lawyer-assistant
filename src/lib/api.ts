import func2url from "../../backend/func2url.json";
import type { ClientRecord, CaseRecord, GeneratedDocument, DocTypeKey } from "@/types";

const CLIENTS_URL = func2url["clients"];
const CASES_URL = func2url["cases"];
const DOCGEN_URL = func2url["documents-generate"];
const USERS_URL = func2url["users"];

const AUTH_TOKEN_KEY = "legis_pro_auth_token";

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "X-Auth-Token": token || "",
      ...(options?.headers || {}),
    },
  });
  if (!res.ok) {
    let message = `Ошибка запроса (${res.status})`;
    try {
      const data = await res.json();
      message = data.error || message;
      (message as unknown as { missing_fields?: string[] });
      throw Object.assign(new Error(message), { missing_fields: data.missing_fields });
    } catch (e) {
      if (e instanceof Error && e.message !== message) throw e;
      throw new Error(message);
    }
  }
  return res.json();
}

// ───────── Clients ─────────
export const clientsApi = {
  list: () => request<ClientRecord[]>(CLIENTS_URL),
  get: (id: number) => request<ClientRecord>(`${CLIENTS_URL}?id=${id}`),
  create: (data: Partial<ClientRecord>) =>
    request<{ id: number }>(CLIENTS_URL, { method: "POST", body: JSON.stringify(data) }),
  update: (data: Partial<ClientRecord> & { id: number }) =>
    request<{ success: boolean }>(CLIENTS_URL, { method: "PUT", body: JSON.stringify(data) }),
  remove: (id: number) =>
    request<{ success: boolean }>(`${CLIENTS_URL}?id=${id}`, { method: "DELETE" }),
};

// ───────── Cases ─────────
export const casesApi = {
  list: (clientId?: number) =>
    request<CaseRecord[]>(clientId ? `${CASES_URL}?client_id=${clientId}` : CASES_URL),
  get: (id: number) => request<CaseRecord>(`${CASES_URL}?id=${id}`),
  create: (data: Partial<CaseRecord>) =>
    request<{ id: number }>(CASES_URL, { method: "POST", body: JSON.stringify(data) }),
  update: (data: Partial<CaseRecord> & { id: number }) =>
    request<{ success: boolean }>(CASES_URL, { method: "PUT", body: JSON.stringify(data) }),
  remove: (id: number) =>
    request<{ success: boolean }>(`${CASES_URL}?id=${id}`, { method: "DELETE" }),
};

// ───────── Document generation ─────────
export interface GenerateResult {
  id: number;
  title: string;
  docx_url: string;
  pdf_url: string;
}

export const documentsApi = {
  listForCase: (caseId: number) => request<GeneratedDocument[]>(`${DOCGEN_URL}?case_id=${caseId}`),
  checkFields: (docType: DocTypeKey, caseId: number) =>
    request<{ missing_fields: string[] }>(DOCGEN_URL, {
      method: "POST",
      body: JSON.stringify({ doc_type: docType, case_id: caseId, check_only: true }),
    }),
  generate: (docType: DocTypeKey, caseId: number) =>
    request<GenerateResult>(DOCGEN_URL, {
      method: "POST",
      body: JSON.stringify({ doc_type: docType, case_id: caseId }),
    }),
};

// ───────── Users (сотрудники, только для администратора) ─────────
export interface UserRecord {
  id: number;
  name: string;
  email: string;
  role: "admin" | "lawyer" | "staff" | "readonly";
  status: "active" | "inactive";
  last_login: string | null;
  created_at: string;
}

export interface AuditEntry {
  id: number;
  user_id: number | null;
  user_name: string | null;
  email: string;
  event: "login_success" | "login_failed" | "locked" | "bootstrap";
  ip_address: string | null;
  created_at: string;
}

export const usersApi = {
  list: () => request<UserRecord[]>(USERS_URL),
  audit: () => request<AuditEntry[]>(`${USERS_URL}?resource=audit`),
  create: (data: { name: string; email: string; password: string; role: string }) =>
    request<{ id: number }>(USERS_URL, { method: "POST", body: JSON.stringify(data) }),
  update: (data: { id: number; name?: string; role?: string; status?: string; password?: string }) =>
    request<{ success: boolean }>(USERS_URL, { method: "PUT", body: JSON.stringify(data) }),
  remove: (id: number) =>
    request<{ success: boolean }>(`${USERS_URL}?id=${id}`, { method: "DELETE" }),
};