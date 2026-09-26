import json
import os
import hmac
import hashlib
import base64
import time
import secrets
from typing import Dict, Any, Optional
import psycopg2

CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Auth-Token',
    'Access-Control-Max-Age': '86400',
}

ROLES = {'admin', 'lawyer', 'staff', 'readonly'}


def get_conn():
    dsn = os.environ['DATABASE_URL']
    schema = os.environ.get('MAIN_DB_SCHEMA', 'public')
    return psycopg2.connect(dsn, options=f'-c search_path={schema}')


def esc(v: str) -> str:
    return str(v).replace("'", "''")


def hash_password(password: str) -> str:
    salt = secrets.token_hex(16)
    digest = hashlib.pbkdf2_hmac('sha256', password.encode(), salt.encode(), 100_000).hex()
    return f"{salt}${digest}"


def _sign(payload: str, secret: str) -> str:
    return base64.urlsafe_b64encode(
        hmac.new(secret.encode(), payload.encode(), hashlib.sha256).digest()
    ).decode().rstrip('=')


def verify_token(token: str, secret: str) -> Optional[Dict[str, Any]]:
    try:
        payload, sig = token.split('.', 1)
        expected_sig = _sign(payload, secret)
        if not hmac.compare_digest(sig, expected_sig):
            return None
        padded = payload + '=' * (-len(payload) % 4)
        data = json.loads(base64.urlsafe_b64decode(padded))
        if time.time() >= data['exp']:
            return None
        return data
    except Exception:
        return None


def get_current_admin(event: Dict[str, Any], cur, secret: str) -> Optional[Dict[str, Any]]:
    headers = event.get('headers') or {}
    token = headers.get('X-Auth-Token') or headers.get('x-auth-token', '')
    if not token:
        return None
    data = verify_token(token, secret)
    if not data:
        return None
    cur.execute(f"SELECT id, role, status FROM users WHERE id = {int(data['uid'])}")
    row = cur.fetchone()
    if not row or row[2] != 'active' or row[1] != 'admin':
        return None
    return {'id': row[0], 'role': row[1]}


def row_to_dict(row, columns):
    d = dict(zip(columns, row))
    for k, v in d.items():
        if hasattr(v, 'isoformat'):
            d[k] = v.isoformat()
    return d


USER_COLUMNS = ['id', 'name', 'email', 'role', 'status', 'last_login', 'created_at']


def handler(event: Dict[str, Any], context) -> Dict[str, Any]:
    '''Управление сотрудниками (только для администратора): список, создание, изменение роли/статуса, сброс пароля, журнал входов'''
    method = event.get('httpMethod', 'GET')

    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': ''}

    secret = os.environ.get('AUTH_SECRET', '')
    conn = get_conn()
    cur = conn.cursor()

    try:
        admin = get_current_admin(event, cur, secret)
        if not admin:
            return {'statusCode': 403, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Доступно только администратору'}, ensure_ascii=False)}

        params = event.get('queryStringParameters') or {}
        resource = params.get('resource', 'users')
        user_id = params.get('id')

        if resource == 'audit' and method == 'GET':
            cur.execute(
                "SELECT la.id, la.user_id, u.name, la.email, la.event, la.ip_address, la.created_at "
                "FROM login_audit la LEFT JOIN users u ON u.id = la.user_id "
                "ORDER BY la.created_at DESC LIMIT 200"
            )
            rows = cur.fetchall()
            columns = ['id', 'user_id', 'user_name', 'email', 'event', 'ip_address', 'created_at']
            items = [row_to_dict(r, columns) for r in rows]
            return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': json.dumps(items, ensure_ascii=False)}

        if method == 'GET':
            cols = ', '.join(USER_COLUMNS)
            cur.execute(f"SELECT {cols} FROM users ORDER BY created_at DESC")
            rows = cur.fetchall()
            items = [row_to_dict(r, USER_COLUMNS) for r in rows]
            return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': json.dumps(items, ensure_ascii=False)}

        body = json.loads(event.get('body') or '{}')

        if method == 'POST':
            name = (body.get('name') or '').strip()
            email = (body.get('email') or '').strip().lower()
            password = body.get('password') or ''
            role = body.get('role') or 'lawyer'

            if role not in ROLES:
                return {'statusCode': 400, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Некорректная роль'}, ensure_ascii=False)}
            if not name or not email or len(password) < 6:
                return {'statusCode': 400, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Заполните имя, email и пароль (минимум 6 символов)'}, ensure_ascii=False)}

            cur.execute(f"SELECT id FROM users WHERE email = '{esc(email)}'")
            if cur.fetchone():
                return {'statusCode': 409, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Сотрудник с таким email уже существует'}, ensure_ascii=False)}

            password_hash = hash_password(password)
            cur.execute(
                f"INSERT INTO users (name, email, password_hash, role, status) "
                f"VALUES ('{esc(name)}', '{esc(email)}', '{esc(password_hash)}', '{esc(role)}', 'active') RETURNING id"
            )
            new_id = cur.fetchone()[0]
            conn.commit()
            return {'statusCode': 201, 'headers': CORS_HEADERS, 'body': json.dumps({'id': new_id}, ensure_ascii=False)}

        if method == 'PUT':
            uid = int(body.get('id'))
            set_parts = []
            if 'name' in body:
                set_parts.append(f"name = '{esc(body['name'])}'")
            if 'role' in body:
                if body['role'] not in ROLES:
                    return {'statusCode': 400, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Некорректная роль'}, ensure_ascii=False)}
                set_parts.append(f"role = '{esc(body['role'])}'")
            if 'status' in body:
                set_parts.append(f"status = '{esc(body['status'])}'")
            if body.get('password'):
                if len(body['password']) < 6:
                    return {'statusCode': 400, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Пароль должен быть не короче 6 символов'}, ensure_ascii=False)}
                set_parts.append(f"password_hash = '{esc(hash_password(body['password']))}'")
                set_parts.append("failed_attempts = 0, locked_until = NULL")
            set_parts.append("updated_at = now()")

            cur.execute(f"UPDATE users SET {', '.join(set_parts)} WHERE id = {uid}")
            conn.commit()
            return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': json.dumps({'success': True}, ensure_ascii=False)}

        if method == 'DELETE':
            uid = int(user_id or body.get('id'))
            if uid == admin['id']:
                return {'statusCode': 400, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Нельзя удалить свою учётную запись'}, ensure_ascii=False)}
            cur.execute(f"DELETE FROM users WHERE id = {uid}")
            conn.commit()
            return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': json.dumps({'success': True}, ensure_ascii=False)}

        return {'statusCode': 405, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Метод не поддерживается'})}

    finally:
        cur.close()
        conn.close()
