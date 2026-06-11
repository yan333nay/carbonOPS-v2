import psycopg2
import psycopg2.extras
from contextlib import contextmanager
from datetime import datetime
from core.config import DB_CONFIG


@contextmanager
def get_conn():
    conn = psycopg2.connect(**DB_CONFIG)
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


# ── Objectives ─────────────────────────────────────────

def create_objective(title: str, objective: str, department: str = None,
                     priority: str = "medium", deadline: str = None) -> int:
    with get_conn() as conn:
        cur = conn.cursor()
        cur.execute("""
            INSERT INTO objectives (title, objective, department, priority, deadline)
            VALUES (%s, %s, %s, %s, %s) RETURNING id
        """, (title, objective, department, priority, deadline))
        return cur.fetchone()[0]


def get_active_objectives() -> list:
    with get_conn() as conn:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute("""
            SELECT o.*, 
                   COUNT(t.id) as total_tasks,
                   COUNT(t.id) FILTER (WHERE t.status = 'done') as done_tasks,
                   COUNT(t.id) FILTER (WHERE t.status = 'pending') as pending_tasks
            FROM objectives o
            LEFT JOIN tasks t ON t.objective_id = o.id
            WHERE o.status IN ('open', 'in_progress')
            GROUP BY o.id
            ORDER BY o.priority DESC, o.created_at ASC
        """)
        return cur.fetchall()


def update_objective_status(objective_id: int, status: str):
    with get_conn() as conn:
        cur = conn.cursor()
        cur.execute("""
            UPDATE objectives SET status = %s, updated_at = NOW()
            WHERE id = %s
        """, (status, objective_id))


# ── Tasks ──────────────────────────────────────────────

def create_task(agent: str, task: str, priority: str = "medium",
                objective_id: int = None) -> int:
    with get_conn() as conn:
        cur = conn.cursor()
        cur.execute("""
            INSERT INTO tasks (objective_id, agent, task, priority, status)
            VALUES (%s, %s, %s, %s, 'pending') RETURNING id
        """, (objective_id, agent, task, priority))
        return cur.fetchone()[0]


def get_pending_tasks(agent: str = None) -> list:
    with get_conn() as conn:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        if agent:
            cur.execute("""
                SELECT * FROM tasks WHERE status = 'pending' AND agent = %s
                ORDER BY priority DESC, created_at ASC
            """, (agent,))
        else:
            cur.execute("""
                SELECT * FROM tasks WHERE status = 'pending'
                ORDER BY agent, priority DESC, created_at ASC
            """)
        return cur.fetchall()


def update_task(task_id: int, status: str, result: str = None, error: str = None):
    with get_conn() as conn:
        cur = conn.cursor()
        now = datetime.now()
        if status == "running":
            cur.execute("""
                UPDATE tasks SET status = %s, started_at = %s WHERE id = %s
            """, (status, now, task_id))
        else:
            cur.execute("""
                UPDATE tasks SET status = %s, result = %s, error = %s,
                completed_at = %s WHERE id = %s
            """, (status, result, error, now, task_id))


# ── Logs ───────────────────────────────────────────────

def log_action(agent: str, action: str, task_id: int = None, details: dict = None):
    import json
    with get_conn() as conn:
        cur = conn.cursor()
        cur.execute("""
            INSERT INTO agent_logs (agent, task_id, action, details)
            VALUES (%s, %s, %s, %s)
        """, (agent, task_id, action, json.dumps(details or {})))


# ── Leads ──────────────────────────────────────────────

def create_lead(name: str, company: str, segment: str = None,
                contact_phone: str = None, contact_instagram: str = None,
                source: str = None) -> int:
    with get_conn() as conn:
        cur = conn.cursor()
        cur.execute("""
            INSERT INTO leads (name, company, segment, contact_phone,
                               contact_instagram, source, status)
            VALUES (%s, %s, %s, %s, %s, %s, 'new') RETURNING id
        """, (name, company, segment, contact_phone, contact_instagram, source))
        return cur.fetchone()[0]


def get_leads(status: str = None) -> list:
    with get_conn() as conn:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        if status:
            cur.execute("SELECT * FROM leads WHERE status = %s ORDER BY created_at DESC", (status,))
        else:
            cur.execute("SELECT * FROM leads ORDER BY created_at DESC")
        return cur.fetchall()


def update_lead_status(lead_id: int, status: str, notes: str = None):
    with get_conn() as conn:
        cur = conn.cursor()
        cur.execute("""
            UPDATE leads SET status = %s, notes = %s, updated_at = NOW()
            WHERE id = %s
        """, (status, notes, lead_id))
