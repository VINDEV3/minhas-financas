# Minhas Finanças - TODO

## Funcionalidades Essenciais

### Backend & Banco de Dados
- [x] Criar tabela de despesas (expenses) com campos: id, userId, categoria, valor, data, descrição
- [x] Criar tabela de orçamento (budget) com campos: id, userId, receita_mensal, data_criacao
- [x] Implementar queries de banco de dados para CRUD de despesas
- [x] Implementar queries de banco de dados para CRUD de orçamento
- [x] Criar procedures tRPC para listar despesas
- [x] Criar procedures tRPC para criar/atualizar/deletar despesas
- [x] Criar procedures tRPC para definir/obter orçamento mensal
- [x] Implementar algoritmo de análise preditiva e sugestões de economia

### Frontend - UI/UX Moderna
- [x] Definir paleta de cores vibrantes (azuis elétricos, roxos profundos, laranjas energéticos)
- [x] Configurar Tailwind CSS com gradientes suaves e design tokens
- [x] Criar layout principal com DashboardLayout (sidebar + conteúdo)
- [x] Implementar página Home com redirecionamento para Dashboard após login
- [x] Criar Dashboard principal com:
  - [x] Campo de entrada de receita mensal
  - [x] Exibição do total de despesas em destaque
  - [x] Anel de progresso (donut chart) mostrando despesas vs orçamento
  - [x] Botão flutuante (+) para adicionar nova despesa

### Entrada de Dados de Despesas
- [x] Criar modal/formulário para entrada de despesa com campos: categoria, valor, data, descrição
- [x] Implementar validação de entrada (valores numéricos, datas válidas)
- [x] Adicionar feedback visual ao salvar despesa (micro-interação com toast)
- [x] Listar despesas em cards com informações: categoria, valor, data
- [x] Implementar ações de editar/deletar despesa em cada card

### Cálculo e Exibição
- [x] Implementar cálculo automático do total de despesas em tempo real
- [x] Atualizar anel de progresso dinamicamente conforme despesas mudam
- [x] Exibir diferença entre receita e despesas (saldo/excesso)

### Sistema de Alertas e Sugestões
- [x] Criar componente de alerta de orçamento com gradiente de cores quentes
- [x] Implementar lógica para ativar alerta quando despesas > receita
- [x] Calcular percentual de excesso do orçamento
- [x] Implementar algoritmo de recomendação:
  - [x] Identificar categoria com maior gasto
  - [x] Sugerir corte percentual (10%, 15%, 20%)
  - [x] Exibir economia potencial em valores monetários
- [x] Exibir sugestões acionáveis de forma clara e visual

### Visualizações e Gráficos
- [x] Implementar anel de progresso (donut chart) para visualizar despesas vs orçamento
- [x] Implementar visualização de despesas por categoria com barras de progresso
- [x] Adicionar animações suaves aos gráficos

### Responsividade e Acessibilidade
- [x] Testar responsividade em mobile, tablet e desktop
- [ ] Garantir navegação por teclado (Tab, Enter, ESC)
- [ ] Implementar focus rings visíveis
- [ ] Testar com leitores de tela
- [ ] Garantir contraste de cores adequado

### Testes e Ajustes Finais
- [x] Testar fluxo completo: login → entrada de despesa → cálculo → alerta
- [x] Testar performance com muitas despesas
- [x] Testar persistência de dados (refresh da página)
- [x] Ajustar animações e micro-interações
- [x] Revisar design visual e consistência de cores

### Deploy e Apresentação
- [x] Criar checkpoint do projeto
- [x] Preparar documentação de uso
- [x] Apresentar resultados ao usuário

## Nova Funcionalidade: Parcelamento de Compras

### Backend & Banco de Dados
- [ ] Adicionar campo `installments` (número de parcelas) na tabela expenses
- [ ] Adicionar campo `installmentNumber` (qual parcela é essa) na tabela expenses
- [ ] Adicionar campo `originalPurchaseDate` (data original da compra) na tabela expenses
- [ ] Criar função para distribuir valor entre parcelas automaticamente
- [ ] Criar procedure tRPC para criar despesa parcelada

### Frontend - UI/UX
- [ ] Adicionar campo "Número de Parcelas" no modal de despesa
- [ ] Adicionar validação para número de parcelas (1-36)
- [ ] Mostrar preview de como as parcelas serão distribuídas
- [ ] Exibir informação de parcelamento nos cards de despesa
- [ ] Adicionar indicador visual para despesas parceladas

### Lógica de Parcelamento
- [ ] Implementar algoritmo para distribuir parcelas por mês
- [ ] Calcular data de cada parcela automaticamente
- [ ] Suportar parcelas iguais
- [ ] Atualizar cálculo de total de despesas para considerar parcelamento

### Testes
- [ ] Testar criação de despesa com 1 parcela (sem parcelamento)
- [ ] Testar criação de despesa com múltiplas parcelas
- [ ] Testar se as parcelas aparecem nas datas corretas
- [ ] Testar se o total de despesas é calculado corretamente


## Nova Funcionalidade: Visualização de Despesas por Mês (Extrato)

### Backend
- [ ] Criar query para agrupar despesas por mês e categoria
- [ ] Criar procedure tRPC para retornar despesas agrupadas por mês
- [ ] Implementar lógica de cálculo de totais por mês

### Frontend
- [ ] Criar componente de visualização de meses (similar a extrato de cartão)
- [ ] Implementar navegação entre meses (anterior/próximo)
- [ ] Agrupar despesas por categoria dentro de cada mês
- [ ] Exibir subtotal por categoria
- [ ] Exibir total geral do mês
- [ ] Adicionar indicador visual de mês atual
- [ ] Implementar responsividade para mobile
