import React, { useState, useEffect, useCallback } from "react";
import Icon from "@/components/ui/icon";
import type { CaseRecord, ClientRecord, DocTypeKey } from "@/types";
import { casesApi, clientsApi, documentsApi } from "@/lib/api";

type IconName = Parameters<typeof Icon>[0]["name"];

const fmtDate = (d: string | null) => d ? new Date(d).toLocaleDateString("ru-RU") : "";

const DOC_TYPES: { key: DocTypeKey; label: string; icon: IconName; hint: string }[] = [
  { key: "zayavlenie", label: "Заявление в СК", icon: "FileText", hint: "Первичное заявление о страховой выплате" },
  { key: "pretenziya", label: "Претензия в СК", icon: "AlertOctagon", hint: "Досудебная претензия с требованием выплаты" },
  { key: "utochnenie", label: "Уточнённое заявление в СК", icon: "FilePen", hint: "Уточнённый иск с обновлёнными требованиями" },
  { key: "dogovor", label: "Договор оказания услуг", icon: "FileSignature", hint: "Договор с клиентом на юридические услуги" },
];

// ───────── Case Picker ─────────
const CasePicker = ({ cases, clients, value, onChange }: {
  cases: CaseRecord[];
  clients: ClientRecord[];
  value: CaseRecord | null;
  onChange: (c: CaseRecord | null) => void;
}) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const clientName = (clientId: number) => clients.find(c => c.id === clientId)?.name || "Без клиента";
  const filtered = cases.filter(c => clientName(c.client_id).toLowerCase().includes(search.toLowerCase()));
  const valueClient = value ? clients.find(c => c.id === value.client_id) : null;

  return (
    <div ref={ref} className="relative">
      <div
        className="flex items-center gap-2 px-3 py-2.5 bg-surface-2 border border-border rounded-xl cursor-pointer hover:border-electric/50 transition-colors"
        onClick={() => setOpen(o => !o)}
      >
        <Icon name="Briefcase" size={15} className="text-muted-foreground shrink-0" />
        <span className={`flex-1 text-sm truncate ${value ? "text-foreground" : "text-muted-foreground"}`}>
          {value ? clientName(value.client_id) : "Выбрать дело..."}
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
                placeholder="Поиск по клиенту..."
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
                  <div className="font-medium">{clientName(c.client_id)}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {c.vehicle && <span>{c.vehicle}</span>}
                    {c.incident_date && <span className="ml-2">· ДТП {fmtDate(c.incident_date)}</span>}
                  </div>
                </button>
              ))
            }
          </div>
        </div>
      )}
      {valueClient && (
        <div className="mt-2 p-3 rounded-xl border border-electric/20 bg-electric/5 flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-electric/10 flex items-center justify-center shrink-0 mt-0.5">
            <span className="text-electric font-bold text-sm">{valueClient.name[0]}</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-foreground">{valueClient.name}</div>
            <div className="text-xs text-muted-foreground mt-0.5 flex flex-wrap gap-x-3">
              {value?.vehicle && <span>{value.vehicle} · {value.vehicle_plate}</span>}
              {value?.incident_date && <span>ДТП: {fmtDate(value.incident_date)}{value.incident_place ? ` · ${value.incident_place}` : ""}</span>}
              {value?.guilt_insurance_company && <span>СК: {value.guilt_insurance_company}</span>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ───────── Doc Type Card ─────────
const DocTypeCard = ({ docType, selectedCase, onGenerated }: {
  docType: typeof DOC_TYPES[number];
  selectedCase: CaseRecord | null;
  onGenerated: (docType: DocTypeKey, result: { title: string; docx_url: string; pdf_url: string }) => void;
}) => {
  const [checking, setChecking] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [missing, setMissing] = useState<string[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMissing(null);
    setError(null);
    if (!selectedCase) return;
    setChecking(true);
    documentsApi.checkFields(docType.key, selectedCase.id)
      .then(res => setMissing(res.missing_fields))
      .catch(() => setMissing(null))
      .finally(() => setChecking(false));
  }, [selectedCase, docType.key]);

  const handleGenerate = async () => {
    if (!selectedCase || generating) return;
    setGenerating(true);
    setError(null);
    try {
      const result = await documentsApi.generate(docType.key, selectedCase.id);
      onGenerated(docType.key, result);
    } catch (e) {
      const err = e as Error & { missing_fields?: string[] };
      if (err.missing_fields) setMissing(err.missing_fields);
      setError(err.message || "Не удалось сформировать документ");
    } finally {
      setGenerating(false);
    }
  };

  const canGenerate = selectedCase && !checking && (missing === null || missing.length === 0);

  return (
    <div className={`p-4 rounded-xl border transition-all ${selectedCase ? "border-border surface hover:border-electric/40" : "border-border/50 surface opacity-50"}`}>
      <div className="flex items-start gap-3 mb-3">
        <div className="w-9 h-9 rounded-xl bg-electric/10 flex items-center justify-center shrink-0">
          <Icon name={docType.icon} size={17} className="text-electric" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-foreground leading-tight">{docType.label}</div>
          <div className="text-xs text-muted-foreground mt-0.5">{docType.hint}</div>
        </div>
      </div>

      {selectedCase && checking && (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
          <Icon name="Loader2" size={12} className="animate-spin" />
          Проверка данных...
        </div>
      )}

      {selectedCase && !checking && missing && missing.length > 0 && (
        <div className="mb-3 p-2.5 rounded-lg bg-yellow-400/10 border border-yellow-400/20">
          <div className="flex items-center gap-1.5 text-xs font-medium text-yellow-400 mb-1">
            <Icon name="AlertTriangle" size={12} />
            Не хватает данных
          </div>
          <ul className="text-xs text-muted-foreground space-y-0.5">
            {missing.map(m => <li key={m}>· {m}</li>)}
          </ul>
        </div>
      )}

      {error && (
        <div className="mb-3 p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-400">
          {error}
        </div>
      )}

      <button
        disabled={!canGenerate || generating}
        onClick={handleGenerate}
        className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-electric text-background rounded-lg text-xs font-medium hover:opacity-90 transition-opacity disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <Icon name={generating ? "Loader2" : "Sparkles"} size={13} className={generating ? "animate-spin" : ""} />
        {generating ? "Формируем..." : "Сформировать"}
      </button>
    </div>
  );
};

// ───────── Generated Result Modal ─────────
const ResultModal = ({ title, docxUrl, pdfUrl, onClose }: { title: string; docxUrl: string; pdfUrl: string; onClose: () => void }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
    <div className="relative w-full max-w-sm bg-surface border border-border rounded-2xl shadow-2xl animate-scale-in p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center shrink-0">
          <Icon name="CheckCircle2" size={18} className="text-green-400" />
        </div>
        <div>
          <div className="font-bold text-foreground">Документ готов</div>
          <div className="text-sm text-muted-foreground mt-0.5">{title}</div>
        </div>
      </div>
      <div className="flex flex-col gap-2 mb-4">
        <a href={docxUrl} download target="_blank" rel="noreferrer"
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-electric text-background rounded-xl text-sm font-medium hover:opacity-90 transition-opacity">
          <Icon name="FileDown" size={15} />
          Скачать Word (.docx)
        </a>
        <a href={pdfUrl} download target="_blank" rel="noreferrer"
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-surface-2 text-foreground rounded-xl text-sm font-medium hover:bg-surface-3 transition-colors">
          <Icon name="FileDown" size={15} />
          Скачать PDF
        </a>
      </div>
      <button onClick={onClose} className="w-full px-4 py-2 bg-surface-2 text-muted-foreground rounded-xl text-sm font-medium hover:text-foreground transition-colors">
        Закрыть
      </button>
    </div>
  </div>
);

// ───────── Section: Documents ─────────
export const DocumentsSection = () => {
  const [cases, setCases] = useState<CaseRecord[]>([]);
  const [clients, setClients] = useState<ClientRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCase, setSelectedCase] = useState<CaseRecord | null>(null);
  const [result, setResult] = useState<{ title: string; docx_url: string; pdf_url: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [casesData, clientsData] = await Promise.all([casesApi.list(), clientsApi.list()]);
      setCases(casesData);
      setClients(clientsData);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-4 animate-fade-in">
      {result && (
        <ResultModal title={result.title} docxUrl={result.docx_url} pdfUrl={result.pdf_url} onClose={() => setResult(null)} />
      )}

      <div>
        <h2 className="text-xl font-bold text-foreground">Документы</h2>
        <p className="text-sm text-muted-foreground">Выберите дело и тип документа — он соберётся автоматически по утверждённому шаблону</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Icon name="Loader2" size={24} className="text-muted-foreground animate-spin" />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="p-4 rounded-xl border border-border bg-surface-2">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">
              Выберите дело
            </label>
            <CasePicker cases={cases} clients={clients} value={selectedCase} onChange={setSelectedCase} />
            {!selectedCase && (
              <p className="text-xs text-muted-foreground mt-2">
                Данные подставятся автоматически: ФИО, паспорт, адрес, ТС, полис, виновник ДТП, дата и место происшествия.
              </p>
            )}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {DOC_TYPES.map(docType => (
              <DocTypeCard
                key={docType.key}
                docType={docType}
                selectedCase={selectedCase}
                onGenerated={(_key, res) => setResult(res)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
