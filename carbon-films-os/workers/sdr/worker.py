"""
SDR Worker
Responsável: Qualificação profunda, gestão de conversas, preparação de propostas
"""
from core.claude_client import ask_json
from core.db import get_leads, update_lead_status, log_action
from core.config import brain_context

SYSTEM = """
Você é o SDR Agent da Carbon Films.
Sua função é qualificar leads respondentes, preparar argumentos de venda
e rascunhar propostas comerciais.
Você conhece profundamente as ofertas, o processo de vendas e as objeções comuns.
Seja consultivo. Ouça antes de vender.
"""

def execute(task: dict) -> str:
    brain = brain_context()

    contacted_leads = get_leads(status="contacted")
    replied_leads   = get_leads(status="replied")

    leads_context = ""
    all_relevant = contacted_leads + replied_leads
    if all_relevant:
        leads_context = f"\n\nLeads em andamento: {len(all_relevant)}"
        for l in all_relevant[:5]:
            leads_context += f"\n- {l['company']} | status: {l['status']} | {l.get('notes', '')[:80]}"

    prompt = f"""
## Contexto da empresa
{brain}
{leads_context}

## Tarefa a executar
{task['task']}

## O que fazer
Execute a tarefa. Retorne um JSON:
{{
  "summary": "resumo do que foi feito",
  "proposals_drafted": [
    {{
      "company": "nome da empresa",
      "recommended_offer": "qual serviço/pacote recomendar",
      "pitch": "argumento principal de venda personalizado",
      "investment": "faixa de investimento sugerida"
    }}
  ],
  "leads_to_update": [
    {{
      "company": "nome",
      "new_status": "qualified | meeting_scheduled | proposal_sent",
      "notes": "anotação"
    }}
  ],
  "escalate_to_human": false,
  "escalation_reason": null,
  "next_action": "próximo passo"
}}

Se precisar de decisão humana, defina escalate_to_human=true e explique o motivo.
"""

    result = ask_json(SYSTEM, prompt)

    if result.get("escalate_to_human"):
        log_action("sdr", "ESCALADA PARA HUMANO", task_id=task["id"],
                   details={"reason": result.get("escalation_reason")})
        return f"⚠️  REQUER ATENÇÃO HUMANA: {result.get('escalation_reason')} | {result.get('summary', '')}"

    leads_all = get_leads()
    leads_updated = 0
    for update in result.get("leads_to_update", []):
        matching = [l for l in leads_all if l["company"] == update.get("company")]
        for lead in matching:
            update_lead_status(lead["id"], update["new_status"], update.get("notes"))
            leads_updated += 1

    output = result.get("summary", "")
    proposals = result.get("proposals_drafted", [])
    if proposals:
        output += f" | {len(proposals)} proposta(s) rascunhada(s)."
    if leads_updated:
        output += f" | {leads_updated} lead(s) atualizados."
    if result.get("next_action"):
        output += f" | Próximo: {result['next_action']}"

    return output
