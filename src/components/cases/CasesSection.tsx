import React, { useState } from "react";
import Icon from "@/components/ui/icon";
import type { Case, Client } from "@/types";
import { CLIENTS, CASES, INSURANCE_COMPANIES } from "@/data/mockData";

type IconName = Parameters<typeof Icon>[0]["name"];

const inputCls = "w-full px-3 py-2.5 bg-surface-2 border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-electric transition-colors";

// ───────── Helper ─────────
const StatusBadge = ({ status }: { status: string }) => {
  const map: Record<string, { label: string; cls: string }> = {
    urgent: { label: "Срочно", cls: "badge-urgent" },
    active: { label: "Активно", cls: "badge-active" },
    pending: { label: "Ожидание", cls: "badge-pending" },
    closed: { label: "Закрыто", cls: "bg-muted text-muted-foreground border border-border" },
  };
  const s = map[status] || { label: status, cls: "badge-info" };
  return <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${s.cls}`}>{s.label}</span>;
};

const PriorityDot = ({ priority }: { priority: string }) => {
  const colors: Record<string, string> = { high: "bg-red-500", medium: "bg-yellow-400", low: "bg-green-500" };
  return <span className={`inline-block w-2 h-2 rounded-full ${colors[priority] || "bg-gray-400"} animate-pulse-dot`} />;
};

// ───────── Insurance Select ─────────
export const InsuranceSelect = ({ value, onChange, placeholder = "Выбрать страховую..." }: {
  value: string; onChange: (v: string) => void; placeholder?: string;
}) => {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  const filtered = INSURANCE_COMPANIES.filter(c => c.toLowerCase().includes(search.toLowerCase()));

  React.useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <div className={`${inputCls} flex items-center gap-2 cursor-pointer`} onClick={() => setOpen(o => !o)}>
        <span className={value ? "text-foreground flex-1 truncate" : "text-muted-foreground flex-1"}>{value || placeholder}</span>
        {value && <button onClick={e => { e.stopPropagation(); onChange(""); setSearch(""); }} className="text-muted-foreground hover:text-foreground shrink-0"><Icon name="X" size={13} /></button>}
        <Icon name={open ? "ChevronUp" : "ChevronDown"} size={14} className="text-muted-foreground shrink-0" />
      </div>
      {open && (
        <div className="absolute z-50 top-full mt-1 w-full bg-surface border border-border rounded-xl shadow-xl overflow-hidden">
          <div className="p-2 border-b border-border">
            <div className="relative">
              <Icon name="Search" size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input autoFocus value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Поиск..." className="w-full pl-7 pr-3 py-1.5 bg-surface-2 rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none" />
            </div>
          </div>
          <div className="max-h-52 overflow-y-auto">
            {filtered.length === 0
              ? <div className="px-3 py-2.5 text-sm text-muted-foreground">Не найдено</div>
              : filtered.map(c => (
                <button key={c} onClick={() => { onChange(c); setSearch(""); setOpen(false); }}
                  className={`w-full text-left px-3 py-2 text-sm transition-colors hover:bg-surface-2 ${value === c ? "text-electric font-medium" : "text-foreground"}`}>
                  {c}
                </button>
              ))
            }
          </div>
        </div>
      )}
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
  driverFullName: "", driverBirthDate: "", driverAddress: "", driverInsuranceCompany: "",
  dtpDate: "", dtpPlace: "",
  guiltFullName: "", guiltBirthDate: "", guiltAddress: "", guiltPhone: "",
  guiltOwnerName: "", guiltOwnerAddress: "",
  guiltVehicle: "", guiltVehiclePlate: "", guiltInsuranceCompany: "", guiltPolicyNumber: "",
};

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
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">ДТП</div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">Дата ДТП</label>
                <input type="date" value={form.dtpDate} onChange={set("dtpDate")} className={inputCls} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">Место ДТП</label>
                <input value={form.dtpPlace} onChange={set("dtpPlace")} placeholder="г. Москва, ул. Ленина" className={inputCls} />
              </div>
            </div>
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
          <div className="border-t border-border pt-4">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Водитель ТС клиента</div>
            <div className="space-y-3">
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
                <InsuranceSelect value={form.driverInsuranceCompany} onChange={v => setForm(f => ({ ...f, driverInsuranceCompany: v }))} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">Номер полиса</label>
                <input value={form.policyNumber} onChange={set("policyNumber")} placeholder="ААА 1234567890" className={inputCls} />
              </div>
            </div>
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
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">Телефон виновника</label>
            <input value={form.guiltPhone} onChange={set("guiltPhone")} placeholder="+7 999 000-00-00" className={inputCls} />
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
            <InsuranceSelect value={form.guiltInsuranceCompany} onChange={v => setForm(f => ({ ...f, guiltInsuranceCompany: v }))} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">Номер полиса виновника</label>
            <input value={form.guiltPolicyNumber} onChange={set("guiltPolicyNumber")} placeholder="ЕЕЕ 9876543210" className={inputCls} />
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
      dtpDate: form.dtpDate, dtpPlace: form.dtpPlace,
      guiltFullName: form.guiltFullName, guiltBirthDate: form.guiltBirthDate,
      guiltAddress: form.guiltAddress, guiltPhone: form.guiltPhone,
      guiltOwnerName: form.guiltOwnerName, guiltOwnerAddress: form.guiltOwnerAddress,
      guiltVehicle: form.guiltVehicle, guiltVehiclePlate: form.guiltVehiclePlate,
      guiltInsuranceCompany: form.guiltInsuranceCompany, guiltPolicyNumber: form.guiltPolicyNumber,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-surface border border-border rounded-2xl shadow-2xl animate-scale-in overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div>
            <h3 className="font-bold text-foreground text-lg">Новое дело</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Шаг {step + 1} из {steps.length} — {steps[step].title}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-surface-2 transition-colors text-muted-foreground hover:text-foreground">
            <Icon name="X" size={18} />
          </button>
        </div>

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

        <div className="p-5 animate-fade-in overflow-y-auto max-h-[60vh]">
          {steps[step].fields}
        </div>

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
  const dtpDate = c.dtpDate ? new Date(c.dtpDate).toLocaleDateString("ru-RU") : "________";
  const driverBlock = c.driverFullName
    ? `\nВодитель транспортного средства истца: ${c.driverFullName}, дата рождения: ${driverBd} г.,\nадрес: ${c.driverAddress || "________________"}, страховая компания: ${c.driverInsuranceCompany || "________________"}, полис № ${c.policyNumber || "________________"}.\n`
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

«${dtpDate}» в ${c.dtpPlace || "________________"} произошло дорожно-транспортное происшествие с участием моего транспортного средства. Виновником ДТП является:
— ${c.guiltFullName || "________________"}, дата рождения: ${gbd} г.,
  адрес проживания: ${c.guiltAddress || "________________"}${c.guiltPhone ? `, тел.: ${c.guiltPhone}` : ""};
— транспортное средство виновника: ${c.guiltVehicle || "________________"},
  государственный регистрационный знак: ${c.guiltVehiclePlate || "________________"};
— собственник транспортного средства: ${owner},
  адрес: ${ownerAddr};
— страховая компания виновника: ${c.guiltInsuranceCompany || "________________"},
  полис ОСАГО № ${c.guiltPolicyNumber || "________________"}.

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
          {(c.dtpDate || c.dtpPlace) && (
            <div className="flex gap-4 p-3 rounded-xl bg-surface-2 border border-border">
              <div className="flex items-center gap-2 text-sm">
                <Icon name="MapPin" size={14} className="text-electric shrink-0" />
                <span className="text-muted-foreground">ДТП:</span>
                <span className="text-foreground font-medium">
                  {c.dtpDate ? new Date(c.dtpDate).toLocaleDateString("ru-RU") : ""}
                  {c.dtpDate && c.dtpPlace ? " · " : ""}
                  {c.dtpPlace}
                </span>
              </div>
            </div>
          )}
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
                {fmt("Телефон", c.guiltPhone)}
                {fmt("Собственник ТС", c.guiltOwnerName)}
                {fmt("Адрес собственника", c.guiltOwnerAddress)}
                {fmt("ТС виновника", c.guiltVehicle)}
                {fmt("Гос. номер ТС виновника", c.guiltVehiclePlate)}
                {fmt("Страховая компания виновника", c.guiltInsuranceCompany)}
                {fmt("Полис виновника", c.guiltPolicyNumber)}
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

export default CasesSection;
