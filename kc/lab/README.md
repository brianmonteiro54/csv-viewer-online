# Desempenho Acadêmico - Escola da Nuvem

Aplicação web para auxiliar no monitoramento e comunicação do desempenho acadêmico dos alunos no programa AWS re/Start da Escola da Nuvem. A ferramenta permite importar dados dos alunos via arquivo CSV, exibir os desempenhos e enviar e-mails personalizados com os critérios de aprovação do curso.

# Funcionalidades

Importação de Dados: Carregue um arquivo CSV com os dados de desempenho dos alunos, incluindo informações sobre Knowledge Checks (KCs) e Labs.
Filtragem e Exibição de Dados: Exibe informações dos alunos na tabela, mostrando as pontuações e itens pendentes em KCs e Labs.
Envio de E-mails: Gere automaticamente links para enviar e-mails de acompanhamento aos alunos, incluindo requisitos de aprovação e orientações motivacionais.

## Exemplo de Mensagem de E-mail Gerada
```Boa noite, [Nome do Aluno]. Seu desempenho nas atividades de Knowledge Checks (KCs) está em [Pontuação KC]%, e seu desempenho nos Labs está em [Pontuação Lab]%. Você ainda tem alguns KCs/Labs pendentes:

[Listagem de KCs/Labs Pendentes]

Para aprovação no curso AWS re/Start, os seguintes requisitos devem ser atendidos:

1. Conclusão de 100% dos Laboratórios: Todos os laboratórios do curso devem ser completados com pontuação total.
2. Pontuação mínima de 70% nos KCs: Obter uma média de pelo menos 70% nos quizzes de avaliação.
3. Presença mínima de 80% nas Aulas.

Continue se dedicando! Cada passo te leva mais perto da sua meta. Com determinação, você está a caminho de concluir com sucesso esse curso e abrir novas oportunidades na sua carreira. Vamos juntos até o final!```
