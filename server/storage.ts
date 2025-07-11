// server/storage.ts

import type { Report, InsertReport } from "@shared/schema";
import memoizee from 'memoizee';
import { createClient } from '@supabase/supabase-js';
// UPDATED: Import the 'File' type from multer instead of formidable
import type { File as MulterFile } from 'multer';

// This function correctly initializes and caches your Supabase configuration.
const getSupabaseClients = memoizee(() => {
  console.log("Attempting to get Supabase configuration...");

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error("FATAL: SUPABASE_URL or SUPABASE_KEY environment variables are not set.");
    throw new Error("Supabase credentials are not configured in the environment.");
  }

  console.log("Supabase credentials loaded successfully.");

  const supabaseClient = createClient(supabaseUrl, supabaseKey);

  return {
    rest: {
      url: supabaseUrl,
      key: supabaseKey,
      reportsEndpoint: `${supabaseUrl}/rest/v1/reports`,
      headers: {
        "apikey": supabaseKey,
        "Authorization": `Bearer ${supabaseKey}`,
        "Content-Type": "application/json",
      },
    },
    client: supabaseClient,
  };
});

export interface IStorage {
  createReport(report: InsertReport): Promise<Report>;
  getReports(): Promise<Report[]>;
  getReport(id: number): Promise<Report | undefined>;
  deleteReport(id: number): Promise<void>;
  // UPDATED: The function signature now expects a MulterFile object
  uploadImage(file: MulterFile, bucket: string): Promise<string>;
}

export class SupabaseStorage implements IStorage {

  // UPDATED: This function is now fully compatible with multer.
  async uploadImage(file: MulterFile, bucket: string): Promise<string> {
    const { client } = getSupabaseClients();
    
    // The file content is now taken directly from the buffer provided by multer.
    const fileContent = file.buffer; 
    // Create a unique file name using the original name from multer.
    const fileName = `${Date.now()}-${file.originalname.replace(/\s/g, '_')}`;

    console.log(`Uploading file '${fileName}' to bucket '${bucket}'...`);

    const { data, error } = await client.storage
      .from(bucket)
      .upload(fileName, fileContent, {
        contentType: file.mimetype!,
        upsert: false,
      });

    if (error) {
      console.error("Supabase uploadImage failed:", error);
      throw new Error(`Failed to upload image: ${error.message}`);
    }

    // After uploading, get the public URL for the file.
    const { data: { publicUrl } } = client.storage
      .from(bucket)
      .getPublicUrl(data.path);

    console.log("Image uploaded successfully. Public URL:", publicUrl);
    return publicUrl;
  }

  // --- NO CHANGES BELOW THIS LINE ---

  async createReport(report: InsertReport): Promise<Report> {
    const { rest: config } = getSupabaseClients();

    function toPostgresArray(arr: string[]): string {
      return `{${arr.map(s => '"' + s.replace(/"/g, '\"') + '"').join(',')}}`;
    }

    function cleanPayload(obj: Record<string, any>): Record<string, any> {
      const arrayFields = ['sales_channels'];
      const result: Record<string, any> = {};
      for (const [key, value] of Object.entries(obj)) {
        if (arrayFields.includes(key)) {
          if (Array.isArray(value)) { result[key] = toPostgresArray(value); } 
          else if (typeof value === 'string' && value.length > 0) { result[key] = toPostgresArray([value]); } 
          else { result[key] = toPostgresArray([]); }
        } else if (value === undefined) {
          result[key] = null;
        } else {
          result[key] = value;
        }
      }
      return result;
    }

    const snakeCaseReport = cleanPayload({
      product_name: report.productName,
      product_category: report.productCategory,
      product_image: report.productImage,
      one_sentence_pitch: report.oneSentencePitch,
      key_features: report.keyFeatures,
      cost_of_goods: report.costOfGoods,
      retail_price: report.retailPrice,
      promo_price: report.promoPrice,
      materials: report.materials,
      variants: report.variants,
      target_audience: report.targetAudience,
      competitors: report.competitors,
      sales_channels: report.salesChannels,
      analysis: report.analysis,
    });

    const res = await fetch(config.reportsEndpoint, {
      method: "POST",
      headers: { ...config.headers, "Prefer": "return=representation" },
      body: JSON.stringify(snakeCaseReport),
    });

    if (!res.ok) {
        const errorText = await res.text();
        console.error("Supabase createReport failed:", errorText);
        throw new Error("Failed to create report: " + errorText);
    }

    const text = await res.text();
    if (!text) throw new Error("Supabase returned empty response on create");
    let newReport;
    try {
      newReport = JSON.parse(text)[0];
    } catch (e) {
      console.error('Failed to parse Supabase response:', text);
      throw e;
    }
    return newReport;
  }

  async getReports(): Promise<Report[]> {
    const { rest: config } = getSupabaseClients();
    const res = await fetch(config.reportsEndpoint + "?order=created_at.desc", { headers: config.headers });
    if (!res.ok) {
        const errorText = await res.text();
        console.error("Supabase getReports failed:", errorText);
        throw new Error("Failed to fetch reports: " + errorText);
    }
    return await res.json();
  }

  async getReport(id: number): Promise<Report | undefined> {
    const { rest: config } = getSupabaseClients();
    const res = await fetch(config.reportsEndpoint + `?id=eq.${id}`, { headers: config.headers });
    if (!res.ok) {
        const errorText = await res.text();
        console.error(`Supabase getReport for id ${id} failed:`, errorText);
        throw new Error("Failed to fetch report: " + errorText);
    }
    const reports = await res.json();
    return reports[0] || undefined;
  }

  async deleteReport(id: number): Promise<void> {
    const { rest: config } = getSupabaseClients();
    const res = await fetch(config.reportsEndpoint + `?id=eq.${id}`, { method: "DELETE", headers: config.headers });
    if (!res.ok) {
        const errorText = await res.text();
        console.error(`Supabase deleteReport for id ${id} failed:`, errorText);
        throw new Error("Failed to delete report: " + errorText);
    }
  }
}

export const storage = new SupabaseStorage();