import json
import os
import hmac
import hashlib
import base64
import time
from typing import Dict, Any

CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Auth-Token',
    'Access-Control-Max-Age': '86400',
}

SESSION_TTL = 60 * 60 * 24 * 30  # 30 дней


def _sign(payload: str, secret: str) -> str:
    return base64.urlsafe_b64encode(
        hmac.new(secret.encode(), payload.encode(), hashlib.sha256).digest()
    ).decode().rstrip('=')


def make_token(secret: str) -> str:
    payload = str(int(time.time()) + SESSION_TTL)
    sig = _sign(payload, secret)
    return f"{payload}.{sig}"


def verify_token(token: str, secret: str) -> bool:
    try:
        payload, sig = token.split('.', 1)
        expected_sig = _sign(payload, secret)
        if not hmac.compare_digest(sig, expected_sig):
            return False
        expires_at = int(payload)
        return time.time() < expires_at
    except Exception:
        return False


def handler(event: Dict[str, Any], context) -> Dict[str, Any]:
    '''Проверка общего пароля для входа сотрудников и валидация сессионного токена'''
    method = event.get('httpMethod', 'GET')

    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': ''}

    secret = os.environ.get('AUTH_SECRET', '')
    site_password = os.environ.get('SITE_PASSWORD', '')

    if method == 'POST':
        body = json.loads(event.get('body') or '{}')
        password = body.get('password', '')

        if not site_password:
            return {'statusCode': 500, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Пароль для входа ещё не настроен администратором'}, ensure_ascii=False)}

        if password != site_password:
            return {'statusCode': 401, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Неверный пароль'}, ensure_ascii=False)}

        token = make_token(secret)
        return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': json.dumps({'token': token}, ensure_ascii=False)}

    if method == 'GET':
        headers = event.get('headers') or {}
        token = headers.get('X-Auth-Token') or headers.get('x-auth-token', '')
        valid = bool(token) and verify_token(token, secret)
        return {'statusCode': 200 if valid else 401, 'headers': CORS_HEADERS, 'body': json.dumps({'valid': valid}, ensure_ascii=False)}

    return {'statusCode': 405, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Метод не поддерживается'})}
