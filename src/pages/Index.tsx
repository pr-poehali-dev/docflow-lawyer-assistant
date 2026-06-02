import { useState } from "react";
import Icon from "@/components/ui/icon";
import type { Section } from "@/types";
import { TASKS, EVENTS, PAYMENTS, NOTIFICATIONS } from "@/data/mockData";
import CasesSection from "@/components/cases/CasesSection";
import {
  Dashboard,
  ClientsSection,
  DocumentsSection,
  TasksSection,
  CalendarSection,
  ReviewedSection,
  PaymentsSection,
  UsersSection,
} from "@/components/sections/OtherSections";

type IconName = Parameters<typeof Icon>[0]["name"];

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
      case "cases":     return <CasesSection />;
      case "clients":   return <ClientsSection />;
      case "documents": return <DocumentsSection />;
      case "tasks":     return <TasksSection />;
      case "calendar":  return <CalendarSection />;
      case "reviewed":  return <ReviewedSection />;
      case "payments":  return <PaymentsSection />;
      case "users":     return <UsersSection />;
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
