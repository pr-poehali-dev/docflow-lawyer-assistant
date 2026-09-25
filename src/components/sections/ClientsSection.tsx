import React, { useState, useEffect, useCallback } from "react";
import Icon from "@/components/ui/icon";
import { StatusBadge } from "./DashboardSection";
import type { ClientRecord } from "@/types";
import { clientsApi } from "@/lib/api";

const inputCls = "w-full px-3 py-2.5 bg-surface-2 border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-electric transition-colors";

const emptyClient: Omit<ClientRecord, "id" | "cases_count" | "created_at" | "updated_at"> = {
  name: "", client_type: "Физическое лицо", phone: "", email: "", status: "new",
  birth_date: "", address: "", passport_series: "", passport_number: "",
  passport_issued: "", passport_date: "", inn: "", ogrn: "", kpp: "", bank_details: "",
  last_contact: "",
};

// ───────── Client Modal ─────────
const ClientModal = ({ client, onClose, onSaved }: {
  client: ClientRecord | null;
  onClose: () => void;
  onSaved: () => void;
}) => {
  const [form, setForm] = useState(
    client ? {
      name: client.name, client_type: client.client_type, phone: client.phone, email: client.email,
      status: client.status, birth_date: client.birth_date || "", address: client.address,
      passport_series: client.passport_series, passport_number: client.passport_number,
      passport_issued: client.passport_issued, passport_date: client.passport_date || "",
      inn: client.inn, ogrn: client.ogrn, kpp: client.kpp, bank_details: client.bank_details,
      last_contact: client.last_contact || "",
    } : { ...emptyClient }
  );
  const [saving, setSaving] = useState(false);
  const isLegal = form.client_type !== "Физическое лицо";

  const set = (k: keyof typeof emptyClient) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSave = async () => {
    if (!form.name.trim() || saving) return;
    setSaving(true);
    try {
      if (client) {
        await clientsApi.update({ id: client.id, ...form });
      } else {
        await clientsApi.create(form);
      }
      onSaved();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-surface border border-border rounded-2xl shadow-2xl animate-scale-in overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-5 border-b border-border shrink-0">
          <h3 className="font-bold text-foreground text-lg">{client ? "Редактировать клиента" : "Новый клиент"}</h3>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-surface-2 transition-colors text-muted-foreground hover:text-foreground">
            <Icon name="X" size={18} />
          </button>
        </div>
        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">ФИО / Название <span className="text-red-400">*</span></label>
            <input value={form.name} onChange={set("name")} placeholder="Иванов Иван Иванович" className={inputCls} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Тип клиента</label>
              <select value={form.client_type} onChange={set("client_type")} className={inputCls}>
                <option>Физическое лицо</option>
                <option>Юридическое лицо</option>
                <option>ИП</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Статус</label>
              <select value={form.status} onChange={set("status")} className={inputCls}>
                <option value="new">Новый</option>
                <option value="active">Активный</option>
                <option value="closed">Закрытый</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Телефон</label>
              <input value={form.phone} onChange={set("phone")} placeholder="+7 999 000-00-00" className={inputCls} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Email</label>
              <input value={form.email} onChange={set("email")} placeholder="client@mail.ru" className={inputCls} />
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">Адрес</label>
            <input value={form.address} onChange={set("address")} placeholder="г. Москва, ул. Ленина, д. 1, кв. 1" className={inputCls} />
          </div>

          {!isLegal && (
            <div className="border-t border-border pt-4 space-y-3">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Паспортные данные</div>
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">Дата рождения</label>
                <input type="date" value={form.birth_date || ""} onChange={set("birth_date")} className={inputCls} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">Серия</label>
                  <input value={form.passport_series} onChange={set("passport_series")} placeholder="1234" className={inputCls} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">Номер</label>
                  <input value={form.passport_number} onChange={set("passport_number")} placeholder="567890" className={inputCls} />
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">Кем выдан</label>
                <input value={form.passport_issued} onChange={set("passport_issued")} placeholder="УМВД России по г. Москве" className={inputCls} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">Дата выдачи</label>
                <input type="date" value={form.passport_date || ""} onChange={set("passport_date")} className={inputCls} />
              </div>
            </div>
          )}

          {isLegal && (
            <div className="border-t border-border pt-4 space-y-3">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Реквизиты организации</div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">ИНН</label>
                  <input value={form.inn} onChange={set("inn")} placeholder="7701234567" className={inputCls} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">КПП</label>
                  <input value={form.kpp} onChange={set("kpp")} placeholder="770101001" className={inputCls} />
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">ОГРН</label>
                <input value={form.ogrn} onChange={set("ogrn")} placeholder="1027700132195" className={inputCls} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">Банковские реквизиты</label>
                <textarea value={form.bank_details} onChange={e => setForm(f => ({ ...f, bank_details: e.target.value }))}
                  placeholder="р/с, БИК, банк..." rows={2} className={inputCls} />
              </div>
            </div>
          )}
        </div>
        <div className="flex items-center justify-between p-5 border-t border-border shrink-0">
          <button onClick={onClose} className="px-4 py-2 bg-surface-2 text-muted-foreground rounded-xl text-sm font-medium hover:text-foreground transition-colors">
            Отмена
          </button>
          <button onClick={handleSave} disabled={!form.name.trim() || saving}
            className="flex items-center gap-2 px-5 py-2 bg-electric text-background rounded-xl text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed">
            <Icon name={saving ? "Loader2" : "Save"} size={16} className={saving ? "animate-spin" : ""} />
            {saving ? "Сохраняем..." : "Сохранить"}
          </button>
        </div>
      </div>
    </div>
  );
};

// ───────── Delete Confirm ─────────
const DeleteConfirm = ({ name, onConfirm, onCancel }: { name: string; onConfirm: () => void; onCancel: () => void }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onCancel} />
    <div className="relative w-full max-w-sm bg-surface border border-border rounded-2xl shadow-2xl animate-scale-in p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center shrink-0">
          <Icon name="Trash2" size={18} className="text-red-400" />
        </div>
        <div>
          <div className="font-bold text-foreground">Удалить клиента?</div>
          <div className="text-sm text-muted-foreground mt-0.5">{name}</div>
        </div>
      </div>
      <p className="text-sm text-muted-foreground mb-5">Все связанные дела также будут удалены. Это действие нельзя отменить.</p>
      <div className="flex gap-3">
        <button onClick={onCancel} className="flex-1 px-4 py-2 bg-surface-2 text-muted-foreground rounded-xl text-sm font-medium hover:text-foreground transition-colors">
          Отмена
        </button>
        <button onClick={onConfirm} className="flex-1 px-4 py-2 bg-red-500 text-white rounded-xl text-sm font-medium hover:opacity-90 transition-opacity">
          Удалить
        </button>
      </div>
    </div>
  </div>
);

const highlight = (text: string, query: string) => {
  if (!query.trim() || !text) return <>{text}</>;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-electric/30 text-electric rounded px-0.5">{text.slice(idx, idx + query.length)}</mark>
      {text.slice(idx + query.length)}
    </>
  );
};

// ───────── Section: Clients ─────────
export const ClientsSection = () => {
  const [clients, setClients] = useState<ClientRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [modalClient, setModalClient] = useState<ClientRecord | null | "new">(null);
  const [deleteTarget, setDeleteTarget] = useState<ClientRecord | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await clientsApi.list();
      setClients(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось загрузить клиентов");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const q = search.toLowerCase();
  const filtered = clients.filter(c => {
    const matchSearch = !q ||
      c.name.toLowerCase().includes(q) ||
      (c.client_type || "").toLowerCase().includes(q) ||
      (c.phone || "").toLowerCase().includes(q) ||
      (c.email || "").toLowerCase().includes(q);
    const matchStatus = statusFilter === "all" || c.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const statusFilters = [
    { key: "all", label: "Все" },
    { key: "active", label: "Активные" },
    { key: "new", label: "Новые" },
    { key: "closed", label: "Закрытые" },
  ];

  const handleDelete = async (client: ClientRecord) => {
    await clientsApi.remove(client.id);
    setDeleteTarget(null);
    load();
  };

  return (
    <div className="space-y-4 animate-fade-in">
      {modalClient !== null && (
        <ClientModal
          client={modalClient === "new" ? null : modalClient}
          onClose={() => setModalClient(null)}
          onSaved={() => { setModalClient(null); load(); }}
        />
      )}
      {deleteTarget && (
        <DeleteConfirm
          name={deleteTarget.name}
          onConfirm={() => handleDelete(deleteTarget)}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">Справочник клиентов</h2>
          <p className="text-sm text-muted-foreground">{filtered.length} из {clients.length} клиентов</p>
        </div>
        <button onClick={() => setModalClient("new")}
          className="flex items-center gap-2 px-4 py-2 bg-electric text-background rounded-lg text-sm font-medium hover:opacity-90 transition-opacity">
          <Icon name="UserPlus" size={16} />
          Добавить
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Icon name="Search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Имя, телефон, email, тип клиента..."
            className="w-full pl-9 pr-9 py-2.5 bg-surface-2 border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-electric transition-colors"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
              <Icon name="X" size={14} />
            </button>
          )}
        </div>
        <div className="flex gap-2">
          {statusFilters.map(f => (
            <button key={f.key} onClick={() => setStatusFilter(f.key)}
              className={`px-3 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${statusFilter === f.key ? "bg-electric text-background" : "bg-surface-2 text-muted-foreground hover:text-foreground"}`}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-16">
          <Icon name="Loader2" size={24} className="text-muted-foreground animate-spin" />
        </div>
      )}

      {!loading && error && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Icon name="AlertTriangle" size={24} className="text-red-400 mb-2" />
          <div className="text-sm text-muted-foreground">{error}</div>
          <button onClick={load} className="mt-3 px-4 py-2 bg-surface-2 rounded-xl text-sm text-muted-foreground hover:text-foreground transition-colors">
            Повторить
          </button>
        </div>
      )}

      {!loading && !error && filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center animate-fade-in">
          <div className="w-14 h-14 rounded-2xl bg-surface-2 flex items-center justify-center mb-4">
            <Icon name="SearchX" size={24} className="text-muted-foreground" />
          </div>
          <div className="text-foreground font-semibold mb-1">{clients.length === 0 ? "Клиентов пока нет" : "Клиенты не найдены"}</div>
          <div className="text-sm text-muted-foreground">
            {clients.length === 0 ? "Добавьте первого клиента, чтобы начать работу" : "Попробуйте изменить запрос или сбросить фильтры"}
          </div>
          {clients.length > 0 && (
            <button onClick={() => { setSearch(""); setStatusFilter("all"); }}
              className="mt-4 px-4 py-2 bg-surface-2 rounded-xl text-sm text-muted-foreground hover:text-foreground transition-colors">
              Сбросить фильтры
            </button>
          )}
        </div>
      )}

      {!loading && !error && filtered.length > 0 && (
        <div className="space-y-3">
          {filtered.map(client => (
            <div key={client.id} className="p-4 rounded-xl border border-border surface hover:border-electric/30 transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-xl bg-electric/10 flex items-center justify-center shrink-0">
                  <span className="text-electric font-bold text-lg">{client.name[0]}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-foreground truncate">{highlight(client.name, search)}</h3>
                    <StatusBadge status={client.status} />
                  </div>
                  <div className="text-sm text-muted-foreground">{highlight(client.client_type, search)}</div>
                </div>
                <div className="hidden lg:grid grid-cols-3 gap-6 text-right">
                  <div>
                    <div className="text-xs text-muted-foreground">Телефон</div>
                    <div className="text-sm text-foreground">{client.phone || "—"}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Дел</div>
                    <div className="text-sm font-bold text-electric">{client.cases_count ?? 0}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Последний контакт</div>
                    <div className="text-sm text-foreground">{client.last_contact || "—"}</div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setModalClient(client)}
                    className="p-2 rounded-lg bg-surface-2 hover:bg-electric/10 hover:text-electric transition-colors">
                    <Icon name="Pencil" size={14} className="text-muted-foreground" />
                  </button>
                  <button onClick={() => setDeleteTarget(client)}
                    className="p-2 rounded-lg bg-surface-2 hover:bg-red-500/10 hover:text-red-400 transition-colors">
                    <Icon name="Trash2" size={14} className="text-muted-foreground" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};