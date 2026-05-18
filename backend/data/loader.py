"""
Loads source SQL data into Supabase.
Run once (or on data refresh) — not called at API startup.
"""
import os
from supabase import create_client


def get_client():
    return create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_KEY"])


def load_sql_file(path: str) -> None:
    """Execute a .sql file against the Supabase database. (stub)"""
    # TODO: connect via psycopg2/asyncpg and execute the SQL
    raise NotImplementedError


if __name__ == "__main__":
    load_sql_file("rag/gerf_2026.sql")
