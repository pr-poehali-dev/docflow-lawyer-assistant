import json
import os
import sys
from pathlib import Path

import psycopg2
from psycopg2.extras import Json

ORDER = ["users", "clients", "cases", "generated_documents", "login_audit", "activity_log"]


def main() -> None:
    src = Path(sys.argv[1] if len(sys.argv) > 1 else "export")
    conn = psycopg2.connect(os.environ["DATABASE_URL"])
    cur = conn.cursor()
    for table in ORDER:
        path = src / f"{table}.json"
        if not path.exists():
            continue
        rows = json.loads(path.read_text(encoding="utf-8"))
        for row in rows:
            cols = list(row.keys())
            values = [Json(v) if isinstance(v, (dict, list)) else v for v in row.values()]
            cur.execute(
                f"INSERT INTO {table} ({', '.join(cols)}) VALUES ({', '.join(['%s'] * len(cols))}) ON CONFLICT DO NOTHING",
                values,
            )
        if rows and "id" in rows[0]:
            cur.execute(f"SELECT setval(pg_get_serial_sequence('{table}', 'id'), COALESCE(MAX(id), 1)) FROM {table}")
        print(table, len(rows))
    conn.commit()
    conn.close()


if __name__ == "__main__":
    main()
