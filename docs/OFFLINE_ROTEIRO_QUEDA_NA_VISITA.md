# Roteiro: queda de internet no meio de uma visita aberta

Teste em aparelho (APK) com 2 contas: **técnico** (líder da OS) e **gestor** do contrato.
Antes: técnico logado, no "Meu Painel" com internet, barra de preparo concluída.

## 1. Queda com a visita aberta
- [ ] Técnico inicia a visita online e abre o relatório de um ativo (trava adquirida).
- [ ] Ligar modo avião. A `ConnectionStrip` deve indicar "sem conexão".
- [ ] Marcar 2 atividades, editar comentário, incluir 1 material, lançar Km do veículo → tudo salva na hora e o contador de pendências sobe.
- [ ] Tirar 2 fotos → aparecem na tela (arquivo local).
- [ ] Abrir um **segundo ativo** da mesma visita sem sinal → anotar o que acontece (trava é adquirida só com sinal).
- [ ] Tentar uma ação **fora da lista offline** (ex.: cadastrar veículo novo) → deve recusar com aviso, sem travar a tela.

## 2. Queda no meio da gravação
- [ ] Com internet, tocar em salvar e ligar o modo avião logo em seguida (testar 3x).
- [ ] A alteração não pode sumir nem duplicar: conferir na fila e, depois, no banco.

## 3. Volta do sinal
- [ ] Desligar o modo avião e ficar no "Meu Painel". A fila deve esvaziar sozinha, em ordem.
- [ ] Fotos sobem; conferir no gestor que o relatório e as fotos chegaram, sem duplicatas.
- [ ] Repetir com sinal voltando fora do "Meu Painel": a rodada só roda ao voltar ao painel.

## 4. Encerrar e iniciar outra visita offline
- [ ] Sem sinal: encerrar a visita e iniciar outra (OS já baixada).
- [ ] Reconectar: "Iniciar" é aceito, depois o resto sobe. Conferir hora (hora do aparelho) e equipe (só o líder).

## 5. Conflitos
- [ ] Sem sinal no técnico, gestor troca o líder da OS. Reconectar: a operação deve ficar como conflito no painel de pendências.
- [ ] Gestor força a liberação da trava de um ativo enquanto o técnico está offline. Reconectar: operações do ativo viram conflito; outros ativos seguem.

## 6. Sessão e logout
- [ ] Ficar offline com o app aberto por mais de 1 h (sessão pode expirar). Reconectar: a fila só envia depois de renovar a sessão.
- [ ] Tentar sair com pendências: o aviso do logout deve aparecer.

## Já sabido (não é falha do teste)
- A trava do ativo **não expira** (`ov_asset_lock`): técnico offline por muito tempo segura o ativo até liberar ou até o gestor forçar.
- Veículo novo e ativo novo fora do fluxo da visita continuam só online.
