import { useState } from "react";
import Icon from "@/components/ui/icon";
import { PAYMENTS, SYSTEM_USERS } from "@/data/mockData";

// ───────── Section: Payments ─────────
export const PaymentsSection = () => {
  const [filter, setFilter] = useState("all");

  const statusMap: Record<string, { label: string; cls: string }> = {
    paid:    { label: "Оплачено",   cls: "badge-active" },
    pending: { label: "Ожидание",   cls: "badge-pending" },
    overdue: { label: "Просрочено", cls: "badge-urgent" },
    partial: { label: "Частично",   cls: "badge-info" },
  };
  const typeMap: Record<string, string> = {
    retainer: "Аванс/ретейнер", hourly: "Почасовая оплата",
    success_fee: "Гонорар успеха", consultation: "Консультация",
  };
  const filters = [
    { key: "all", label: "Все" }, { key: "paid", label: "Оплачено" },
    { key: "pending", label: "Ожидание" }, { key: "overdue", label: "Просрочено" }, { key: "partial", label: "Частично" },
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

      <div className="grid grid-cols-3 gap-3">
        <div className="p-4 rounded-xl border border-green-500/20 bg-green-500/5">
          <div className="flex items-center gap-2 mb-2"><Icon name="TrendingUp" size={15} className="text-green-400" /><span className="text-xs text-muted-foreground">Получено</span></div>
          <div className="text-xl font-bold text-green-400">{fmt(totalPaid)}</div>
        </div>
        <div className="p-4 rounded-xl border border-yellow-500/20 bg-yellow-500/5">
          <div className="flex items-center gap-2 mb-2"><Icon name="Clock" size={15} className="text-yellow-400" /><span className="text-xs text-muted-foreground">Ожидается</span></div>
          <div className="text-xl font-bold text-yellow-400">{fmt(totalPending)}</div>
        </div>
        <div className="p-4 rounded-xl border border-red-500/20 bg-red-500/5">
          <div className="flex items-center gap-2 mb-2"><Icon name="AlertCircle" size={15} className="text-red-400" /><span className="text-xs text-muted-foreground">Просрочено</span></div>
          <div className="text-xl font-bold text-red-400">{fmt(totalOverdue)}</div>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        {filters.map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${filter === f.key ? "bg-electric text-background" : "bg-surface-2 text-muted-foreground hover:text-foreground"}`}>
            {f.label}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {filtered.map(p => (
          <div key={p.id} className="flex items-center gap-4 p-4 rounded-xl border border-border surface hover:border-electric/30 hover-scale cursor-pointer transition-colors">
            <div className="w-10 h-10 rounded-xl bg-surface-2 flex items-center justify-center shrink-0">
              <Icon name="Wallet" size={18} className="text-electric" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                <h3 className="font-medium text-foreground">{p.client}</h3>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusMap[p.status].cls}`}>{statusMap[p.status].label}</span>
              </div>
              <div className="text-xs text-muted-foreground">{p.case}</div>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-xs text-muted-foreground">{typeMap[p.type]}</span>
                {p.comment && <span className="text-xs text-muted-foreground">· {p.comment}</span>}
              </div>
            </div>
            <div className="text-right shrink-0">
              <div className={`text-base font-bold ${
                p.status === "paid" ? "text-green-400" : p.status === "overdue" ? "text-red-400" : "text-foreground"
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

// ───────── Section: Users ─────────
export const UsersSection = () => {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  const roleMap: Record<string, { label: string; cls: string; color: string }> = {
    admin:     { label: "Администратор", cls: "badge-urgent",  color: "text-red-400" },
    lawyer:    { label: "Юрист",         cls: "badge-active",  color: "text-green-400" },
    assistant: { label: "Ассистент",     cls: "badge-info",    color: "text-blue-400" },
    readonly:  { label: "Только чтение", cls: "badge-pending", color: "text-yellow-400" },
  };
  const statusMap: Record<string, { label: string; dot: string }> = {
    active:   { label: "Активен",      dot: "bg-green-400" },
    inactive: { label: "Неактивен",    dot: "bg-yellow-400" },
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

      <div className="grid grid-cols-4 gap-3">
        {(["admin", "lawyer", "assistant", "readonly"] as const).map(role => (
          <button key={role} onClick={() => setFilter(role)}
            className={`p-3 rounded-xl border text-left transition-all hover-scale ${filter === role ? "border-electric/40 bg-electric/5" : "border-border surface"}`}>
            <div className={`text-xl font-bold ${roleMap[role].color}`}>{SYSTEM_USERS.filter(u => u.role === role).length}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{roleMap[role].label}</div>
          </button>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Icon name="Search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Поиск по имени или email..."
            className="w-full pl-9 pr-9 py-2.5 bg-surface-2 border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-electric transition-colors" />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <Icon name="X" size={14} />
            </button>
          )}
        </div>
        <div className="flex gap-2 flex-wrap">
          {filters.slice(0, 3).map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              className={`px-3 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${filter === f.key ? "bg-electric text-background" : "bg-surface-2 text-muted-foreground hover:text-foreground"}`}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="hidden lg:grid grid-cols-[1fr_180px_140px_100px_80px] gap-4 px-4 text-xs text-muted-foreground uppercase tracking-wider">
        <div>Пользователь</div><div>Роль</div><div>Последний вход</div><div>Статус</div><div className="text-right">Дел</div>
      </div>

      <div className="space-y-2">
        {filtered.map(user => (
          <div key={user.id} className="p-4 rounded-xl border border-border surface hover:border-electric/30 hover-scale cursor-pointer transition-colors">
            <div className="flex items-center gap-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-bold text-base ${avatarColor[user.role]}`}>
                {user.avatar}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="font-semibold text-foreground">{user.name}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${roleMap[user.role].cls}`}>{roleMap[user.role].label}</span>
                </div>
                <div className="text-xs text-muted-foreground">{user.email}</div>
              </div>
              <div className="hidden lg:flex items-center gap-8">
                <div className="w-36 text-sm text-muted-foreground">{user.lastLogin}</div>
                <div className="w-28 flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${statusMap[user.status].dot}`} />
                  <span className="text-sm text-foreground">{statusMap[user.status].label}</span>
                </div>
                <div className="w-10 text-right text-sm font-bold text-electric">{user.cases}</div>
              </div>
              <div className="flex gap-2">
                <button className="p-2 rounded-lg bg-surface-2 hover:bg-surface-3 transition-colors">
                  <Icon name="Settings" size={14} className="text-muted-foreground" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
