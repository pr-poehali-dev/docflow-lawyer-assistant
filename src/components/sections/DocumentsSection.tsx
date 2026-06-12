import React, { useState } from "react";
import Icon from "@/components/ui/icon";
import type { Case } from "@/types";
import { DOCUMENTS } from "@/data/mockData";
import { StatusBadge } from "./DashboardSection";

type IconName = Parameters<typeof Icon>[0]["name"];

// ───────── Shared cases store (singleton via module-level ref) ─────────
// Cases are passed in from CasesSection via a shared atom-like approach.
// We use a simple global event bus to get cases without prop drilling.
let _casesStore: Case[] = [];
export const setCasesStore = (cases: Case[]) => { _casesStore = cases; };

// ───────── Document generators ─────────
const fmt = (d: string) => {
  if (!d) return "________";
  try { return new Date(d).toLocaleDateString("ru-RU"); } catch { return d; }
};

const generateZayavlenie = (c: Case): string => {
  const today = new Date().toLocaleDateString("ru-RU");
  const passport = [c.passportSeries, c.passportNumber].filter(Boolean).join(" ") || "________";
  const owner = c.guiltOwnerName || c.guiltFullName || "________________";
  const ownerAddr = c.guiltOwnerAddress || c.guiltAddress || "________________";
  return `Страховая компания: ${c.guiltInsuranceCompany || "________________"}

От: ${c.fullName || "________________"}
Дата рождения: ${fmt(c.birthDate)} г.
Адрес: ${c.address || "________________"}
Паспорт: серия ${passport}, выдан ${c.passportIssued || "________________"} ${fmt(c.passportDate)} г.

ЗАЯВЛЕНИЕ О СТРАХОВОЙ ВЫПЛАТЕ

${today} г. в ${c.dtpPlace || "________________"} произошло ДТП с участием моего транспортного средства ${c.vehicle || "________________"}, г/н ${c.vehiclePlate || "________________"}, застрахованного по полису ОСАГО № ${c.policyNumber || "________________"} (${c.driverInsuranceCompany || c.insuranceCompany || "________________"}).

Виновником ДТП является:
${c.guiltFullName || "________________"}, дата рождения: ${fmt(c.guiltBirthDate)} г.,
адрес: ${c.guiltAddress || "________________"}${c.guiltPhone ? `, тел.: ${c.guiltPhone}` : ""};
транспортное средство: ${c.guiltVehicle || "________________"}, г/н ${c.guiltVehiclePlate || "________________"};
собственник ТС: ${owner}, адрес: ${ownerAddr};
страховая компания виновника: ${c.guiltInsuranceCompany || "________________"}, полис № ${c.guiltPolicyNumber || "________________"}.

В результате ДТП мой автомобиль получил механические повреждения.

На основании ст. 11, 12 Федерального закона «Об ОСАГО» прошу:
1. Признать произошедшее ДТП страховым случаем.
2. Произвести осмотр повреждённого транспортного средства.
3. Выплатить страховое возмещение в полном объёме.

К заявлению прилагаю:
— копию паспорта заявителя;
— свидетельство о регистрации ТС;
— документы о ДТП (извещение, справка, постановление);
— реквизиты для выплаты.

${today} г.        ________________ / ${c.fullName || ""}`;
};

const generatePretenziya = (c: Case): string => {
  const today = new Date().toLocaleDateString("ru-RU");
  const passport = [c.passportSeries, c.passportNumber].filter(Boolean).join(" ") || "________";
  return `${c.guiltInsuranceCompany || "________________"}

От: ${c.fullName || "________________"},
адрес: ${c.address || "________________"},
паспорт: серия ${passport}, выдан ${c.passportIssued || "________________"} ${fmt(c.passportDate)} г.

ПРЕТЕНЗИЯ

Я, ${c.fullName || "________________"}, обратился(ась) к вам с заявлением о выплате страхового возмещения в связи с ДТП, произошедшим ${fmt(c.dtpDate)} г. в ${c.dtpPlace || "________________"}.

Транспортное средство: ${c.vehicle || "________________"}, г/н ${c.vehiclePlate || "________________"}.
Полис ОСАГО: № ${c.policyNumber || "________________"}, страховая компания: ${c.driverInsuranceCompany || c.insuranceCompany || "________________"}.

Виновник ДТП: ${c.guiltFullName || "________________"},
страховая компания виновника: ${c.guiltInsuranceCompany || "________________"}, полис № ${c.guiltPolicyNumber || "________________"}.

Однако до настоящего времени выплата не произведена / произведена не в полном объёме, что является нарушением п. 21 ст. 12 ФЗ «Об ОСАГО».

На основании изложенного ТРЕБУЮ:
1. В течение 10 календарных дней с момента получения настоящей претензии выплатить страховое возмещение в полном объёме.
2. Выплатить неустойку за нарушение сроков выплаты из расчёта 1% от суммы страхового возмещения за каждый день просрочки.
3. Возместить расходы на оценку ущерба и юридические услуги.

В случае неудовлетворения настоящей претензии в указанный срок буду вынужден(а) обратиться в суд с иском о взыскании страхового возмещения, неустойки, штрафа в размере 50%, компенсации морального вреда и судебных расходов.

${today} г.        ________________ / ${c.fullName || ""}`;
};

const generateUточnenie = (c: Case): string => {
  const today = new Date().toLocaleDateString("ru-RU");
  const court = c.court || "________________";
  const passport = [c.passportSeries, c.passportNumber].filter(Boolean).join(" ") || "________";
  const owner = c.guiltOwnerName || c.guiltFullName || "________________";
  const ownerAddr = c.guiltOwnerAddress || c.guiltAddress || "________________";
  return `В ${court}

Истец: ${c.fullName || "________________"},
дата рождения: ${fmt(c.birthDate)} г.,
адрес: ${c.address || "________________"},
паспорт: серия ${passport}, выдан ${c.passportIssued || "________________"} ${fmt(c.passportDate)} г.

Ответчик: ${c.guiltInsuranceCompany || "________________"}

УТОЧНЁННОЕ ИСКОВОЕ ЗАЯВЛЕНИЕ
о взыскании страхового возмещения

В дополнение к ранее поданному исковому заявлению о взыскании страхового возмещения по факту ДТП, произошедшего ${fmt(c.dtpDate)} г. в ${c.dtpPlace || "________________"}, уточняю исковые требования.

Мне на праве собственности принадлежит транспортное средство: ${c.vehicle || "________________"}, г/н ${c.vehiclePlate || "________________"}, застрахованное по полису ОСАГО № ${c.policyNumber || "________________"} (${c.driverInsuranceCompany || c.insuranceCompany || "________________"}).

Виновник ДТП — ${c.guiltFullName || "________________"} (${fmt(c.guiltBirthDate)} г.р.),
адрес: ${c.guiltAddress || "________________"}${c.guiltPhone ? `, тел.: ${c.guiltPhone}` : ""}.
Транспортное средство виновника: ${c.guiltVehicle || "________________"}, г/н ${c.guiltVehiclePlate || "________________"}.
Собственник ТС виновника: ${owner}, адрес: ${ownerAddr}.
Страховая компания виновника: ${c.guiltInsuranceCompany || "________________"}, полис № ${c.guiltPolicyNumber || "________________"}.

С учётом полученного заключения независимой экспертизы уточняю размер исковых требований.

ПРОШУ:
1. Взыскать с ${c.guiltInsuranceCompany || "ответчика"} страховое возмещение в уточнённом размере согласно заключению эксперта.
2. Взыскать неустойку за нарушение сроков выплаты страхового возмещения.
3. Взыскать штраф в размере 50% от суммы, присуждённой в пользу истца.
4. Взыскать расходы на оценку ущерба, юридические услуги и иные судебные расходы.
5. Взыскать компенсацию морального вреда.

Приложения:
— заключение независимой экспертизы;
— обновлённый расчёт суммы иска;
— иные документы, подтверждающие уточнённые требования.

${today} г.        ________________ / ${c.fullName || ""}`;
};

const DOC_TYPES = [
  { key: "zayavlenie", label: "Заявление в СК", icon: "FileText", generate: generateZayavlenie },
  { key: "pretenziya", label: "Претензия в СК", icon: "AlertOctagon", generate: generatePretenziya },
  { key: "utochnenie", label: "Уточнённое заявление в СК", icon: "FilePen", generate: generateUточnenie },
];

// ───────── Case Picker ─────────
const CasePicker = ({ cases, value, onChange }: {
  cases: Case[];
  value: Case | null;
  onChange: (c: Case | null) => void;
}) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = cases.filter(c => c.fullName.toLowerCase().includes(search.toLowerCase()));

  return (
    <div ref={ref} className="relative">
      <div
        className="flex items-center gap-2 px-3 py-2.5 bg-surface-2 border border-border rounded-xl cursor-pointer hover:border-electric/50 transition-colors"
        onClick={() => setOpen(o => !o)}
      >
        <Icon name="Briefcase" size={15} className="text-muted-foreground shrink-0" />
        <span className={`flex-1 text-sm truncate ${value ? "text-foreground" : "text-muted-foreground"}`}>
          {value ? value.fullName : "Выбрать дело..."}
        </span>
        {value && (
          <button onClick={e => { e.stopPropagation(); onChange(null); setSearch(""); }}
            className="text-muted-foreground hover:text-foreground shrink-0">
            <Icon name="X" size={13} />
          </button>
        )}
        <Icon name={open ? "ChevronUp" : "ChevronDown"} size={14} className="text-muted-foreground shrink-0" />
      </div>
      {open && (
        <div className="absolute z-50 top-full mt-1 w-full bg-surface border border-border rounded-xl shadow-xl overflow-hidden">
          <div className="p-2 border-b border-border">
            <div className="relative">
              <Icon name="Search" size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input autoFocus value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Поиск по ФИО..."
                className="w-full pl-7 pr-3 py-1.5 bg-surface-2 rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none" />
            </div>
          </div>
          <div className="max-h-52 overflow-y-auto">
            {cases.length === 0
              ? <div className="px-3 py-3 text-sm text-muted-foreground">Дел пока нет. Сначала создайте дело во вкладке «Дела».</div>
              : filtered.length === 0
              ? <div className="px-3 py-2.5 text-sm text-muted-foreground">Не найдено</div>
              : filtered.map(c => (
                <button key={c.id} onClick={() => { onChange(c); setSearch(""); setOpen(false); }}
                  className={`w-full text-left px-3 py-2.5 text-sm transition-colors hover:bg-surface-2 border-b border-border/30 last:border-0 ${value?.id === c.id ? "text-electric font-medium" : "text-foreground"}`}>
                  <div className="font-medium">{c.fullName}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {c.vehicle && <span>{c.vehicle}</span>}
                    {c.dtpDate && <span className="ml-2">· ДТП {fmt(c.dtpDate)}</span>}
                  </div>
                </button>
              ))
            }
          </div>
        </div>
      )}
    </div>
  );
};

// ───────── Document Viewer Modal ─────────
const DocViewerModal = ({ title, text, onClose }: { title: string; text: string; onClose: () => void }) => {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-surface border border-border rounded-2xl shadow-2xl animate-scale-in overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-5 border-b border-border shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-electric/10 flex items-center justify-center">
              <Icon name="ScrollText" size={16} className="text-electric" />
            </div>
            <h3 className="font-bold text-foreground">{title}</h3>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={copy}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-2 hover:bg-surface-3 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">
              <Icon name={copied ? "Check" : "Copy"} size={13} className={copied ? "text-green-400" : ""} />
              {copied ? "Скопировано!" : "Копировать"}
            </button>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-surface-2 transition-colors text-muted-foreground hover:text-foreground">
              <Icon name="X" size={18} />
            </button>
          </div>
        </div>
        <div className="overflow-y-auto flex-1 p-5">
          <div className="bg-surface-2 border border-border rounded-xl p-5 font-mono text-xs text-foreground leading-relaxed whitespace-pre-wrap">
            {text}
          </div>
        </div>
      </div>
    </div>
  );
};

// ───────── Section: Documents ─────────
export const DocumentsSection = ({ cases }: { cases?: Case[] }) => {
  const [filter, setFilter] = useState("all");
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);
  const [viewDoc, setViewDoc] = useState<{ title: string; text: string } | null>(null);
  const [activeTab, setActiveTab] = useState<"static" | "generated">("generated");

  const allCases = cases ?? _casesStore;

  const typeIcon: Record<string, string> = {
    "Иск": "FileText", "Аналитика": "BarChart2", "Жалоба": "AlertOctagon",
    "Отчёт": "FileBarChart", "Заключение": "CheckSquare",
  };
  const filtered = filter === "all" ? DOCUMENTS : DOCUMENTS.filter(d => d.status === filter);
  const filterLabels: Record<string, string> = { all: "Все", final: "Финал", review: "Проверка", draft: "Черновики" };

  return (
    <div className="space-y-4 animate-fade-in">
      {viewDoc && (
        <DocViewerModal title={viewDoc.title} text={viewDoc.text} onClose={() => setViewDoc(null)} />
      )}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">Документы</h2>
          <p className="text-sm text-muted-foreground">{DOCUMENTS.length} документов в архиве</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-electric text-background rounded-lg text-sm font-medium hover:opacity-90 transition-opacity">
          <Icon name="Upload" size={16} />
          Загрузить
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border">
        {([
          ["generated", "FilePen", "Сформировать документ"],
          ["static", "FolderOpen", "Архив документов"],
        ] as const).map(([key, icon, label]) => (
          <button key={key} onClick={() => setActiveTab(key)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-all ${activeTab === key ? "border-electric text-electric" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
            <Icon name={icon} size={14} />
            {label}
          </button>
        ))}
      </div>

      {/* ─── Generated docs tab ─── */}
      {activeTab === "generated" && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl border border-border bg-surface-2">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">
              Выберите дело
            </label>
            <CasePicker cases={allCases} value={selectedCase} onChange={setSelectedCase} />
            {!selectedCase && (
              <p className="text-xs text-muted-foreground mt-2">
                Выберите дело — и документы заполнятся автоматически данными клиента, виновника, полиса и ДТП.
              </p>
            )}
          </div>

          {selectedCase && (
            <div className="p-3 rounded-xl border border-electric/20 bg-electric/5 flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-electric/10 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-electric font-bold text-sm">{selectedCase.fullName[0]}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-foreground">{selectedCase.fullName}</div>
                <div className="text-xs text-muted-foreground mt-0.5 flex flex-wrap gap-x-3">
                  {selectedCase.vehicle && <span>{selectedCase.vehicle} · {selectedCase.vehiclePlate}</span>}
                  {selectedCase.dtpDate && <span>ДТП: {fmt(selectedCase.dtpDate)}{selectedCase.dtpPlace ? ` · ${selectedCase.dtpPlace}` : ""}</span>}
                  {selectedCase.guiltInsuranceCompany && <span>СК: {selectedCase.guiltInsuranceCompany}</span>}
                </div>
              </div>
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-3">
            {DOC_TYPES.map(doc => (
              <div key={doc.key} className={`p-4 rounded-xl border transition-all ${selectedCase ? "border-border surface hover:border-electric/40" : "border-border/50 surface opacity-50"}`}>
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-9 h-9 rounded-xl bg-electric/10 flex items-center justify-center shrink-0">
                    <Icon name={doc.icon as IconName} size={17} className="text-electric" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-foreground leading-tight">{doc.label}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">По данным дела</div>
                  </div>
                </div>
                <button
                  disabled={!selectedCase}
                  onClick={() => selectedCase && setViewDoc({ title: doc.label, text: doc.generate(selectedCase) })}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-electric text-background rounded-lg text-xs font-medium hover:opacity-90 transition-opacity disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <Icon name="Eye" size={13} />
                  Сформировать
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── Archive tab ─── */}
      {activeTab === "static" && (
        <div className="space-y-3">
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
      )}
    </div>
  );
};
