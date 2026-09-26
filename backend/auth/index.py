import json
import os
import hmac
import hashlib
import base64
import time
import secrets
from typing import Dict, Any, Optional
import psycopg2
import requests

CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Auth-Token',
    'Access-Control-Max-Age': '86400',
}

SESSION_TTL = 60 * 60 * 12  # 12 часов — автоматический выход при долгом бездействии сессии
PENDING_2FA_TTL = 60 * 10  # 10 минут на ввод кода из письма
MAX_FAILED_ATTEMPTS = 5
LOCK_MINUTES = 15
CODE_MAX_ATTEMPTS = 5
FROM_EMAIL = 'ЛЕГИС ПРО <onboarding@resend.dev>'


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


def hash_code(code: str) -> str:
    return hashlib.sha256(code.encode()).hexdigest()


# ───────── Токены ─────────
def _sign(payload: str, secret: str) -> str:
    return base64.urlsafe_b64encode(
        hmac.new(secret.encode(), payload.encode(), hashlib.sha256).digest()
    ).decode().rstrip('=')


def make_token(user_id: int, role: str, secret: str, purpose: str = 'session', ttl: int = SESSION_TTL) -> str:
    expires_at = int(time.time()) + ttl
    payload_obj = {'uid': user_id, 'role': role, 'exp': expires_at, 'purpose': purpose}
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


def mask_email(email: str) -> str:
    try:
        local, domain = email.split('@', 1)
        visible = local[:2] if len(local) > 2 else local[:1]
        return f"{visible}{'*' * max(len(local) - len(visible), 2)}@{domain}"
    except Exception:
        return email


def send_2fa_email(to_email: str, name: str, code: str) -> Optional[str]:
    '''Отправляет письмо с кодом подтверждения через Resend. Возвращает текст ошибки или None при успехе'''
    api_key = os.environ.get('RESEND_API_KEY')
    if not api_key:
        return 'Отправка email не настроена администратором'
    try:
        resp = requests.post(
            'https://api.resend.com/emails',
            headers={'Authorization': f'Bearer {api_key}', 'Content-Type': 'application/json'},
            json={
                'from': FROM_EMAIL,
                'to': [to_email],
                'subject': f'Код входа: {code}',
                'html': (
                    f'<p>Здравствуйте, {name}!</p>'
                    f'<p>Ваш код для входа в систему ЛЕГИС ПРО:</p>'
                    f'<p style="font-size:28px;font-weight:bold;letter-spacing:4px;">{code}</p>'
                    f'<p>Код действителен 10 минут. Если вы не пытались войти — проигнорируйте это письмо.</p>'
                ),
            },
            timeout=8,
        )
        if resp.status_code >= 400:
            return f'Не удалось отправить письмо (код {resp.status_code})'
        return None
    except Exception as e:
        return f'Не удалось отправить письмо: {e}'


def issue_2fa_code(cur, user_id: int, email: str, name: str) -> Optional[str]:
    '''Генерирует код, сохраняет его хеш в БД и отправляет письмо. Возвращает текст ошибки или None'''
    code = f"{secrets.randbelow(1_000_000):06d}"
    cur.execute(
        f"INSERT INTO login_2fa_codes (user_id, code_hash, expires_at) "
        f"VALUES ({user_id}, '{esc(hash_code(code))}', now() + interval '{PENDING_2FA_TTL} seconds')"
    )
    return send_2fa_email(email, name, code)


def handler(event: Dict[str, Any], context) -> Dict[str, Any]:
    '''Аутентификация сотрудников с двухфакторной защитой: вход по email/паролю, код подтверждения на почту, блокировка после неудачных попыток, создание первого администратора, проверка сессии'''
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

        # ───────── Шаг 2: проверка кода из письма ─────────
        if method == 'POST' and action == 'verify_2fa':
            body = json.loads(event.get('body') or '{}')
            pending_token = body.get('pending_token') or ''
            code = (body.get('code') or '').strip()
            ip = get_client_ip(event)

            data = verify_token(pending_token, secret)
            if not data or data.get('purpose') != 'pending_2fa':
                return {'statusCode': 401, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Сессия входа истекла, попробуйте войти заново'}, ensure_ascii=False)}

            user_id = int(data['uid'])
            cur.execute(
                f"SELECT id, name, email, role, status FROM users WHERE id = {user_id}"
            )
            user_row = cur.fetchone()
            if not user_row or user_row[4] != 'active':
                return {'statusCode': 403, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Учётная запись недоступна'}, ensure_ascii=False)}
            _, name, email, role, _ = user_row

            cur.execute(
                f"SELECT id, code_hash, attempts, expires_at < now() as is_expired "
                f"FROM login_2fa_codes WHERE user_id = {user_id} ORDER BY created_at DESC LIMIT 1"
            )
            code_row = cur.fetchone()
            if not code_row:
                return {'statusCode': 400, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Код не найден, запросите новый'}, ensure_ascii=False)}

            code_id, code_hash, attempts, is_expired = code_row
            if is_expired:
                return {'statusCode': 400, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Код истёк, запросите новый'}, ensure_ascii=False)}
            if attempts >= CODE_MAX_ATTEMPTS:
                return {'statusCode': 423, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Превышено число попыток, запросите новый код'}, ensure_ascii=False)}

            if not hmac.compare_digest(hash_code(code), code_hash):
                cur.execute(f"UPDATE login_2fa_codes SET attempts = attempts + 1 WHERE id = {code_id}")
                log_audit(cur, user_id, email, 'login_2fa_failed', ip)
                conn.commit()
                return {'statusCode': 401, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Неверный код'}, ensure_ascii=False)}

            cur.execute(f"DELETE FROM login_2fa_codes WHERE user_id = {user_id}")
            cur.execute(f"UPDATE users SET last_login = now() WHERE id = {user_id}")
            log_audit(cur, user_id, email, 'login_success', ip)
            conn.commit()

            token = make_token(user_id, role, secret)
            return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': json.dumps({'token': token, 'user': {'id': user_id, 'name': name, 'email': email, 'role': role}}, ensure_ascii=False)}

        # ───────── Повторная отправка кода ─────────
        if method == 'POST' and action == 'resend_2fa':
            body = json.loads(event.get('body') or '{}')
            pending_token = body.get('pending_token') or ''

            data = verify_token(pending_token, secret)
            if not data or data.get('purpose') != 'pending_2fa':
                return {'statusCode': 401, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Сессия входа истекла, попробуйте войти заново'}, ensure_ascii=False)}

            user_id = int(data['uid'])
            cur.execute(f"SELECT name, email FROM users WHERE id = {user_id}")
            row = cur.fetchone()
            if not row:
                return {'statusCode': 404, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Пользователь не найден'}, ensure_ascii=False)}
            name, email = row

            send_error = issue_2fa_code(cur, user_id, email, name)
            conn.commit()
            if send_error:
                return {'statusCode': 502, 'headers': CORS_HEADERS, 'body': json.dumps({'error': send_error}, ensure_ascii=False)}
            return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': json.dumps({'sent': True, 'email': mask_email(email)}, ensure_ascii=False)}

        # ───────── Шаг 1: вход по email/паролю ─────────
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

            # Пароль верный — сбрасываем счётчик неудач и отправляем код подтверждения
            cur.execute(f"UPDATE users SET failed_attempts = 0, locked_until = NULL WHERE id = {user_id}")
            send_error = issue_2fa_code(cur, user_id, user_email, name)
            log_audit(cur, user_id, email, 'login_2fa_sent', ip)
            conn.commit()

            if send_error:
                return {'statusCode': 502, 'headers': CORS_HEADERS, 'body': json.dumps({'error': send_error}, ensure_ascii=False)}

            pending_token = make_token(user_id, role, secret, purpose='pending_2fa', ttl=PENDING_2FA_TTL)
            return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': json.dumps({
                'requires_2fa': True,
                'pending_token': pending_token,
                'email': mask_email(user_email),
            }, ensure_ascii=False)}

        # ───────── Проверка сессии ─────────
        if method == 'GET':
            headers = event.get('headers') or {}
            token = headers.get('X-Auth-Token') or headers.get('x-auth-token', '')
            data = verify_token(token, secret) if token else None
            if not data or data.get('purpose') not in (None, 'session'):
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
