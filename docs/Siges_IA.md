PROMPT — PLANEJAMENTO DA FUNCIONALIDADE DE INTELIGÊNCIA ARTIFICIAL NO SIGES

1. Papel e objetivo

Atue como um arquiteto de software sênior, especialista em inteligência artificial local, React, Vite, Supabase, PostgreSQL, segurança de aplicações, engenharia de dados e integração de sistemas.

Sua missão é analisar o projeto existente do SIGES e elaborar um planejamento técnico completo para implementar um Assistente de Inteligência Artificial integrado à aplicação, permitindo que os usuários façam perguntas em linguagem natural e obtenham informações confiáveis a partir dos dados armazenados no banco de dados.

Neste momento, o objetivo é exclusivamente planejar a funcionalidade. Não implemente código, não modifique arquivos e não execute alterações no banco de dados antes de apresentar o planejamento e receber autorização explícita.

O resultado deverá ser específico para o SIGES existente, evitando soluções genéricas ou a criação desnecessária de uma nova arquitetura.

2. Contexto tecnológico existente

Considere as seguintes informações sobre a infraestrutura:

Aplicação

Sistema denominado SIGES.

Frontend desenvolvido em React e Vite.

Projeto desenvolvido e mantido no VS Code.

Aplicação já existente, com telas, componentes, regras de negócio e funcionalidades implementadas.

A funcionalidade de IA deverá ser incorporada à aplicação atual, preservando sua identidade visual e suas funcionalidades.

Banco de dados e autenticação

Supabase self-hosted.

Banco de dados PostgreSQL.

Supabase Auth para autenticação, conforme a configuração existente.

Utilização de tabelas, views, funções SQL, RPCs e políticas de acesso.

A estrutura real do banco deverá ser identificada durante a análise do projeto.

Não presuma nomes de tabelas, colunas, views ou funções que ainda não tenham sido verificados.

Infraestrutura

VPS Contabo.

Ubuntu Server 24.04.

6 vCPUs.

12 GB de RAM.

Disco de aproximadamente 200 GB.

EasyPanel para gerenciamento dos serviços.

Traefik para roteamento e HTTPS.

Domínio existente: desvio.app.br.

Supabase e demais serviços hospedados na mesma VPS.

Inteligência artificial e automação

Preferência por utilizar Ollama para executar modelos de linguagem localmente.

Avaliar o modelo Qwen3:8b como candidato inicial, sem assumir que seu desempenho já foi validado.

n8n já utilizado ou disponível para automações.

Preferência por soluções open source e hospedadas na infraestrutura existente.

Não utilizar APIs comerciais de IA que cobrem por tokens como dependência obrigatória.

Não contratar novos serviços pagos nem ampliar o hardware como requisito inicial.

A arquitetura atual deverá ser verificada antes de definir detalhes de implementação. Se algum componente mencionado ainda não estiver instalado ou configurado, registre essa condição como uma pendência.

3. Objetivo funcional da IA

Criar um Assistente SIGES capaz de interpretar perguntas em português e consultar informações reais do banco de dados, respondendo de forma clara, contextualizada e verificável.

Exemplos de perguntas:

Quais ordens de serviço estão abertas atualmente?

Quais ordens estão abertas há mais de 30 dias?

Quantas ordens de serviço foram concluídas em determinado período?

Qual foi o custo total de manutenção em um período específico?

Quanto foi gasto com materiais, serviços e transporte?

Qual unidade apresentou o maior custo de manutenção?

Quais ordens de serviço tiveram os maiores custos?

Qual foi o custo de transporte apropriado por ordem de serviço?

Quais materiais foram utilizados em determinada ordem de serviço?

Compare os custos de manutenção de dois períodos.

Apresente um resumo das ordens de serviço de determinada unidade.

Quais indicadores operacionais merecem atenção?

Gere uma tabela com os resultados de uma consulta.

Explique por que determinado indicador aumentou ou diminuiu, utilizando os dados disponíveis.

Esses exemplos são ilustrativos. As perguntas que dependam de informações inexistentes no banco deverão ser identificadas como limitações, sem inventar dados.

A IA deverá distinguir claramente:

Dados efetivamente consultados.

Cálculos realizados sobre os dados.

Interpretações e hipóteses.

Informações que não estão disponíveis no banco.

4. Primeira etapa obrigatória: análise do projeto existente

Antes de propor a arquitetura definitiva, analise o código-fonte e a estrutura do SIGES.

Identifique:

Organização das pastas e arquivos.

Versões do React, Vite e principais dependências.

Configuração atual do Supabase client.

Forma de autenticação e gerenciamento da sessão.

Tratamento atual de permissões e perfis de usuário.

Estrutura de rotas e páginas protegidas.

Componentes de interface que possam ser reutilizados.

Padrões de formulários, tabelas, dashboards e modais.

Convenções de nomenclatura e organização do código.

Utilização de variáveis de ambiente.

Existência de backend próprio, Edge Functions, RPCs ou APIs.

Views e funções existentes que já forneçam informações operacionais.

Recursos de logging, auditoria e tratamento de erros.

Configurações de implantação e comunicação com a infraestrutura.

Examine também a documentação e os arquivos de configuração relevantes, sem expor segredos.

Se o acesso ao banco estiver disponível, identifique os objetos relevantes para consultas operacionais, como ordens de serviço, unidades, materiais, serviços, transporte, custos e históricos.

Não altere dados nem execute comandos destrutivos durante essa análise.

Se não for possível inspecionar algum componente, informe claramente a limitação e solicite apenas as informações necessárias para continuar.

5. Arquitetura da solução

Proponha uma arquitetura adequada ao SIGES existente, considerando preferencialmente:

React + Vite para a interface.

Supabase Auth para identificar o usuário autenticado.

Backend seguro ou camada equivalente de orquestração.

Ollama para inferência local.

PostgreSQL/Supabase para consultas autorizadas.

n8n como componente opcional para automações específicas.

Traefik e EasyPanel para implantação.

Avalie pelo menos estas alternativas:

Alternativa A — Consulta por funções previamente definidas

A IA identifica a intenção do usuário e solicita a execução de funções SQL ou RPCs previamente autorizadas.

Alternativa B — Geração de SQL pela IA

A IA interpreta a pergunta e propõe uma consulta SQL, que deverá ser validada antes de qualquer execução.

Alternativa C — Arquitetura híbrida

A IA utiliza ferramentas e funções previamente definidas para as consultas comuns, podendo propor consultas adicionais em um ambiente rigorosamente controlado.

Compare as alternativas considerando segurança, precisão, manutenção, complexidade, desempenho e custo operacional.

Escolha uma abordagem principal e justifique a decisão.

Não permita que o modelo execute SQL arbitrário diretamente no banco de produção. Caso a geração de SQL seja considerada, especifique mecanismos rigorosos de validação, restrição a consultas somente de leitura, limites de execução, controle de objetos acessíveis e prevenção contra acesso indevido a dados.

6. Segurança e controle de acesso

A segurança é um requisito obrigatório.

O planejamento deverá contemplar:

Reutilização da identidade do usuário autenticado no SIGES.

Autorização no servidor, não apenas na interface.

Respeito às permissões já existentes no sistema.

Aplicação das políticas RLS do Supabase, quando pertinentes.

Prevenção de acesso cruzado entre usuários, unidades ou grupos de dados.

Proibição de expor a chave service_role no frontend.

Proibição de expor credenciais do PostgreSQL, tokens ou segredos no navegador.

Comunicação privada entre os serviços internos.

Não exposição pública da API do Ollama.

Proteção dos endpoints da IA contra acesso não autorizado.

Validação e limitação de parâmetros de consulta.

Limites de tempo, volume de resultados e consumo de recursos.

Registro das consultas realizadas e dos erros relevantes.

Proteção contra prompt injection e tentativas de contornar permissões.

Controle sobre dados sensíveis eventualmente presentes nos registros.

Definição de retenção e exclusão do histórico de conversas.

Não presuma que o uso de uma conexão administrativa do Supabase preserva automaticamente as permissões dos usuários. Explique como a identidade e as autorizações serão propagadas e verificadas.

Na primeira versão, a IA deverá realizar somente consultas de leitura. Alterações de registros, exclusões, inserções e operações administrativas deverão ficar fora do escopo inicial.

7. Interface e experiência do usuário

Planeje uma interface integrada ao SIGES, respeitando seus componentes, cores, tipografia e padrões de navegação.

Avalie:

Acesso por item no menu lateral.

Janela de chat ou página própria.

Campo de pergunta em português.

Sugestões de perguntas iniciais.

Indicador de processamento.

Exibição de erros e solicitações de esclarecimento.

Respostas em Markdown.

Tabelas com resultados consultados.

Indicadores numéricos e gráficos quando apropriados.

Identificação do período e dos filtros aplicados.

Indicação das fontes de dados utilizadas.

Exibição da consulta ou do relatório de execução em formato legível, quando útil.

Histórico de conversas.

Possibilidade de iniciar uma nova conversa.

Experiência responsiva para computadores e celulares.

Acessibilidade e consistência visual.

A IA deverá pedir esclarecimentos quando a pergunta for ambígua, por exemplo, quando o usuário não especificar qual unidade ou período deseja consultar.

Não implemente uma interface independente que ignore os padrões visuais e os componentes já utilizados no SIGES.

8. Estratégia de consulta ao banco

Planeje como a IA descobrirá quais informações consultar.

Considere criar um catálogo controlado de ferramentas, views e funções de consulta.

Para cada ferramenta proposta, documente:

Nome.

Finalidade.

Parâmetros de entrada.

Validações.

Objetos do banco utilizados.

Permissões necessárias.

Formato do retorno.

Limites de volume e tempo.

Tratamento de erros.

Testes necessários.

Avalie a possibilidade de reutilizar views e funções existentes em vez de duplicar regras de negócio.

Para informações financeiras e operacionais, identifique quais cálculos precisam ocorrer no PostgreSQL para garantir resultados consistentes, em vez de depender de cálculos improvisados pelo modelo.

Quando o banco não contiver informações suficientes para responder, a IA deverá informar essa limitação.

9. Modelo local e desempenho

Avalie a viabilidade do Ollama na VPS existente, considerando que ela também hospeda o Supabase, o n8n e outros serviços.

Analise:

Memória RAM disponível em condições normais.

Consumo adicional do modelo.

Uso de CPU.

Tempo esperado de resposta, a ser medido em testes.

Tamanho do contexto.

Concorrência de usuários.

Limites de requisições simultâneas.

Impacto sobre o PostgreSQL e demais serviços.

Necessidade de limitar o número de resultados enviados ao modelo.

Alternativas de modelos locais compatíveis com os recursos disponíveis.

Considere Qwen3:4b como candidato inicial, mas não o trate como uma escolha definitiva sem testes.

Não recomende a compra de hardware ou a contratação de APIs pagas como primeira solução.

Defina critérios objetivos para aprovar o modelo, incluindo qualidade das respostas, precisão das consultas, latência e estabilidade.

10. Memória, documentos e RAG

Avalie se a primeira versão precisa de memória persistente ou recuperação de documentos.

Diferencie:

Histórico de conversas.

Preferências persistentes do usuário.

Documentos técnicos e manuais.

Consultas transacionais ao banco de dados.

Não confunda a recuperação de documentos com consultas a dados operacionais.

Se houver benefício real, proponha uma segunda etapa com RAG e embeddings locais, sem envio obrigatório de documentos para provedores externos.

Defina como os dados serão atualizados, indexados, autorizados e excluídos.

11. Integração com n8n

Avalie a necessidade de integrar o n8n à arquitetura.

Identifique quais tarefas justificam essa integração e quais devem permanecer em funções ou endpoints próprios do SIGES.

Considere exemplos como geração de relatórios, notificações e execução de fluxos autorizados.

Não torne o n8n uma dependência obrigatória para consultas simples se isso aumentar desnecessariamente a complexidade.

Qualquer automação que modifique dados deverá exigir uma etapa explícita de autorização, caso seja considerada em uma fase futura.

12. Plano de implantação no EasyPanel

Apresente um plano compatível com o ambiente atual.

Inclua:

Serviços que serão reaproveitados.

Serviços que precisarão ser criados.

Redes Docker necessárias.

Comunicação entre os contêineres.

Variáveis de ambiente.

Volumes persistentes.

Configuração do Ollama.

Configuração do backend, se necessário.

Configuração do domínio e HTTPS pelo Traefik.

Regras de firewall.

Estratégia de logs.

Monitoramento de recursos.

Backup e recuperação.

Procedimento de atualização e rollback.

Não invente nomes de serviços, redes ou portas internas. Identifique-os na configuração existente ou marque-os como itens a confirmar.

Não modifique configurações persistentes do EasyPanel sem explicar previamente os efeitos e o método de manutenção.

13. Plano de testes e validação

Elabore uma estratégia de testes que contemple:

Perguntas com respostas conhecidas.

Comparação entre respostas e resultados SQL de referência.

Perguntas ambíguas.

Consultas sem resultados.

Consultas com grande volume de dados.

Usuários com permissões diferentes.

Tentativas de acesso a informações não autorizadas.

Tentativas de injeção de instruções maliciosas.

Erros e indisponibilidade do Ollama.

Indisponibilidade do PostgreSQL.

Tempo de resposta e concorrência.

Estabilidade dos demais serviços da VPS.

Responsividade da interface.

Persistência e exclusão do histórico.

Defina critérios mensuráveis para aprovar a funcionalidade antes de liberá-la para os usuários.

14. Etapas de desenvolvimento

Organize a implementação em fases independentes, com entregas verificáveis.

Uma proposta inicial de fases é:

Diagnóstico do projeto e do banco.

Definição da arquitetura e das regras de segurança.

Criação da primeira camada de consulta.

Integração do modelo local.

Desenvolvimento da interface React.

Integração das consultas reais.

Implementação do histórico e das fontes.

Testes de segurança e desempenho.

Implantação controlada.

Avaliação de melhorias futuras.

Para cada fase, informe:

Objetivo.

Arquivos ou componentes afetados.

Dependências.

Entregáveis.

Riscos.

Critérios de aceitação.

Estimativa de esforço em horas, identificada como estimativa.

Não apresente prazos como garantidos antes de conhecer a estrutura do projeto.

15. Entregáveis obrigatórios

Ao concluir o planejamento, apresente:

Resumo executivo da solução.

Diagnóstico do estado atual do SIGES.

Arquitetura proposta e diagrama de componentes.

Comparação das alternativas técnicas.

Decisão arquitetural justificada.

Fluxo detalhado de uma pergunta até a resposta.

Estratégia de segurança e permissões.

Catálogo inicial de ferramentas de consulta.

Modelo de integração com Ollama e Supabase.

Proposta de interface.

Plano de implantação no EasyPanel.

Plano de testes.

Plano de desenvolvimento por fases.

Estimativa de esforço.

Riscos e limitações.

Lista de dúvidas e informações ainda necessárias.

Critérios para decidir se a solução pode entrar em produção.

Apresente também uma lista dos arquivos que provavelmente precisarão ser criados ou alterados, mas diferencie os arquivos identificados no projeto daqueles que são apenas sugestões.

16. Restrições obrigatórias

Não modificar arquivos nesta etapa.

Não executar migrations ou comandos de alteração do banco.

Não excluir, sobrescrever ou recriar serviços existentes.

Não substituir a autenticação atual sem justificativa.

Não introduzir provedores de IA pagos como requisito.

Não expor chaves, tokens ou credenciais.

Não conceder acesso irrestrito ao banco de dados.

Não presumir estruturas de tabelas ou permissões.

Não duplicar regras de negócio já implementadas.

Não propor uma reescrita do SIGES.

Não iniciar a implementação antes da aprovação do planejamento.

Sempre que houver incerteza, identifique-a claramente e proponha como verificá-la.

17. Formato da resposta

Organize a resposta em seções numeradas, com diagramas, tabelas comparativas, listas de decisões e critérios de aceitação.

Diferencie fatos verificados, hipóteses, recomendações e pendências.

Se tiver acesso ao repositório, comece pela inspeção do projeto antes de recomendar arquivos ou tecnologias específicas.

Ao final, apresente uma recomendação objetiva da arquitetura mais adequada e uma lista curta das decisões que preciso aprovar antes de autorizar o desenvolvimento.

Resultado esperado: um plano técnico executável para incorporar uma IA local ao SIGES, capaz de responder a perguntas em linguagem natural utilizando dados reais do sistema, preservando a arquitetura existente, a segurança dos usuários e a meta de não pagar por tokens