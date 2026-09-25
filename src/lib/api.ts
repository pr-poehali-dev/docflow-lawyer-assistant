import func2url from "../../backend/func2url.json";
import type { ClientRecord, CaseRecord, GeneratedDocument, DocTypeKey } from "@/types";

const CLIENTS_URL = func2url["clients"];
const CASES_URL = func2url["cases"];
const DOCGEN_URL = func2url["documents-generate"];

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options?.headers || {}) },
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
