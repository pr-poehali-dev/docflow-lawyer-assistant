import hashlib
import hmac
import importlib.util
import json
import logging
import mimetypes
import os
import sys
import time
import uuid
from pathlib import Path
from urllib.parse import quote

from fastapi import FastAPI, Request, Response
from fastapi.concurrency import run_in_threadpool
from fastapi.responses import FileResponse, JSONResponse

logger = logging.getLogger("legis")

BACKEND_DIR = Path(os.environ.get("BACKEND_DIR", Path(__file__).resolve().parent.parent / "backend"))
STORAGE_DIR = Path(os.environ.get("STORAGE_DIR", "/data/files")).resolve()
FILES_PREFIX = os.environ.get("FILES_URL_PREFIX", "/api/files").rstrip("/")
SECRET = os.environ.get("AUTH_SECRET", "")
LINK_TTL_SECONDS = 600

FUNCTIONS = ("auth", "users", "clients", "cases", "documents-generate")
LOGGED_RESOURCES = {"users", "clients", "cases", "documents-generate"}
WRITE_METHODS = {"POST", "PUT", "DELETE"}
ACTIONS = {"POST": "create", "PUT": "update", "DELETE": "delete"}

if len(SECRET) < 32:
    raise RuntimeError("AUTH_SECRET должен быть не короче 32 символов")


def load_function(name: str):
    folder = BACKEND_DIR / name
    sys.path.insert(0, str(folder))
    try:
        spec = importlib.util.spec_from_file_location("fn_" + name.replace("-", "_"), folder / "index.py")
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)
    finally:
        sys.path.remove(str(folder))
    return module


MODULES = {name: load_function(name) for name in FUNCTIONS}


class Context:
    def __init__(self):
        self.request_id = str(uuid.uuid4())


def client_ip(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for", "").split(",")[0].strip()
    if forwarded:
        return forwarded
    return request.client.host if request.client else ""


def token_user_id(request: Request):
    token = request.headers.get("x-auth-token", "")
    if not token:
        return None
    data = MODULES["auth"].verify_token(token, SECRET)
    if not data or data.get("purpose") not in (None, "session"):
        return None
    return int(data["uid"])


def file_signature(path: str, exp: int, uid: int) -> str:
    message = f"{path}|{exp}|{uid}".encode()
    return hmac.new(SECRET.encode(), message, hashlib.sha256).hexdigest()


def signed_file_url(path: str, uid) -> str:
    exp = int(time.time()) + LINK_TTL_SECONDS
    uid_value = uid or 0
    sig = file_signature(path, exp, uid_value)
    return f"{FILES_PREFIX}/{quote(path)}?exp={exp}&uid={uid_value}&sig={sig}"


def sign_document_urls(body: str, uid) -> str:
    try:
        data = json.loads(body)
    except ValueError:
        return body
    items = data if isinstance(data, list) else [data]
    for item in items:
        if not isinstance(item, dict):
            continue
        for key in ("docx_url", "pdf_url"):
            value = item.get(key)
            if isinstance(value, str) and value.startswith(FILES_PREFIX + "/"):
                item[key] = signed_file_url(value[len(FILES_PREFIX) + 1:], uid)
    return json.dumps(data, ensure_ascii=False)


def record_activity(user_id, action: str, resource: str, resource_id, ip: str) -> None:
    try:
        conn = MODULES["auth"].get_conn()
        try:
            cur = conn.cursor()
            cur.execute(
                "INSERT INTO activity_log (user_id, action, resource, resource_id, ip_address) "
                "VALUES (%s, %s, %s, %s, %s)",
                (user_id, action, resource, None if resource_id is None else str(resource_id), ip),
            )
            conn.commit()
        finally:
            conn.close()
    except Exception:
        logger.exception("Не удалось записать действие в журнал")


def extract_resource_id(request: Request, raw_body: str, response_body: str):
    rid = request.query_params.get("id")
    if rid:
        return rid
    for source in (raw_body, response_body):
        try:
            data = json.loads(source)
        except ValueError:
            continue
        if isinstance(data, dict) and data.get("id") is not None:
            return data["id"]
    return None


app = FastAPI(docs_url=None, redoc_url=None, openapi_url=None)


@app.get("/api/health")
async def health():
    return {"status": "ok"}


@app.get("/api/files/{path:path}")
async def download_file(path: str, request: Request, exp: int = 0, uid: int = 0, sig: str = ""):
    expected = file_signature(path, exp, uid)
    if exp < time.time() or not hmac.compare_digest(expected, sig):
        return JSONResponse({"error": "Ссылка недействительна или устарела"}, status_code=403)

    full_path = (STORAGE_DIR / path).resolve()
    if STORAGE_DIR not in full_path.parents or not full_path.is_file():
        return JSONResponse({"error": "Файл не найден"}, status_code=404)

    await run_in_threadpool(record_activity, uid or None, "download", "files", path, client_ip(request))
    media_type = mimetypes.guess_type(full_path.name)[0] or "application/octet-stream"
    return FileResponse(full_path, filename=full_path.name, media_type=media_type)


@app.api_route("/api/{name}", methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"])
async def function_proxy(name: str, request: Request):
    module = MODULES.get(name)
    if module is None:
        return JSONResponse({"error": "Не найдено"}, status_code=404)

    method = request.method
    raw_body = (await request.body()).decode("utf-8") if method in WRITE_METHODS else ""
    ip = client_ip(request)

    event = {
        "httpMethod": method,
        "headers": dict(request.headers),
        "queryStringParameters": dict(request.query_params) or None,
        "body": raw_body,
        "isBase64Encoded": False,
        "requestContext": {"identity": {"sourceIp": ip}},
    }

    try:
        result = await run_in_threadpool(module.handler, event, Context())
    except Exception:
        logger.exception("Ошибка в обработчике %s", name)
        return JSONResponse({"error": "Внутренняя ошибка сервера"}, status_code=500)

    status = int(result.get("statusCode", 200))
    body = result.get("body") or ""
    uid = await run_in_threadpool(token_user_id, request)

    if name == "documents-generate" and status == 200 and method in ("GET", "POST"):
        body = sign_document_urls(body, uid)

    try:
        is_dry_run = bool(json.loads(raw_body).get("check_only")) if raw_body else False
    except (ValueError, AttributeError):
        is_dry_run = False
    if method in WRITE_METHODS and name in LOGGED_RESOURCES and status < 400 and not is_dry_run:
        action = "generate" if name == "documents-generate" else ACTIONS[method]
        resource_id = extract_resource_id(request, raw_body, body)
        await run_in_threadpool(record_activity, uid, action, name, resource_id, ip)

    return Response(content=body, status_code=status, media_type="application/json")
