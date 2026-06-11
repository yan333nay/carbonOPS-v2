"""
Leads Worker
Responsável: Prospecção e qualificação de leads
"""
from core.claude_client import ask_json
from core.db import create_lead, log_action
from core.config import brain_context

SYSTEM = """
Você é o Leads Agent da Carbon Films.
Sua função é identificar e qualificar potenciais clientes no mercado imobiliário.
Você conhece profundamente o ICP (perfil ideal de cliente) da empresa.
Seja específico, prático e orientado a resultados.
"""

def execute(task: dict) -> str:
    """
    Executa uma tarefa de prospecção.
    Recebe a tarefa do banco e retorna o resultado como string.
    """
    brain = brain_context()

    prompt = f"""
## Contexto da empresa
{brain}

## Tarefa a executar
{task['task']}

## O que fazer
Analise a tarefa e execute-a. Retorne um JSON:
{{
  "summary": "resumo do que foi feito",
  "leads": [
    {{
      "name": "nome do contato",
      "company": "nome da imobiliária/empresa",
      "segment": "imobiliaria | construtora | incorporadora",
      "contact_phone": "número ou null",
      "contact_instagram": "@handle ou null",
      "source": "instagram | google_maps | linkedin | referral"
    }}
  ],
  "next_action": "o que deve acontecer depois com esses leads"
}}

Se a tarefa não for de geração de leads (ex: análise, estratégia), retorne:
{{
  "summary": "descrição do que foi feito",
  "leads": [],
  "next_action": "próximo passo"
}}
"""

    result = ask_json(SYSTEM, prompt)

    # Salva leads no banco se houver
    leads_saved = 0
    for lead in result.get("leads", []):
        try:
            create_lead(
                name=lead.get("name", ""),
                company=lead.get("company", ""),
                segment=lead.get("segment"),
                contact_phone=lead.get("contact_phone"),
                contact_instagram=lead.get("contact_instagram"),
                source=lead.get("source"),
            )
            leads_saved += 1
        except Exception as e:
            log_action("leads", f"Erro ao salvar lead: {e}", task_id=task["id"])

    summary = result.get("summary", "")
    next_action = result.get("next_action", "")

    output = summary
    if leads_saved:
        output += f" | {leads_saved} lead(s) salvos no banco."
    if next_action:
        output += f" | Próximo passo: {next_action}"

    return output
