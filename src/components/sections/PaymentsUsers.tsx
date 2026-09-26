import { useState, useEffect, useCallback, FormEvent } from "react";
import Icon from "@/components/ui/icon";
import { PAYMENTS } from "@/data/mockData";
import { usersApi, type UserRecord, type AuditEntry } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";

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

const inputCls = "w-full px-3 py-2.5 bg-surface-2 border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-electric transition-colors";

const roleMap: Record<string, { label: string; cls: string; color: string; avatarCls: string }> = {
  admin:    { label: "Администратор",  cls: "badge-urgent",  color: "text-red-400",    avatarCls: "bg-red-500/15 text-red-400" },
  lawyer:   { label: "Юрист",          cls: "badge-active",  color: "text-green-400",  avatarCls: "bg-green-500/15 text-green-400" },
  staff:    { label: "Сотрудник",      cls: "badge-info",    color: "text-blue-400",   avatarCls: "bg-blue-500/15 text-blue-400" },
  readonly: { label: "Только просмотр", cls: "badge-pending", color: "text-yellow-400", avatarCls: "bg-yellow-500/15 text-yellow-400" },
};

const eventMap: Record<string, { label: string; icon: string; color: string }> = {
  login_success: { label: "Успешный вход", icon: "LogIn", color: "text-green-400" },
  login_failed:  { label: "Неверный пароль", icon: "AlertTriangle", color: "text-yellow-400" },
  locked:        { label: "Учётная запись заблокирована", icon: "Lock", color: "text-red-400" },
  bootstrap:     { label: "Создание администратора", icon: "UserPlus", color: "text-electric" },
};

// ───────── User Modal ─────────
const UserModal = ({ user, onClose, onSaved }: { user: UserRecord | null; onClose: () => void; onSaved: () => void }) => {
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [role, setRole] = useState(user?.role || "lawyer");
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    setError(null);
    try {
      if (user) {
        await usersApi.update({ id: user.id, name, role, ...(password ? { password } : {}) });
      } else {
        await usersApi.create({ name, email, password, role });
      }
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось сохранить");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
      <form onSubmit={handleSubmit} className="relative w-full max-w-md bg-surface border border-border rounded-2xl shadow-2xl animate-scale-in overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h3 className="font-bold text-foreground text-lg">{user ? "Редактировать сотрудника" : "Новый сотрудник"}</h3>
          <button type="button" onClick={onClose} className="p-2 rounded-xl hover:bg-surface-2 transition-colors text-muted-foreground hover:text-foreground">
            <Icon name="X" size={18} />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">Имя <span className="text-red-400">*</span></label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Иван Иванов" className={inputCls} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">Email <span className="text-red-400">*</span></label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} disabled={!!user}
              placeholder="ivan@legispro.ru" className={`${inputCls} ${user ? "opacity-50 cursor-not-allowed" : ""}`} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">Роль</label>
            <select value={role} onChange={e => setRole(e.target.value as UserRecord["role"])} className={inputCls}>
              <option value="admin">Администратор</option>
              <option value="lawyer">Юрист</option>
              <option value="staff">Сотрудник</option>
              <option value="readonly">Только просмотр</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">
              {user ? "Новый пароль (необязательно)" : "Пароль"} <span className="text-red-400">{!user && "*"}</span>
            </label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder="Минимум 6 символов" className={inputCls} />
          </div>
          {error && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-400">
              <Icon name="AlertTriangle" size={13} />
              {error}
            </div>
          )}
        </div>
        <div className="flex items-center justify-between p-5 border-t border-border">
          <button type="button" onClick={onClose} className="px-4 py-2 bg-surface-2 text-muted-foreground rounded-xl text-sm font-medium hover:text-foreground transition-colors">
            Отмена
          </button>
          <button type="submit" disabled={!name || !email || (!user && password.length < 6) || saving}
            className="flex items-center gap-2 px-5 py-2 bg-electric text-background rounded-xl text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed">
            <Icon name={saving ? "Loader2" : "Save"} size={16} className={saving ? "animate-spin" : ""} />
            {saving ? "Сохраняем..." : "Сохранить"}
          </button>
        </div>
      </form>
    </div>
  );
};

const DeleteConfirm = ({ name, onConfirm, onCancel }: { name: string; onConfirm: () => void; onCancel: () => void }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onCancel} />
    <div className="relative w-full max-w-sm bg-surface border border-border rounded-2xl shadow-2xl animate-scale-in p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center shrink-0">
          <Icon name="Trash2" size={18} className="text-red-400" />
        </div>
        <div>
          <div className="font-bold text-foreground">Удалить сотрудника?</div>
          <div className="text-sm text-muted-foreground mt-0.5">{name}</div>
        </div>
      </div>
      <p className="text-sm text-muted-foreground mb-5">Доступ будет отозван немедленно. Это действие нельзя отменить.</p>
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

// ───────── Section: Users ─────────
export const UsersSection = () => {
  const { user: currentUser } = useAuth();
  const [tab, setTab] = useState<"users" | "audit">("users");
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [audit, setAudit] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [modalUser, setModalUser] = useState<UserRecord | null | "new">(null);
  const [deleteTarget, setDeleteTarget] = useState<UserRecord | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setForbidden(false);
    try {
      const [usersData, auditData] = await Promise.all([usersApi.list(), usersApi.audit()]);
      setUsers(usersData);
      setAudit(auditData);
    } catch {
      setForbidden(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (u: UserRecord) => {
    await usersApi.remove(u.id);
    setDeleteTarget(null);
    load();
  };

  const q = search.toLowerCase();
  const filtered = users.filter(u => {
    const matchRole = filter === "all" || u.role === filter;
    const matchSearch = !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
    return matchRole && matchSearch;
  });

  const activeCount = users.filter(u => u.status === "active").length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Icon name="Loader2" size={24} className="text-muted-foreground animate-spin" />
      </div>
    );
  }

  if (forbidden || currentUser?.role !== "admin") {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in">
        <div className="w-14 h-14 rounded-2xl bg-surface-2 flex items-center justify-center mb-4">
          <Icon name="ShieldAlert" size={24} className="text-muted-foreground" />
        </div>
        <div className="text-foreground font-semibold mb-1">Доступно только администратору</div>
        <div className="text-sm text-muted-foreground">У вашей роли нет прав на управление сотрудниками</div>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in">
      {modalUser !== null && (
        <UserModal user={modalUser === "new" ? null : modalUser} onClose={() => setModalUser(null)} onSaved={() => { setModalUser(null); load(); }} />
      )}
      {deleteTarget && (
        <DeleteConfirm name={deleteTarget.name} onConfirm={() => handleDelete(deleteTarget)} onCancel={() => setDeleteTarget(null)} />
      )}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">Сотрудники и доступ</h2>
          <p className="text-sm text-muted-foreground">{activeCount} активных из {users.length}</p>
        </div>
        {tab === "users" && (
          <button onClick={() => setModalUser("new")}
            className="flex items-center gap-2 px-4 py-2 bg-electric text-background rounded-lg text-sm font-medium hover:opacity-90 transition-opacity">
            <Icon name="UserPlus" size={16} />
            Добавить
          </button>
        )}
      </div>

      <div className="flex border-b border-border">
        {([["users", "Сотрудники"], ["audit", "Журнал входов"]] as const).map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-all ${tab === key ? "border-electric text-electric" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
            {label}
          </button>
        ))}
      </div>

      {tab === "users" && (
        <>
          <div className="grid grid-cols-4 gap-3">
            {(["admin", "lawyer", "staff", "readonly"] as const).map(role => (
              <button key={role} onClick={() => setFilter(role)}
                className={`p-3 rounded-xl border text-left transition-all hover-scale ${filter === role ? "border-electric/40 bg-electric/5" : "border-border surface"}`}>
                <div className={`text-xl font-bold ${roleMap[role].color}`}>{users.filter(u => u.role === role).length}</div>
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
            <button onClick={() => setFilter("all")}
              className={`px-3 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${filter === "all" ? "bg-electric text-background" : "bg-surface-2 text-muted-foreground hover:text-foreground"}`}>
              Все
            </button>
          </div>

          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="text-foreground font-semibold mb-1">Сотрудники не найдены</div>
              <div className="text-sm text-muted-foreground">Попробуйте изменить фильтр или добавьте нового сотрудника</div>
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map(u => (
                <div key={u.id} className="p-4 rounded-xl border border-border surface hover:border-electric/30 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-bold text-base ${roleMap[u.role].avatarCls}`}>
                      {u.name[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        <span className="font-semibold text-foreground">{u.name}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${roleMap[u.role].cls}`}>{roleMap[u.role].label}</span>
                        {u.id === currentUser?.id && <span className="text-xs text-muted-foreground">(вы)</span>}
                      </div>
                      <div className="text-xs text-muted-foreground">{u.email}</div>
                    </div>
                    <div className="hidden lg:flex items-center gap-6 shrink-0">
                      <div className="w-40 text-sm text-muted-foreground">
                        {u.last_login ? new Date(u.last_login).toLocaleString("ru-RU") : "Ещё не заходил"}
                      </div>
                      <div className="w-28 flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${u.status === "active" ? "bg-green-400" : "bg-yellow-400"}`} />
                        <span className="text-sm text-foreground">{u.status === "active" ? "Активен" : "Отключён"}</span>
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button onClick={() => setModalUser(u)} className="p-2 rounded-lg bg-surface-2 hover:bg-electric/10 hover:text-electric transition-colors">
                        <Icon name="Pencil" size={14} className="text-muted-foreground" />
                      </button>
                      {u.id !== currentUser?.id && (
                        <button onClick={() => setDeleteTarget(u)} className="p-2 rounded-lg bg-surface-2 hover:bg-red-500/10 hover:text-red-400 transition-colors">
                          <Icon name="Trash2" size={14} className="text-muted-foreground" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {tab === "audit" && (
        <div className="space-y-2">
          {audit.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="text-sm text-muted-foreground">Пока нет записей</div>
            </div>
          ) : (
            audit.map(entry => {
              const ev = eventMap[entry.event] || { label: entry.event, icon: "Info", color: "text-muted-foreground" };
              return (
                <div key={entry.id} className="flex items-center gap-3 p-3 rounded-xl border border-border surface">
                  <div className={`w-8 h-8 rounded-lg bg-surface-2 flex items-center justify-center shrink-0 ${ev.color}`}>
                    <Icon name={ev.icon as Parameters<typeof Icon>[0]["name"]} size={14} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-foreground">
                      <span className="font-medium">{entry.user_name || entry.email}</span>
                      <span className="text-muted-foreground"> · {ev.label}</span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {new Date(entry.created_at).toLocaleString("ru-RU")}
                      {entry.ip_address && <span> · {entry.ip_address}</span>}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};
