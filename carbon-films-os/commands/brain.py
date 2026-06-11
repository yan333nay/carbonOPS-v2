#!/usr/bin/env python3
"""
/brain

Mostra resumo do company-brain atual.
"""
import sys, json
sys.path.insert(0, str(__file__).replace("/commands/brain.py", ""))

from core.config import BRAIN_DIR

def run():
    print("\n" + "="*60)
    print("  COMPANY BRAIN — CARBON FILMS")
    print("="*60 + "\n")

    for f in sorted(BRAIN_DIR.iterdir()):
        if f.suffix not in (".md", ".json"):
            continue
        size = f.stat().st_size
        filled = "✅" if size > 200 else "⚠️  VAZIO"
        print(f"  {filled}  {f.name:30} ({size:,} bytes)")

    print()
    print("  Edite os arquivos em /company-brain/ para atualizar.")
    print("="*60 + "\n")


if __name__ == "__main__":
    run()
