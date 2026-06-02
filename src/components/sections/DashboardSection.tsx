import Icon from "@/components/ui/icon";
import type { Section } from "@/types";
import { CLIENTS, TASKS, EVENTS, NOTIFICATIONS } from "@/data/mockData";

type IconName = Parameters<typeof Icon>[0]["name"];

// ───────── Shared Helpers ─────────
export const StatusBadge = ({ status }: { status: string }) => {
  const map: Record<string, { label: string; cls: string }> = {
    urgent:  { label: "Срочно",      cls: "badge-urgent" },
    active:  { label: "Активно",     cls: "badge-active" },
    pending: { label: "Ожидание",    cls: "badge-pending" },
    closed:  { label: "Закрыто",     cls: "bg-muted text-muted-foreground border border-border" },
    new:     { label: "Новый",       cls: "badge-info" },
    final:   { label: "Финал",       cls: "badge-active" },
    draft:   { label: "Черновик",    cls: "badge-pending" },
    review:  { label: "На проверке", cls: "badge-info" },
  };
  const s = map[status] || { label: status, cls: "badge-info" };
  return <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${s.cls}`}>{s.label}</span>;
};

export const PriorityDot = ({ priority }: { priority: string }) => {
  const colors: Record<string, string> = { high: "bg-red-500", medium: "bg-yellow-400", low: "bg-green-500" };
  return <span className={`inline-block w-2 h-2 rounded-full ${colors[priority] || "bg-gray-400"} animate-pulse-dot`} />;
};

// ───────── Section: Dashboard ─────────
export const Dashboard = ({ onSection }: { onSection: (s: Section) => void }) => {
  const urgentTasks = TASKS.filter(t => !t.done && t.priority === "high").length;
  const activeCases = 0;

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
          <button key={i} onClick={s.onClick} className="text-left p-4 rounded-xl border border-border surface hover-scale cursor-pointer">
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
