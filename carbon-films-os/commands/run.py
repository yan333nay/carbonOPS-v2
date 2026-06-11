#!/usr/bin/env python3
"""
/run <agente>
Executa todas as tarefas pendentes de um agente.
"""
import sys
import os
import importlib.util
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from core.db import get_pending_tasks, update_task, log_action
from core.config import AGENTS


def run(agent: str):
    if agent not in AGENTS:
        print(f"❌ Agente '{agent}' não existe. Disponíveis: {', '.join(AGENTS)}")
        sys.exit(1)

    tasks = get_pending_tasks(agent)
    if not tasks:
        print(f"\n✅ Nenhuma tarefa pendente para '{agent}'.\n")
        return

    print(f"\n🤖 Executando worker: {agent.upper()}")
    print(f"📌 {len(tasks)} tarefa(s) pendente(s)\n")

    # Importa worker dinamicamente
    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    worker_path = os.path.join(root, "workers", agent, "worker.py")
    if not os.path.exists(worker_path):
        print(f"❌ Worker não encontrado: workers/{agent}/worker.py")
        sys.exit(1)

    spec   = importlib.util.spec_from_file_location(f"workers.{agent}.worker", worker_path)
    worker = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(worker)

    for task in tasks:
        print(f"  ▶️  [{task['id']}] {task['task'][:70]}")
        update_task(task["id"], "running")
        log_action(agent, "task_started", task_id=task["id"])
        try:
            result = worker.execute(task)
            update_task(task["id"], "done", result=str(result))
            log_action(agent, "task_done", task_id=task["id"],
                       details={"result": str(result)[:500]})
            print(f"  ✅  {str(result)[:120]}\n")
        except Exception as e:
            update_task(task["id"], "failed", error=str(e))
            log_action(agent, "task_failed", task_id=task["id"], details={"error": str(e)})
            print(f"  ❌  Erro: {e}\n")

    print(f"🏁 Worker '{agent}' finalizado.\n")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(f"Uso: python commands/run.py <agente>\nAgentes: {', '.join(AGENTS)}")
        sys.exit(1)
    run(sys.argv[1])
