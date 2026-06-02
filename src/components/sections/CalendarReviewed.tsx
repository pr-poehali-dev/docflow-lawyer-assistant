import { useState } from "react";
import Icon from "@/components/ui/icon";
import { EVENTS, REVIEWED_CASES } from "@/data/mockData";

type IconName = Parameters<typeof Icon>[0]["name"];

// ───────── Section: Calendar ─────────
export const CalendarSection = () => {
  const evTypeLabel: Record<string, string> = { court: "Заседание", meeting: "Встреча", deadline: "Дедлайн", call: "Звонок" };
  const evTypeColor: Record<string, string> = {
    court: "border-l-red-500 bg-red-500/5",
    meeting: "border-l-blue-500 bg-blue-500/5",
    deadline: "border-l-yellow-500 bg-yellow-500/5",
    call: "border-l-green-500 bg-green-500/5",
  };
  const evIcon: Record<string, string> = { court: "Gavel", meeting: "Users", deadline: "Clock", call: "Phone" };
  const evIconColor: Record<string, string> = { court: "text-red-400", meeting: "text-blue-400", deadline: "text-yellow-400", call: "text-green-400" };
  const evBadgeCls: Record<string, string> = { court: "badge-urgent", meeting: "badge-info", deadline: "badge-pending", call: "badge-active" };

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
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${evBadgeCls[ev.type]}`}>{evTypeLabel[ev.type]}</span>
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

// ───────── Section: Reviewed ─────────
export const ReviewedSection = () => {
  const [filter, setFilter] = useState("all");
  const resultMap: Record<string, { label: string; cls: string; icon: string }> = {
    won:       { label: "Выиграно",  cls: "badge-active",  icon: "Trophy" },
    lost:      { label: "Проиграно", cls: "badge-urgent",  icon: "XCircle" },
    settled:   { label: "Мировое",  cls: "badge-info",    icon: "Handshake" },
    withdrawn: { label: "Отозвано", cls: "badge-pending", icon: "RotateCcw" },
  };
  const filters = [
    { key: "all", label: "Все" }, { key: "won", label: "Выиграно" },
    { key: "settled", label: "Мировое" }, { key: "lost", label: "Проиграно" }, { key: "withdrawn", label: "Отозвано" },
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

      <div className="grid grid-cols-3 gap-3">
        <div className="p-4 rounded-xl border border-border surface text-center">
          <div className="text-2xl font-bold text-green-400">{wonCount}</div>
          <div className="text-xs text-muted-foreground mt-1">Выиграно</div>
        </div>
        <div className="p-4 rounded-xl border border-border surface text-center">
          <div className="text-2xl font-bold text-electric">{Math.round((wonCount / REVIEWED_CASES.length) * 100)}%</div>
          <div className="text-xs text-muted-foreground mt-1">Успешность</div>
        </div>
        <div className="p-4 rounded-xl border border-border surface text-center">
          <div className="text-2xl font-bold text-foreground">{(totalAmount / 1000000).toFixed(1)}М</div>
          <div className="text-xs text-muted-foreground mt-1">Взыскано, ₽</div>
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

      <div className="space-y-3">
        {filtered.map(c => {
          const res = resultMap[c.result];
          return (
            <div key={c.id} className="p-4 rounded-xl border border-border surface hover:border-electric/30 hover-scale cursor-pointer transition-colors">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-2 min-w-0">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    c.result === "won" ? "bg-green-400/10" : c.result === "lost" ? "bg-red-500/10" :
                    c.result === "settled" ? "bg-blue-400/10" : "bg-yellow-400/10"
                  }`}>
                    <Icon name={res.icon as IconName} size={15} className={
                      c.result === "won" ? "text-green-400" : c.result === "lost" ? "text-red-400" :
                      c.result === "settled" ? "text-blue-400" : "text-yellow-400"
                    } />
                  </div>
                  <h3 className="font-semibold text-foreground truncate">{c.title}</h3>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${res.cls}`}>{res.label}</span>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                <div><div className="text-xs text-muted-foreground mb-0.5">Клиент</div><div className="text-sm text-foreground font-medium">{c.client}</div></div>
                <div><div className="text-xs text-muted-foreground mb-0.5">Категория</div><div className="text-sm text-foreground">{c.category}</div></div>
                <div><div className="text-xs text-muted-foreground mb-0.5">Закрыто</div><div className="text-sm text-foreground">{c.closedDate} · {c.duration}</div></div>
                {c.amount && <div><div className="text-xs text-muted-foreground mb-0.5">Взыскано</div><div className="text-sm font-bold text-green-400">{c.amount}</div></div>}
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
