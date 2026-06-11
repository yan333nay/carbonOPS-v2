"""
Campaign Worker
Responsável: Cadência de mensagens e follow-up
"""
from core.claude_client import ask_json
from core.db import get_leads, update_lead_status, log_action
from core.config import brain_context

SYSTEM = """
Você é o Campaign Agent da Carbon Films.
Sua função é criar e gerenciar cadências de mensagens para prospects.
Tom: direto, consultivo, sem pitch imediato. Foco em gerar resposta.
Nunca seja agressivo ou insistente demais.
"""

def execute(task: dict) -> str:
    brain = brain_context()

    # Busca leads para contexto se for tarefa de disparo
    new_leads = get_leads(status="new")
    leads_context = ""
    if new_leads:
        leads_context = f"\n\nLeads disponíveis (status=new): {len(new_leads)} lead(s)"
        for l in new_leads[:5]:  # mostra até 5 como exemplo
            leads_context += f"\n- {l['company']} | {l.get('contact_instagram', '')} | {l.get('contact_phone', '')}"

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
  "messages_created": [
    {{
      "sequence_name": "nome da sequência",
      "messages": [
        {{
          "day": 1,
          "channel": "whatsapp | instagram_dm",
          "content": "texto da mensagem"
        }}
      ]
    }}
  ],
  "leads_to_update": [
    {{
      "company": "nome da empresa",
      "new_status": "contacted | cold",
      "notes": "observação"
    }}
  ],
  "next_action": "próximo passo"
}}
"""

    result = ask_json(SYSTEM, prompt)

    # Atualiza status de leads se necessário
    leads_updated = 0
    for update in result.get("leads_to_update", []):
        matching = [l for l in new_leads if l["company"] == update.get("company")]
        for lead in matching:
            update_lead_status(lead["id"], update["new_status"], update.get("notes"))
            leads_updated += 1

    output = result.get("summary", "")
    msgs = result.get("messages_created", [])
    if msgs:
        total_msgs = sum(len(m.get("messages", [])) for m in msgs)
        output += f" | {len(msgs)} sequência(s) criada(s) com {total_msgs} mensagem(ns) total."
    if leads_updated:
        output += f" | {leads_updated} lead(s) atualizados."
    if result.get("next_action"):
        output += f" | Próximo: {result['next_action']}"

    return output
