import { useState } from "react";
import Icon from "@/components/ui/icon";
import { CLIENTS, DOCUMENTS, TASKS } from "@/data/mockData";
import { StatusBadge, PriorityDot } from "./DashboardSection";

type IconName = Parameters<typeof Icon>[0]["name"];

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
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const q = search.toLowerCase();
  const filtered = CLIENTS.filter(c => {
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

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">Справочник клиентов</h2>
          <p className="text-sm text-muted-foreground">{filtered.length} из {CLIENTS.length} клиентов</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-electric text-background rounded-lg text-sm font-medium hover:opacity-90 transition-opacity">
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
          <div key={client.id} className="p-4 rounded-xl border border-border surface hover:border-electric/30 hover-scale cursor-pointer transition-colors">
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
                <button className="p-2 rounded-lg bg-surface-2 hover:bg-surface-3 transition-colors">
                  <Icon name="Phone" size={14} className="text-muted-foreground" />
                </button>
                <button className="p-2 rounded-lg bg-surface-2 hover:bg-surface-3 transition-colors">
                  <Icon name="Mail" size={14} className="text-muted-foreground" />
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
