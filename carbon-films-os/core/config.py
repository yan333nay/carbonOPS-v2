import os
import json
from pathlib import Path
from dotenv import load_dotenv

ROOT      = Path(__file__).parent.parent
BRAIN_DIR = ROOT / "company-brain"

load_dotenv(ROOT / ".env")

ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")
CLAUDE_MODEL      = "claude-sonnet-4-6"
MAX_TOKENS        = 4096

AGENTS     = ["leads", "campaign", "sdr", "analyst", "social"]
ALL_AGENTS = ["architect", "manager"] + AGENTS

DEPARTMENTS = {
    "diretoria":   ["architect"],
    "operacional": ["manager"],
    "comercial":   ["leads", "campaign", "sdr", "analyst"],
    "marketing":   ["social"],
}


def load_brain() -> dict:
    brain = {}
    for f in BRAIN_DIR.iterdir():
        if f.suffix == ".json":
            brain[f.stem] = json.loads(f.read_text())
        elif f.suffix == ".md":
            brain[f.stem] = f.read_text()
    return brain


def brain_context() -> str:
    brain = load_brain()
    parts = []
    priority_keys = ["company", "vision", "offers", "sales-process", "agent-map"]
    all_keys = priority_keys + [k for k in brain if k not in priority_keys]
    for key in all_keys:
        if key not in brain:
            continue
        value = brain[key]
        content = json.dumps(value, ensure_ascii=False, indent=2) if isinstance(value, dict) else value
        parts.append(f"=== {key} ===\n{content}")
    return "\n\n".join(parts)
