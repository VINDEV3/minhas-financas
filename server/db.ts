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

// Installment/Parcelamento queries
export async function createInstallmentExpenses(
  userId: number,
  category: string,
  totalAmount: number,
  installments: number,
  purchaseDate: string,
  description?: string
): Promise<Expense[]> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot create installment expenses: database not available");
    return [];
  }

  try {
    const createdExpenses: Expense[] = [];
    const amountPerInstallment = Math.round(totalAmount / installments);
    const remainder = totalAmount - amountPerInstallment * installments;
    
    // Converter data de compra para Date
    const purchaseDateObj = new Date(purchaseDate);
    
    for (let i = 0; i < installments; i++) {
      // Calcular data da parcela (adicionar meses)
      const installmentDate = new Date(purchaseDateObj);
      installmentDate.setMonth(installmentDate.getMonth() + i);
      const installmentDateStr = installmentDate.toISOString().split('T')[0];
      
      // Adicionar resto na última parcela
      const amount = i === installments - 1 ? amountPerInstallment + remainder : amountPerInstallment;
      
      const result = await db.insert(expenses).values({
        userId,
        category,
        amount,
        date: installmentDateStr,
        description: description ? `${description} (${i + 1}/${installments})` : `Parcela ${i + 1}/${installments}`,
        installments,
        installmentNumber: i + 1,
        originalPurchaseDate: purchaseDate,
      });
      
      const id = result[0].insertId as number;
      const created = await db.select().from(expenses).where(eq(expenses.id, id)).limit(1);
      if (created.length > 0) {
        createdExpenses.push(created[0]);
      }
    }
    
    return createdExpenses;
  } catch (error) {
    console.error("[Database] Failed to create installment expenses:", error);
    return [];
  }
}
