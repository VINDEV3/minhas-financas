ALTER TABLE `expenses` ADD `installments` int DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `expenses` ADD `installmentNumber` int DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `expenses` ADD `originalPurchaseDate` varchar(10);--> statement-breakpoint
ALTER TABLE `expenses` ADD `parentExpenseId` int;