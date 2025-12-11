import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useMemo } from "react";

const MONTHS = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

export default function Statement() {
  const { isAuthenticated } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());

  // Queries
  const { data: expenses = [], isLoading: expensesLoading } = trpc.expenses.list.useQuery();

  // Agrupar despesas por mês
  const monthlyExpenses = useMemo(() => {
    const grouped: { [key: string]: { [category: string]: number } } = {};

    expenses.forEach((expense) => {
      const expenseDate = new Date(expense.date);
      const monthKey = `${expenseDate.getFullYear()}-${String(expenseDate.getMonth() + 1).padStart(2, "0")}`;

      if (!grouped[monthKey]) {
        grouped[monthKey] = {};
      }

      if (!grouped[monthKey][expense.category]) {
        grouped[monthKey][expense.category] = 0;
      }

      grouped[monthKey][expense.category] += expense.amount / 100;
    });

    return grouped;
  }, [expenses]);

  // Obter despesas do mês atual
  const currentMonthKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}`;
  const currentMonthExpenses = monthlyExpenses[currentMonthKey] || {};

  // Calcular total do mês
  const monthTotal = Object.values(currentMonthExpenses).reduce((sum, amount) => sum + amount, 0);

  // Navegação de meses
  const handlePreviousMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() - 1);
    setCurrentDate(newDate);
  };

  const handleNextMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + 1);
    setCurrentDate(newDate);
  };

  const isCurrentMonth =
    currentDate.getFullYear() === new Date().getFullYear() &&
    currentDate.getMonth() === new Date().getMonth();

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Acesso Necessário</CardTitle>
            <CardDescription>Faça login para acessar seu extrato</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (expensesLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Extrato
          </h1>
          <p className="text-muted-foreground">
            Visualize suas despesas organizadas por mês
          </p>
        </div>

        {/* Month Navigation */}
        <Card className="gradient-card border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <div>
              <CardTitle className="text-lg">
                {MONTHS[currentDate.getMonth()]} de {currentDate.getFullYear()}
              </CardTitle>
              {isCurrentMonth && (
                <CardDescription className="text-xs text-accent mt-1">
                  Mês atual
                </CardDescription>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePreviousMonth}
                className="gap-1"
              >
                <ChevronLeft className="w-4 h-4" />
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleNextMonth}
                className="gap-1"
              >
                Próximo
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
        </Card>

        {/* Expenses by Category */}
        <Card className="gradient-card border-border/50">
          <CardHeader>
            <CardTitle>Despesas do Mês</CardTitle>
            <CardDescription>
              {Object.keys(currentMonthExpenses).length === 0
                ? "Nenhuma despesa registrada neste mês"
                : `Total: R$ ${monthTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.keys(currentMonthExpenses).length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  Nenhuma despesa registrada para {MONTHS[currentDate.getMonth()]}
                </p>
              </div>
            ) : (
              <>
                {Object.entries(currentMonthExpenses)
                  .sort(([, a], [, b]) => b - a)
                  .map(([category, amount]) => (
                    <div
                      key={category}
                      className="flex items-center justify-between p-4 bg-background/50 rounded-lg border border-border/50 hover:border-border transition-colors"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-foreground">{category}</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {((amount / monthTotal) * 100).toFixed(1)}% do total
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-accent text-lg">
                          R$ {amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                    </div>
                  ))}

                {/* Month Total */}
                <div className="mt-6 pt-4 border-t border-border/50">
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-foreground text-lg">Total do Mês</p>
                    <p className="font-bold text-primary text-2xl">
                      R$ {monthTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Monthly Summary */}
        <Card className="gradient-card border-border/50">
          <CardHeader>
            <CardTitle>Resumo dos Últimos 6 Meses</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(monthlyExpenses)
              .sort(([keyA], [keyB]) => keyB.localeCompare(keyA))
              .slice(0, 6)
              .map(([monthKey, categories]) => {
                const [year, month] = monthKey.split("-");
                const total = Object.values(categories).reduce((sum, amount) => sum + amount, 0);
                const isSelected = monthKey === currentMonthKey;

                return (
                  <button
                    key={monthKey}
                    onClick={() => {
                      const [y, m] = monthKey.split("-");
                      setCurrentDate(new Date(parseInt(y), parseInt(m) - 1));
                    }}
                    className={`w-full flex items-center justify-between p-3 rounded-lg border transition-colors ${
                      isSelected
                        ? "bg-primary/10 border-primary"
                        : "bg-background/50 border-border/50 hover:border-border"
                    }`}
                  >
                    <p className={`font-medium ${isSelected ? "text-primary" : ""}`}>
                      {MONTHS[parseInt(month) - 1]} de {year}
                    </p>
                    <p className={`font-bold ${isSelected ? "text-primary" : "text-accent"}`}>
                      R$ {total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </p>
                  </button>
                );
              })}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
