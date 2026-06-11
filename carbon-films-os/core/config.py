import os
import json
from pathlib import Path

# ── Paths ──────────────────────────────────────────────
ROOT        = Path(__file__).parent.parent
BRAIN_DIR   = ROOT / "company-brain"
MANAGER_DIR = ROOT / "manager"
WORKERS_DIR = ROOT / "workers"

# ── Database ───────────────────────────────────────────
DB_CONFIG = {
    "host":     os.getenv("DB_HOST",     "localhost"),
    "port":     int(os.getenv("DB_PORT", "5432")),
    "database": os.getenv("DB_NAME",     "carbonfilms"),
    "user":     os.getenv("DB_USER",     "postgres"),
    "password": os.getenv("DB_PASSWORD", ""),
}

# ── Anthropic ──────────────────────────────────────────
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")
CLAUDE_MODEL      = "claude-sonnet-4-20250514"
MAX_TOKENS        = 4096

# ── Agents ─────────────────────────────────────────────
AGENTS = ["leads", "campaign", "sdr", "analyst", "social"]

DEPARTMENTS = {
    "comercial": ["leads", "campaign", "sdr", "analyst"],
    "marketing": ["social"],
    "produto":   ["crm_dev"],
}

# ── Helpers ────────────────────────────────────────────
def load_brain() -> dict:
    """Carrega todos os arquivos do company-brain como dict."""
    brain = {}
    for f in BRAIN_DIR.iterdir():
        if f.suffix == ".json":
            brain[f.stem] = json.loads(f.read_text())
        elif f.suffix == ".md":
            brain[f.stem] = f.read_text()
        elif f.suffix == ".sql":
            pass  # ignora SQL no brain
    return brain

def brain_context() -> str:
    """Retorna company-brain formatado como contexto para prompts."""
    brain = load_brain()
    parts = []
    for key, value in brain.items():
        content = json.dumps(value, ensure_ascii=False) if isinstance(value, dict) else value
        parts.append(f"=== {key} ===\n{content}")
    return "\n\n".join(parts)
