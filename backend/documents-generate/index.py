import json
import os
import re
from datetime import datetime
from typing import Dict, Any

import boto3
import psycopg2

from templates import TEMPLATES, get_missing_fields
from renderers import render_docx, render_pdf

CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-User-Id, X-Auth-Token, X-Session-Id',
    'Access-Control-Max-Age': '86400',
}


def get_conn():
    dsn = os.environ['DATABASE_URL']
    schema = os.environ.get('MAIN_DB_SCHEMA', 'public')
    conn = psycopg2.connect(dsn, options=f'-c search_path={schema}')
    return conn


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

CLIENT_COLUMNS = [
    'id', 'name', 'client_type', 'phone', 'email', 'status', 'birth_date', 'address',
    'passport_series', 'passport_number', 'passport_issued', 'passport_date',
    'inn', 'ogrn', 'kpp', 'bank_details', 'last_contact', 'created_at', 'updated_at'
]


def row_to_dict(row, columns):
    d = dict(zip(columns, row))
    for k, v in d.items():
        if hasattr(v, 'isoformat'):
            d[k] = v.isoformat()
        elif hasattr(v, '__float__') and not isinstance(v, (int, float, bool, type(None))):
            d[k] = float(v)
    return d


def safe_filename(s):
    s = re.sub(r'[^\w\s-]', '', s, flags=re.UNICODE)
    s = re.sub(r'\s+', '-', s.strip())
    return s[:80]


def handler(event: Dict[str, Any], context) -> Dict[str, Any]:
    '''Генерация юридических документов (заявление, претензия, уточнённое заявление, договор) в DOCX и PDF на основе данных дела и клиента, с загрузкой готовых файлов в S3'''
    method = event.get('httpMethod', 'GET')

    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': ''}

    if method == 'GET':
        params = event.get('queryStringParameters') or {}
        case_id = params.get('case_id')
        if not case_id:
            return {'statusCode': 400, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Не указан case_id'})}
        conn = get_conn()
        cur = conn.cursor()
        try:
            cur.execute(
                "SELECT id, case_id, client_id, doc_type, title, docx_url, pdf_url, created_at "
                f"FROM generated_documents WHERE case_id = {int(case_id)} ORDER BY created_at DESC"
            )
            rows = cur.fetchall()
            columns = ['id', 'case_id', 'client_id', 'doc_type', 'title', 'docx_url', 'pdf_url', 'created_at']
            items = [row_to_dict(r, columns) for r in rows]
            return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': json.dumps(items, ensure_ascii=False)}
        finally:
            cur.close()
            conn.close()

    if method != 'POST':
        return {'statusCode': 405, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Метод не поддерживается'})}

    body = json.loads(event.get('body') or '{}')
    doc_type = body.get('doc_type')
    case_id = body.get('case_id')
    check_only = body.get('check_only', False)

    if doc_type not in TEMPLATES:
        return {'statusCode': 400, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Неизвестный тип документа'})}
    if not case_id:
        return {'statusCode': 400, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Не указан case_id'})}

    conn = get_conn()
    cur = conn.cursor()

    try:
        cols = ', '.join(CASE_COLUMNS)
        cur.execute(f"SELECT {cols} FROM cases WHERE id = {int(case_id)}")
        case_row = cur.fetchone()
        if not case_row:
            return {'statusCode': 404, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Дело не найдено'})}
        case_data = row_to_dict(case_row, CASE_COLUMNS)

        client_cols = ', '.join(CLIENT_COLUMNS)
        cur.execute(f"SELECT {client_cols} FROM clients WHERE id = {int(case_data['client_id'])}")
        client_row = cur.fetchone()
        if not client_row:
            return {'statusCode': 404, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Клиент не найден'})}
        client_data = row_to_dict(client_row, CLIENT_COLUMNS)

        merged = {**case_data, **{k: v for k, v in client_data.items() if k != 'id'}}

        missing = get_missing_fields(doc_type, merged)
        if check_only:
            return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': json.dumps({'missing_fields': missing}, ensure_ascii=False)}

        if missing:
            return {'statusCode': 422, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Не заполнены обязательные поля', 'missing_fields': missing}, ensure_ascii=False)}

        template = TEMPLATES[doc_type]
        blocks = template['func'](merged)
        label = template['label']

        docx_bytes = render_docx(blocks, label)
        pdf_bytes = render_pdf(blocks, label)

        today_str = datetime.now().strftime("%d-%m-%Y")
        client_name_safe = safe_filename(merged.get('name', 'Клиент'))
        doc_label_safe = safe_filename(label)
        base_filename = f"{doc_label_safe}_{client_name_safe}_{today_str}"

        s3 = boto3.client(
            's3',
            endpoint_url='https://bucket.poehali.dev',
            aws_access_key_id=os.environ['AWS_ACCESS_KEY_ID'],
            aws_secret_access_key=os.environ['AWS_SECRET_ACCESS_KEY'],
        )
        key_prefix = f"documents/case-{case_id}"
        docx_key = f"{key_prefix}/{base_filename}.docx"
        pdf_key = f"{key_prefix}/{base_filename}.pdf"

        s3.put_object(Bucket='files', Key=docx_key, Body=docx_bytes, ContentType='application/vnd.openxmlformats-officedocument.wordprocessingml.document')
        s3.put_object(Bucket='files', Key=pdf_key, Body=pdf_bytes, ContentType='application/pdf')

        cdn_base = f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket"
        docx_url = f"{cdn_base}/{docx_key}"
        pdf_url = f"{cdn_base}/{pdf_key}"

        title_escaped = label.replace("'", "''")
        docx_url_escaped = docx_url.replace("'", "''")
        pdf_url_escaped = pdf_url.replace("'", "''")

        cur.execute(
            f"INSERT INTO generated_documents (case_id, client_id, doc_type, title, docx_url, pdf_url) "
            f"VALUES ({int(case_id)}, {int(merged['client_id'])}, '{doc_type}', '{title_escaped}', '{docx_url_escaped}', '{pdf_url_escaped}') "
            f"RETURNING id"
        )
        new_id = cur.fetchone()[0]
        conn.commit()

        return {
            'statusCode': 200,
            'headers': CORS_HEADERS,
            'body': json.dumps({
                'id': new_id,
                'title': label,
                'docx_url': docx_url,
                'pdf_url': pdf_url,
            }, ensure_ascii=False)
        }

    finally:
        cur.close()
        conn.close()