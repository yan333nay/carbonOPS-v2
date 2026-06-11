#!/usr/bin/env python3
"""
/architech "<pergunta ou problema>"

O Architect analisa o sistema, toma decisões arquiteturais e instrui o Manager.
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from core.config import brain_context
from core.claude_client import ask
from core.db import get_active_objectives, get_pending_tasks, create_objective, log_action

ARCHITECT_SYSTEM = open(
    os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
                 "architect", "architect.md")
).read()


def run(input_text: str):
    print(f"\n🏛️  Architect recebeu: {input_text}\n")

    brain = brain_context()
    objectives = get_active_objectives()
    pending    = get_pending_tasks()

    system_state = f"""
## Estado atual do sistema

Objetivos ativos: {len(objectives)}
{chr(10).join(f"- [{o['id']}] {o['title']} | {o['status']} | {o['done_tasks'] or 0}/{o['total_tasks'] or 0} tarefas" for o in objectives)}

Tarefas pendentes: {len(pending)}
Por agente: { {a: sum(1 for t in pending if t['agent']==a) for a in set(t['agent'] for t in pending)} }
"""

    prompt = f"""
## Company Brain
{brain}

{system_state}

## Input do Yan
{input_text}

## Sua resposta
Analise como Architect. Seja direto e estruturado:

1. **DIAGNÓSTICO** — qual é a situação real
2. **DECISÃO** — o que deve mudar ou ser criado no sistema
3. **PLANO** — passos concretos de implementação
4. **INSTRUÇÃO AO MANAGER** — se necessário, qual objetivo criar (ou "nenhuma — decisão puramente arquitetural")

Se precisar criar um objetivo no banco para o Manager, termine com:
[CRIAR_OBJETIVO: título | departamento | prioridade | descrição]
"""

    print("⏳ Architect analisando...\n")
    response = ask(ARCHITECT_SYSTEM, prompt, max_tokens=2000)

    print("=" * 60)
    print("  ARCHITECT — CARBON FILMS")
    print("=" * 60)
    print(response)
    print("=" * 60)

    # Se o Architect instruiu o Manager, cria o objetivo automaticamente
    import re
    match = re.search(r'\[CRIAR_OBJETIVO:\s*([^|]+)\|([^|]+)\|([^|]+)\|([^\]]+)\]', response)
    if match:
        title, dept, priority, desc = [x.strip() for x in match.groups()]
        obj_id = create_objective(
            title=title,
            objective=desc,
            department=dept.lower(),
            priority=priority.lower(),
            created_by="architect",
        )
        log_action("architect", "objetivo_criado_para_manager",
                   details={"objective_id": obj_id, "title": title})
        print(f"\n✅ Objetivo criado para o Manager (id={obj_id}): {title}")
        print("   Use /manager para processar o objetivo.\n")

    log_action("architect", "analise_realizada",
               details={"input": input_text[:200], "response_len": len(response)})


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Uso: python commands/architect.py \"sua pergunta ou problema\"")
        sys.exit(1)
    run(" ".join(sys.argv[1:]))
