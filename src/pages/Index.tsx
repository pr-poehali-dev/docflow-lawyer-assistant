import { useState } from "react";
import Icon from "@/components/ui/icon";

type IconName = Parameters<typeof Icon>[0]["name"];

// ───────── Types ─────────
type Section = "dashboard" | "cases" | "clients" | "documents" | "tasks" | "calendar" | "reviewed" | "payments" | "users";

interface SystemUser {
  id: number; name: string; email: string; role: "admin" | "lawyer" | "assistant" | "readonly";
  status: "active" | "inactive" | "blocked"; lastLogin: string; cases: number; avatar: string;
}

interface Client {
  id: number; name: string; phone: string; email: string; type: string;
  cases: number; lastContact: string; status: "active" | "new" | "closed";
}
interface Case {
  id: number; title: string; client: string; category: string;
  status: "active" | "pending" | "closed" | "urgent"; deadline: string; court?: string; priority: "high" | "medium" | "low";
  // Истец
  fullName: string; birthDate: string; address: string;
  passportSeries: string; passportNumber: string; passportIssued: string; passportDate: string;
  vehicle: string; vehiclePlate: string;
  policyNumber: string; insuranceCompany: string;
  // Водитель ТС клиента
  driverFullName: string; driverBirthDate: string; driverAddress: string; driverInsuranceCompany: string;
  // Виновник ДТП
  guiltFullName: string; guiltBirthDate: string; guiltAddress: string;
  guiltOwnerName: string; guiltOwnerAddress: string;
  guiltVehicle: string; guiltVehiclePlate: string; guiltInsuranceCompany: string;
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
interface ReviewedCase {
  id: number; title: string; client: string; category: string;
  closedDate: string; result: "won" | "lost" | "settled" | "withdrawn";
  court?: string; duration: string; amount?: string;
}
interface Payment {
  id: number; client: string; case: string; amount: number;
  date: string; status: "paid" | "pending" | "overdue" | "partial";
  type: "retainer" | "hourly" | "success_fee" | "consultation";
  comment?: string;
}

// ───────── Mock Data ─────────
const CLIENTS: Client[] = [
  { id: 1, name: "ООО «Альфа Строй»", phone: "+7 495 123-45-67", email: "info@alfa-stroy.ru", type: "Юридическое лицо", cases: 3, lastContact: "01.06.2026", status: "active" },
  { id: 2, name: "Петров Андрей Николаевич", phone: "+7 916 234-56-78", email: "petrov@mail.ru", type: "Физическое лицо", cases: 1, lastContact: "28.05.2026", status: "active" },
  { id: 3, name: "ИП Сидорова Мария", phone: "+7 903 345-67-89", email: "sidorova@biz.ru", type: "ИП", cases: 2, lastContact: "25.05.2026", status: "new" },
  { id: 4, name: "АО «ТехноПром»", phone: "+7 495 456-78-90", email: "legal@technoprom.ru", type: "Юридическое лицо", cases: 5, lastContact: "20.05.2026", status: "active" },
  { id: 5, name: "Козлов Виктор Павлович", phone: "+7 926 567-89-01", email: "kozlov@gmail.com", type: "Физическое лицо", cases: 1, lastContact: "15.05.2026", status: "closed" },
];

const CASES: Case[] = [];

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

const REVIEWED_CASES: ReviewedCase[] = [
  { id: 1, title: "Признание сделки недействительной", client: "Козлов Виктор Павлович", category: "Гражданское право", closedDate: "15.04.2026", result: "won", court: "Тверской районный суд", duration: "8 мес.", amount: "2 400 000 ₽" },
  { id: 2, title: "Взыскание неустойки по договору подряда", client: "ООО «Альфа Строй»", category: "Корпоративное право", closedDate: "02.03.2026", result: "settled", court: "Арбитражный суд г. Москвы", duration: "5 мес.", amount: "850 000 ₽" },
  { id: 3, title: "Оспаривание штрафа налоговой", client: "АО «ТехноПром»", category: "Налоговое право", closedDate: "20.01.2026", result: "won", court: "9-й ААС", duration: "3 мес.", amount: "1 100 000 ₽" },
  { id: 4, title: "Раздел имущества супругов", client: "Петров Андрей Николаевич", category: "Семейное право", closedDate: "10.12.2025", result: "lost", court: "Хамовнический суд", duration: "11 мес." },
  { id: 5, title: "Защита деловой репутации", client: "ИП Сидорова Мария", category: "Гражданское право", closedDate: "05.11.2025", result: "withdrawn", court: "Мещанский суд", duration: "2 мес." },
];

const PAYMENTS: Payment[] = [
  { id: 1, client: "АО «ТехноПром»", case: "Сопровождение M&A сделки", amount: 350000, date: "01.06.2026", status: "paid", type: "retainer", comment: "Аванс по договору" },
  { id: 2, client: "ООО «Альфа Строй»", case: "Корпоративный спор", amount: 120000, date: "28.05.2026", status: "overdue", type: "hourly", comment: "За май 2026" },
  { id: 3, client: "ИП Сидорова Мария", case: "Регистрация товарного знака", amount: 45000, date: "25.05.2026", status: "paid", type: "consultation" },
  { id: 4, client: "Петров Андрей Николаевич", case: "Трудовой спор", amount: 80000, date: "20.06.2026", status: "pending", type: "retainer", comment: "2-й транш" },
  { id: 5, client: "АО «ТехноПром»", case: "Взыскание задолженности", amount: 200000, date: "15.06.2026", status: "partial", type: "success_fee", comment: "Оплачено 100 000 ₽" },
  { id: 6, client: "Козлов Виктор Павлович", case: "Признание сделки", amount: 180000, date: "20.04.2026", status: "paid", type: "success_fee", comment: "Гонорар успеха" },
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

// ───────── New Case Form ─────────
const emptyForm = {
  clientId: "" as string,
  fullName: "", birthDate: "", address: "",
  passportSeries: "", passportNumber: "", passportIssued: "", passportDate: "",
  vehicle: "", vehiclePlate: "",
  policyNumber: "", insuranceCompany: "",
  court: "", deadline: "", priority: "medium" as "high" | "medium" | "low",
  // Водитель ТС клиента
  driverFullName: "", driverBirthDate: "", driverAddress: "", driverInsuranceCompany: "",
  // Виновник
  guiltFullName: "", guiltBirthDate: "", guiltAddress: "",
  guiltOwnerName: "", guiltOwnerAddress: "",
  guiltVehicle: "", guiltVehiclePlate: "", guiltInsuranceCompany: "",
};

const inputCls = "w-full px-3 py-2.5 bg-surface-2 border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-electric transition-colors";

const NewCaseModal = ({ onClose, onSave }: { onClose: () => void; onSave: (c: Case) => void }) => {
  const [form, setForm] = useState(emptyForm);
  const [step, setStep] = useState(0);
  const [clientSearch, setClientSearch] = useState("");

  const set = (k: keyof typeof emptyForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const filteredClients = CLIENTS.filter(c =>
    c.name.toLowerCase().includes(clientSearch.toLowerCase()) && c.status !== "closed"
  );

  const selectClient = (client: Client) => {
    setForm(f => ({ ...f, clientId: String(client.id), fullName: f.fullName || client.name }));
    setClientSearch(client.name);
  };

  const selectedClient = CLIENTS.find(c => String(c.id) === form.clientId);

  const steps = [
    {
      title: "Клиент",
      icon: "Users",
      fields: (
        <div className="space-y-4">
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">Выбрать из справочника</label>
            <div className="relative">
              <Icon name="Search" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                value={clientSearch}
                onChange={e => { setClientSearch(e.target.value); setForm(f => ({ ...f, clientId: "" })); }}
                placeholder="Поиск клиента..."
                className={`${inputCls} pl-8`}
              />
            </div>
            {clientSearch && !form.clientId && (
              <div className="mt-1 border border-border rounded-xl overflow-hidden bg-surface-2">
                {filteredClients.length === 0
                  ? <div className="p-3 text-sm text-muted-foreground">Клиент не найден</div>
                  : filteredClients.map(c => (
                    <button key={c.id} onClick={() => selectClient(c)}
                      className="w-full flex items-center gap-3 p-3 hover:bg-surface-3 transition-colors text-left border-b border-border/50 last:border-0">
                      <div className="w-8 h-8 rounded-lg bg-electric/10 flex items-center justify-center shrink-0">
                        <span className="text-electric font-bold text-sm">{c.name[0]}</span>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-foreground">{c.name}</div>
                        <div className="text-xs text-muted-foreground">{c.type} · {c.phone}</div>
                      </div>
                    </button>
                  ))
                }
              </div>
            )}
            {selectedClient && (
              <div className="mt-2 flex items-center gap-3 p-3 rounded-xl border border-electric/30 bg-electric/5">
                <div className="w-9 h-9 rounded-xl bg-electric/10 flex items-center justify-center shrink-0">
                  <span className="text-electric font-bold">{selectedClient.name[0]}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-foreground">{selectedClient.name}</div>
                  <div className="text-xs text-muted-foreground">{selectedClient.phone} · {selectedClient.email}</div>
                </div>
                <button onClick={() => { setForm(f => ({ ...f, clientId: "" })); setClientSearch(""); }}
                  className="text-muted-foreground hover:text-foreground">
                  <Icon name="X" size={14} />
                </button>
              </div>
            )}
          </div>
          <div className="border-t border-border pt-4">
            <label className="text-xs text-muted-foreground mb-1.5 block">ФИО клиента <span className="text-red-400">*</span></label>
            <input value={form.fullName} onChange={set("fullName")} placeholder="Иванов Иван Иванович" className={inputCls} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">Дата рождения</label>
            <input type="date" value={form.birthDate} onChange={set("birthDate")} className={inputCls} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">Адрес проживания</label>
            <input value={form.address} onChange={set("address")} placeholder="г. Москва, ул. Ленина, д. 1, кв. 1" className={inputCls} />
          </div>
        </div>
      ),
    },
    {
      title: "Паспорт",
      icon: "CreditCard",
      fields: (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Серия</label>
              <input value={form.passportSeries} onChange={set("passportSeries")} placeholder="1234" className={inputCls} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Номер</label>
              <input value={form.passportNumber} onChange={set("passportNumber")} placeholder="567890" className={inputCls} />
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">Кем выдан</label>
            <input value={form.passportIssued} onChange={set("passportIssued")} placeholder="УМВД России по г. Москве" className={inputCls} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">Дата выдачи</label>
            <input type="date" value={form.passportDate} onChange={set("passportDate")} className={inputCls} />
          </div>
        </div>
      ),
    },
    {
      title: "Виновник ДТП",
      icon: "AlertTriangle",
      fields: (
        <div className="space-y-4">
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">ФИО виновника</label>
            <input value={form.guiltFullName} onChange={set("guiltFullName")} placeholder="Петров Пётр Петрович" className={inputCls} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">Дата рождения</label>
            <input type="date" value={form.guiltBirthDate} onChange={set("guiltBirthDate")} className={inputCls} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">Адрес проживания</label>
            <input value={form.guiltAddress} onChange={set("guiltAddress")} placeholder="г. Москва, ул. Примерная, д. 5" className={inputCls} />
          </div>
          <div className="border-t border-border pt-4">
            <label className="text-xs text-muted-foreground mb-1.5 block">Собственник ТС (если отличается от виновника)</label>
            <input value={form.guiltOwnerName} onChange={set("guiltOwnerName")} placeholder="ФИО или наименование организации" className={inputCls} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">Адрес собственника ТС</label>
            <input value={form.guiltOwnerAddress} onChange={set("guiltOwnerAddress")} placeholder="г. Москва, ул. Примерная, д. 5" className={inputCls} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">ТС виновника (марка, модель)</label>
            <input value={form.guiltVehicle} onChange={set("guiltVehicle")} placeholder="Hyundai Solaris 2020" className={inputCls} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">Гос. номер ТС виновника</label>
            <input value={form.guiltVehiclePlate} onChange={set("guiltVehiclePlate")} placeholder="Б 456 ВГ 77" className={inputCls} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">Страховая компания виновника</label>
            <input value={form.guiltInsuranceCompany} onChange={set("guiltInsuranceCompany")} placeholder="Альфастрахование, РЕСО..." className={inputCls} />
          </div>
        </div>
      ),
    },
    {
      title: "Водитель ТС",
      icon: "UserCheck",
      fields: (
        <div className="space-y-4">
          <p className="text-xs text-muted-foreground bg-surface-2 rounded-xl px-3 py-2">
            Водитель транспортного средства клиента — если отличается от собственника (истца)
          </p>
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">ФИО водителя</label>
            <input value={form.driverFullName} onChange={set("driverFullName")} placeholder="Иванов Иван Иванович" className={inputCls} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">Дата рождения</label>
            <input type="date" value={form.driverBirthDate} onChange={set("driverBirthDate")} className={inputCls} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">Место проживания</label>
            <input value={form.driverAddress} onChange={set("driverAddress")} placeholder="г. Москва, ул. Ленина, д. 1, кв. 1" className={inputCls} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">Страховая компания</label>
            <input value={form.driverInsuranceCompany} onChange={set("driverInsuranceCompany")} placeholder="СОГАЗ, Росгосстрах..." className={inputCls} />
          </div>
        </div>
      ),
    },
    {
      title: "ТС и полис",
      icon: "Car",
      fields: (
        <div className="space-y-4">
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">Марка и модель ТС</label>
            <input value={form.vehicle} onChange={set("vehicle")} placeholder="Toyota Camry 2022" className={inputCls} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">Государственный номер</label>
            <input value={form.vehiclePlate} onChange={set("vehiclePlate")} placeholder="А 123 БВ 77" className={inputCls} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">Номер полиса</label>
            <input value={form.policyNumber} onChange={set("policyNumber")} placeholder="ААА 1234567890" className={inputCls} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">Страховая компания</label>
            <input value={form.insuranceCompany} onChange={set("insuranceCompany")} placeholder="СОГАЗ, Росгосстрах..." className={inputCls} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">Суд</label>
            <input value={form.court} onChange={set("court")} placeholder="Арбитражный суд г. Москвы" className={inputCls} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Дедлайн</label>
              <input type="date" value={form.deadline} onChange={set("deadline")} className={inputCls} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Приоритет</label>
              <select value={form.priority} onChange={set("priority")} className={inputCls}>
                <option value="high">Высокий</option>
                <option value="medium">Средний</option>
                <option value="low">Низкий</option>
              </select>
            </div>
          </div>
        </div>
      ),
    },
  ];

  const isLast = step === steps.length - 1;
  const canSubmit = form.fullName.trim().length > 0;

  const handleSave = () => {
    if (!canSubmit) return;
    const dl = form.deadline ? new Date(form.deadline).toLocaleDateString("ru-RU") : "—";
    onSave({
      id: Date.now(), title: form.fullName, client: form.fullName,
      category: "Страховые споры", status: "active", deadline: dl,
      court: form.court || undefined, priority: form.priority,
      fullName: form.fullName, birthDate: form.birthDate, address: form.address,
      passportSeries: form.passportSeries, passportNumber: form.passportNumber,
      passportIssued: form.passportIssued, passportDate: form.passportDate,
      vehicle: form.vehicle, vehiclePlate: form.vehiclePlate,
      policyNumber: form.policyNumber, insuranceCompany: form.insuranceCompany,
      driverFullName: form.driverFullName, driverBirthDate: form.driverBirthDate,
      driverAddress: form.driverAddress, driverInsuranceCompany: form.driverInsuranceCompany,
      guiltFullName: form.guiltFullName, guiltBirthDate: form.guiltBirthDate, guiltAddress: form.guiltAddress,
      guiltOwnerName: form.guiltOwnerName, guiltOwnerAddress: form.guiltOwnerAddress,
      guiltVehicle: form.guiltVehicle, guiltVehiclePlate: form.guiltVehiclePlate,
      guiltInsuranceCompany: form.guiltInsuranceCompany,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-surface border border-border rounded-2xl shadow-2xl animate-scale-in overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div>
            <h3 className="font-bold text-foreground text-lg">Новое дело</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Шаг {step + 1} из {steps.length} — {steps[step].title}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-surface-2 transition-colors text-muted-foreground hover:text-foreground">
            <Icon name="X" size={18} />
          </button>
        </div>

        {/* Step tabs */}
        <div className="flex border-b border-border">
          {steps.map((s, i) => (
            <button
              key={i}
              onClick={() => setStep(i)}
              className={`flex-1 flex flex-col items-center gap-1 py-3 text-xs font-medium transition-all border-b-2 ${
                i === step ? "border-electric text-electric" :
                i < step ? "border-green-500/50 text-green-400" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon name={(i < step ? "CheckCircle2" : s.icon) as IconName} size={16} />
              <span className="hidden sm:block">{s.title}</span>
            </button>
          ))}
        </div>

        {/* Fields */}
        <div className="p-5 animate-fade-in">
          {steps[step].fields}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-5 border-t border-border">
          <button
            onClick={() => step > 0 ? setStep(s => s - 1) : onClose()}
            className="flex items-center gap-2 px-4 py-2 bg-surface-2 text-muted-foreground rounded-xl text-sm font-medium hover:text-foreground transition-colors"
          >
            <Icon name="ChevronLeft" size={16} />
            {step === 0 ? "Отмена" : "Назад"}
          </button>
          <div className="flex gap-2">
            {!isLast && (
              <button
                onClick={() => setStep(s => s + 1)}
                className="flex items-center gap-2 px-4 py-2 bg-electric text-background rounded-xl text-sm font-medium hover:opacity-90 transition-opacity"
              >
                Далее
                <Icon name="ChevronRight" size={16} />
              </button>
            )}
            {isLast && (
              <button
                onClick={handleSave}
                disabled={!canSubmit}
                className="flex items-center gap-2 px-5 py-2 bg-electric text-background rounded-xl text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Icon name="Save" size={16} />
                Сохранить дело
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ───────── Statement generator ─────────
const generateStatement = (c: Case): string => {
  const today = new Date().toLocaleDateString("ru-RU");
  const bd = c.birthDate ? new Date(c.birthDate).toLocaleDateString("ru-RU") : "________";
  const gbd = c.guiltBirthDate ? new Date(c.guiltBirthDate).toLocaleDateString("ru-RU") : "________";
  const pd = c.passportDate ? new Date(c.passportDate).toLocaleDateString("ru-RU") : "________";
  const court = c.court || "________________";
  const passport = [c.passportSeries, c.passportNumber].filter(Boolean).join(" ") || "________";
  const owner = c.guiltOwnerName || c.guiltFullName || "________________";
  const ownerAddr = c.guiltOwnerAddress || c.guiltAddress || "________________";

  const driverBd = c.driverBirthDate ? new Date(c.driverBirthDate).toLocaleDateString("ru-RU") : "________";
  const driverBlock = c.driverFullName
    ? `\nВодитель транспортного средства истца: ${c.driverFullName}, дата рождения: ${driverBd} г.,\nадрес: ${c.driverAddress || "________________"}, страховая компания: ${c.driverInsuranceCompany || "________________"}.\n`
    : "";

  return `В ${court}

Истец: ${c.fullName || "________________"},
дата рождения: ${bd} г.,
адрес: ${c.address || "________________"},
паспорт: серия ${passport}, выдан ${c.passportIssued || "________________"} ${pd} г.
${driverBlock}
Ответчик: ${c.guiltInsuranceCompany || "________________"}

ИСКОВОЕ ЗАЯВЛЕНИЕ
о взыскании страхового возмещения

Я, ${c.fullName || "________________"}, являюсь собственником транспортного средства: ${c.vehicle || "________________"}, государственный регистрационный знак ${c.vehiclePlate || "________________"}.

Транспортное средство застраховано по полису ОСАГО № ${c.policyNumber || "________________"}, страховая компания: ${c.insuranceCompany || "________________"}.

В результате дорожно-транспортного происшествия виновником которого является:
— ${c.guiltFullName || "________________"}, дата рождения: ${gbd} г.,
  адрес проживания: ${c.guiltAddress || "________________"};
— транспортное средство виновника: ${c.guiltVehicle || "________________"},
  государственный регистрационный знак: ${c.guiltVehiclePlate || "________________"};
— собственник транспортного средства: ${owner},
  адрес: ${ownerAddr};
— страховая компания виновника: ${c.guiltInsuranceCompany || "________________"}.

Мне был причинён имущественный ущерб. Страховая компания ответчика отказывается возмещать ущерб в добровольном порядке либо произвела выплату не в полном объёме.

На основании изложенного, руководствуясь ст. 12, 16.1 Федерального закона «Об обязательном страховании гражданской ответственности владельцев транспортных средств»,

ПРОШУ:

1. Взыскать с ${c.guiltInsuranceCompany || "ответчика"} страховое возмещение в полном объёме.
2. Взыскать с ответчика неустойку за нарушение сроков выплаты страхового возмещения.
3. Взыскать с ответчика судебные расходы и расходы на оплату услуг представителя.

Приложения:
— копия паспорта истца;
— свидетельство о регистрации ТС истца;
— страховой полис № ${c.policyNumber || "________________"};
— документы о ДТП (справка, схема, постановление);
— досудебная претензия (при наличии).

${today} г.                    ________________ / ${c.fullName || ""}`;
};

// ───────── Case Card ─────────
const CaseCard = ({ c }: { c: Case }) => {
  const [tab, setTab] = useState<"data" | "statement">("data");
  const [copied, setCopied] = useState(false);

  const fmt = (label: string, value: string) => value ? (
    <div key={label}>
      <div className="text-xs text-muted-foreground mb-0.5">{label}</div>
      <div className="text-sm text-foreground">{value}</div>
    </div>
  ) : null;

  const statement = generateStatement(c);

  const copyStatement = () => {
    navigator.clipboard.writeText(statement).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="border-t border-border animate-fade-in">
      {/* Tabs */}
      <div className="flex border-b border-border">
        {([["data", "FileText", "Данные дела"], ["statement", "ScrollText", "Заявление"]] as const).map(([key, icon, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-all ${tab === key ? "border-electric text-electric" : "border-transparent text-muted-foreground hover:text-foreground"}`}
          >
            <Icon name={icon} size={14} />
            {label}
          </button>
        ))}
      </div>

      {tab === "data" && (
        <div className="p-4 space-y-5">
          <div>
            <div className="text-xs font-semibold text-electric uppercase tracking-wider mb-3">Истец</div>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              {fmt("ФИО", c.fullName)}
              {fmt("Дата рождения", c.birthDate ? new Date(c.birthDate).toLocaleDateString("ru-RU") : "")}
              {fmt("Адрес", c.address)}
              {fmt("Паспорт серия/номер", [c.passportSeries, c.passportNumber].filter(Boolean).join(" "))}
              {fmt("Кем выдан", c.passportIssued)}
              {fmt("Дата выдачи", c.passportDate ? new Date(c.passportDate).toLocaleDateString("ru-RU") : "")}
              {fmt("Транспортное средство", c.vehicle)}
              {fmt("Гос. номер", c.vehiclePlate)}
              {fmt("Полис ОСАГО", c.policyNumber)}
              {fmt("Страховая компания истца", c.insuranceCompany)}
              {fmt("Суд", c.court || "")}
              {fmt("Дедлайн", c.deadline)}
            </div>
          </div>
          {(c.driverFullName || c.driverAddress || c.driverInsuranceCompany) && (
            <div className="border-t border-border pt-5">
              <div className="text-xs font-semibold text-yellow-400 uppercase tracking-wider mb-3">Водитель ТС клиента</div>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                {fmt("ФИО водителя", c.driverFullName)}
                {fmt("Дата рождения", c.driverBirthDate ? new Date(c.driverBirthDate).toLocaleDateString("ru-RU") : "")}
                {fmt("Место проживания", c.driverAddress)}
                {fmt("Страховая компания", c.driverInsuranceCompany)}
              </div>
            </div>
          )}
          {(c.guiltFullName || c.guiltVehicle || c.guiltInsuranceCompany) && (
            <div className="border-t border-border pt-5">
              <div className="text-xs font-semibold text-red-400 uppercase tracking-wider mb-3">Виновник ДТП</div>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                {fmt("ФИО виновника", c.guiltFullName)}
                {fmt("Дата рождения", c.guiltBirthDate ? new Date(c.guiltBirthDate).toLocaleDateString("ru-RU") : "")}
                {fmt("Адрес виновника", c.guiltAddress)}
                {fmt("Собственник ТС", c.guiltOwnerName)}
                {fmt("Адрес собственника", c.guiltOwnerAddress)}
                {fmt("ТС виновника", c.guiltVehicle)}
                {fmt("Гос. номер ТС виновника", c.guiltVehiclePlate)}
                {fmt("Страховая компания виновника", c.guiltInsuranceCompany)}
              </div>
            </div>
          )}
        </div>
      )}

      {tab === "statement" && (
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-400" />
              <span className="text-xs text-muted-foreground">Заявление сформировано автоматически по данным дела</span>
            </div>
            <button
              onClick={copyStatement}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-2 hover:bg-surface-3 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <Icon name={copied ? "Check" : "Copy"} size={13} className={copied ? "text-green-400" : ""} />
              {copied ? "Скопировано!" : "Копировать"}
            </button>
          </div>
          <div className="bg-surface-2 border border-border rounded-xl p-5 font-mono text-xs text-foreground leading-relaxed whitespace-pre-wrap scrollbar-thin overflow-auto max-h-[420px]">
            {statement}
          </div>
        </div>
      )}
    </div>
  );
};

// ───────── Section: Cases ─────────
const CasesSection = () => {
  const [cases, setCases] = useState<Case[]>(CASES);
  const [filter, setFilter] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [expanded, setExpanded] = useState<number | null>(null);

  const filters = [
    { key: "all", label: "Все" },
    { key: "active", label: "Активные" },
    { key: "urgent", label: "Срочные" },
    { key: "pending", label: "Ожидание" },
    { key: "closed", label: "Закрытые" },
  ];
  const filtered = filter === "all" ? cases : cases.filter(c => c.status === filter);

  const handleSave = (c: Case) => {
    setCases(prev => [c, ...prev]);
    setShowModal(false);
  };

  return (
    <div className="space-y-4 animate-fade-in">
      {showModal && <NewCaseModal onClose={() => setShowModal(false)} onSave={handleSave} />}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">Юридические дела</h2>
          <p className="text-sm text-muted-foreground">{cases.length} дел в работе</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-electric text-background rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
        >
          <Icon name="Plus" size={16} />
          Новое дело
        </button>
      </div>

      <div className="flex gap-2 flex-wrap">
        {filters.map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${filter === f.key ? "bg-electric text-background" : "bg-surface-2 text-muted-foreground hover:text-foreground"}`}>
            {f.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-surface-2 flex items-center justify-center mb-4">
            <Icon name="Briefcase" size={28} className="text-muted-foreground" />
          </div>
          <div className="text-foreground font-semibold mb-1">Дел пока нет</div>
          <div className="text-sm text-muted-foreground mb-4">Нажмите «Новое дело», чтобы добавить первое</div>
          <button onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-electric text-background rounded-xl text-sm font-medium hover:opacity-90 transition-opacity">
            <Icon name="Plus" size={16} />
            Новое дело
          </button>
        </div>
      )}

      <div className="space-y-3">
        {filtered.map(c => (
          <div key={c.id} className="rounded-xl border border-border surface hover:border-electric/30 transition-colors overflow-hidden">
            <button
              className="w-full flex items-center justify-between gap-3 p-4 text-left"
              onClick={() => setExpanded(expanded === c.id ? null : c.id)}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-electric/10 flex items-center justify-center shrink-0">
                  <span className="text-electric font-bold">{(c.fullName || "?")[0]}</span>
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <PriorityDot priority={c.priority} />
                    <h3 className="font-semibold text-foreground truncate">{c.fullName}</h3>
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2">
                    {c.vehicle && <span>{c.vehicle}</span>}
                    {c.insuranceCompany && <><span>·</span><span>{c.insuranceCompany}</span></>}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <StatusBadge status={c.status} />
                <Icon name={expanded === c.id ? "ChevronUp" : "ChevronDown"} size={16} className="text-muted-foreground" />
              </div>
            </button>
            {expanded === c.id && <CaseCard c={c} />}
          </div>
        ))}
      </div>
    </div>
  );
};

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

const ClientsSection = () => {
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
          <p className="text-sm text-muted-foreground">
            {filtered.length} из {CLIENTS.length} клиентов
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-electric text-background rounded-lg text-sm font-medium hover:opacity-90 transition-opacity">
          <Icon name="UserPlus" size={16} />
          Добавить
        </button>
      </div>

      {/* Search + filters */}
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
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <Icon name="X" size={14} />
            </button>
          )}
        </div>
        <div className="flex gap-2">
          {statusFilters.map(f => (
            <button
              key={f.key}
              onClick={() => setStatusFilter(f.key)}
              className={`px-3 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${statusFilter === f.key ? "bg-electric text-background" : "bg-surface-2 text-muted-foreground hover:text-foreground"}`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center animate-fade-in">
          <div className="w-14 h-14 rounded-2xl bg-surface-2 flex items-center justify-center mb-4">
            <Icon name="SearchX" size={24} className="text-muted-foreground" />
          </div>
          <div className="text-foreground font-semibold mb-1">Клиенты не найдены</div>
          <div className="text-sm text-muted-foreground">Попробуйте изменить запрос или сбросить фильтры</div>
          <button
            onClick={() => { setSearch(""); setStatusFilter("all"); }}
            className="mt-4 px-4 py-2 bg-surface-2 rounded-xl text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
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

const SYSTEM_USERS: SystemUser[] = [
  { id: 1, name: "Ледюкова Диана", email: "ledyukova@lexoffice.ru", role: "admin", status: "active", lastLogin: "Сегодня, 09:15", cases: 0, avatar: "Д" },
  { id: 2, name: "Сапрыкина Людмила", email: "saprykina@lexoffice.ru", role: "lawyer", status: "active", lastLogin: "Сегодня, 08:40", cases: 0, avatar: "Л" },
];

// ───────── Section: Users ─────────
const UsersSection = () => {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  const roleMap: Record<string, { label: string; cls: string; color: string }> = {
    admin:     { label: "Администратор", cls: "badge-urgent",  color: "text-red-400" },
    lawyer:    { label: "Юрист",         cls: "badge-active",  color: "text-green-400" },
    assistant: { label: "Ассистент",     cls: "badge-info",    color: "text-blue-400" },
    readonly:  { label: "Только чтение", cls: "badge-pending", color: "text-yellow-400" },
  };
  const statusMap: Record<string, { label: string; dot: string }> = {
    active:   { label: "Активен",   dot: "bg-green-400" },
    inactive: { label: "Неактивен", dot: "bg-yellow-400" },
    blocked:  { label: "Заблокирован", dot: "bg-red-500" },
  };
  const avatarColor: Record<string, string> = {
    admin:     "bg-red-500/15 text-red-400",
    lawyer:    "bg-green-500/15 text-green-400",
    assistant: "bg-blue-500/15 text-blue-400",
    readonly:  "bg-yellow-500/15 text-yellow-400",
  };

  const filters = [
    { key: "all", label: "Все" },
    { key: "admin", label: "Администраторы" },
    { key: "lawyer", label: "Юристы" },
    { key: "assistant", label: "Ассистенты" },
    { key: "readonly", label: "Только чтение" },
  ];

  const q = search.toLowerCase();
  const filtered = SYSTEM_USERS.filter(u => {
    const matchRole = filter === "all" || u.role === filter;
    const matchSearch = !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
    return matchRole && matchSearch;
  });

  const activeCount = SYSTEM_USERS.filter(u => u.status === "active").length;

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">Пользователи системы</h2>
          <p className="text-sm text-muted-foreground">{activeCount} активных из {SYSTEM_USERS.length}</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-electric text-background rounded-lg text-sm font-medium hover:opacity-90 transition-opacity">
          <Icon name="UserPlus" size={16} />
          Добавить
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { role: "admin",     count: SYSTEM_USERS.filter(u => u.role === "admin").length },
          { role: "lawyer",    count: SYSTEM_USERS.filter(u => u.role === "lawyer").length },
          { role: "assistant", count: SYSTEM_USERS.filter(u => u.role === "assistant").length },
          { role: "readonly",  count: SYSTEM_USERS.filter(u => u.role === "readonly").length },
        ].map(s => (
          <button
            key={s.role}
            onClick={() => setFilter(s.role)}
            className={`p-3 rounded-xl border text-left transition-all hover-scale ${filter === s.role ? "border-electric/40 bg-electric/5" : "border-border surface"}`}
          >
            <div className={`text-xl font-bold ${roleMap[s.role].color}`}>{s.count}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{roleMap[s.role].label}</div>
          </button>
        ))}
      </div>

      {/* Search + filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Icon name="Search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Поиск по имени или email..."
            className="w-full pl-9 pr-9 py-2.5 bg-surface-2 border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-electric transition-colors"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <Icon name="X" size={14} />
            </button>
          )}
        </div>
        <div className="flex gap-2 flex-wrap">
          {filters.slice(0, 3).map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-3 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${filter === f.key ? "bg-electric text-background" : "bg-surface-2 text-muted-foreground hover:text-foreground"}`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table header */}
      <div className="hidden lg:grid grid-cols-[1fr_180px_140px_100px_80px] gap-4 px-4 text-xs text-muted-foreground uppercase tracking-wider">
        <div>Пользователь</div>
        <div>Роль</div>
        <div>Последний вход</div>
        <div>Статус</div>
        <div className="text-right">Дел</div>
      </div>

      {/* Users list */}
      <div className="space-y-2">
        {filtered.map(user => (
          <div key={user.id} className="p-4 rounded-xl border border-border surface hover:border-electric/30 hover-scale cursor-pointer transition-colors">
            <div className="flex items-center gap-4">
              {/* Avatar */}
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-bold text-base ${avatarColor[user.role]}`}>
                {user.avatar}
              </div>

              {/* Name + email */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="font-semibold text-foreground">{user.name}</span>
                  {user.id === 1 && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-electric/15 text-electric font-medium">Вы</span>
                  )}
                </div>
                <div className="text-xs text-muted-foreground">{user.email}</div>
              </div>

              {/* Role */}
              <div className="hidden lg:block w-44 shrink-0">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${roleMap[user.role].cls}`}>
                  {roleMap[user.role].label}
                </span>
              </div>

              {/* Last login */}
              <div className="hidden lg:block w-36 text-sm text-muted-foreground shrink-0">
                {user.lastLogin}
              </div>

              {/* Status */}
              <div className="hidden lg:flex items-center gap-1.5 w-24 shrink-0">
                <div className={`w-2 h-2 rounded-full ${statusMap[user.status].dot} ${user.status === "active" ? "animate-pulse-dot" : ""}`} />
                <span className="text-sm text-muted-foreground">{statusMap[user.status].label}</span>
              </div>

              {/* Cases count */}
              <div className="hidden lg:block w-10 text-right shrink-0">
                {user.cases > 0
                  ? <span className="text-sm font-bold text-electric">{user.cases}</span>
                  : <span className="text-sm text-muted-foreground">—</span>
                }
              </div>

              {/* Actions */}
              <div className="flex gap-1 shrink-0 ml-2">
                <button className="p-2 rounded-lg bg-surface-2 hover:bg-surface-3 transition-colors" title="Редактировать">
                  <Icon name="Pencil" size={13} className="text-muted-foreground" />
                </button>
                {user.status === "blocked"
                  ? <button className="p-2 rounded-lg bg-green-500/10 hover:bg-green-500/20 transition-colors" title="Разблокировать">
                      <Icon name="Unlock" size={13} className="text-green-400" />
                    </button>
                  : <button className="p-2 rounded-lg bg-surface-2 hover:bg-red-500/10 transition-colors" title="Заблокировать">
                      <Icon name="Lock" size={13} className="text-muted-foreground hover:text-red-400" />
                    </button>
                }
              </div>
            </div>

            {/* Mobile extras */}
            <div className="lg:hidden mt-3 flex items-center gap-3 flex-wrap">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${roleMap[user.role].cls}`}>
                {roleMap[user.role].label}
              </span>
              <div className="flex items-center gap-1.5">
                <div className={`w-1.5 h-1.5 rounded-full ${statusMap[user.status].dot}`} />
                <span className="text-xs text-muted-foreground">{statusMap[user.status].label}</span>
              </div>
              <span className="text-xs text-muted-foreground">{user.lastLogin}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ───────── Section: Reviewed ─────────
const ReviewedSection = () => {
  const [filter, setFilter] = useState("all");
  const resultMap: Record<string, { label: string; cls: string; icon: string }> = {
    won:       { label: "Выиграно",   cls: "badge-active",  icon: "Trophy" },
    lost:      { label: "Проиграно", cls: "badge-urgent",  icon: "XCircle" },
    settled:   { label: "Мировое",   cls: "badge-info",    icon: "Handshake" },
    withdrawn: { label: "Отозвано",  cls: "badge-pending", icon: "RotateCcw" },
  };
  const filters = [
    { key: "all", label: "Все" },
    { key: "won", label: "Выиграно" },
    { key: "settled", label: "Мировое" },
    { key: "lost", label: "Проиграно" },
    { key: "withdrawn", label: "Отозвано" },
  ];
  const filtered = filter === "all" ? REVIEWED_CASES : REVIEWED_CASES.filter(c => c.result === filter);
  const wonCount = REVIEWED_CASES.filter(c => c.result === "won").length;
  const totalAmount = REVIEWED_CASES.filter(c => c.amount).reduce((acc, c) => {
    const num = parseInt((c.amount || "0").replace(/\D/g, ""));
    return acc + num;
  }, 0);

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">Рассмотренные дела</h2>
          <p className="text-sm text-muted-foreground">{REVIEWED_CASES.length} завершённых дел</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-4 rounded-xl border border-border surface text-center">
          <div className="text-2xl font-bold text-green-400">{wonCount}</div>
          <div className="text-xs text-muted-foreground mt-1">Выиграно</div>
        </div>
        <div className="p-4 rounded-xl border border-border surface text-center">
          <div className="text-2xl font-bold text-electric">
            {Math.round((wonCount / REVIEWED_CASES.length) * 100)}%
          </div>
          <div className="text-xs text-muted-foreground mt-1">Успешность</div>
        </div>
        <div className="p-4 rounded-xl border border-border surface text-center">
          <div className="text-2xl font-bold text-foreground">
            {(totalAmount / 1000000).toFixed(1)}М
          </div>
          <div className="text-xs text-muted-foreground mt-1">Взыскано, ₽</div>
        </div>
      </div>

      {/* Filters */}
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
        {filtered.map(c => {
          const res = resultMap[c.result];
          return (
            <div key={c.id} className="p-4 rounded-xl border border-border surface hover:border-electric/30 hover-scale cursor-pointer transition-colors">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-2 min-w-0">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    c.result === "won" ? "bg-green-400/10" :
                    c.result === "lost" ? "bg-red-500/10" :
                    c.result === "settled" ? "bg-blue-400/10" : "bg-yellow-400/10"
                  }`}>
                    <Icon name={res.icon as IconName} size={15} className={
                      c.result === "won" ? "text-green-400" :
                      c.result === "lost" ? "text-red-400" :
                      c.result === "settled" ? "text-blue-400" : "text-yellow-400"
                    } />
                  </div>
                  <h3 className="font-semibold text-foreground truncate">{c.title}</h3>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${res.cls}`}>{res.label}</span>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                <div>
                  <div className="text-xs text-muted-foreground mb-0.5">Клиент</div>
                  <div className="text-sm text-foreground font-medium">{c.client}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-0.5">Категория</div>
                  <div className="text-sm text-foreground">{c.category}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-0.5">Закрыто</div>
                  <div className="text-sm text-foreground">{c.closedDate} · {c.duration}</div>
                </div>
                {c.amount && (
                  <div>
                    <div className="text-xs text-muted-foreground mb-0.5">Взыскано</div>
                    <div className="text-sm font-bold text-green-400">{c.amount}</div>
                  </div>
                )}
              </div>
              {c.court && (
                <div className="mt-2 text-xs text-muted-foreground flex items-center gap-1">
                  <Icon name="Landmark" size={11} />
                  {c.court}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ───────── Section: Payments ─────────
const PaymentsSection = () => {
  const [filter, setFilter] = useState("all");

  const statusMap: Record<string, { label: string; cls: string }> = {
    paid:     { label: "Оплачено",   cls: "badge-active" },
    pending:  { label: "Ожидание",   cls: "badge-pending" },
    overdue:  { label: "Просрочено", cls: "badge-urgent" },
    partial:  { label: "Частично",   cls: "badge-info" },
  };
  const typeMap: Record<string, string> = {
    retainer:     "Аванс/ретейнер",
    hourly:       "Почасовая оплата",
    success_fee:  "Гонорар успеха",
    consultation: "Консультация",
  };

  const filters = [
    { key: "all", label: "Все" },
    { key: "paid", label: "Оплачено" },
    { key: "pending", label: "Ожидание" },
    { key: "overdue", label: "Просрочено" },
    { key: "partial", label: "Частично" },
  ];

  const filtered = filter === "all" ? PAYMENTS : PAYMENTS.filter(p => p.status === filter);
  const totalPaid = PAYMENTS.filter(p => p.status === "paid").reduce((a, p) => a + p.amount, 0);
  const totalPending = PAYMENTS.filter(p => p.status === "pending" || p.status === "overdue").reduce((a, p) => a + p.amount, 0);
  const totalOverdue = PAYMENTS.filter(p => p.status === "overdue").reduce((a, p) => a + p.amount, 0);

  const fmt = (n: number) => n.toLocaleString("ru-RU") + " ₽";

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">Выплаты и гонорары</h2>
          <p className="text-sm text-muted-foreground">{PAYMENTS.length} платежей</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-electric text-background rounded-lg text-sm font-medium hover:opacity-90 transition-opacity">
          <Icon name="Plus" size={16} />
          Добавить
        </button>
      </div>

      {/* Finance summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-4 rounded-xl border border-green-500/20 bg-green-500/5">
          <div className="flex items-center gap-2 mb-2">
            <Icon name="TrendingUp" size={15} className="text-green-400" />
            <span className="text-xs text-muted-foreground">Получено</span>
          </div>
          <div className="text-xl font-bold text-green-400">{fmt(totalPaid)}</div>
        </div>
        <div className="p-4 rounded-xl border border-yellow-500/20 bg-yellow-500/5">
          <div className="flex items-center gap-2 mb-2">
            <Icon name="Clock" size={15} className="text-yellow-400" />
            <span className="text-xs text-muted-foreground">Ожидается</span>
          </div>
          <div className="text-xl font-bold text-yellow-400">{fmt(totalPending)}</div>
        </div>
        <div className="p-4 rounded-xl border border-red-500/20 bg-red-500/5">
          <div className="flex items-center gap-2 mb-2">
            <Icon name="AlertCircle" size={15} className="text-red-400" />
            <span className="text-xs text-muted-foreground">Просрочено</span>
          </div>
          <div className="text-xl font-bold text-red-400">{fmt(totalOverdue)}</div>
        </div>
      </div>

      {/* Filters */}
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

      {/* List */}
      <div className="space-y-2">
        {filtered.map(p => (
          <div key={p.id} className="flex items-center gap-4 p-4 rounded-xl border border-border surface hover:border-electric/30 hover-scale cursor-pointer transition-colors">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              p.status === "paid" ? "bg-green-400/10" :
              p.status === "overdue" ? "bg-red-500/10" :
              p.status === "partial" ? "bg-blue-400/10" : "bg-yellow-400/10"
            }`}>
              <Icon name="Wallet" size={18} className={
                p.status === "paid" ? "text-green-400" :
                p.status === "overdue" ? "text-red-400" :
                p.status === "partial" ? "text-blue-400" : "text-yellow-400"
              } />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                <span className="font-semibold text-foreground">{p.client}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusMap[p.status].cls}`}>
                  {statusMap[p.status].label}
                </span>
              </div>
              <div className="text-xs text-muted-foreground">{p.case}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{typeMap[p.type]}{p.comment ? ` · ${p.comment}` : ""}</div>
            </div>
            <div className="text-right shrink-0">
              <div className={`text-base font-bold ${
                p.status === "paid" ? "text-green-400" :
                p.status === "overdue" ? "text-red-400" : "text-foreground"
              }`}>
                {fmt(p.amount)}
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">{p.date}</div>
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
    { key: "reviewed" as Section, icon: "Archive", label: "Рассмотренные" },
    { key: "payments" as Section, icon: "Wallet", label: "Выплаты" },
    { key: "users" as Section, icon: "ShieldCheck", label: "Пользователи" },
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
      case "reviewed": return <ReviewedSection />;
      case "payments": return <PaymentsSection />;
      case "users": return <UsersSection />;
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
              {item.key === "payments" && PAYMENTS.filter(p => p.status === "overdue").length > 0 && (
                <span className="ml-auto text-xs bg-red-500/15 text-red-400 px-1.5 py-0.5 rounded-md">
                  {PAYMENTS.filter(p => p.status === "overdue").length}
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