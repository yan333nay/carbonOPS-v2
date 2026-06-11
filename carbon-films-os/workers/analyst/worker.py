"""
Analyst Worker
Responsável: Análise de resultados, identificação de padrões, sugestão de melhorias
"""
from core.claude_client import ask
from core.db import get_active_objectives, get_pending_tasks, get_leads, log_action
from core.config import brain_context, BRAIN_DIR

SYSTEM = """
Você é o Analyst Agent da Carbon Films.
Sua função é analisar dados, identificar padrões e sugerir melhorias concretas.
Seja direto. Dê números quando possível. Priorize insights acionáveis.
Termine sempre com recomendações específicas.
"""

def execute(task: dict) -> str:
    brain    = brain_context()
    objectives = get_active_objectives()
    pending    = get_pending_tasks()
    leads      = get_leads()

    leads_by_status = {}
    for l in leads:
        leads_by_status[l["status"]] = leads_by_status.get(l["status"], 0) + 1

    data_context = f"""
## Dados operacionais atuais

Objetivos ativos: {len(objectives)}
{chr(10).join(f"- {o['title']}: {o['done_tasks'] or 0}/{o['total_tasks'] or 0} tarefas concluídas" for o in objectives)}

Tarefas pendentes: {len(pending)}

Pipeline de leads: {leads_by_status}
Total de leads: {len(leads)}
"""

    prompt = f"""
## Contexto da empresa
{brain}

{data_context}

## Tarefa a executar
{task['task']}

Analise os dados, execute a tarefa e forneça:
1. Análise dos dados atuais
2. Principais gargalos identificados
3. Recomendações específicas e acionáveis (mínimo 3)
4. Métricas a monitorar nos próximos 7 dias
"""

    analysis = ask(SYSTEM, prompt)

    log_action("analyst", "analysis_complete", task_id=task["id"],
               details={"task": task["task"], "leads_total": len(leads)})

    return f"Análise concluída. {len(analysis)} chars de insight gerado. Ver logs para detalhes."
