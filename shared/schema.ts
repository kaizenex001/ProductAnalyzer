import { pgTable, text, serial, timestamp, jsonb, decimal, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const reports = pgTable("reports", {
  id: serial("id").primaryKey(),
  productName: text("product_name").notNull(),
  productCategory: text("product_category").notNull(),
  productImage: text("product_image"),
  oneSentencePitch: text("one_sentence_pitch"),
  keyFeatures: text("key_features"),
  costOfGoods: decimal("cost_of_goods", { precision: 10, scale: 2 }),
  retailPrice: decimal("retail_price", { precision: 10, scale: 2 }),
  promoPrice: decimal("promo_price", { precision: 10, scale: 2 }),
  materials: text("materials"),
  variants: text("variants"),
  targetAudience: text("target_audience"),
  competitors: text("competitors"),
  salesChannels: text("sales_channels"),
  analysis: jsonb("analysis"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertReportSchema = createInsertSchema(reports).omit({
  id: true,
  createdAt: true,
});

export const productInputSchema = z.object({
  productName: z.string().min(1, "Product name is required"),
  productCategory: z.string().min(1, "Product category is required"),
  productImage: z.string().optional(),
  oneSentencePitch: z.string().min(1, "One sentence pitch is required"),
  keyFeatures: z.string().min(1, "Key features are required"),
  costOfGoods: z.string().min(1, "Cost of goods is required"),
  retailPrice: z.string().min(1, "Retail price is required"),
  promoPrice: z.string().optional(),
  materials: z.string().min(1, "Materials are required"),
  variants: z.string().optional(),
  targetAudience: z.string().min(1, "Target audience is required"),
  competitors: z.string().min(1, "Competitors are required"),
  salesChannels: z.array(z.string()).min(1, "At least one sales channel is required"),
});

export type InsertReport = z.infer<typeof insertReportSchema>;
export type Report = typeof reports.$inferSelect;
export type ProductInput = z.infer<typeof productInputSchema>;
