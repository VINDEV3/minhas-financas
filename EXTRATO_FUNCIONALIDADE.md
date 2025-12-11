# 📊 Funcionalidade de Extrato por Mês

## Visão Geral

A nova funcionalidade de **Extrato** permite visualizar todas as despesas organizadas por mês, similar a um extrato de cartão de crédito. Cada mês mostra as despesas agrupadas por categoria com totais automáticos.

## Como Acessar

1. Clique em **"Extrato"** no menu lateral do Dashboard
2. A página carregará mostrando o mês atual com todas as despesas

## Funcionalidades

### 1. **Navegação Entre Meses**
- Botão **"Anterior"** - Navega para o mês anterior
- Botão **"Próximo"** - Navega para o mês seguinte
- Indicador **"Mês atual"** - Mostra quando você está visualizando o mês atual

### 2. **Visualização de Despesas por Categoria**
As despesas são agrupadas por categoria e exibem:
- **Nome da categoria** (ex: Alimentação, Moradia, Lazer)
- **Valor total** em R$ (destacado em vermelho/laranja)
- **Percentual** do total do mês (ex: 25.5% do total)

### 3. **Total do Mês**
Na parte inferior de cada mês, é exibido:
- **Total do Mês** em destaque com a cor primária
- Valor em R$ formatado corretamente

### 4. **Resumo dos Últimos 6 Meses**
Abaixo da visualização detalhada, você vê:
- Lista dos últimos 6 meses
- Total de despesas de cada mês
- Clique em qualquer mês para visualizar seus detalhes

## Exemplo de Visualização

```
═══════════════════════════════════════════════════════════
                    EXTRATO
═══════════════════════════════════════════════════════════

                  Outubro de 2025
                  ✓ Mês atual

┌─────────────────────────────────────────────────────────┐
│                 Despesas do Mês                         │
│                 Total: R$ 2.930,00                      │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ Moradia                                    R$ 1.200,00 │
│ 40.9% do total                                          │
│                                                         │
│ Alimentação                                  R$ 450,00 │
│ 15.4% do total                                          │
│                                                         │
│ Lazer                                        R$ 362,50 │
│ 12.4% do total                                          │
│                                                         │
│ Transporte                                   R$ 150,00 │
│ 5.1% do total                                           │
│                                                         │
│ Saúde                                         R$ 80,00 │
│ 2.7% do total                                           │
│                                                         │
│ Educação                                     R$ 300,00 │
│ 10.2% do total                                          │
│                                                         │
│ Compras                                      R$ 250,00 │
│ 8.5% do total                                           │
│                                                         │
│ Utilidades                                   R$ 120,00 │
│ 4.1% do total                                           │
│                                                         │
├─────────────────────────────────────────────────────────┤
│                Total do Mês: R$ 2.930,00               │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│          Resumo dos Últimos 6 Meses                     │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ Outubro de 2025 (Mês Selecionado)    R$ 2.930,00      │
│                                                         │
│ Setembro de 2025                     R$ 2.750,00      │
│                                                         │
│ Agosto de 2025                       R$ 3.100,00      │
│                                                         │
│ Julho de 2025                        R$ 2.500,00      │
│                                                         │
│ Junho de 2025                        R$ 2.800,00      │
│                                                         │
│ Maio de 2025                         R$ 3.200,00      │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## Recursos Técnicos

### Backend
- **Query de Agrupamento**: Agrupa despesas por mês e categoria
- **Cálculo de Totais**: Calcula automaticamente o total por categoria e por mês
- **Procedure tRPC**: `expenses.list` retorna todas as despesas com datas

### Frontend
- **Componente Statement.tsx**: Renderiza a visualização do extrato
- **Navegação de Meses**: Usa `useState` para gerenciar o mês atual
- **Agrupamento de Dados**: `useMemo` agrupa despesas por mês e categoria
- **Formatação Monetária**: Usa `toLocaleString` para formatar valores em Real

## Integração com Parcelamento

Quando você cria uma despesa parcelada (ex: 12x), cada parcela aparecerá:
- Na data correspondente de cada mês
- Agrupada com outras despesas da mesma categoria
- Contribuindo para o total do mês

**Exemplo:**
```
Compra: PlayStation 5 - R$ 1.200,00 em 12 parcelas
Data da Compra: Outubro de 2025

Outubro de 2025:
├─ Eletrônicos: R$ 100,00 (1/12 da parcela)

Novembro de 2025:
├─ Eletrônicos: R$ 100,00 (2/12 da parcela)

Dezembro de 2025:
├─ Eletrônicos: R$ 100,00 (3/12 da parcela)
... e assim por diante
```

## Responsividade

A página é totalmente responsiva:
- **Desktop**: Layout completo com todas as informações
- **Tablet**: Ajusta o tamanho dos cards
- **Mobile**: Stack vertical, botões de navegação otimizados

## Próximas Melhorias Sugeridas

1. **Gráficos Mensais**: Adicionar gráficos de pizza/barra para visualização mensal
2. **Comparação de Meses**: Comparar gastos entre meses
3. **Exportar Extrato**: Opção para baixar extrato em PDF
4. **Filtros Avançados**: Filtrar por categoria, intervalo de datas
5. **Metas Mensais**: Definir metas por categoria e acompanhar progresso

---

**Status**: ✅ Implementado e Testado
**Última Atualização**: Novembro 2025
