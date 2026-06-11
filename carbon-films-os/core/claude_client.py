import anthropic
from core.config import ANTHROPIC_API_KEY, CLAUDE_MODEL, MAX_TOKENS

client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)


def ask(system: str, user: str, max_tokens: int = MAX_TOKENS) -> str:
    """Chamada simples: system prompt + mensagem do usuário → resposta em texto."""
    response = client.messages.create(
        model=CLAUDE_MODEL,
        max_tokens=max_tokens,
        system=system,
        messages=[{"role": "user", "content": user}],
    )
    return response.content[0].text


def ask_json(system: str, user: str, max_tokens: int = MAX_TOKENS) -> dict:
    """Igual ao ask(), mas faz parse do JSON retornado."""
    import json, re
    raw = ask(system, user + "\n\nResponda APENAS com JSON válido, sem markdown, sem explicações.", max_tokens)
    # Remove ```json fences se existirem
    raw = re.sub(r"```json|```", "", raw).strip()
    return json.loads(raw)
