import { reports, type Report, type InsertReport } from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  // Report operations
  createReport(report: InsertReport): Promise<Report>;
  getReports(): Promise<Report[]>;
  getReport(id: number): Promise<Report | undefined>;
  deleteReport(id: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async createReport(report: InsertReport): Promise<Report> {
    const [newReport] = await db
      .insert(reports)
      .values(report)
      .returning();
    return newReport;
  }

  async getReports(): Promise<Report[]> {
    return await db
      .select()
      .from(reports)
      .orderBy(desc(reports.createdAt));
  }

  async getReport(id: number): Promise<Report | undefined> {
    const [report] = await db
      .select()
      .from(reports)
      .where(eq(reports.id, id));
    return report || undefined;
  }

  async deleteReport(id: number): Promise<void> {
    await db
      .delete(reports)
      .where(eq(reports.id, id));
  }
}

export const storage = new DatabaseStorage();
