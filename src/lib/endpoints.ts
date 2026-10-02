import func2url from "../../backend/func2url.json";

const API_BASE = (import.meta.env.VITE_API_BASE as string | undefined)?.replace(/\/$/, "");

export const endpoint = (name: keyof typeof func2url): string =>
  API_BASE ? `${API_BASE}/${name}` : func2url[name];
