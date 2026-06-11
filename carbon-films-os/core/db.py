"""
Database layer — SQLite (sem dependências externas).
Caminho: /root/carbon-films-os/data/carbonfilms.db
"""
import sqlite3
import json
from pathlib import Path
from datetime import datetime
from contextlib import contextmanager

DB_PATH = Path(__file__).parent.parent / "data" / "carbonfilms.db"
DB_PATH.parent.mkdir(exist_ok=True)


@contextmanager
def get_conn():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def setup():
    with get_conn() as conn:
        conn.executescript("""
        CREATE TABLE IF NOT EXISTS agents (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE NOT NULL,
            department TEXT,
            role TEXT,
            status TEXT DEFAULT 'active',
            created_at TEXT DEFAULT (datetime('now'))
        );
        INSERT OR IGNORE INTO agents (name, department, role) VALUES
            ('architect', 'diretoria',  'Visão estratégica, design do sistema, decisões de arquitetura'),
            ('manager',   'operacional','Coordenação de agentes, criação de tarefas, acompanhamento'),
            ('social',    'marketing',  'Conteúdo e redes sociais'),
            ('leads',     'comercial',  'Prospecção e qualificação de leads'),
            ('campaign',  'comercial',  'Cadência de mensagens e follow-up'),
            ('sdr',       'comercial',  'Negociação e agendamento de reuniões'),
            ('analyst',   'comercial',  'Análise de resultados e aprendizado');

        CREATE TABLE IF NOT EXISTS objectives (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            objective TEXT NOT NULL,
            department TEXT,
            priority TEXT DEFAULT 'medium',
            status TEXT DEFAULT 'open',
            deadline TEXT,
            result TEXT,
            created_by TEXT DEFAULT 'human',
            created_at TEXT DEFAULT (datetime('now')),
            updated_at TEXT DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS tasks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            objective_id INTEGER REFERENCES objectives(id),
            agent TEXT REFERENCES agents(name),
            task TEXT NOT NULL,
            priority TEXT DEFAULT 'medium',
            status TEXT DEFAULT 'pending',
            result TEXT,
            error TEXT,
            created_at TEXT DEFAULT (datetime('now')),
            started_at TEXT,
            completed_at TEXT
        );

        CREATE TABLE IF NOT EXISTS agent_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            agent TEXT,
            task_id INTEGER REFERENCES tasks(id),
            action TEXT NOT NULL,
            details TEXT,
            created_at TEXT DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS leads (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            company TEXT,
            segment TEXT,
            contact_phone TEXT,
            contact_email TEXT,
            contact_instagram TEXT,
            source TEXT,
            status TEXT DEFAULT 'new',
            notes TEXT,
            assigned_agent TEXT,
            created_at TEXT DEFAULT (datetime('now')),
            updated_at TEXT DEFAULT (datetime('now'))
        );
        """)


def create_objective(title, objective, department=None, priority="medium",
                     deadline=None, created_by="human"):
    with get_conn() as conn:
        cur = conn.execute("""
            INSERT INTO objectives (title, objective, department, priority, deadline, created_by)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (title, objective, department, priority, deadline, created_by))
        return cur.lastrowid


def get_active_objectives():
    with get_conn() as conn:
        rows = conn.execute("""
            SELECT o.*,
                   COUNT(t.id) as total_tasks,
                   COUNT(CASE WHEN t.status='done' THEN 1 END) as done_tasks,
                   COUNT(CASE WHEN t.status='pending' THEN 1 END) as pending_tasks
            FROM objectives o
            LEFT JOIN tasks t ON t.objective_id = o.id
            WHERE o.status IN ('open', 'in_progress')
            GROUP BY o.id
            ORDER BY CASE o.priority WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END,
                     o.created_at ASC
        """).fetchall()
        return [dict(r) for r in rows]


def update_objective_status(objective_id, status):
    with get_conn() as conn:
        conn.execute("UPDATE objectives SET status=?, updated_at=datetime('now') WHERE id=?",
                     (status, objective_id))


def create_task(agent, task, priority="medium", objective_id=None):
    with get_conn() as conn:
        cur = conn.execute("""
            INSERT INTO tasks (objective_id, agent, task, priority, status)
            VALUES (?, ?, ?, ?, 'pending')
        """, (objective_id, agent, task, priority))
        return cur.lastrowid


def get_pending_tasks(agent=None):
    with get_conn() as conn:
        if agent:
            rows = conn.execute("""
                SELECT * FROM tasks WHERE status='pending' AND agent=?
                ORDER BY CASE priority WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END,
                         created_at ASC
            """, (agent,)).fetchall()
        else:
            rows = conn.execute("""
                SELECT * FROM tasks WHERE status='pending'
                ORDER BY agent,
                         CASE priority WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END,
                         created_at ASC
            """).fetchall()
        return [dict(r) for r in rows]


def update_task(task_id, status, result=None, error=None):
    now = datetime.now().isoformat()
    with get_conn() as conn:
        if status == "running":
            conn.execute("UPDATE tasks SET status=?, started_at=? WHERE id=?",
                         (status, now, task_id))
        else:
            conn.execute("""
                UPDATE tasks SET status=?, result=?, error=?, completed_at=? WHERE id=?
            """, (status, result, error, now, task_id))


def log_action(agent, action, task_id=None, details=None):
    with get_conn() as conn:
        conn.execute("""
            INSERT INTO agent_logs (agent, task_id, action, details)
            VALUES (?, ?, ?, ?)
        """, (agent, task_id, action, json.dumps(details or {})))


def create_lead(name, company, segment=None, contact_phone=None,
                contact_instagram=None, source=None):
    with get_conn() as conn:
        cur = conn.execute("""
            INSERT INTO leads (name, company, segment, contact_phone,
                               contact_instagram, source, status)
            VALUES (?, ?, ?, ?, ?, ?, 'new')
        """, (name, company, segment, contact_phone, contact_instagram, source))
        return cur.lastrowid


def get_leads(status=None):
    with get_conn() as conn:
        if status:
            rows = conn.execute(
                "SELECT * FROM leads WHERE status=? ORDER BY created_at DESC", (status,)
            ).fetchall()
        else:
            rows = conn.execute(
                "SELECT * FROM leads ORDER BY created_at DESC"
            ).fetchall()
        return [dict(r) for r in rows]


def update_lead_status(lead_id, status, notes=None):
    with get_conn() as conn:
        conn.execute("""
            UPDATE leads SET status=?, notes=?, updated_at=datetime('now') WHERE id=?
        """, (status, notes, lead_id))


setup()
