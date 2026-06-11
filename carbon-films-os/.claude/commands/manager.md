Execute o Manager Agent da Carbon Films para o seguinte objetivo: "$ARGUMENTS"

Passos:
1. cd /root/carbon-films-os
2. Execute: python commands/manager.py "$ARGUMENTS"
3. Mostre o output completo ao usuário

O Manager analisa o objetivo, consulta o company-brain e cria tarefas atômicas para os workers.
Após criar as tarefas, informe o usuário que pode usar /run <agente> para executá-las.
