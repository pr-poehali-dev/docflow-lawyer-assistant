import json
import os
from typing import Dict, Any
import psycopg2


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

CASE_COLUMNS = [
    'id', 'client_id', 'title', 'category', 'status', 'priority', 'deadline', 'court',
    'vehicle', 'vehicle_plate', 'policy_number', 'insurance_company',
    'driver_full_name', 'driver_birth_date', 'driver_address', 'driver_insurance_company',
    'incident_date', 'incident_place',
    'guilt_full_name', 'guilt_birth_date', 'guilt_address', 'guilt_phone',
    'guilt_owner_name', 'guilt_owner_address', 'guilt_vehicle', 'guilt_vehicle_plate',
    'guilt_insurance_company', 'guilt_policy_number',
    'amount', 'contract_number', 'contract_date', 'circumstances', 'desired_result',
    'created_at', 'updated_at'
]

TEXT_FIELDS = [
    'title', 'category', 'status', 'priority', 'court',
    'vehicle', 'vehicle_plate', 'policy_number', 'insurance_company',
    'driver_full_name', 'driver_address', 'driver_insurance_company',
    'incident_place',
    'guilt_full_name', 'guilt_address', 'guilt_phone',
    'guilt_owner_name', 'guilt_owner_address', 'guilt_vehicle', 'guilt_vehicle_plate',
    'guilt_insurance_company', 'guilt_policy_number',
    'contract_number', 'circumstances', 'desired_result'
]
DATE_FIELDS = ['deadline', 'driver_birth_date', 'incident_date', 'guilt_birth_date', 'contract_date']
NUMERIC_FIELDS = ['amount']


def esc(v):
    return str(v).replace("'", "''")


def row_to_dict(row, columns):
    d = dict(zip(columns, row))
    for k, v in d.items():
        if hasattr(v, 'isoformat'):
            d[k] = v.isoformat()
        elif hasattr(v, '__float__') and not isinstance(v, (int, float, bool, type(None))):
            d[k] = float(v)
    return d


def handler(event: Dict[str, Any], context) -> Dict[str, Any]:
    '''API для управления юридическими делами: создание, чтение, обновление, удаление дел, привязанных к клиентам'''
    method = event.get('httpMethod', 'GET')

    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': ''}

    conn = get_conn()
    cur = conn.cursor()

    try:
        params = event.get('queryStringParameters') or {}
        case_id = params.get('id')
        client_id_filter = params.get('client_id')

        if method == 'GET':
            cols = ', '.join(CASE_COLUMNS)
            if case_id:
                cur.execute(f"SELECT {cols} FROM cases WHERE id = {int(case_id)}")
                row = cur.fetchone()
                if not row:
                    return {'statusCode': 404, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Дело не найдено'})}
                return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': json.dumps(row_to_dict(row, CASE_COLUMNS), ensure_ascii=False)}
            else:
                where = f"WHERE client_id = {int(client_id_filter)}" if client_id_filter else ""
                cur.execute(f"SELECT {cols} FROM cases {where} ORDER BY created_at DESC")
                rows = cur.fetchall()
                items = [row_to_dict(r, CASE_COLUMNS) for r in rows]
                return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': json.dumps(items, ensure_ascii=False)}

        body_str = event.get('body') or '{}'
        body = json.loads(body_str)

        if method == 'POST':
            client_id = int(body.get('client_id'))
            set_parts = [f"client_id = {client_id}"]
            for f in TEXT_FIELDS:
                val = body.get(f) or ('medium' if f == 'priority' else ('active' if f == 'status' else ('Страховые споры' if f == 'category' else '')))
                set_parts.append(f"{f} = '{esc(val)}'")
            for f in DATE_FIELDS:
                val = body.get(f)
                date_sql = 'NULL' if not val else "'" + esc(val) + "'"
                set_parts.append(f"{f} = {date_sql}")
            for f in NUMERIC_FIELDS:
                val = body.get(f)
                num_sql = 'NULL' if val in (None, '') else str(float(val))
                set_parts.append(f"{f} = {num_sql}")

            cols = ', '.join([p.split(' = ')[0] for p in set_parts])
            vals = ', '.join([p.split(' = ', 1)[1] for p in set_parts])
            cur.execute(f"INSERT INTO cases ({cols}) VALUES ({vals}) RETURNING id")
            new_id = cur.fetchone()[0]
            conn.commit()
            return {'statusCode': 201, 'headers': CORS_HEADERS, 'body': json.dumps({'id': new_id}, ensure_ascii=False)}

        if method == 'PUT':
            cid = int(body.get('id'))
            set_parts = []
            if 'client_id' in body and body.get('client_id'):
                set_parts.append(f"client_id = {int(body.get('client_id'))}")
            for f in TEXT_FIELDS:
                if f in body:
                    set_parts.append(f"{f} = '{esc(body.get(f) or '')}'")
            for f in DATE_FIELDS:
                if f in body:
                    val = body.get(f)
                    date_sql = 'NULL' if not val else "'" + esc(val) + "'"
                    set_parts.append(f"{f} = {date_sql}")
            for f in NUMERIC_FIELDS:
                if f in body:
                    val = body.get(f)
                    num_sql = 'NULL' if val in (None, '') else str(float(val))
                    set_parts.append(f"{f} = {num_sql}")
            set_parts.append("updated_at = now()")

            if not set_parts:
                return {'statusCode': 400, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Нет данных для обновления'})}

            cur.execute(f"UPDATE cases SET {', '.join(set_parts)} WHERE id = {cid}")
            conn.commit()
            return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': json.dumps({'success': True}, ensure_ascii=False)}

        if method == 'DELETE':
            cid = int(case_id or body.get('id'))
            cur.execute(f"DELETE FROM cases WHERE id = {cid}")
            conn.commit()
            return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': json.dumps({'success': True}, ensure_ascii=False)}

        return {'statusCode': 405, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Метод не поддерживается'})}

    finally:
        cur.close()
        conn.close()