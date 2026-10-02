FROM python:3.12-slim
WORKDIR /app
COPY server/requirements.txt /app/server/requirements.txt
RUN pip install --no-cache-dir -r /app/server/requirements.txt
COPY server /app/server
COPY backend /app/backend
COPY db_migrations /app/db_migrations
ENV BACKEND_DIR=/app/backend MIGRATIONS_DIR=/app/db_migrations STORAGE_DIR=/data/files STORAGE_BACKEND=local MAIL_BACKEND=smtp PYTHONUNBUFFERED=1
RUN useradd -m app && mkdir -p /data/files && chown -R app /data
USER app
WORKDIR /app/server
CMD ["sh", "-c", "python migrate.py && uvicorn main:app --host 0.0.0.0 --port 8000 --proxy-headers --forwarded-allow-ips='*'"]
