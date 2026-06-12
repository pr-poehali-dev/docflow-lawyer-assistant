import React, { useState } from "react";
import Icon from "@/components/ui/icon";
import { CLIENTS, DOCUMENTS, TASKS } from "@/data/mockData";
import { StatusBadge, PriorityDot } from "./DashboardSection";
import type { Client } from "@/types";

type IconName = Parameters<typeof Icon>[0]["name"];

const inputCls = "w-full px-3 py-2.5 bg-surface-2 border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-electric transition-colors";

// ───────── Client Modal ─────────
const emptyClient: Omit<Client, "id"> = {
  name: "", phone: "", email: "", type: "Физическое лицо",
  cases: 0, lastContact: "", status: "new",
};

const ClientModal = ({ client, onClose, onSave }: {
  client: Client | null;
  onClose: () => void;
  onSave: (c: Client) => void;
}) => {
  const [form, setForm] = useState<Omit<Client, "id">>(
    client ? { name: client.name, phone: client.phone, email: client.email, type: client.type, cases: client.cases, lastContact: client.lastContact, status: client.status }
    : { ...emptyClient }
  );

  const set = (k: keyof typeof emptyClient) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSave = () => {
    if (!form.name.trim()) return;
    onSave({
      id: client?.id ?? Date.now(),
      ...form,
      lastContact: form.lastContact || new Date().toLocaleDateString("ru-RU"),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-surface border border-border rounded-2xl shadow-2xl animate-scale-in overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h3 className="font-bold text-foreground text-lg">{client ? "Редактировать клиента" : "Новый клиент"}</h3>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-surface-2 transition-colors text-muted-foreground hover:text-foreground">
            <Icon name="X" size={18} />
          </button>
        </div>
        <div className="p-5 space-y-4 overflow-y-auto max-h-[70vh]">
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">ФИО / Название <span className="text-red-400">*</span></label>
            <input value={form.name} onChange={set("name")} placeholder="Иванов Иван Иванович" className={inputCls} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">Тип клиента</label>
            <select value={form.type} onChange={set("type")} className={inputCls}>
              <option>Физическое лицо</option>
              <option>Юридическое лицо</option>
              <option>ИП</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">Телефон</label>
            <input value={form.phone} onChange={set("phone")} placeholder="+7 999 000-00-00" className={inputCls} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">Email</label>
            <input value={form.email} onChange={set("email")} placeholder="client@mail.ru" className={inputCls} />
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
        <div className="flex items-center justify-between p-5 border-t border-border">
          <button onClick={onClose} className="px-4 py-2 bg-surface-2 text-muted-foreground rounded-xl text-sm font-medium hover:text-foreground transition-colors">
            Отмена
          </button>
          <button onClick={handleSave} disabled={!form.name.trim()}
            className="flex items-center gap-2 px-5 py-2 bg-electric text-background rounded-xl text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed">
            <Icon name="Save" size={16} />
            Сохранить
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
      <p className="text-sm text-muted-foreground mb-5">Это действие нельзя отменить.</p>
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

// ───────── Section: Clients ─────────
const highlight = (text: string, query: string) => {
  if (!query.trim()) return <>{text}</>;
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

export const ClientsSection = () => {
  const [clients, setClients] = useState<Client[]>(CLIENTS);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [modalClient, setModalClient] = useState<Client | null | "new">(null);
  const [deleteTarget, setDeleteTarget] = useState<Client | null>(null);

  const q = search.toLowerCase();
  const filtered = clients.filter(c => {
    const matchSearch = !q ||
      c.name.toLowerCase().includes(q) ||
      c.type.toLowerCase().includes(q) ||
      c.phone.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q);
    const matchStatus = statusFilter === "all" || c.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const statusFilters = [
    { key: "all", label: "Все" },
    { key: "active", label: "Активные" },
    { key: "new", label: "Новые" },
    { key: "closed", label: "Закрытые" },
  ];

  const handleSave = (saved: Client) => {
    setClients(prev => prev.some(c => c.id === saved.id)
      ? prev.map(c => c.id === saved.id ? saved : c)
      : [saved, ...prev]
    );
    setModalClient(null);
  };

  const handleDelete = (client: Client) => {
    setClients(prev => prev.filter(c => c.id !== client.id));
    setDeleteTarget(null);
  };

  return (
    <div className="space-y-4 animate-fade-in">
      {modalClient !== null && (
        <ClientModal
          client={modalClient === "new" ? null : modalClient}
          onClose={() => setModalClient(null)}
          onSave={handleSave}
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

      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center animate-fade-in">
          <div className="w-14 h-14 rounded-2xl bg-surface-2 flex items-center justify-center mb-4">
            <Icon name="SearchX" size={24} className="text-muted-foreground" />
          </div>
          <div className="text-foreground font-semibold mb-1">Клиенты не найдены</div>
          <div className="text-sm text-muted-foreground">Попробуйте изменить запрос или сбросить фильтры</div>
          <button onClick={() => { setSearch(""); setStatusFilter("all"); }}
            className="mt-4 px-4 py-2 bg-surface-2 rounded-xl text-sm text-muted-foreground hover:text-foreground transition-colors">
            Сбросить фильтры
          </button>
        </div>
      )}

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
                <div className="text-sm text-muted-foreground">{highlight(client.type, search)}</div>
                {search && (client.phone.toLowerCase().includes(q) || client.email.toLowerCase().includes(q)) && (
                  <div className="flex gap-3 mt-1">
                    {client.phone.toLowerCase().includes(q) && (
                      <span className="text-xs text-muted-foreground">{highlight(client.phone, search)}</span>
                    )}
                    {client.email.toLowerCase().includes(q) && (
                      <span className="text-xs text-muted-foreground">{highlight(client.email, search)}</span>
                    )}
                  </div>
                )}
              </div>
              <div className="hidden lg:grid grid-cols-3 gap-6 text-right">
                <div>
                  <div className="text-xs text-muted-foreground">Телефон</div>
                  <div className="text-sm text-foreground">{client.phone}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Дел</div>
                  <div className="text-sm font-bold text-electric">{client.cases}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Последний контакт</div>
                  <div className="text-sm text-foreground">{client.lastContact}</div>
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
    </div>
  );
};

// ───────── Section: Documents ─────────
export const DocumentsSection = () => {
  const [filter, setFilter] = useState("all");
  const typeIcon: Record<string, string> = {
    "Иск": "FileText", "Аналитика": "BarChart2", "Жалоба": "AlertOctagon",
    "Отчёт": "FileBarChart", "Заключение": "CheckSquare",
  };
  const filtered = filter === "all" ? DOCUMENTS : DOCUMENTS.filter(d => d.status === filter);
  const filterLabels: Record<string, string> = { all: "Все", final: "Финал", review: "Проверка", draft: "Черновики" };

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">Документы</h2>
          <p className="text-sm text-muted-foreground">{DOCUMENTS.length} документов</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-electric text-background rounded-lg text-sm font-medium hover:opacity-90 transition-opacity">
          <Icon name="Upload" size={16} />
          Загрузить
        </button>
      </div>
      <div className="flex gap-2">
        {["all", "final", "review", "draft"].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${filter === f ? "bg-electric text-background" : "bg-surface-2 text-muted-foreground hover:text-foreground"}`}>
            {filterLabels[f]}
          </button>
        ))}
      </div>
      <div className="space-y-2">
        {filtered.map(doc => (
          <div key={doc.id} className="flex items-center gap-4 p-4 rounded-xl border border-border surface hover:border-electric/30 hover-scale cursor-pointer transition-colors">
            <div className="w-10 h-10 rounded-xl bg-electric/10 flex items-center justify-center shrink-0">
              <Icon name={(typeIcon[doc.type] || "File") as IconName} size={18} className="text-electric" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <h3 className="font-medium text-foreground truncate">{doc.title}</h3>
                <StatusBadge status={doc.status} />
              </div>
              <div className="text-xs text-muted-foreground">{doc.case}</div>
            </div>
            <div className="hidden lg:flex items-center gap-6 text-right">
              <div>
                <div className="text-xs text-muted-foreground">Версия</div>
                <div className="text-sm font-mono text-electric">v{doc.version}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Обновлён</div>
                <div className="text-sm text-foreground">{doc.updated}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Размер</div>
                <div className="text-sm text-foreground">{doc.size}</div>
              </div>
            </div>
            <div className="flex gap-2">
              <button className="p-2 rounded-lg bg-surface-2 hover:bg-surface-3 transition-colors">
                <Icon name="Download" size={14} className="text-muted-foreground" />
              </button>
              <button className="p-2 rounded-lg bg-surface-2 hover:bg-surface-3 transition-colors">
                <Icon name="History" size={14} className="text-muted-foreground" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ───────── Section: Tasks ─────────
export const TasksSection = () => {
  const [tasks, setTasks] = useState(TASKS);
  const toggle = (id: number) => setTasks(ts => ts.map(t => t.id === id ? { ...t, done: !t.done } : t));
  const done = tasks.filter(t => t.done).length;
  const priorityLabels: Record<string, string> = { high: "Высокий приоритет", medium: "Средний приоритет", low: "Низкий приоритет" };

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">Задачи и сроки</h2>
          <p className="text-sm text-muted-foreground">{done} из {tasks.length} выполнено</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-electric text-background rounded-lg text-sm font-medium hover:opacity-90 transition-opacity">
          <Icon name="Plus" size={16} />
          Задача
        </button>
      </div>
      <div className="w-full bg-surface-2 rounded-full h-1.5 overflow-hidden">
        <div className="h-full bg-electric rounded-full transition-all duration-500" style={{ width: `${(done / tasks.length) * 100}%` }} />
      </div>
      <div>
        {["high", "medium", "low"].map(priority => {
          const priorityTasks = tasks.filter(t => t.priority === priority);
          return (
            <div key={priority}>
              <div className="flex items-center gap-2 mb-2 mt-5">
                <PriorityDot priority={priority} />
                <span className="text-sm font-semibold text-muted-foreground">{priorityLabels[priority]}</span>
              </div>
              {priorityTasks.map(task => (
                <div
                  key={task.id}
                  className={`flex items-center gap-4 p-3 rounded-xl border mb-2 transition-all cursor-pointer ${task.done ? "border-border opacity-50 surface" : "border-border surface hover:border-electric/30"}`}
                  onClick={() => toggle(task.id)}
                >
                  <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${task.done ? "bg-electric border-electric" : "border-border hover:border-electric"}`}>
                    {task.done && <Icon name="Check" size={12} className="text-background" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={`text-sm font-medium ${task.done ? "line-through text-muted-foreground" : "text-foreground"}`}>{task.title}</div>
                    <div className="text-xs text-muted-foreground">{task.case} · {task.category}</div>
                  </div>
                  <div className={`text-xs font-medium shrink-0 ${task.done ? "text-muted-foreground" : "text-yellow-400"}`}>{task.deadline}</div>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
};