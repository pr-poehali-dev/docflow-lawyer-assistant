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
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Auth-Token',
    'Access-Control-Max-Age': '86400',
}

SESSION_TTL = 60 * 60 * 12  # 12 часов — автоматический выход при долгом бездействии сессии
MAX_FAILED_ATTEMPTS = 5
LOCK_MINUTES = 15


def get_conn():
    dsn = os.environ['DATABASE_URL']
    schema = os.environ.get('MAIN_DB_SCHEMA', 'public')
    return psycopg2.connect(dsn, options=f'-c search_path={schema}')


def esc(v: str) -> str:
    return str(v).replace("'", "''")


# ───────── Пароли ─────────
def hash_password(password: str) -> str:
    salt = secrets.token_hex(16)
    digest = hashlib.pbkdf2_hmac('sha256', password.encode(), salt.encode(), 100_000).hex()
    return f"{salt}${digest}"


def verify_password(password: str, stored: str) -> bool:
    try:
        salt, digest = stored.split('$', 1)
        check = hashlib.pbkdf2_hmac('sha256', password.encode(), salt.encode(), 100_000).hex()
        return hmac.compare_digest(check, digest)
    except Exception:
        return False


# ───────── Токены ─────────
def _sign(payload: str, secret: str) -> str:
    return base64.urlsafe_b64encode(
        hmac.new(secret.encode(), payload.encode(), hashlib.sha256).digest()
    ).decode().rstrip('=')


def make_token(user_id: int, role: str, secret: str) -> str:
    expires_at = int(time.time()) + SESSION_TTL
    payload_obj = {'uid': user_id, 'role': role, 'exp': expires_at}
    payload = base64.urlsafe_b64encode(json.dumps(payload_obj).encode()).decode().rstrip('=')
    sig = _sign(payload, secret)
    return f"{payload}.{sig}"


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


def get_client_ip(event: Dict[str, Any]) -> str:
    try:
        return event.get('requestContext', {}).get('identity', {}).get('sourceIp', '') or ''
    except Exception:
        return ''


def log_audit(cur, user_id: Optional[int], email: str, event_type: str, ip: str):
    user_id_sql = 'NULL' if user_id is None else str(user_id)
    cur.execute(
        f"INSERT INTO login_audit (user_id, email, event, ip_address) "
        f"VALUES ({user_id_sql}, '{esc(email)}', '{esc(event_type)}', '{esc(ip)}')"
    )


def handler(event: Dict[str, Any], context) -> Dict[str, Any]:
    '''Аутентификация сотрудников: вход по email/паролю, блокировка после неудачных попыток, создание первого администратора, проверка сессии'''
    method = event.get('httpMethod', 'GET')

    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': ''}

    secret = os.environ.get('AUTH_SECRET', '')
    params = event.get('queryStringParameters') or {}
    action = params.get('action', '')

    conn = get_conn()
    cur = conn.cursor()

    try:
        # ───────── Проверка, есть ли уже пользователи (для экрана начальной настройки) ─────────
        if method == 'GET' and action == 'status':
            cur.execute("SELECT COUNT(*) FROM users")
            count = cur.fetchone()[0]
            return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': json.dumps({'has_users': count > 0}, ensure_ascii=False)}

        # ───────── Создание первого администратора (только если пользователей ещё нет) ─────────
        if method == 'POST' and action == 'bootstrap':
            cur.execute("SELECT COUNT(*) FROM users")
            count = cur.fetchone()[0]
            if count > 0:
                return {'statusCode': 403, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'В системе уже есть пользователи'}, ensure_ascii=False)}

            body = json.loads(event.get('body') or '{}')
            name = (body.get('name') or '').strip()
            email = (body.get('email') or '').strip().lower()
            password = body.get('password') or ''

            if not name or not email or len(password) < 6:
                return {'statusCode': 400, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Заполните имя, email и пароль (минимум 6 символов)'}, ensure_ascii=False)}

            password_hash = hash_password(password)
            cur.execute(
                f"INSERT INTO users (name, email, password_hash, role, status) "
                f"VALUES ('{esc(name)}', '{esc(email)}', '{esc(password_hash)}', 'admin', 'active') RETURNING id"
            )
            user_id = cur.fetchone()[0]
            log_audit(cur, user_id, email, 'bootstrap', get_client_ip(event))
            conn.commit()

            token = make_token(user_id, 'admin', secret)
            return {'statusCode': 201, 'headers': CORS_HEADERS, 'body': json.dumps({'token': token, 'user': {'id': user_id, 'name': name, 'email': email, 'role': 'admin'}}, ensure_ascii=False)}

        # ───────── Вход ─────────
        if method == 'POST':
            body = json.loads(event.get('body') or '{}')
            email = (body.get('email') or '').strip().lower()
            password = body.get('password') or ''
            ip = get_client_ip(event)

            cur.execute(
                f"SELECT id, name, email, password_hash, role, status, failed_attempts, locked_until "
                f"FROM users WHERE email = '{esc(email)}'"
            )
            row = cur.fetchone()

            if not row:
                log_audit(cur, None, email, 'login_failed', ip)
                conn.commit()
                return {'statusCode': 401, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Неверный email или пароль'}, ensure_ascii=False)}

            user_id, name, user_email, password_hash, role, status, failed_attempts, locked_until = row

            if status != 'active':
                return {'statusCode': 403, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Учётная запись отключена'}, ensure_ascii=False)}

            if locked_until is not None:
                cur.execute(f"SELECT now() < '{locked_until}'::timestamp")
                if cur.fetchone()[0]:
                    return {'statusCode': 423, 'headers': CORS_HEADERS, 'body': json.dumps({'error': f'Слишком много неверных попыток. Повторите через {LOCK_MINUTES} минут'}, ensure_ascii=False)}

            if not verify_password(password, password_hash):
                new_attempts = failed_attempts + 1
                if new_attempts >= MAX_FAILED_ATTEMPTS:
                    cur.execute(
                        f"UPDATE users SET failed_attempts = 0, locked_until = now() + interval '{LOCK_MINUTES} minutes' WHERE id = {user_id}"
                    )
                    log_audit(cur, user_id, email, 'locked', ip)
                    conn.commit()
                    return {'statusCode': 423, 'headers': CORS_HEADERS, 'body': json.dumps({'error': f'Слишком много неверных попыток. Учётная запись заблокирована на {LOCK_MINUTES} минут'}, ensure_ascii=False)}
                cur.execute(f"UPDATE users SET failed_attempts = {new_attempts} WHERE id = {user_id}")
                log_audit(cur, user_id, email, 'login_failed', ip)
                conn.commit()
                return {'statusCode': 401, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Неверный email или пароль'}, ensure_ascii=False)}

            cur.execute(f"UPDATE users SET failed_attempts = 0, locked_until = NULL, last_login = now() WHERE id = {user_id}")
            log_audit(cur, user_id, email, 'login_success', ip)
            conn.commit()

            token = make_token(user_id, role, secret)
            return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': json.dumps({'token': token, 'user': {'id': user_id, 'name': name, 'email': user_email, 'role': role}}, ensure_ascii=False)}

        # ───────── Проверка сессии ─────────
        if method == 'GET':
            headers = event.get('headers') or {}
            token = headers.get('X-Auth-Token') or headers.get('x-auth-token', '')
            data = verify_token(token, secret) if token else None
            if not data:
                return {'statusCode': 401, 'headers': CORS_HEADERS, 'body': json.dumps({'valid': False}, ensure_ascii=False)}

            cur.execute(f"SELECT id, name, email, role, status FROM users WHERE id = {data['uid']}")
            row = cur.fetchone()
            if not row or row[4] != 'active':
                return {'statusCode': 401, 'headers': CORS_HEADERS, 'body': json.dumps({'valid': False}, ensure_ascii=False)}

            uid, name, user_email, role, _ = row
            return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': json.dumps({'valid': True, 'user': {'id': uid, 'name': name, 'email': user_email, 'role': role}}, ensure_ascii=False)}

        return {'statusCode': 405, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Метод не поддерживается'})}

    finally:
        cur.close()
        conn.close()
