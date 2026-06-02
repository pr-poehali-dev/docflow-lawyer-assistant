import type { Client, Case, Document, Task, CalEvent, Notification, ReviewedCase, Payment, SystemUser } from "@/types";

export const CLIENTS: Client[] = [
  { id: 1, name: "ООО «Альфа Строй»", phone: "+7 495 123-45-67", email: "info@alfa-stroy.ru", type: "Юридическое лицо", cases: 3, lastContact: "01.06.2026", status: "active" },
  { id: 2, name: "Петров Андрей Николаевич", phone: "+7 916 234-56-78", email: "petrov@mail.ru", type: "Физическое лицо", cases: 1, lastContact: "28.05.2026", status: "active" },
  { id: 3, name: "ИП Сидорова Мария", phone: "+7 903 345-67-89", email: "sidorova@biz.ru", type: "ИП", cases: 2, lastContact: "25.05.2026", status: "new" },
  { id: 4, name: "АО «ТехноПром»", phone: "+7 495 456-78-90", email: "legal@technoprom.ru", type: "Юридическое лицо", cases: 5, lastContact: "20.05.2026", status: "active" },
  { id: 5, name: "Козлов Виктор Павлович", phone: "+7 926 567-89-01", email: "kozlov@gmail.com", type: "Физическое лицо", cases: 1, lastContact: "15.05.2026", status: "closed" },
];

export const CASES: Case[] = [];

export const DOCUMENTS: Document[] = [
  { id: 1, title: "Исковое заявление о взыскании задолженности", case: "Взыскание задолженности по аренде", type: "Иск", version: 3, updated: "01.06.2026", size: "124 КБ", status: "final" },
  { id: 2, title: "Договор поставки (анализ)", case: "Корпоративный спор", type: "Аналитика", version: 2, updated: "31.05.2026", size: "87 КБ", status: "review" },
  { id: 3, title: "Апелляционная жалоба", case: "Трудовой спор", type: "Жалоба", version: 1, updated: "30.05.2026", size: "56 КБ", status: "draft" },
  { id: 4, title: "Due Diligence отчёт", case: "Сопровождение M&A", type: "Отчёт", version: 4, updated: "29.05.2026", size: "2.3 МБ", status: "review" },
  { id: 5, title: "Правовое заключение по товарному знаку", case: "Регистрация товарного знака", type: "Заключение", version: 1, updated: "27.05.2026", size: "43 КБ", status: "draft" },
];

export const TASKS: Task[] = [
  { id: 1, title: "Подготовить ходатайство об отсрочке", case: "Корпоративный спор", deadline: "03.06.2026", priority: "high", done: false, category: "Процессуальные" },
  { id: 2, title: "Запросить выписку из ЕГРЮЛ", case: "Сопровождение M&A", deadline: "04.06.2026", priority: "high", done: false, category: "Документы" },
  { id: 3, title: "Провести переговоры с контрагентом", case: "Взыскание задолженности", deadline: "06.06.2026", priority: "medium", done: false, category: "Переговоры" },
  { id: 4, title: "Подать документы в Роспатент", case: "Регистрация ТЗ", deadline: "10.06.2026", priority: "medium", done: true, category: "Документы" },
  { id: 5, title: "Ознакомиться с материалами дела", case: "Трудовой спор", deadline: "07.06.2026", priority: "low", done: false, category: "Анализ" },
  { id: 6, title: "Составить проект мирового соглашения", case: "Взыскание задолженности", deadline: "12.06.2026", priority: "medium", done: false, category: "Переговоры" },
];

export const EVENTS: CalEvent[] = [
  { id: 1, title: "Предварительное заседание", type: "court", date: "05.06.2026", time: "10:00", client: "ООО «Альфа Строй»", location: "Арбитражный суд, зал 12" },
  { id: 2, title: "Встреча с клиентом", type: "meeting", date: "04.06.2026", time: "14:30", client: "АО «ТехноПром»", location: "Офис клиента" },
  { id: 3, title: "Дедлайн: ходатайство", type: "deadline", date: "03.06.2026", time: "18:00", client: "ООО «Альфа Строй»" },
  { id: 4, title: "Телефонная консультация", type: "call", date: "06.06.2026", time: "11:00", client: "Петров А.Н." },
  { id: 5, title: "Основное заседание суда", type: "court", date: "15.06.2026", time: "09:30", client: "АО «ТехноПром»", location: "Пресненский суд, зал 5" },
];

export const NOTIFICATIONS: Notification[] = [
  { id: 1, text: "Через 3 дня заседание по делу «Альфа Строй»", type: "urgent", time: "Сейчас" },
  { id: 2, text: "Дедлайн по ходатайству — завтра в 18:00", type: "urgent", time: "1ч назад" },
  { id: 3, text: "Петров А.Н. ожидает ответа по делу", type: "warning", time: "3ч назад" },
  { id: 4, text: "Документ «Due Diligence» отправлен на проверку", type: "info", time: "Вчера" },
];

export const REVIEWED_CASES: ReviewedCase[] = [
  { id: 1, title: "Признание сделки недействительной", client: "Козлов Виктор Павлович", category: "Гражданское право", closedDate: "15.04.2026", result: "won", court: "Тверской районный суд", duration: "8 мес.", amount: "2 400 000 ₽" },
  { id: 2, title: "Взыскание неустойки по договору подряда", client: "ООО «Альфа Строй»", category: "Корпоративное право", closedDate: "02.03.2026", result: "settled", court: "Арбитражный суд г. Москвы", duration: "5 мес.", amount: "850 000 ₽" },
  { id: 3, title: "Оспаривание штрафа налоговой", client: "АО «ТехноПром»", category: "Налоговое право", closedDate: "20.01.2026", result: "won", court: "9-й ААС", duration: "3 мес.", amount: "1 100 000 ₽" },
  { id: 4, title: "Раздел имущества супругов", client: "Петров Андрей Николаевич", category: "Семейное право", closedDate: "10.12.2025", result: "lost", court: "Хамовнический суд", duration: "11 мес." },
  { id: 5, title: "Защита деловой репутации", client: "ИП Сидорова Мария", category: "Гражданское право", closedDate: "05.11.2025", result: "withdrawn", court: "Мещанский суд", duration: "2 мес." },
];

export const PAYMENTS: Payment[] = [
  { id: 1, client: "АО «ТехноПром»", case: "Сопровождение M&A сделки", amount: 350000, date: "01.06.2026", status: "paid", type: "retainer", comment: "Аванс по договору" },
  { id: 2, client: "ООО «Альфа Строй»", case: "Корпоративный спор", amount: 120000, date: "28.05.2026", status: "overdue", type: "hourly", comment: "За май 2026" },
  { id: 3, client: "ИП Сидорова Мария", case: "Регистрация товарного знака", amount: 45000, date: "25.05.2026", status: "paid", type: "consultation" },
  { id: 4, client: "Петров Андрей Николаевич", case: "Трудовой спор", amount: 80000, date: "20.06.2026", status: "pending", type: "retainer", comment: "2-й транш" },
  { id: 5, client: "АО «ТехноПром»", case: "Взыскание задолженности", amount: 200000, date: "15.06.2026", status: "partial", type: "success_fee", comment: "Оплачено 100 000 ₽" },
  { id: 6, client: "Козлов Виктор Павлович", case: "Признание сделки", amount: 180000, date: "20.04.2026", status: "paid", type: "success_fee", comment: "Гонорар успеха" },
];

export const SYSTEM_USERS: SystemUser[] = [
  { id: 1, name: "Ледюкова Диана", email: "ledyukova@lexoffice.ru", role: "admin", status: "active", lastLogin: "Сегодня, 09:15", cases: 0, avatar: "Д" },
  { id: 2, name: "Сапрыкина Людмила", email: "saprykina@lexoffice.ru", role: "lawyer", status: "active", lastLogin: "Сегодня, 08:40", cases: 0, avatar: "Л" },
];

export const INSURANCE_COMPANIES = [
  "ПАО СК \"РОСГОССТРАХ\"",
  "ООО СК \"СБЕРБАНК СТРАХОВАНИЕ\"",
  "ПАО \"ГРУППА РЕНЕССАНС СТРАХОВАНИЕ\"",
  "САО «ВСК»",
  "ООО \"СК \"СОГЛАСИЕ\"",
  "СПАО \"ИНГОССТРАХ\"",
  "АО \"СОГАЗ\"",
  "АО \"АЛЬФАСТРАХОВАНИЕ\"",
  "САО \"РЕСО-ГАРАНТИЯ\"",
  "АО \"Т-СТРАХОВАНИЕ\"",
  "ПАО \"САК \"ЭНЕРГОГАРАНТ\"",
  "АО \"МАКС\"",
  "ООО \"АБСОЛЮТ СТРАХОВАНИЕ\"",
  "АО \"СК \"АСТРО-ВОЛГА\"",
  "Ответственность не застрахована",
  "МКУ \"СЛУЖБА АВТОМОБИЛЬНЫХ ДОРОГ\"",
  "Российский союз автостраховщиков",
  "ООО \"ПРОМИНСТРАХ\"",
  "ООО \"СФ \"АДОНИС\"",
  "ООО Страховая Компания \"Гелиос\"",
  "АО \"СК ГАЙДЕ\"",
  "АО \"ОСК\"",
  "ОАО \"СК \"РЕГИОНГАРАНТ\"",
  "ООО \"ЮЖУРАЛ-АСКО\"",
  "АО \"СК \"ПАРИ\"",
  "ОАО СК \"ЭНИ\"",
  "САО \"НАДЕЖДА\"",
  "ООО РСО \"ЕВРОИНС\"",
  "ООО СК \"ПАРИТЕТ - СК\"",
  "АО СГ \"СПАССКИЕ ВОРОТА\"",
  "ОАО СК \"БАСК\"",
  "АО \"БОРОВИЦКОЕ СТРАХОВОЕ ОБЩЕСТВО\"",
  "АО СК \"ЧУЛПАН\"",
  "Администрация Петропавловск-Камчатского городского округа",
  "АО \"ГСК \"ЮГОРИЯ\"",
];
