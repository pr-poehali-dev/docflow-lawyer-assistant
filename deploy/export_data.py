import json
import os
import sys
from datetime import date, datetime
from decimal import Decimal
from pathlib import Path

import psycopg2

TABLES = ["users", "clients", "cases", "generated_documents", "login_audit", "activity_log"]


def default(value):
    if isinstance(value, (datetime, date)):
        return value.isoformat()
    if isinstance(value, Decimal):
        return float(value)
    raise TypeError(type(value))


def main() -> None:
    dsn = os.environ["SOURCE_DATABASE_URL"]
    schema = os.environ.get("SOURCE_SCHEMA", "public")
    out = Path(sys.argv[1] if len(sys.argv) > 1 else "export")
    out.mkdir(parents=True, exist_ok=True)
    conn = psycopg2.connect(dsn, options=f"-c search_path={schema}")
    cur = conn.cursor()
    for table in TABLES:
        try:
            cur.execute(f"SELECT * FROM {table} ORDER BY 1")
        except psycopg2.Error:
            conn.rollback()
            print("Пропущена (нет таблицы):", table)
            continue
        columns = [d[0] for d in cur.description]
        rows = [dict(zip(columns, r)) for r in cur.fetchall()]
        (out / f"{table}.json").write_text(json.dumps(rows, default=default, ensure_ascii=False, indent=1), encoding="utf-8")
        print(table, len(rows))
    conn.close()


if __name__ == "__main__":
    main()
