import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { AlertCircle, Plus, TrendingDown, Wallet } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const EXPENSE_CATEGORIES = [
  "Alimentação",
  "Transporte",
  "Moradia",
  "Saúde",
  "Educação",
  "Lazer",
  "Compras",
  "Utilidades",
  "Outros",
];

export default function Dashboard() {
  const { user, isAuthenticated } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newExpense, setNewExpense] = useState({
    category: "",
    amount: "",
    date: new Date().toISOString().split("T")[0],
    description: "",
    installments: "1",
    purchaseDate: new Date().toISOString().split("T")[0],
  });
  const [useInstallments, setUseInstallments] = useState(false);

  // Queries
  const { data: expenses = [], isLoading: expensesLoading, refetch: refetchExpenses } = trpc.expenses.list.useQuery();
  const { data: budget, isLoading: budgetLoading, refetch: refetchBudget } = trpc.budget.get.useQuery();

  // Mutations
  const createExpenseMutation = trpc.expenses.create.useMutation({
    onSuccess: () => {
      toast.success("Despesa adicionada com sucesso!");
      refetchExpenses();
      setNewExpense({
        category: "",
        amount: "",
        date: new Date().toISOString().split("T")[0],
        description: "",
        installments: "1",
        purchaseDate: new Date().toISOString().split("T")[0],
      });
      setUseInstallments(false);
      setIsDialogOpen(false);
    },
    onError: (error) => {
      toast.error(`Erro ao adicionar despesa: ${error.message}`);
    },
  });

  const deleteExpenseMutation = trpc.expenses.delete.useMutation({
    onSuccess: () => {
      toast.success("Despesa removida com sucesso!");
      refetchExpenses();
    },
    onError: (error) => {
      toast.error(`Erro ao remover despesa: ${error.message}`);
    },
  });

  const setBudgetMutation = trpc.budget.set.useMutation({
    onSuccess: () => {
      toast.success("Orçamento atualizado com sucesso!");
      refetchBudget();
    },
    onError: (error) => {
      toast.error(`Erro ao atualizar orçamento: ${error.message}`);
    },
  });

  const createInstallmentMutation = trpc.expenses.createInstallment.useMutation({
    onSuccess: () => {
      toast.success("Despesa parcelada adicionada com sucesso!");
      refetchExpenses();
      setNewExpense({
        category: "",
        amount: "",
        date: new Date().toISOString().split("T")[0],
        description: "",
        installments: "1",
        purchaseDate: new Date().toISOString().split("T")[0],
      });
      setUseInstallments(false);
      setIsDialogOpen(false);
    },
    onError: (error) => {
      toast.error(`Erro ao adicionar despesa parcelada: ${error.message}`);
    },
  });

  // Cálculos
  const monthlyBudget = budget ? budget.monthlyIncome / 100 : 0;
  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount / 100, 0);
  const remainingBudget = monthlyBudget - totalExpenses;
  const budgetPercentage = monthlyBudget > 0 ? (totalExpenses / monthlyBudget) * 100 : 0;
  const isOverBudget = totalExpenses > monthlyBudget;
  const excessAmount = isOverBudget ? totalExpenses - monthlyBudget : 0;
  const excessPercentage = isOverBudget ? ((excessAmount / monthlyBudget) * 100).toFixed(1) : 0;

  // Despesas por categoria
  const expensesByCategory = EXPENSE_CATEGORIES.map((category) => {
    const categoryTotal = expenses
      .filter((exp) => exp.category === category)
      .reduce((sum, exp) => sum + exp.amount / 100, 0);
    return { category, total: categoryTotal };
  }).filter((item) => item.total > 0);

  // Categoria com maior gasto
  const topCategory = expensesByCategory.length > 0
    ? expensesByCategory.reduce((prev, current) =>
        prev.total > current.total ? prev : current
      )
    : null;

  // Sugestão de economia
  const getSavingSuggestion = () => {
    if (!isOverBudget || !topCategory) return null;

    const reductionPercentages = [10, 15, 20];
    for (const percentage of reductionPercentages) {
      const potentialSavings = (topCategory.total * percentage) / 100;
      if (excessAmount <= potentialSavings) {
        return {
          category: topCategory.category,
          percentage,
          savings: potentialSavings.toFixed(2),
          newAmount: (topCategory.total - potentialSavings).toFixed(2),
        };
      }
    }

    return {
      category: topCategory.category,
      percentage: 25,
      savings: (topCategory.total * 0.25).toFixed(2),
      newAmount: (topCategory.total * 0.75).toFixed(2),
    };
  };

  const suggestion = getSavingSuggestion();

  const handleAddExpense = () => {
    if (newExpense.category && newExpense.amount) {
      const amountInCents = Math.round(parseFloat(newExpense.amount) * 100);
      createExpenseMutation.mutate({
        category: newExpense.category,
        amount: amountInCents,
        date: newExpense.date,
        description: newExpense.description || undefined,
      });
    }
  };

  const handleDeleteExpense = (id: number) => {
    deleteExpenseMutation.mutate({ id });
  };

  const handleSetBudget = (budgetValue: number) => {
    const amountInCents = Math.round(budgetValue * 100);
    setBudgetMutation.mutate({ monthlyIncome: amountInCents });
  };

  const handleAddInstallmentExpense = () => {
    if (newExpense.category && newExpense.amount && newExpense.installments) {
      const amountInCents = Math.round(parseFloat(newExpense.amount) * 100);
      const installments = parseInt(newExpense.installments);
      createInstallmentMutation.mutate({
        category: newExpense.category,
        amount: amountInCents,
        installments,
        purchaseDate: newExpense.purchaseDate,
        description: newExpense.description || undefined,
      });
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Acesso Necessário</CardTitle>
            <CardDescription>Faça login para acessar seu dashboard de finanças</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (expensesLoading || budgetLoading) {
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
            Minhas Finanças
          </h1>
          <p className="text-muted-foreground">
            Bem-vindo, {user?.name || "Usuário"}! Gerencie suas despesas e orçamento
          </p>
        </div>

        {/* Budget Section */}
        <div className="grid gap-4 md:grid-cols-3">
          {/* Budget Input Card */}
          <Card className="gradient-card border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Wallet className="w-4 h-4 text-primary" />
                Receita Mensal
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Input
                  type="number"
                  defaultValue={monthlyBudget}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value);
                    if (value > 0) {
                      handleSetBudget(value);
                    }
                  }}
                  className="bg-background/50"
                  placeholder="Digite sua receita"
                />
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                R$ {monthlyBudget.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </p>
            </CardContent>
          </Card>

          {/* Total Expenses Card */}
          <Card className="gradient-card border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-accent" />
                Total de Despesas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-accent">
                R$ {totalExpenses.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                {budgetPercentage.toFixed(1)}% do orçamento
              </p>
            </CardContent>
          </Card>

          {/* Remaining Budget Card */}
          <Card className={`gradient-card border-border/50 ${isOverBudget ? "border-destructive/50" : ""}`}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Wallet className="w-4 h-4" />
                {isOverBudget ? "Excesso" : "Saldo"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className={`text-2xl font-bold ${isOverBudget ? "text-destructive" : "text-green-400"}`}>
                R$ {Math.abs(remainingBudget).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                {isOverBudget ? "Você excedeu seu orçamento" : "Disponível para gastar"}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Budget Progress Donut Chart */}
        <Card className="gradient-card border-border/50">
          <CardHeader>
            <CardTitle className="text-lg">Progresso do Orçamento</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center">
              <div className="relative w-40 h-40">
                <svg className="w-full h-full" viewBox="0 0 100 100">
                  {/* Background circle */}
                  <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="8" className="text-muted opacity-20" />
                  {/* Progress circle */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="url(#gradient)"
                    strokeWidth="8"
                    strokeDasharray={`${(budgetPercentage / 100) * 251.2} 251.2`}
                    strokeLinecap="round"
                    transform="rotate(-90 50 50)"
                  />
                  <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="hsl(260, 85%, 55%)" />
                      <stop offset="100%" stopColor="hsl(200, 100%, 50%)" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <p className="text-2xl font-bold">{budgetPercentage.toFixed(0)}%</p>
                  <p className="text-xs text-muted-foreground">Utilizado</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Alert Section */}
        {isOverBudget && (
          <Card className="gradient-accent border-destructive/50 bg-gradient-to-br from-destructive/10 to-accent/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertCircle className="w-5 h-5" />
                Alerta de Orçamento
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-background/50 rounded-lg p-4">
                <p className="font-semibold text-foreground">
                  Você excedeu seu orçamento em {excessPercentage}% (R$ {excessAmount.toFixed(2)})
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Seu gasto total é de R$ {totalExpenses.toFixed(2)}, mas sua receita mensal é de R$ {monthlyBudget.toFixed(2)}
                </p>
              </div>

              {suggestion && (
                <div className="bg-background/50 rounded-lg p-4 border border-accent/30">
                  <p className="font-semibold text-accent mb-2">💡 Sugestão de Economia</p>
                  <p className="text-sm text-foreground">
                    Sugerimos reduzir <span className="font-bold text-accent">{suggestion.category}</span> em{" "}
                    <span className="font-bold text-accent">{suggestion.percentage}%</span> (R$ {suggestion.savings})
                    para voltar à meta.
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Isso deixaria a categoria em R$ {suggestion.newAmount}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Expenses Section */}
        <Card className="gradient-card border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle>Despesas</CardTitle>
              <CardDescription>Suas despesas do mês</CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-2 bg-primary hover:bg-primary/90">
                  <Plus className="w-4 h-4" />
                  Nova Despesa
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-card border-border">
                <DialogHeader>
                  <DialogTitle>Adicionar Nova Despesa</DialogTitle>
                  <DialogDescription>
                    Preencha os detalhes da sua nova despesa
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="category">Categoria</Label>
                    <Select value={newExpense.category} onValueChange={(value) => setNewExpense({ ...newExpense, category: value })}>
                      <SelectTrigger id="category" className="bg-background/50">
                        <SelectValue placeholder="Selecione uma categoria" />
                      </SelectTrigger>
                      <SelectContent>
                        {EXPENSE_CATEGORIES.map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="amount">Valor (R$)</Label>
                    <Input
                      id="amount"
                      type="number"
                      placeholder="0.00"
                      value={newExpense.amount}
                      onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                      className="bg-background/50"
                    />
                  </div>

                  <div>
                    <Label htmlFor="date">Data</Label>
                    <Input
                      id="date"
                      type="date"
                      value={newExpense.date}
                      onChange={(e) => setNewExpense({ ...newExpense, date: e.target.value })}
                      className="bg-background/50"
                    />
                  </div>

                  <div>
                    <Label htmlFor="description">Descrição (opcional)</Label>
                    <Input
                      id="description"
                      placeholder="Descrição da despesa"
                      value={newExpense.description}
                      onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                      className="bg-background/50"
                    />
                  </div>

                  <div className="flex items-center gap-2 p-3 bg-background/50 rounded-lg">
                    <input
                      type="checkbox"
                      id="useInstallments"
                      checked={useInstallments}
                      onChange={(e) => setUseInstallments(e.target.checked)}
                      className="w-4 h-4 cursor-pointer"
                    />
                    <Label htmlFor="useInstallments" className="cursor-pointer flex-1 m-0">
                      Parcelar esta compra?
                    </Label>
                  </div>

                  {useInstallments && (
                    <>
                      <div>
                        <Label htmlFor="purchaseDate">Data da Compra</Label>
                        <Input
                          id="purchaseDate"
                          type="date"
                          value={newExpense.purchaseDate}
                          onChange={(e) => setNewExpense({ ...newExpense, purchaseDate: e.target.value })}
                          className="bg-background/50"
                        />
                      </div>

                      <div>
                        <Label htmlFor="installments">Número de Parcelas (1-36)</Label>
                        <Input
                          id="installments"
                          type="number"
                          min="1"
                          max="36"
                          value={newExpense.installments}
                          onChange={(e) => setNewExpense({ ...newExpense, installments: e.target.value })}
                          className="bg-background/50"
                        />
                        {newExpense.installments && newExpense.amount && (
                          <p className="text-sm text-muted-foreground mt-2">
                            Parcelas de R$ {(parseFloat(newExpense.amount) / parseInt(newExpense.installments)).toFixed(2)}
                          </p>
                        )}
                      </div>
                    </>
                  )}

                  <Button
                    onClick={useInstallments ? handleAddInstallmentExpense : handleAddExpense}
                    className="w-full bg-primary hover:bg-primary/90"
                    disabled={useInstallments ? createInstallmentMutation.isPending : createExpenseMutation.isPending}
                  >
                    {useInstallments
                      ? createInstallmentMutation.isPending
                        ? "Adicionando..."
                        : "Adicionar Despesa Parcelada"
                      : createExpenseMutation.isPending
                      ? "Adicionando..."
                      : "Adicionar Despesa"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="list" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="list">Lista</TabsTrigger>
                <TabsTrigger value="categories">Por Categoria</TabsTrigger>
              </TabsList>

              <TabsContent value="list" className="space-y-3 mt-4">
                {expenses.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">Nenhuma despesa registrada</p>
                ) : (
                  expenses.map((expense) => (
                    <div key={expense.id} className="flex items-center justify-between p-3 bg-background/50 rounded-lg border border-border/50 hover:border-border transition-colors">
                      <div className="flex-1">
                        <p className="font-medium">{expense.category}</p>
                        <p className="text-sm text-muted-foreground">{expense.description || "Sem descrição"}</p>
                        <p className="text-xs text-muted-foreground mt-1">{expense.date}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <p className="font-bold text-accent">
                          R$ {(expense.amount / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </p>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteExpense(expense.id)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          disabled={deleteExpenseMutation.isPending}
                        >
                          ✕
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </TabsContent>

              <TabsContent value="categories" className="space-y-3 mt-4">
                {expensesByCategory.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">Nenhuma despesa registrada</p>
                ) : (
                  expensesByCategory.map((item) => (
                    <div key={item.category} className="p-3 bg-background/50 rounded-lg border border-border/50">
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-medium">{item.category}</p>
                        <p className="font-bold text-accent">
                          R$ {item.total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className="bg-gradient-primary h-2 rounded-full"
                          style={{ width: `${(item.total / totalExpenses) * 100}%` }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        {((item.total / totalExpenses) * 100).toFixed(1)}% do total
                      </p>
                    </div>
                  ))
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
