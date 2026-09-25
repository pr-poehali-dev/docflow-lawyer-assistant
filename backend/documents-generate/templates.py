"""Библиотека утверждённых шаблонов документов.
Каждый шаблон возвращает список «блоков» — универсальное представление,
которое затем рендерится и в DOCX, и в PDF одинаково.
"""
from datetime import datetime

FIRM_NAME = "ООО «ЛексОфис»"
PLACEHOLDER = "________________"


def fmt_date(value):
    if not value:
        return PLACEHOLDER
    try:
        d = value if isinstance(value, str) else str(value)
        parsed = datetime.strptime(d[:10], "%Y-%m-%d")
        return parsed.strftime("%d.%m.%Y")
    except Exception:
        return str(value)


def g(data, key, default=None):
    val = data.get(key)
    if val in (None, ''):
        return default if default is not None else PLACEHOLDER
    return val


def block(text, align="left", bold=False, size=11, spacing_after=8, italic=False):
    return {"text": text, "align": align, "bold": bold, "size": size, "spacing_after": spacing_after, "italic": italic}


def passport_str(data):
    series = data.get('passport_series') or ''
    number = data.get('passport_number') or ''
    joined = (series + " " + number).strip()
    return joined if joined else PLACEHOLDER


def money(value):
    if value in (None, ''):
        return PLACEHOLDER
    try:
        return f"{float(value):,.2f}".replace(",", " ").replace(".", ",") + " руб."
    except Exception:
        return str(value)


# ───────── Заявление в СК ─────────
def zayavlenie(data):
    today = datetime.now().strftime("%d.%m.%Y")
    owner = g(data, 'guilt_owner_name', g(data, 'guilt_full_name'))
    owner_addr = g(data, 'guilt_owner_address', g(data, 'guilt_address'))
    blocks = [
        block(f"Страховая компания: {g(data, 'guilt_insurance_company')}", align="right", spacing_after=2),
        block(f"От: {g(data, 'name')}", align="right", spacing_after=2),
        block(f"Дата рождения: {fmt_date(data.get('birth_date'))} г.", align="right", spacing_after=2),
        block(f"Адрес: {g(data, 'address')}", align="right", spacing_after=2),
        block(f"Паспорт: серия {passport_str(data)}, выдан {g(data, 'passport_issued')} {fmt_date(data.get('passport_date'))} г.", align="right", spacing_after=20),
        block("ЗАЯВЛЕНИЕ О СТРАХОВОЙ ВЫПЛАТЕ", align="center", bold=True, size=13, spacing_after=16),
        block(
            f"{fmt_date(data.get('incident_date')) if data.get('incident_date') else today} г. в {g(data, 'incident_place')} произошло ДТП с участием "
            f"моего транспортного средства {g(data, 'vehicle')}, г/н {g(data, 'vehicle_plate')}, застрахованного по полису ОСАГО "
            f"№ {g(data, 'policy_number')} ({g(data, 'driver_insurance_company', g(data, 'insurance_company'))})."
        ),
        block("Виновником ДТП является:"),
        block(
            f"{g(data, 'guilt_full_name')}, дата рождения: {fmt_date(data.get('guilt_birth_date'))} г., "
            f"адрес: {g(data, 'guilt_address')}" + (f", тел.: {data.get('guilt_phone')}" if data.get('guilt_phone') else "") + ";"
        ),
        block(f"транспортное средство: {g(data, 'guilt_vehicle')}, г/н {g(data, 'guilt_vehicle_plate')};"),
        block(f"собственник ТС: {owner}, адрес: {owner_addr};"),
        block(f"страховая компания виновника: {g(data, 'guilt_insurance_company')}, полис № {g(data, 'guilt_policy_number')}."),
        block("В результате ДТП мой автомобиль получил механические повреждения."),
        block("На основании ст. 11, 12 Федерального закона «Об ОСАГО» прошу:"),
        block("1. Признать произошедшее ДТП страховым случаем."),
        block("2. Произвести осмотр повреждённого транспортного средства."),
        block("3. Выплатить страховое возмещение в полном объёме."),
        block("К заявлению прилагаю: копию паспорта заявителя; свидетельство о регистрации ТС; документы о ДТП (извещение, справка, постановление); реквизиты для выплаты.", spacing_after=24),
        block(f"{today} г.                                                                    ________________ / {g(data, 'name', '')}", spacing_after=0),
    ]
    return blocks


# ───────── Претензия в СК ─────────
def pretenziya(data):
    today = datetime.now().strftime("%d.%m.%Y")
    blocks = [
        block(f"{g(data, 'guilt_insurance_company')}", align="right", spacing_after=2),
        block(f"От: {g(data, 'name')},", align="right", spacing_after=2),
        block(f"адрес: {g(data, 'address')},", align="right", spacing_after=2),
        block(f"паспорт: серия {passport_str(data)}, выдан {g(data, 'passport_issued')} {fmt_date(data.get('passport_date'))} г.", align="right", spacing_after=20),
        block("ПРЕТЕНЗИЯ", align="center", bold=True, size=13, spacing_after=16),
        block(
            f"Я, {g(data, 'name')}, обратился(ась) к вам с заявлением о выплате страхового возмещения в связи с ДТП, "
            f"произошедшим {fmt_date(data.get('incident_date'))} г. в {g(data, 'incident_place')}."
        ),
        block(f"Транспортное средство: {g(data, 'vehicle')}, г/н {g(data, 'vehicle_plate')}."),
        block(f"Полис ОСАГО: № {g(data, 'policy_number')}, страховая компания: {g(data, 'driver_insurance_company', g(data, 'insurance_company'))}."),
        block(f"Виновник ДТП: {g(data, 'guilt_full_name')}, страховая компания виновника: {g(data, 'guilt_insurance_company')}, полис № {g(data, 'guilt_policy_number')}."),
        block("Однако до настоящего времени выплата не произведена / произведена не в полном объёме, что является нарушением п. 21 ст. 12 ФЗ «Об ОСАГО»."),
        block("На основании изложенного ТРЕБУЮ:"),
        block("1. В течение 10 календарных дней с момента получения настоящей претензии выплатить страховое возмещение в полном объёме."),
        block("2. Выплатить неустойку за нарушение сроков выплаты из расчёта 1% от суммы страхового возмещения за каждый день просрочки."),
        block("3. Возместить расходы на оценку ущерба и юридические услуги."),
        block(
            "В случае неудовлетворения настоящей претензии в указанный срок буду вынужден(а) обратиться в суд с иском о взыскании "
            "страхового возмещения, неустойки, штрафа в размере 50%, компенсации морального вреда и судебных расходов.",
            spacing_after=24
        ),
        block(f"{today} г.                                                                    ________________ / {g(data, 'name', '')}", spacing_after=0),
    ]
    return blocks


# ───────── Уточнённое заявление в СК ─────────
def utochnenie(data):
    today = datetime.now().strftime("%d.%m.%Y")
    owner = g(data, 'guilt_owner_name', g(data, 'guilt_full_name'))
    owner_addr = g(data, 'guilt_owner_address', g(data, 'guilt_address'))
    blocks = [
        block(f"В {g(data, 'court')}", align="right", spacing_after=12),
        block(f"Истец: {g(data, 'name')},", align="right", spacing_after=2),
        block(f"дата рождения: {fmt_date(data.get('birth_date'))} г.,", align="right", spacing_after=2),
        block(f"адрес: {g(data, 'address')},", align="right", spacing_after=2),
        block(f"паспорт: серия {passport_str(data)}, выдан {g(data, 'passport_issued')} {fmt_date(data.get('passport_date'))} г.", align="right", spacing_after=8),
        block(f"Ответчик: {g(data, 'guilt_insurance_company')}", align="right", spacing_after=20),
        block("УТОЧНЁННОЕ ИСКОВОЕ ЗАЯВЛЕНИЕ", align="center", bold=True, size=13, spacing_after=2),
        block("о взыскании страхового возмещения", align="center", bold=True, size=12, spacing_after=16),
        block(
            f"В дополнение к ранее поданному исковому заявлению о взыскании страхового возмещения по факту ДТП, "
            f"произошедшего {fmt_date(data.get('incident_date'))} г. в {g(data, 'incident_place')}, уточняю исковые требования."
        ),
        block(
            f"Мне на праве собственности принадлежит транспортное средство: {g(data, 'vehicle')}, г/н {g(data, 'vehicle_plate')}, "
            f"застрахованное по полису ОСАГО № {g(data, 'policy_number')} ({g(data, 'driver_insurance_company', g(data, 'insurance_company'))})."
        ),
        block(
            f"Виновник ДТП — {g(data, 'guilt_full_name')} ({fmt_date(data.get('guilt_birth_date'))} г.р.), адрес: {g(data, 'guilt_address')}" +
            (f", тел.: {data.get('guilt_phone')}" if data.get('guilt_phone') else "") + "."
        ),
        block(f"Транспортное средство виновника: {g(data, 'guilt_vehicle')}, г/н {g(data, 'guilt_vehicle_plate')}."),
        block(f"Собственник ТС виновника: {owner}, адрес: {owner_addr}."),
        block(f"Страховая компания виновника: {g(data, 'guilt_insurance_company')}, полис № {g(data, 'guilt_policy_number')}."),
        block("С учётом полученного заключения независимой экспертизы уточняю размер исковых требований."),
        block("ПРОШУ:"),
        block(f"1. Взыскать с {g(data, 'guilt_insurance_company', 'ответчика')} страховое возмещение в уточнённом размере согласно заключению эксперта."),
        block("2. Взыскать неустойку за нарушение сроков выплаты страхового возмещения."),
        block("3. Взыскать штраф в размере 50% от суммы, присуждённой в пользу истца."),
        block("4. Взыскать расходы на оценку ущерба, юридические услуги и иные судебные расходы."),
        block("5. Взыскать компенсацию морального вреда.", spacing_after=16),
        block("Приложения: заключение независимой экспертизы; обновлённый расчёт суммы иска; иные документы, подтверждающие уточнённые требования.", spacing_after=24),
        block(f"{today} г.                                                                    ________________ / {g(data, 'name', '')}", spacing_after=0),
    ]
    return blocks


# ───────── Договор оказания услуг ─────────
def dogovor(data):
    contract_num = g(data, 'contract_number', '__')
    contract_date_str = fmt_date(data.get('contract_date')) if data.get('contract_date') else datetime.now().strftime("%d.%m.%Y")
    blocks = [
        block(f"ДОГОВОР № {contract_num}", align="center", bold=True, size=13, spacing_after=2),
        block("оказания юридических услуг", align="center", bold=True, size=12, spacing_after=16),
        block(f"г. Москва                                                                                       {contract_date_str} г.", spacing_after=16),
        block(
            f"{FIRM_NAME}, именуемое в дальнейшем «Исполнитель», с одной стороны, и {g(data, 'name')}, "
            f"именуем(ый/ая) в дальнейшем «Заказчик», с другой стороны, вместе именуемые «Стороны», заключили настоящий Договор о нижеследующем:",
            spacing_after=16
        ),
        block("1. ПРЕДМЕТ ДОГОВОРА", bold=True, spacing_after=8),
        block(
            f"1.1. Исполнитель обязуется оказать Заказчику юридические услуги, а Заказчик обязуется оплатить эти услуги "
            f"на условиях настоящего Договора.",
        ),
        block(f"1.2. Содержание и обстоятельства, в связи с которыми оказываются услуги: {g(data, 'circumstances')}"),
        block(f"1.3. Ожидаемый результат оказания услуг: {g(data, 'desired_result')}", spacing_after=16),
        block("2. СТОИМОСТЬ УСЛУГ И ПОРЯДОК РАСЧЁТОВ", bold=True, spacing_after=8),
        block(f"2.1. Стоимость услуг по настоящему Договору составляет {money(data.get('amount'))}."),
        block("2.2. Оплата производится в порядке 100% предоплаты либо иными сроками, согласованными Сторонами дополнительно.", spacing_after=16),
        block("3. ПРАВА И ОБЯЗАННОСТИ СТОРОН", bold=True, spacing_after=8),
        block("3.1. Исполнитель обязуется оказывать услуги квалифицированно, добросовестно и в согласованные сроки."),
        block("3.2. Заказчик обязуется предоставлять Исполнителю документы и информацию, необходимые для оказания услуг.", spacing_after=16),
        block("4. ОТВЕТСТВЕННОСТЬ СТОРОН", bold=True, spacing_after=8),
        block("4.1. За неисполнение или ненадлежащее исполнение обязательств по Договору Стороны несут ответственность в соответствии с действующим законодательством РФ.", spacing_after=16),
        block("5. РЕКВИЗИТЫ И ПОДПИСИ СТОРОН", bold=True, spacing_after=12),
        block(f"Исполнитель: {FIRM_NAME}", spacing_after=2),
        block(
            f"Заказчик: {g(data, 'name')}, адрес: {g(data, 'address')}"
            + (f", ИНН {data.get('inn')}" if data.get('inn') else "")
            + (f", ОГРН {data.get('ogrn')}" if data.get('ogrn') else "")
            + (f", паспорт серия {passport_str(data)}" if data.get('passport_series') else ""),
            spacing_after=24
        ),
        block("Исполнитель: ________________ /   М.П.", spacing_after=6),
        block(f"Заказчик: ________________ / {g(data, 'name', '')}", spacing_after=0),
    ]
    return blocks


TEMPLATES = {
    "zayavlenie": {"label": "Заявление в СК", "func": zayavlenie},
    "pretenziya": {"label": "Претензия в СК", "func": pretenziya},
    "utochnenie": {"label": "Уточнённое заявление в СК", "func": utochnenie},
    "dogovor": {"label": "Договор оказания услуг", "func": dogovor},
}

REQUIRED_FIELDS = {
    "zayavlenie": [
        ("name", "ФИО клиента"), ("address", "Адрес клиента"),
        ("passport_series", "Серия паспорта"), ("passport_number", "Номер паспорта"),
        ("vehicle", "Транспортное средство"), ("vehicle_plate", "Гос. номер ТС"),
        ("policy_number", "Номер полиса ОСАГО"), ("guilt_insurance_company", "Страховая компания виновника"),
        ("incident_date", "Дата ДТП"), ("incident_place", "Место ДТП"),
        ("guilt_full_name", "ФИО виновника ДТП"),
    ],
    "pretenziya": [
        ("name", "ФИО клиента"), ("address", "Адрес клиента"),
        ("vehicle", "Транспортное средство"), ("policy_number", "Номер полиса ОСАГО"),
        ("guilt_insurance_company", "Страховая компания виновника"),
        ("incident_date", "Дата ДТП"), ("incident_place", "Место ДТП"),
    ],
    "utochnenie": [
        ("name", "ФИО клиента"), ("address", "Адрес клиента"), ("court", "Суд"),
        ("vehicle", "Транспортное средство"), ("policy_number", "Номер полиса ОСАГО"),
        ("guilt_insurance_company", "Страховая компания виновника"),
        ("incident_date", "Дата ДТП"), ("incident_place", "Место ДТП"),
    ],
    "dogovor": [
        ("name", "ФИО/название клиента"), ("address", "Адрес клиента"),
        ("amount", "Сумма договора"), ("circumstances", "Предмет услуг"),
    ],
}


def get_missing_fields(doc_type, data):
    required = REQUIRED_FIELDS.get(doc_type, [])
    missing = []
    for key, label in required:
        if not data.get(key):
            missing.append(label)
    return missing
