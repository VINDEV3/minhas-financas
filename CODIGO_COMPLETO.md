# 📚 Código Completo - Aplicação "Minhas Finanças"

## 📋 Índice
1. [Banco de Dados - Schema](#banco-de-dados)
2. [Backend - Database Queries](#backend-queries)
3. [Backend - tRPC Routers](#backend-routers)
4. [Frontend - App.tsx](#frontend-app)
5. [Frontend - Home.tsx](#frontend-home)
6. [Frontend - Dashboard.tsx](#frontend-dashboard)
7. [Estilos - index.css](#estilos)

---

## <a name="banco-de-dados"></a>1. Banco de Dados - Schema (drizzle/schema.ts)

```typescript
import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const expenses = mysqlTable("expenses", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  category: varchar("category", { length: 64 }).notNull(),
  amount: int("amount").notNull(),
  date: varchar("date", { length: 10 }).notNull(),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Expense = typeof expenses.$inferSelect;
export type InsertExpense = typeof expenses.$inferInsert;

export const budgets = mysqlTable("budgets", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  monthlyIncome: int("monthlyIncome").notNull(),
  month: varchar("month", { length: 7 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Budget = typeof budgets.$inferSelect;
export type InsertBudget = typeof budgets.$inferInsert;
```

---

## <a name="backend-queries"></a>2. Backend - Database Queries (server/db.ts)

```typescript
import { and, desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { Budget, Expense, InsertBudget, InsertExpense, InsertUser, budgets, expenses, users } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Expense queries
export async function createExpense(expense: InsertExpense): Promise<Expense | null> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot create expense: database not available");
    return null;
  }

  try {
    const result = await db.insert(expenses).values(expense);
    const id = result[0].insertId as number;
    const created = await db.select().from(expenses).where(eq(expenses.id, id)).limit(1);
    return created.length > 0 ? created[0] : null;
  } catch (error) {
    console.error("[Database] Failed to create expense:", error);
    return null;
  }
}

export async function getExpensesByUserId(userId: number): Promise<Expense[]> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get expenses: database not available");
    return [];
  }

  try {
    return await db.select().from(expenses).where(eq(expenses.userId, userId)).orderBy(desc(expenses.date));
  } catch (error) {
    console.error("[Database] Failed to get expenses:", error);
    return [];
  }
}

export async function deleteExpense(id: number, userId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot delete expense: database not available");
    return false;
  }

  try {
    await db.delete(expenses).where(and(eq(expenses.id, id), eq(expenses.userId, userId)));
    return true;
  } catch (error) {
    console.error("[Database] Failed to delete expense:", error);
    return false;
  }
}

export async function updateExpense(id: number, userId: number, data: Partial<InsertExpense>): Promise<Expense | null> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot update expense: database not available");
    return null;
  }

  try {
    await db.update(expenses).set(data).where(and(eq(expenses.id, id), eq(expenses.userId, userId)));
    const updated = await db.select().from(expenses).where(eq(expenses.id, id)).limit(1);
    return updated.length > 0 ? updated[0] : null;
  } catch (error) {
    console.error("[Database] Failed to update expense:", error);
    return null;
  }
}

// Budget queries
export async function upsertBudget(budget: InsertBudget): Promise<Budget | null> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert budget: database not available");
    return null;
  }

  try {
    await db.insert(budgets).values(budget).onDuplicateKeyUpdate({
      set: {
        monthlyIncome: budget.monthlyIncome,
        updatedAt: new Date(),
      },
    });
    const result = await db.select().from(budgets).where(eq(budgets.userId, budget.userId)).limit(1);
    return result.length > 0 ? result[0] : null;
  } catch (error) {
    console.error("[Database] Failed to upsert budget:", error);
    return null;
  }
}

export async function getBudgetByUserId(userId: number): Promise<Budget | null> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get budget: database not available");
    return null;
  }

  try {
    const result = await db.select().from(budgets).where(eq(budgets.userId, userId)).limit(1);
    return result.length > 0 ? result[0] : null;
  } catch (error) {
    console.error("[Database] Failed to get budget:", error);
    return null;
  }
}
```

---

## <a name="backend-routers"></a>3. Backend - tRPC Routers (server/routers.ts)

```typescript
import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { createExpense, deleteExpense, getBudgetByUserId, getExpensesByUserId, updateExpense, upsertBudget } from "./db";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // Expenses router
  expenses: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return await getExpensesByUserId(ctx.user.id);
    }),

    create: protectedProcedure
      .input(
        z.object({
          category: z.string().min(1),
          amount: z.number().int().positive(),
          date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
          description: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const expense = await createExpense({
          userId: ctx.user.id,
          category: input.category,
          amount: input.amount,
          date: input.date,
          description: input.description || null,
        });
        return expense;
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number().int() }))
      .mutation(async ({ ctx, input }) => {
        const success = await deleteExpense(input.id, ctx.user.id);
        return { success };
      }),

    update: protectedProcedure
      .input(
        z.object({
          id: z.number().int(),
          category: z.string().optional(),
          amount: z.number().int().positive().optional(),
          date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
          description: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { id, ...data } = input;
        const expense = await updateExpense(id, ctx.user.id, data);
        return expense;
      }),
  }),

  // Budget router
  budget: router({
    get: protectedProcedure.query(async ({ ctx }) => {
      const currentMonth = new Date().toISOString().slice(0, 7);
      let budget = await getBudgetByUserId(ctx.user.id);

      if (!budget) {
        budget = await upsertBudget({
          userId: ctx.user.id,
          monthlyIncome: 300000,
          month: currentMonth,
        });
      }

      return budget;
    }),

    set: protectedProcedure
      .input(z.object({ monthlyIncome: z.number().int().positive() }))
      .mutation(async ({ ctx, input }) => {
        const currentMonth = new Date().toISOString().slice(0, 7);
        const budget = await upsertBudget({
          userId: ctx.user.id,
          monthlyIncome: input.monthlyIncome,
          month: currentMonth,
        });
        return budget;
      }),
  }),
});

export type AppRouter = typeof appRouter;
```

---

## <a name="frontend-app"></a>4. Frontend - App.tsx (client/src/App.tsx)

```typescript
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/dashboard"} component={Dashboard} />
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="dark"
      >
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
```

---

## <a name="frontend-home"></a>5. Frontend - Home.tsx (client/src/pages/Home.tsx)

```typescript
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, PieChart, TrendingUp, Zap } from "lucide-react";
import { useEffect } from "react";
import { useLocation } from "wouter";

export default function Home() {
  const { user, isAuthenticated, loading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (isAuthenticated && !loading) {
      setLocation("/dashboard");
    }
  }, [isAuthenticated, loading, setLocation]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg bg-gradient-primary bg-clip-text text-transparent">
              Minhas Finanças
            </span>
          </div>
          <div className="flex items-center gap-4">
            <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Recursos
            </a>
            <a href="#benefits" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Benefícios
            </a>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container py-20 md:py-32">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h1 className="text-4xl md:text-5xl font-bold leading-tight">
              Controle suas <span className="bg-gradient-primary bg-clip-text text-transparent">finanças</span> com facilidade
            </h1>
            <p className="text-lg text-muted-foreground">
              Gerencie suas despesas mensais, defina orçamentos e receba sugestões inteligentes para economizar. Tudo em um único lugar, com interface moderna e intuitiva.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" className="bg-gradient-primary hover:opacity-90 text-white">
                Começar Agora
              </Button>
              <Button size="lg" variant="outline" className="border-border hover:bg-background/50">
                Saiba Mais
              </Button>
            </div>
          </div>

          {/* Hero Visual */}
          <div className="relative h-80 md:h-96">
            <div className="absolute inset-0 bg-gradient-primary opacity-10 rounded-3xl blur-3xl"></div>
            <div className="relative h-full flex items-center justify-center">
              <div className="w-full max-w-sm space-y-4">
                {/* Mock Dashboard Card */}
                <div className="gradient-card rounded-2xl p-6 border border-border/50 shadow-2xl">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Receita Mensal</span>
                      <span className="text-2xl font-bold text-primary">R$ 3.000</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Total de Despesas</span>
                      <span className="text-2xl font-bold text-accent">R$ 2.450</span>
                    </div>
                    <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                      <div className="w-4/5 h-full bg-gradient-primary rounded-full"></div>
                    </div>
                    <div className="text-xs text-muted-foreground">81.7% do orçamento utilizado</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="container py-20 md:py-32">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Recursos Poderosos</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Tudo que você precisa para gerenciar suas finanças pessoais de forma eficiente
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              icon: BarChart3,
              title: "Entrada de Despesas",
              description: "Registre suas despesas por categoria de forma rápida e organizada",
            },
            {
              icon: TrendingUp,
              title: "Cálculo Automático",
              description: "Veja o total de despesas atualizado em tempo real",
            },
            {
              icon: PieChart,
              title: "Análise Visual",
              description: "Gráficos intuitivos mostram como você gasta seu dinheiro",
            },
            {
              icon: Zap,
              title: "Sugestões Inteligentes",
              description: "Receba recomendações personalizadas para economizar",
            },
          ].map((feature, idx) => (
            <Card key={idx} className="gradient-card border-border/50 hover:border-border transition-colors">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-gradient-primary flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <CardTitle className="text-lg">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-muted-foreground">{feature.description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Benefits Section */}
      <section id="benefits" className="container py-20 md:py-32">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h2 className="text-3xl md:text-4xl font-bold">Por que usar Minhas Finanças?</h2>
            <ul className="space-y-4">
              {[
                "Controle total sobre suas despesas mensais",
                "Alertas automáticos quando você ultrapassa o orçamento",
                "Sugestões de economia baseadas em seus gastos",
                "Interface moderna e fácil de usar",
                "Acesso em qualquer dispositivo",
                "Dados seguros e privados",
              ].map((benefit, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-gradient-primary flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-white text-sm font-bold">✓</span>
                  </div>
                  <span className="text-foreground">{benefit}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="relative h-80 md:h-96">
            <div className="absolute inset-0 bg-gradient-accent opacity-10 rounded-3xl blur-3xl"></div>
            <div className="relative h-full flex items-center justify-center">
              <div className="w-full max-w-sm space-y-4">
                {/* Mock Alert Card */}
                <div className="gradient-accent rounded-2xl p-6 border border-destructive/50 bg-gradient-to-br from-destructive/10 to-accent/10 shadow-2xl">
                  <div className="space-y-3">
                    <p className="font-semibold text-destructive flex items-center gap-2">
                      <span className="text-lg">⚠️</span> Alerta de Orçamento
                    </p>
                    <p className="text-sm text-foreground">
                      Você excedeu seu orçamento em 8.3%
                    </p>
                    <div className="bg-background/50 rounded-lg p-3 border border-accent/30">
                      <p className="text-xs font-semibold text-accent mb-1">💡 Sugestão de Economia</p>
                      <p className="text-xs text-muted-foreground">
                        Reduza Lazer em 15% para voltar à meta
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container py-20 md:py-32">
        <div className="gradient-card rounded-3xl p-12 md:p-16 border border-border/50 text-center space-y-6">
          <h2 className="text-3xl md:text-4xl font-bold">Pronto para controlar suas finanças?</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Comece agora mesmo e veja como é fácil gerenciar suas despesas e economizar dinheiro
          </p>
          <Button size="lg" className="bg-gradient-primary hover:opacity-90 text-white">
            Começar Agora
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8 mt-20">
        <div className="container flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-gradient-primary flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold">Minhas Finanças</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © 2025 Minhas Finanças. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
```

---

## <a name="frontend-dashboard"></a>6. Frontend - Dashboard.tsx (client/src/pages/Dashboard.tsx)

```typescript
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
  });

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
      });
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

                  <Button onClick={handleAddExpense} className="w-full bg-primary hover:bg-primary/90" disabled={createExpenseMutation.isPending}>
                    {createExpenseMutation.isPending ? "Adicionando..." : "Adicionar Despesa"}
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
```

---

## <a name="estilos"></a>7. Estilos - index.css (client/src/index.css)

```css
@import "tailwindcss";
@import "tw-animate-css";

@custom-variant dark (&:is(.dark *));

@theme inline {
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
  --color-destructive-foreground: var(--destructive-foreground);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);
  --color-chart-1: var(--chart-1);
  --color-chart-2: var(--chart-2);
  --color-chart-3: var(--chart-3);
  --color-chart-4: var(--chart-4);
  --color-chart-5: var(--chart-5);
  --color-sidebar: var(--sidebar);
  --color-sidebar-foreground: var(--sidebar-foreground);
  --color-sidebar-primary: var(--sidebar-primary);
  --color-sidebar-primary-foreground: var(--sidebar-primary-foreground);
  --color-sidebar-accent: var(--sidebar-accent);
  --color-sidebar-accent-foreground: var(--sidebar-accent-foreground);
  --color-sidebar-border: var(--sidebar-border);
  --color-sidebar-ring: var(--sidebar-ring);
}

:root {
  /* Paleta de cores vibrantes */
  --primary: oklch(0.55 0.25 260);        /* Roxo profundo vibrante */
  --primary-foreground: oklch(0.98 0 0);
  --secondary: oklch(0.55 0.25 200);      /* Azul elétrico */
  --secondary-foreground: oklch(0.98 0 0);
  --sidebar-primary: oklch(0.55 0.25 260);
  --sidebar-primary-foreground: oklch(0.98 0 0);
  --chart-1: oklch(0.55 0.25 260);        /* Roxo */
  --chart-2: oklch(0.55 0.25 200);        /* Azul */
  --chart-3: oklch(0.6 0.25 30);          /* Laranja */
  --chart-4: oklch(0.5 0.2 280);          /* Roxo mais escuro */
  --chart-5: oklch(0.45 0.2 210);         /* Azul mais escuro */
  --radius: 0.75rem;
  --background: oklch(0.08 0.01 240);
  --foreground: oklch(0.98 0.001 0);
  --card: oklch(0.12 0.01 240);
  --card-foreground: oklch(0.98 0.001 0);
  --popover: oklch(0.12 0.01 240);
  --popover-foreground: oklch(0.98 0.001 0);
  --muted: oklch(0.25 0.01 240);
  --muted-foreground: oklch(0.7 0.01 0);
  --accent: oklch(0.6 0.25 30);           /* Laranja energético */
  --accent-foreground: oklch(0.98 0 0);
  --destructive: oklch(0.577 0.245 27.325);
  --destructive-foreground: oklch(0.985 0 0);
  --border: oklch(0.2 0.01 240);
  --input: oklch(0.18 0.01 240);
  --ring: oklch(0.55 0.25 260);
  --sidebar: oklch(0.12 0.01 240);
  --sidebar-foreground: oklch(0.98 0.001 0);
  --sidebar-accent: oklch(0.55 0.25 260);
  --sidebar-accent-foreground: oklch(0.98 0 0);
  --sidebar-border: oklch(0.2 0.01 240);
  --sidebar-ring: oklch(0.55 0.25 260);
}

.dark {
  /* Paleta de cores vibrantes (dark mode) */
  --primary: oklch(0.55 0.25 260);
  --primary-foreground: oklch(0.98 0 0);
  --secondary: oklch(0.55 0.25 200);
  --secondary-foreground: oklch(0.98 0 0);
  --sidebar-primary: oklch(0.55 0.25 260);
  --sidebar-primary-foreground: oklch(0.98 0 0);
  --background: oklch(0.08 0.01 240);
  --foreground: oklch(0.98 0.001 0);
  --card: oklch(0.12 0.01 240);
  --card-foreground: oklch(0.98 0.001 0);
  --popover: oklch(0.12 0.01 240);
  --popover-foreground: oklch(0.98 0.001 0);
  --secondary: oklch(0.24 0.006 286.033);
  --secondary-foreground: oklch(0.7 0.005 65);
  --muted: oklch(0.25 0.01 240);
  --muted-foreground: oklch(0.7 0.01 0);
  --accent: oklch(0.6 0.25 30);
  --accent-foreground: oklch(0.98 0 0);
  --destructive: oklch(0.704 0.191 22.216);
  --destructive-foreground: oklch(0.985 0 0);
  --border: oklch(0.2 0.01 240);
  --input: oklch(0.18 0.01 240);
  --ring: oklch(0.55 0.25 260);
  --chart-1: oklch(0.55 0.25 260);
  --chart-2: oklch(0.55 0.25 200);
  --chart-3: oklch(0.6 0.25 30);
  --chart-4: oklch(0.5 0.2 280);
  --chart-5: oklch(0.45 0.2 210);
  --sidebar: oklch(0.12 0.01 240);
  --sidebar-foreground: oklch(0.98 0.001 0);
  --sidebar-accent: oklch(0.55 0.25 260);
  --sidebar-accent-foreground: oklch(0.98 0 0);
  --sidebar-border: oklch(0.2 0.01 240);
  --sidebar-ring: oklch(0.55 0.25 260);
}

@layer base {
  * {
    @apply border-border outline-ring/50;
  }
  body {
    @apply bg-background text-foreground;
    background: linear-gradient(135deg, oklch(0.08 0.01 240) 0%, oklch(0.12 0.01 260) 50%, oklch(0.08 0.01 240) 100%);
  }
  
  /* Gradientes reutilizáveis */
  .gradient-primary {
    background: linear-gradient(135deg, oklch(0.55 0.25 260) 0%, oklch(0.55 0.25 200) 100%);
  }
  
  .gradient-accent {
    background: linear-gradient(135deg, oklch(0.6 0.25 30) 0%, oklch(0.577 0.245 27.325) 100%);
  }
  
  .gradient-card {
    background: linear-gradient(135deg, oklch(0.15 0.01 240) 0%, oklch(0.12 0.01 260) 100%);
  }
  button:not(:disabled),
  [role="button"]:not([aria-disabled="true"]),
  [type="button"]:not(:disabled),
  [type="submit"]:not(:disabled),
  [type="reset"]:not(:disabled),
  a[href],
  select:not(:disabled),
  input[type="checkbox"]:not(:disabled),
  input[type="radio"]:not(:disabled) {
    @apply cursor-pointer;
  }
  
  /* Estilos de transição suave */
  * {
    @apply transition-colors duration-200;
  }
}

@layer components {
  /**
   * Custom container utility that centers content and adds responsive padding.
   *
   * This overrides Tailwind's default container behavior to:
   * - Auto-center content (mx-auto)
   * - Add responsive horizontal padding
   * - Set max-width for large screens
   *
   * Usage: <div className="container">...</div>
   *
   * For custom widths, use max-w-* utilities directly:
   * <div className="max-w-6xl mx-auto px-4">...</div>
   */
  .container {
    width: 100%;
    margin-left: auto;
    margin-right: auto;
    padding-left: 1rem; /* 16px - mobile padding */
    padding-right: 1rem;
  }

  .flex {
    min-height: 0;
    min-width: 0;
  }

  @media (min-width: 640px) {
    .container {
      padding-left: 1.5rem; /* 24px - tablet padding */
      padding-right: 1.5rem;
    }
  }

  @media (min-width: 1024px) {
    .container {
      padding-left: 2rem; /* 32px - desktop padding */
      padding-right: 2rem;
      max-width: 1280px; /* Standard content width */
    }
  }
}
```

---

## 📝 Resumo Técnico

### Stack Utilizado
- **Frontend**: React 19 + TypeScript + Tailwind CSS 4 + shadcn/ui
- **Backend**: Node.js + Express + tRPC 11
- **Banco de Dados**: MySQL + Drizzle ORM
- **Autenticação**: Manus OAuth
- **UI Components**: shadcn/ui (Button, Card, Dialog, Input, Select, Tabs, etc.)
- **Ícones**: Lucide React
- **Notificações**: Sonner

### Funcionalidades Principais
1. ✅ Autenticação com Manus OAuth
2. ✅ Entrada de despesas por categoria
3. ✅ Cálculo automático em tempo real
4. ✅ Definição de orçamento mensal
5. ✅ Anel de progresso (donut chart) dinâmico
6. ✅ Sistema de alertas quando orçamento é excedido
7. ✅ Algoritmo de análise preditiva com sugestões acionáveis
8. ✅ Visualização de despesas por categoria
9. ✅ CRUD completo de despesas
10. ✅ UI/UX moderna com cores vibrantes e gradientes suaves

### Arquitetura
- **Banco de Dados**: 3 tabelas (users, expenses, budgets)
- **Backend**: 6 procedures tRPC (expenses.list, expenses.create, expenses.delete, expenses.update, budget.get, budget.set)
- **Frontend**: 2 páginas principais (Home, Dashboard) + componentes reutilizáveis

---

## 🚀 Como Usar

1. **Clone o repositório** e instale as dependências
2. **Configure as variáveis de ambiente** (DATABASE_URL, OAuth credentials)
3. **Execute as migrações** com `pnpm db:push`
4. **Inicie o servidor** com `pnpm dev`
5. **Acesse** em `http://localhost:3000`

---

Desenvolvido com ❤️ usando Manus AI
