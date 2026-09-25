import React, { useState, useEffect, useCallback } from "react";
import Icon from "@/components/ui/icon";
import type { CaseRecord, ClientRecord } from "@/types";
import { INSURANCE_COMPANIES } from "@/data/mockData";
import { clientsApi, casesApi } from "@/lib/api";

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

const fmtDate = (d: string | null) => d ? new Date(d).toLocaleDateString("ru-RU") : "";

// ───────── Insurance Select ─────────
export const InsuranceSelect = ({ value, onChange, placeholder = "Выбрать страховую..." }: {
  value: string; onChange: (v: string) => void; placeholder?: string;
}) => {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  const filtered = INSURANCE_COMPANIES.filter(c => c.toLowerCase().includes(search.toLowerCase()));

  useEffect(() => {
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
  vehicle: "", vehiclePlate: "",
  policyNumber: "", insuranceCompany: "",
  court: "", deadline: "", priority: "medium" as "high" | "medium" | "low",
  driverFullName: "", driverBirthDate: "", driverAddress: "", driverInsuranceCompany: "",
  dtpDate: "", dtpPlace: "",
  guiltFullName: "", guiltBirthDate: "", guiltAddress: "", guiltPhone: "",
  guiltOwnerName: "", guiltOwnerAddress: "",
  guiltVehicle: "", guiltVehiclePlate: "", guiltInsuranceCompany: "", guiltPolicyNumber: "",
  amount: "", contractNumber: "", contractDate: "", circumstances: "", desiredResult: "",
};

const NewCaseModal = ({ clients, onClose, onSaved }: { clients: ClientRecord[]; onClose: () => void; onSaved: () => void }) => {
  const [form, setForm] = useState(emptyForm);
  const [step, setStep] = useState(0);
  const [clientSearch, setClientSearch] = useState("");
  const [saving, setSaving] = useState(false);

  const set = (k: keyof typeof emptyForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const filteredClients = clients.filter(c =>
    c.name.toLowerCase().includes(clientSearch.toLowerCase()) && c.status !== "closed"
  );

  const selectClient = (client: ClientRecord) => {
    setForm(f => ({ ...f, clientId: String(client.id) }));
    setClientSearch(client.name);
  };

  const selectedClient = clients.find(c => String(c.id) === form.clientId);

  const steps = [
    {
      title: "Клиент и ДТП",
      icon: "Users",
      fields: (
        <div className="space-y-4">
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">Выбрать клиента из справочника <span className="text-red-400">*</span></label>
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
                  ? <div className="p-3 text-sm text-muted-foreground">Клиент не найден. Сначала добавьте его во вкладке «Клиенты».</div>
                  : filteredClients.map(c => (
                    <button key={c.id} onClick={() => selectClient(c)}
                      className="w-full flex items-center gap-3 p-3 hover:bg-surface-3 transition-colors text-left border-b border-border/50 last:border-0">
                      <div className="w-8 h-8 rounded-lg bg-electric/10 flex items-center justify-center shrink-0">
                        <span className="text-electric font-bold text-sm">{c.name[0]}</span>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-foreground">{c.name}</div>
                        <div className="text-xs text-muted-foreground">{c.client_type} · {c.phone}</div>
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
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Водитель ТС клиента (если отличается)</div>
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
            </div>
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
            <label className="text-xs text-muted-foreground mb-1.5 block">Страховая компания клиента</label>
            <InsuranceSelect value={form.insuranceCompany} onChange={v => setForm(f => ({ ...f, insuranceCompany: v }))} />
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
    {
      title: "Договор",
      icon: "FileSignature",
      fields: (
        <div className="space-y-4">
          <p className="text-xs text-muted-foreground">Эти данные нужны для документа «Договор оказания услуг». Можно заполнить позже.</p>
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">Сумма услуг, ₽</label>
            <input type="number" value={form.amount} onChange={set("amount")} placeholder="150000" className={inputCls} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Номер договора</label>
              <input value={form.contractNumber} onChange={set("contractNumber")} placeholder="12" className={inputCls} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Дата договора</label>
              <input type="date" value={form.contractDate} onChange={set("contractDate")} className={inputCls} />
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">Предмет услуг / обстоятельства</label>
            <textarea value={form.circumstances} onChange={set("circumstances")} rows={3}
              placeholder="Оказание юридических услуг по взысканию страхового возмещения..." className={inputCls} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">Ожидаемый результат</label>
            <textarea value={form.desiredResult} onChange={set("desiredResult")} rows={2}
              placeholder="Полное возмещение ущерба" className={inputCls} />
          </div>
        </div>
      ),
    },
  ];

  const isLast = step === steps.length - 1;
  const canSubmit = form.clientId !== "";

  const handleSave = async () => {
    if (!canSubmit || saving) return;
    setSaving(true);
    try {
      await casesApi.create({
        client_id: Number(form.clientId),
        title: selectedClient?.name || "Новое дело",
        category: "Страховые споры",
        status: "active",
        priority: form.priority,
        deadline: form.deadline || undefined,
        court: form.court,
        vehicle: form.vehicle, vehicle_plate: form.vehiclePlate,
        policy_number: form.policyNumber, insurance_company: form.insuranceCompany,
        driver_full_name: form.driverFullName, driver_birth_date: form.driverBirthDate || undefined,
        driver_address: form.driverAddress, driver_insurance_company: form.driverInsuranceCompany,
        incident_date: form.dtpDate || undefined, incident_place: form.dtpPlace,
        guilt_full_name: form.guiltFullName, guilt_birth_date: form.guiltBirthDate || undefined,
        guilt_address: form.guiltAddress, guilt_phone: form.guiltPhone,
        guilt_owner_name: form.guiltOwnerName, guilt_owner_address: form.guiltOwnerAddress,
        guilt_vehicle: form.guiltVehicle, guilt_vehicle_plate: form.guiltVehiclePlate,
        guilt_insurance_company: form.guiltInsuranceCompany, guilt_policy_number: form.guiltPolicyNumber,
        amount: form.amount ? Number(form.amount) : undefined,
        contract_number: form.contractNumber, contract_date: form.contractDate || undefined,
        circumstances: form.circumstances, desired_result: form.desiredResult,
      });
      onSaved();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-surface border border-border rounded-2xl shadow-2xl animate-scale-in overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h3 className="font-bold text-foreground text-lg">Новое дело</h3>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-surface-2 transition-colors text-muted-foreground hover:text-foreground">
            <Icon name="X" size={18} />
          </button>
        </div>

        <div className="flex border-b border-border px-2">
          {steps.map((s, i) => (
            <div key={s.title} className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium border-b-2 transition-all ${i === step ? "border-electric text-electric" : i < step ? "border-transparent text-foreground" : "border-transparent text-muted-foreground"}`}>
              <Icon name={s.icon as IconName} size={13} />
              {s.title}
            </div>
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
                disabled={step === 0 && !canSubmit}
                className="flex items-center gap-2 px-4 py-2 bg-electric text-background rounded-xl text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Далее
                <Icon name="ChevronRight" size={16} />
              </button>
            )}
            {isLast && (
              <button
                onClick={handleSave}
                disabled={!canSubmit || saving}
                className="flex items-center gap-2 px-5 py-2 bg-electric text-background rounded-xl text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Icon name={saving ? "Loader2" : "Save"} size={16} className={saving ? "animate-spin" : ""} />
                {saving ? "Сохраняем..." : "Сохранить дело"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ───────── Case Card ─────────
const CaseCard = ({ c, client }: { c: CaseRecord; client?: ClientRecord }) => {
  const fmt = (label: string, value: string | null | undefined) => value ? (
    <div key={label}>
      <div className="text-xs text-muted-foreground mb-0.5">{label}</div>
      <div className="text-sm text-foreground">{value}</div>
    </div>
  ) : null;

  return (
    <div className="border-t border-border animate-fade-in p-4 space-y-5">
      {(c.incident_date || c.incident_place) && (
        <div className="flex gap-4 p-3 rounded-xl bg-surface-2 border border-border">
          <div className="flex items-center gap-2 text-sm">
            <Icon name="MapPin" size={14} className="text-electric shrink-0" />
            <span className="text-muted-foreground">ДТП:</span>
            <span className="text-foreground font-medium">
              {fmtDate(c.incident_date)}{c.incident_date && c.incident_place ? " · " : ""}{c.incident_place}
            </span>
          </div>
        </div>
      )}
      {client && (
        <div>
          <div className="text-xs font-semibold text-electric uppercase tracking-wider mb-3">Истец</div>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {fmt("ФИО", client.name)}
            {fmt("Дата рождения", fmtDate(client.birth_date))}
            {fmt("Адрес", client.address)}
            {fmt("Паспорт серия/номер", [client.passport_series, client.passport_number].filter(Boolean).join(" "))}
            {fmt("Кем выдан", client.passport_issued)}
            {fmt("Дата выдачи", fmtDate(client.passport_date))}
            {fmt("Транспортное средство", c.vehicle)}
            {fmt("Гос. номер", c.vehicle_plate)}
            {fmt("Полис ОСАГО", c.policy_number)}
            {fmt("Страховая компания истца", c.insurance_company)}
            {fmt("Суд", c.court)}
            {fmt("Дедлайн", fmtDate(c.deadline))}
          </div>
        </div>
      )}
      {(c.driver_full_name || c.driver_address || c.driver_insurance_company) && (
        <div className="border-t border-border pt-5">
          <div className="text-xs font-semibold text-yellow-400 uppercase tracking-wider mb-3">Водитель ТС клиента</div>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {fmt("ФИО водителя", c.driver_full_name)}
            {fmt("Дата рождения", fmtDate(c.driver_birth_date))}
            {fmt("Место проживания", c.driver_address)}
            {fmt("Страховая компания", c.driver_insurance_company)}
          </div>
        </div>
      )}
      {(c.guilt_full_name || c.guilt_vehicle || c.guilt_insurance_company) && (
        <div className="border-t border-border pt-5">
          <div className="text-xs font-semibold text-red-400 uppercase tracking-wider mb-3">Виновник ДТП</div>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {fmt("ФИО виновника", c.guilt_full_name)}
            {fmt("Дата рождения", fmtDate(c.guilt_birth_date))}
            {fmt("Адрес виновника", c.guilt_address)}
            {fmt("Телефон", c.guilt_phone)}
            {fmt("Собственник ТС", c.guilt_owner_name)}
            {fmt("Адрес собственника", c.guilt_owner_address)}
            {fmt("ТС виновника", c.guilt_vehicle)}
            {fmt("Гос. номер ТС виновника", c.guilt_vehicle_plate)}
            {fmt("Страховая компания виновника", c.guilt_insurance_company)}
            {fmt("Полис виновника", c.guilt_policy_number)}
          </div>
        </div>
      )}
      <div className="border-t border-border pt-4 flex items-center gap-2 text-xs text-muted-foreground">
        <Icon name="FileText" size={13} />
        Готовые документы формируются во вкладке «Документы» по этому делу
      </div>
    </div>
  );
};

// ───────── Section: Cases ─────────
const CasesSection = () => {
  const [cases, setCases] = useState<CaseRecord[]>([]);
  const [clients, setClients] = useState<ClientRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [expanded, setExpanded] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [casesData, clientsData] = await Promise.all([casesApi.list(), clientsApi.list()]);
      setCases(casesData);
      setClients(clientsData);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось загрузить дела");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const clientById = (id: number) => clients.find(c => c.id === id);

  const filters = [
    { key: "all", label: "Все" },
    { key: "active", label: "Активные" },
    { key: "urgent", label: "Срочные" },
    { key: "pending", label: "Ожидание" },
    { key: "closed", label: "Закрытые" },
  ];
  const filtered = filter === "all" ? cases : cases.filter(c => c.status === filter);

  return (
    <div className="space-y-4 animate-fade-in">
      {showModal && <NewCaseModal clients={clients} onClose={() => setShowModal(false)} onSaved={() => { setShowModal(false); load(); }} />}

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

      {loading && (
        <div className="flex items-center justify-center py-20">
          <Icon name="Loader2" size={24} className="text-muted-foreground animate-spin" />
        </div>
      )}

      {!loading && error && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Icon name="AlertTriangle" size={24} className="text-red-400 mb-2" />
          <div className="text-sm text-muted-foreground">{error}</div>
          <button onClick={load} className="mt-3 px-4 py-2 bg-surface-2 rounded-xl text-sm text-muted-foreground hover:text-foreground transition-colors">
            Повторить
          </button>
        </div>
      )}

      {!loading && !error && filtered.length === 0 && (
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

      {!loading && !error && filtered.length > 0 && (
        <div className="space-y-3">
          {filtered.map(c => {
            const client = clientById(c.client_id);
            return (
              <div key={c.id} className="rounded-xl border border-border surface hover:border-electric/30 transition-colors overflow-hidden">
                <button
                  className="w-full flex items-center justify-between gap-3 p-4 text-left"
                  onClick={() => setExpanded(expanded === c.id ? null : c.id)}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-electric/10 flex items-center justify-center shrink-0">
                      <span className="text-electric font-bold">{(client?.name || "?")[0]}</span>
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <PriorityDot priority={c.priority} />
                        <h3 className="font-semibold text-foreground truncate">{client?.name || c.title}</h3>
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2">
                        {c.vehicle && <span>{c.vehicle}</span>}
                        {c.insurance_company && <><span>·</span><span>{c.insurance_company}</span></>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <StatusBadge status={c.status} />
                    <Icon name={expanded === c.id ? "ChevronUp" : "ChevronDown"} size={16} className="text-muted-foreground" />
                  </div>
                </button>
                {expanded === c.id && <CaseCard c={c} client={client} />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CasesSection;