import { useState } from "react";
import Icon from "@/components/ui/icon";

type IconName = Parameters<typeof Icon>[0]["name"];

// ───────── Types ─────────
type Section = "dashboard" | "cases" | "clients" | "documents" | "tasks" | "calendar";

interface Client {
  id: number; name: string; phone: string; email: string; type: string;
  cases: number; lastContact: string; status: "active" | "new" | "closed";
}
interface Case {
  id: number; title: string; client: string; category: string;
  status: "active" | "pending" | "closed" | "urgent"; deadline: string; court?: string; priority: "high" | "medium" | "low";
}
interface Document {
  id: number; title: string; case: string; type: string; version: number;
  updated: string; size: string; status: "final" | "draft" | "review";
}
interface Task {
  id: number; title: string; case: string; deadline: string;
  priority: "high" | "medium" | "low"; done: boolean; category: string;
}
interface CalEvent {
  id: number; title: string; type: "court" | "meeting" | "deadline" | "call";
  date: string; time: string; client: string; location?: string;
}
interface Notification {
  id: number; text: string; type: "urgent" | "warning" | "info"; time: string;
}

// ───────── Mock Data ─────────
const CLIENTS: Client[] = [
  { id: 1, name: "ООО «Альфа Строй»", phone: "+7 495 123-45-67", email: "info@alfa-stroy.ru", type: "Юридическое лицо", cases: 3, lastContact: "01.06.2026", status: "active" },
  { id: 2, name: "Петров Андрей Николаевич", phone: "+7 916 234-56-78", email: "petrov@mail.ru", type: "Физическое лицо", cases: 1, lastContact: "28.05.2026", status: "active" },
  { id: 3, name: "ИП Сидорова Мария", phone: "+7 903 345-67-89", email: "sidorova@biz.ru", type: "ИП", cases: 2, lastContact: "25.05.2026", status: "new" },
  { id: 4, name: "АО «ТехноПром»", phone: "+7 495 456-78-90", email: "legal@technoprom.ru", type: "Юридическое лицо", cases: 5, lastContact: "20.05.2026", status: "active" },
  { id: 5, name: "Козлов Виктор Павлович", phone: "+7 926 567-89-01", email: "kozlov@gmail.com", type: "Физическое лицо", cases: 1, lastContact: "15.05.2026", status: "closed" },
];

const CASES: Case[] = [
  { id: 1, title: "Корпоративный спор по договору поставки", client: "ООО «Альфа Строй»", category: "Корпоративное право", status: "urgent", deadline: "05.06.2026", court: "Арбитражный суд г. Москвы", priority: "high" },
  { id: 2, title: "Взыскание задолженности по аренде", client: "АО «ТехноПром»", category: "Гражданское право", status: "active", deadline: "15.06.2026", court: "Пресненский районный суд", priority: "high" },
  { id: 3, title: "Регистрация товарного знака", client: "ИП Сидорова Мария", category: "Интеллектуальная собственность", status: "pending", deadline: "30.06.2026", priority: "medium" },
  { id: 4, title: "Трудовой спор — незаконное увольнение", client: "Петров Андрей Николаевич", category: "Трудовое право", status: "active", deadline: "20.06.2026", court: "Хамовнический суд", priority: "medium" },
  { id: 5, title: "Сопровождение M&A сделки", client: "АО «ТехноПром»", category: "Корпоративное право", status: "active", deadline: "01.07.2026", priority: "high" },
];

const DOCUMENTS: Document[] = [
  { id: 1, title: "Исковое заявление о взыскании задолженности", case: "Взыскание задолженности по аренде", type: "Иск", version: 3, updated: "01.06.2026", size: "124 КБ", status: "final" },
  { id: 2, title: "Договор поставки (анализ)", case: "Корпоративный спор", type: "Аналитика", version: 2, updated: "31.05.2026", size: "87 КБ", status: "review" },
  { id: 3, title: "Апелляционная жалоба", case: "Трудовой спор", type: "Жалоба", version: 1, updated: "30.05.2026", size: "56 КБ", status: "draft" },
  { id: 4, title: "Due Diligence отчёт", case: "Сопровождение M&A", type: "Отчёт", version: 4, updated: "29.05.2026", size: "2.3 МБ", status: "review" },
  { id: 5, title: "Правовое заключение по товарному знаку", case: "Регистрация товарного знака", type: "Заключение", version: 1, updated: "27.05.2026", size: "43 КБ", status: "draft" },
];

const TASKS: Task[] = [
  { id: 1, title: "Подготовить ходатайство об отсрочке", case: "Корпоративный спор", deadline: "03.06.2026", priority: "high", done: false, category: "Процессуальные" },
  { id: 2, title: "Запросить выписку из ЕГРЮЛ", case: "Сопровождение M&A", deadline: "04.06.2026", priority: "high", done: false, category: "Документы" },
  { id: 3, title: "Провести переговоры с контрагентом", case: "Взыскание задолженности", deadline: "06.06.2026", priority: "medium", done: false, category: "Переговоры" },
  { id: 4, title: "Подать документы в Роспатент", case: "Регистрация ТЗ", deadline: "10.06.2026", priority: "medium", done: true, category: "Документы" },
  { id: 5, title: "Ознакомиться с материалами дела", case: "Трудовой спор", deadline: "07.06.2026", priority: "low", done: false, category: "Анализ" },
  { id: 6, title: "Составить проект мирового соглашения", case: "Взыскание задолженности", deadline: "12.06.2026", priority: "medium", done: false, category: "Переговоры" },
];

const EVENTS: CalEvent[] = [
  { id: 1, title: "Предварительное заседание", type: "court", date: "05.06.2026", time: "10:00", client: "ООО «Альфа Строй»", location: "Арбитражный суд, зал 12" },
  { id: 2, title: "Встреча с клиентом", type: "meeting", date: "04.06.2026", time: "14:30", client: "АО «ТехноПром»", location: "Офис клиента" },
  { id: 3, title: "Дедлайн: ходатайство", type: "deadline", date: "03.06.2026", time: "18:00", client: "ООО «Альфа Строй»" },
  { id: 4, title: "Телефонная консультация", type: "call", date: "06.06.2026", time: "11:00", client: "Петров А.Н." },
  { id: 5, title: "Основное заседание суда", type: "court", date: "15.06.2026", time: "09:30", client: "АО «ТехноПром»", location: "Пресненский суд, зал 5" },
];

const NOTIFICATIONS: Notification[] = [
  { id: 1, text: "Через 3 дня заседание по делу «Альфа Строй»", type: "urgent", time: "Сейчас" },
  { id: 2, text: "Дедлайн по ходатайству — завтра в 18:00", type: "urgent", time: "1ч назад" },
  { id: 3, text: "Петров А.Н. ожидает ответа по делу", type: "warning", time: "3ч назад" },
  { id: 4, text: "Документ «Due Diligence» отправлен на проверку", type: "info", time: "Вчера" },
];

// ───────── Helper Components ─────────
const StatusBadge = ({ status }: { status: string }) => {
  const map: Record<string, { label: string; cls: string }> = {
    urgent: { label: "Срочно", cls: "badge-urgent" },
    active: { label: "Активно", cls: "badge-active" },
    pending: { label: "Ожидание", cls: "badge-pending" },
    closed: { label: "Закрыто", cls: "bg-muted text-muted-foreground border border-border" },
    new: { label: "Новый", cls: "badge-info" },
    final: { label: "Финал", cls: "badge-active" },
    draft: { label: "Черновик", cls: "badge-pending" },
    review: { label: "На проверке", cls: "badge-info" },
  };
  const s = map[status] || { label: status, cls: "badge-info" };
  return <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${s.cls}`}>{s.label}</span>;
};

const PriorityDot = ({ priority }: { priority: string }) => {
  const colors: Record<string, string> = {
    high: "bg-red-500", medium: "bg-yellow-400", low: "bg-green-500"
  };
  return <span className={`inline-block w-2 h-2 rounded-full ${colors[priority] || "bg-gray-400"} animate-pulse-dot`} />;
};

// ───────── Section: Dashboard ─────────
const Dashboard = ({ onSection }: { onSection: (s: Section) => void }) => {
  const urgentTasks = TASKS.filter(t => !t.done && t.priority === "high").length;
  const activeCases = CASES.filter(c => c.status === "active" || c.status === "urgent").length;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse-dot" />
          <span className="text-sm font-semibold text-red-400">Важные уведомления</span>
        </div>
        <div className="space-y-2">
          {NOTIFICATIONS.filter(n => n.type === "urgent").map(n => (
            <div key={n.id} className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-foreground/80">
                <Icon name="AlertCircle" size={14} className="text-red-400 shrink-0" />
                {n.text}
              </div>
              <span className="text-xs text-muted-foreground ml-4 shrink-0">{n.time}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Активных дел", value: activeCases, icon: "Briefcase", color: "text-electric", bg: "bg-electric/10", onClick: () => onSection("cases") },
          { label: "Клиентов", value: CLIENTS.length, icon: "Users", color: "text-green-400", bg: "bg-green-400/10", onClick: () => onSection("clients") },
          { label: "Срочных задач", value: urgentTasks, icon: "AlertTriangle", color: "text-yellow-400", bg: "bg-yellow-400/10", onClick: () => onSection("tasks") },
          { label: "Событий на неделе", value: EVENTS.length, icon: "Calendar", color: "text-purple-400", bg: "bg-purple-400/10", onClick: () => onSection("calendar") },
        ].map((s, i) => (
          <button
            key={i}
            onClick={s.onClick}
            className="text-left p-4 rounded-xl border border-border surface hover-scale cursor-pointer"
          >
            <div className={`w-10 h-10 rounded-lg ${s.bg} flex items-center justify-center mb-3`}>
              <Icon name={s.icon as IconName} size={20} className={s.color} />
            </div>
            <div className="text-2xl font-bold text-foreground">{s.value}</div>
            <div className="text-sm text-muted-foreground mt-0.5">{s.label}</div>
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="rounded-xl border border-border surface p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground">Ближайшие события</h3>
            <button onClick={() => onSection("calendar")} className="text-xs text-electric hover:underline">Все →</button>
          </div>
          <div className="space-y-3">
            {EVENTS.slice(0, 4).map(ev => {
              const iconMap: Record<string, string> = { court: "Gavel", meeting: "Users", deadline: "Clock", call: "Phone" };
              const colorMap: Record<string, string> = { court: "text-red-400", meeting: "text-blue-400", deadline: "text-yellow-400", call: "text-green-400" };
              return (
                <div key={ev.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-surface-2 transition-colors">
                  <div className="w-8 h-8 rounded-lg bg-surface-2 flex items-center justify-center shrink-0">
                    <Icon name={iconMap[ev.type] as IconName} size={14} className={colorMap[ev.type]} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-foreground truncate">{ev.title}</div>
                    <div className="text-xs text-muted-foreground">{ev.client}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-xs font-medium text-electric">{ev.date}</div>
                    <div className="text-xs text-muted-foreground">{ev.time}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-xl border border-border surface p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground">Срочные задачи</h3>
            <button onClick={() => onSection("tasks")} className="text-xs text-electric hover:underline">Все →</button>
          </div>
          <div className="space-y-3">
            {TASKS.filter(t => !t.done).slice(0, 5).map(task => (
              <div key={task.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-surface-2 transition-colors">
                <PriorityDot priority={task.priority} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-foreground truncate">{task.title}</div>
                  <div className="text-xs text-muted-foreground">{task.case}</div>
                </div>
                <div className="text-xs font-medium text-yellow-400 shrink-0">{task.deadline}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// ───────── Section: Cases ─────────
const CasesSection = () => {
  const [filter, setFilter] = useState("all");
  const filters = [
    { key: "all", label: "Все" },
    { key: "urgent", label: "Срочные" },
    { key: "active", label: "Активные" },
    { key: "pending", label: "Ожидание" },
    { key: "closed", label: "Закрытые" },
  ];
  const filtered = filter === "all" ? CASES : CASES.filter(c => c.status === filter);

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">Юридические дела</h2>
          <p className="text-sm text-muted-foreground">{CASES.length} дел в работе</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-electric text-background rounded-lg text-sm font-medium hover:opacity-90 transition-opacity">
          <Icon name="Plus" size={16} />
          Новое дело
        </button>
      </div>
      <div className="flex gap-2 flex-wrap">
        {filters.map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${filter === f.key ? "bg-electric text-background" : "bg-surface-2 text-muted-foreground hover:text-foreground"}`}
          >
            {f.label}
          </button>
        ))}
      </div>
      <div className="space-y-3">
        {filtered.map(c => (
          <div key={c.id} className="p-4 rounded-xl border border-border surface hover:border-electric/30 hover-scale cursor-pointer transition-colors">
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="flex items-center gap-2 min-w-0">
                <PriorityDot priority={c.priority} />
                <h3 className="font-semibold text-foreground truncate">{c.title}</h3>
              </div>
              <StatusBadge status={c.status} />
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mt-3">
              <div>
                <div className="text-xs text-muted-foreground mb-0.5">Клиент</div>
                <div className="text-sm text-foreground font-medium">{c.client}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-0.5">Категория</div>
                <div className="text-sm text-foreground">{c.category}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-0.5">Дедлайн</div>
                <div className={`text-sm font-medium ${c.status === "urgent" ? "text-red-400" : "text-foreground"}`}>{c.deadline}</div>
              </div>
              {c.court && (
                <div>
                  <div className="text-xs text-muted-foreground mb-0.5">Суд</div>
                  <div className="text-sm text-foreground truncate">{c.court}</div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ───────── Section: Clients ─────────
const ClientsSection = () => {
  const [search, setSearch] = useState("");
  const filtered = CLIENTS.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.type.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">Справочник клиентов</h2>
          <p className="text-sm text-muted-foreground">{CLIENTS.length} клиентов</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-electric text-background rounded-lg text-sm font-medium hover:opacity-90 transition-opacity">
          <Icon name="UserPlus" size={16} />
          Добавить
        </button>
      </div>
      <div className="relative">
        <Icon name="Search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Поиск по имени или типу..."
          className="w-full pl-9 pr-4 py-2.5 bg-surface-2 border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-electric transition-colors"
        />
      </div>
      <div className="space-y-3">
        {filtered.map(client => (
          <div key={client.id} className="p-4 rounded-xl border border-border surface hover:border-electric/30 hover-scale cursor-pointer transition-colors">
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-electric/10 flex items-center justify-center shrink-0">
                <span className="text-electric font-bold text-lg">{client.name[0]}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-foreground truncate">{client.name}</h3>
                  <StatusBadge status={client.status} />
                </div>
                <div className="text-sm text-muted-foreground">{client.type}</div>
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
const DocumentsSection = () => {
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
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${filter === f ? "bg-electric text-background" : "bg-surface-2 text-muted-foreground hover:text-foreground"}`}
          >
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
const TasksSection = () => {
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
        <div
          className="h-full bg-electric rounded-full transition-all duration-500"
          style={{ width: `${(done / tasks.length) * 100}%` }}
        />
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

// ───────── Section: Calendar ─────────
const CalendarSection = () => {
  const evTypeLabel: Record<string, string> = {
    court: "Заседание", meeting: "Встреча", deadline: "Дедлайн", call: "Звонок"
  };
  const evTypeColor: Record<string, string> = {
    court: "border-l-red-500 bg-red-500/5",
    meeting: "border-l-blue-500 bg-blue-500/5",
    deadline: "border-l-yellow-500 bg-yellow-500/5",
    call: "border-l-green-500 bg-green-500/5",
  };
  const evIcon: Record<string, string> = {
    court: "Gavel", meeting: "Users", deadline: "Clock", call: "Phone"
  };
  const evIconColor: Record<string, string> = {
    court: "text-red-400", meeting: "text-blue-400", deadline: "text-yellow-400", call: "text-green-400"
  };
  const evBadgeCls: Record<string, string> = {
    court: "badge-urgent", meeting: "badge-info", deadline: "badge-pending", call: "badge-active"
  };

  const days = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
  const eventDays = [3, 4, 5, 6];

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">Календарь</h2>
          <p className="text-sm text-muted-foreground">Июнь 2026</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-electric text-background rounded-lg text-sm font-medium hover:opacity-90 transition-opacity">
          <Icon name="Plus" size={16} />
          Событие
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((d, i) => (
          <div key={i} className="text-center">
            <div className="text-xs text-muted-foreground mb-1">{d}</div>
            <div className={`w-9 h-9 mx-auto rounded-xl flex items-center justify-center text-sm font-semibold cursor-pointer transition-all
              ${i + 2 === 2 ? "bg-electric text-background glow-electric-sm" :
              eventDays.includes(i + 2) ? "bg-electric/10 text-electric" : "hover:bg-surface-2 text-foreground"}`}>
              {i + 2}
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-4 flex-wrap">
        {Object.entries(evTypeLabel).map(([key, label]) => (
          <div key={key} className="flex items-center gap-1.5">
            <Icon name={evIcon[key] as IconName} size={12} className={evIconColor[key]} />
            <span className="text-xs text-muted-foreground">{label}</span>
          </div>
        ))}
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Предстоящие события</h3>
        {EVENTS.map(ev => (
          <div key={ev.id} className={`p-4 rounded-xl border-l-4 border border-border hover-scale cursor-pointer transition-all ${evTypeColor[ev.type]}`}>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-surface-2 flex items-center justify-center shrink-0 mt-0.5">
                <Icon name={evIcon[ev.type] as IconName} size={16} className={evIconColor[ev.type]} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h4 className="font-semibold text-foreground">{ev.title}</h4>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${evBadgeCls[ev.type]}`}>
                    {evTypeLabel[ev.type]}
                  </span>
                </div>
                <div className="text-sm text-muted-foreground">{ev.client}</div>
                {ev.location && (
                  <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    <Icon name="MapPin" size={11} />
                    {ev.location}
                  </div>
                )}
              </div>
              <div className="text-right shrink-0">
                <div className="text-sm font-bold text-foreground">{ev.date}</div>
                <div className="text-xs text-electric">{ev.time}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ───────── Main App ─────────
export default function Index() {
  const [section, setSection] = useState<Section>("dashboard");
  const [notifOpen, setNotifOpen] = useState(false);

  const navItems = [
    { key: "dashboard" as Section, icon: "LayoutDashboard", label: "Дашборд" },
    { key: "cases" as Section, icon: "Briefcase", label: "Дела" },
    { key: "clients" as Section, icon: "Users", label: "Клиенты" },
    { key: "documents" as Section, icon: "FolderOpen", label: "Документы" },
    { key: "tasks" as Section, icon: "CheckSquare", label: "Задачи" },
    { key: "calendar" as Section, icon: "Calendar", label: "Календарь" },
  ];

  const urgentCount = NOTIFICATIONS.filter(n => n.type === "urgent").length;

  const renderSection = () => {
    switch (section) {
      case "dashboard": return <Dashboard onSection={setSection} />;
      case "cases": return <CasesSection />;
      case "clients": return <ClientsSection />;
      case "documents": return <DocumentsSection />;
      case "tasks": return <TasksSection />;
      case "calendar": return <CalendarSection />;
    }
  };

  return (
    <div className="min-h-screen bg-background grid-pattern flex">
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-60 border-r border-border glass fixed top-0 left-0 h-full z-40">
        <div className="p-5 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-electric flex items-center justify-center glow-electric-sm">
              <Icon name="Scale" size={18} className="text-background" />
            </div>
            <div>
              <div className="font-bold text-foreground leading-none">LexOffice</div>
              <div className="text-xs text-muted-foreground">Юридическая практика</div>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto scrollbar-thin">
          {navItems.map(item => (
            <button
              key={item.key}
              onClick={() => setSection(item.key)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${section === item.key ? "nav-item-active" : "text-muted-foreground hover:text-foreground hover:bg-surface-2"}`}
            >
              <Icon name={item.icon as IconName} size={18} />
              {item.label}
              {item.key === "tasks" && (
                <span className="ml-auto text-xs bg-yellow-400/15 text-yellow-400 px-1.5 py-0.5 rounded-md">
                  {TASKS.filter(t => !t.done && t.priority === "high").length}
                </span>
              )}
              {item.key === "calendar" && (
                <span className="ml-auto text-xs bg-electric/15 text-electric px-1.5 py-0.5 rounded-md">
                  {EVENTS.filter(e => e.type === "court").length}
                </span>
              )}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-surface-2 flex items-center justify-center">
              <span className="text-electric font-bold">А</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-foreground">Алексей Правдин</div>
              <div className="text-xs text-muted-foreground truncate">Адвокат</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 md:ml-60 flex flex-col min-h-screen">
        {/* Header */}
        <header className="sticky top-0 z-30 glass border-b border-border px-4 md:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="md:hidden w-8 h-8 rounded-xl bg-electric flex items-center justify-center">
              <Icon name="Scale" size={16} className="text-background" />
            </div>
            <h1 className="text-base font-semibold text-foreground">
              {navItems.find(n => n.key === section)?.label}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-xs font-mono text-muted-foreground hidden md:block">2 июня 2026</div>
            <div className="w-px h-4 bg-border hidden md:block" />
            <div className="relative">
              <button
                onClick={() => setNotifOpen(!notifOpen)}
                className="relative p-2 rounded-xl bg-surface-2 hover:bg-surface-3 transition-colors"
              >
                <Icon name="Bell" size={16} className="text-muted-foreground" />
                {urgentCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full text-[10px] text-white font-bold flex items-center justify-center">
                    {urgentCount}
                  </span>
                )}
              </button>

              {notifOpen && (
                <div className="absolute right-0 top-11 z-50 w-80 rounded-xl border border-border glass shadow-2xl animate-fade-in overflow-hidden">
                  <div className="p-3 border-b border-border flex items-center justify-between">
                    <span className="text-sm font-semibold text-foreground">Уведомления</span>
                    <button onClick={() => setNotifOpen(false)} className="text-muted-foreground hover:text-foreground">
                      <Icon name="X" size={14} />
                    </button>
                  </div>
                  <div className="max-h-72 overflow-y-auto scrollbar-thin">
                    {NOTIFICATIONS.map(n => (
                      <div key={n.id} className="p-3 border-b border-border/50 hover:bg-surface-2 transition-colors">
                        <div className="flex items-start gap-2">
                          <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${n.type === "urgent" ? "bg-red-500" : n.type === "warning" ? "bg-yellow-400" : "bg-electric"}`} />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm text-foreground">{n.text}</div>
                            <div className="text-xs text-muted-foreground mt-0.5">{n.time}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <button className="p-2 rounded-xl bg-surface-2 hover:bg-surface-3 transition-colors">
              <Icon name="Search" size={16} className="text-muted-foreground" />
            </button>
          </div>
        </header>

        {/* Mobile nav */}
        <nav className="md:hidden flex items-center gap-1 px-3 py-2 border-b border-border bg-surface-2 overflow-x-auto scrollbar-thin">
          {navItems.map(item => (
            <button
              key={item.key}
              onClick={() => setSection(item.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${section === item.key ? "bg-electric text-background" : "text-muted-foreground hover:text-foreground"}`}
            >
              <Icon name={item.icon as IconName} size={14} />
              {item.label}
            </button>
          ))}
        </nav>

        {/* Content */}
        <main className="flex-1 p-4 md:p-6 max-w-5xl w-full mx-auto">
          {renderSection()}
        </main>
      </div>
    </div>
  );
}