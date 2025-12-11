import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { createExpense, createInstallmentExpenses, deleteExpense, getBudgetByUserId, getExpensesByUserId, updateExpense, upsertBudget } from "./db";

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

    createInstallment: protectedProcedure
      .input(
        z.object({
          category: z.string().min(1),
          amount: z.number().int().positive(),
          installments: z.number().int().min(1).max(36),
          purchaseDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
          description: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const expenses = await createInstallmentExpenses(
          ctx.user.id,
          input.category,
          input.amount,
          input.installments,
          input.purchaseDate,
          input.description
        );
        return expenses;
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
