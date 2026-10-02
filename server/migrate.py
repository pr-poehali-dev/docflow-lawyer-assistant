import os
import sys
from pathlib import Path

import psycopg2

DSN = os.environ["DATABASE_URL"]
SCHEMA = os.environ.get("MAIN_DB_SCHEMA", "public")
MIGRATIONS_DIR = Path(os.environ.get("MIGRATIONS_DIR", Path(__file__).resolve().parent.parent / "db_migrations"))


def main() -> None:
    conn = psycopg2.connect(DSN, options=f"-c search_path={SCHEMA}")
    conn.autocommit = False
    cur = conn.cursor()
    cur.execute("CREATE TABLE IF NOT EXISTS schema_migrations (name TEXT PRIMARY KEY, applied_at TIMESTAMP NOT NULL DEFAULT now())")
    conn.commit()
    cur.execute("SELECT name FROM schema_migrations")
    done = {r[0] for r in cur.fetchall()}
    for path in sorted(MIGRATIONS_DIR.glob("V*.sql")):
        if path.name in done:
            continue
        print("Применяю", path.name, flush=True)
        try:
            cur.execute(path.read_text(encoding="utf-8"))
            cur.execute("INSERT INTO schema_migrations (name) VALUES (%s)", (path.name,))
            conn.commit()
        except Exception as exc:
            conn.rollback()
            print("Ошибка миграции", path.name, exc, file=sys.stderr)
            sys.exit(1)
    conn.close()


if __name__ == "__main__":
    main()
