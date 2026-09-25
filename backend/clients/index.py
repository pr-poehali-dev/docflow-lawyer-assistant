import json
import os
from typing import Dict, Any
import psycopg2
import psycopg2.extras


def get_conn():
    dsn = os.environ['DATABASE_URL']
    schema = os.environ.get('MAIN_DB_SCHEMA', 'public')
    conn = psycopg2.connect(dsn, options=f'-c search_path={schema}')
    return conn


CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-User-Id, X-Auth-Token, X-Session-Id',
    'Access-Control-Max-Age': '86400',
}


def row_to_dict(row, columns):
    d = dict(zip(columns, row))
    for k, v in d.items():
        if hasattr(v, 'isoformat'):
            d[k] = v.isoformat()
        if hasattr(v, '__float__') and not isinstance(v, (int, float, bool, type(None))):
            d[k] = float(v)
    return d


def handler(event: Dict[str, Any], context) -> Dict[str, Any]:
    '''API для управления клиентами юридической фирмы: создание, чтение, обновление, удаление карточек клиентов'''
    method = event.get('httpMethod', 'GET')

    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': ''}

    conn = get_conn()
    cur = conn.cursor()

    try:
        params = event.get('queryStringParameters') or {}
        client_id = params.get('id')

        if method == 'GET':
            if client_id:
                cur.execute(
                    "SELECT id, name, client_type, phone, email, status, birth_date, address, "
                    "passport_series, passport_number, passport_issued, passport_date, "
                    "inn, ogrn, kpp, bank_details, last_contact, created_at, updated_at "
                    "FROM clients WHERE id = %s" % int(client_id)
                )
                row = cur.fetchone()
                if not row:
                    return {'statusCode': 404, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Клиент не найден'})}
                columns = [d[0] for d in cur.description]
                return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': json.dumps(row_to_dict(row, columns), ensure_ascii=False)}
            else:
                cur.execute(
                    "SELECT c.id, c.name, c.client_type, c.phone, c.email, c.status, c.last_contact, "
                    "(SELECT COUNT(*) FROM cases WHERE cases.client_id = c.id) as cases_count "
                    "FROM clients c ORDER BY c.created_at DESC"
                )
                rows = cur.fetchall()
                columns = [d[0] for d in cur.description]
                items = [row_to_dict(r, columns) for r in rows]
                return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': json.dumps(items, ensure_ascii=False)}

        body_str = event.get('body') or '{}'
        body = json.loads(body_str)

        if method == 'POST':
            name = (body.get('name') or '').replace("'", "''")
            client_type = (body.get('client_type') or 'Физическое лицо').replace("'", "''")
            phone = (body.get('phone') or '').replace("'", "''")
            email = (body.get('email') or '').replace("'", "''")
            status = (body.get('status') or 'new').replace("'", "''")
            birth_date = body.get('birth_date') or None
            address = (body.get('address') or '').replace("'", "''")
            passport_series = (body.get('passport_series') or '').replace("'", "''")
            passport_number = (body.get('passport_number') or '').replace("'", "''")
            passport_issued = (body.get('passport_issued') or '').replace("'", "''")
            passport_date = body.get('passport_date') or None
            inn = (body.get('inn') or '').replace("'", "''")
            ogrn = (body.get('ogrn') or '').replace("'", "''")
            kpp = (body.get('kpp') or '').replace("'", "''")
            bank_details = (body.get('bank_details') or '').replace("'", "''")

            birth_date_sql = f"'{birth_date}'" if birth_date else 'NULL'
            passport_date_sql = f"'{passport_date}'" if passport_date else 'NULL'

            cur.execute(
                f"INSERT INTO clients (name, client_type, phone, email, status, birth_date, address, "
                f"passport_series, passport_number, passport_issued, passport_date, inn, ogrn, kpp, bank_details, last_contact) "
                f"VALUES ('{name}', '{client_type}', '{phone}', '{email}', '{status}', {birth_date_sql}, '{address}', "
                f"'{passport_series}', '{passport_number}', '{passport_issued}', {passport_date_sql}, '{inn}', '{ogrn}', '{kpp}', '{bank_details}', now()) "
                f"RETURNING id"
            )
            new_id = cur.fetchone()[0]
            conn.commit()
            return {'statusCode': 201, 'headers': CORS_HEADERS, 'body': json.dumps({'id': new_id}, ensure_ascii=False)}

        if method == 'PUT':
            cid = int(body.get('id'))
            name = (body.get('name') or '').replace("'", "''")
            client_type = (body.get('client_type') or 'Физическое лицо').replace("'", "''")
            phone = (body.get('phone') or '').replace("'", "''")
            email = (body.get('email') or '').replace("'", "''")
            status = (body.get('status') or 'new').replace("'", "''")
            birth_date = body.get('birth_date') or None
            address = (body.get('address') or '').replace("'", "''")
            passport_series = (body.get('passport_series') or '').replace("'", "''")
            passport_number = (body.get('passport_number') or '').replace("'", "''")
            passport_issued = (body.get('passport_issued') or '').replace("'", "''")
            passport_date = body.get('passport_date') or None
            inn = (body.get('inn') or '').replace("'", "''")
            ogrn = (body.get('ogrn') or '').replace("'", "''")
            kpp = (body.get('kpp') or '').replace("'", "''")
            bank_details = (body.get('bank_details') or '').replace("'", "''")

            birth_date_sql = f"'{birth_date}'" if birth_date else 'NULL'
            passport_date_sql = f"'{passport_date}'" if passport_date else 'NULL'

            cur.execute(
                f"UPDATE clients SET name='{name}', client_type='{client_type}', phone='{phone}', email='{email}', "
                f"status='{status}', birth_date={birth_date_sql}, address='{address}', "
                f"passport_series='{passport_series}', passport_number='{passport_number}', "
                f"passport_issued='{passport_issued}', passport_date={passport_date_sql}, "
                f"inn='{inn}', ogrn='{ogrn}', kpp='{kpp}', bank_details='{bank_details}', updated_at=now() "
                f"WHERE id = {cid}"
            )
            conn.commit()
            return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': json.dumps({'success': True}, ensure_ascii=False)}

        if method == 'DELETE':
            cid = int(client_id or body.get('id'))
            cur.execute(f"DELETE FROM clients WHERE id = {cid}")
            conn.commit()
            return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': json.dumps({'success': True}, ensure_ascii=False)}

        return {'statusCode': 405, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Метод не поддерживается'})}

    finally:
        cur.close()
        conn.close()