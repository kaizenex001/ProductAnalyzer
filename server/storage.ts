// Uploads a file to the 'report-images' bucket and returns the public URL
export async function uploadReportImage(file: MulterFile): Promise<string> {
  const { client } = getSupabaseClients();
  const bucket = 'report-images';
  
  // Clean the filename by removing/replacing invalid characters
  const cleanedName = file.originalname
    .replace(/[^a-zA-Z0-9.-]/g, '_') // Replace any non-alphanumeric chars (except . and -) with underscore
    .replace(/_{2,}/g, '_') // Replace multiple underscores with single underscore
    .replace(/^_|_$/g, ''); // Remove leading/trailing underscores
  
  const fileName = `${Date.now()}-${cleanedName}`;
  
  try {
    const { data, error } = await client.storage
      .from(bucket)
      .upload(fileName, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });
    if (error || !data) {
      console.error('Supabase uploadReportImage failed:', error, data);
      throw new Error(`Failed to upload image: ${error?.message || 'Unknown error'}`);
    }
    const publicUrlResult = client.storage.from(bucket).getPublicUrl(data.path);
    const publicUrl = publicUrlResult?.data?.publicUrl;
    if (!publicUrl) {
      console.error('Failed to get public URL after upload', publicUrlResult);
      throw new Error('Failed to get public URL for uploaded image');
    }
    return publicUrl;
  } catch (err) {
    const errorMsg = (err && typeof err === 'object' && 'message' in err) ? (err as Error).message : String(err);
    throw new Error(`uploadReportImage error: ${errorMsg}`);
  }
}
// server/storage.ts

import type { Report, InsertReport } from "@shared/schema";
// Multer does not export a File type, so we define it inline based on the Multer file object structure
type MulterFile = {
  /** Field name specified in the form */
  fieldname: string;
  /** Name of the file on the user's computer */
  originalname: string;
  /** Encoding type of the file */
  encoding: string;
  /** Mime type of the file */
  mimetype: string;
  /** Size of the file in bytes */
  size: number;
  /** A Buffer of the entire file */
  buffer: Buffer;
};
import memoizee from 'memoizee';
import { createClient } from '@supabase/supabase-js';
// UPDATED: Import the 'File' type from multer instead of formidable

// This function correctly initializes and caches your Supabase configuration.
const getSupabaseClients = memoizee(() => {
  console.log("Attempting to get Supabase configuration...");

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error("FATAL: SUPABASE_URL or SUPABASE_ANON_KEY environment variables are not set.");
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
    
    // Create a unique file name with proper sanitization
    const sanitizedName = file.originalname
      .replace(/[^a-zA-Z0-9.-]/g, '_') // Replace special characters with underscores
      .replace(/_{2,}/g, '_') // Replace multiple underscores with single underscore
      .replace(/^_|_$/g, ''); // Remove leading/trailing underscores
    
    // Fallback to 'image' if sanitized name is empty
    const safeName = sanitizedName || 'image';
    const fileName = `${Date.now()}-${safeName}`;

    console.log(`Uploading file '${fileName}' to bucket '${bucket}'...`);

    const { data, error } = await client.storage
      .from(bucket)
      .upload(fileName, fileContent, {
        contentType: file.mimetype!,
        upsert: false,
      });

    if (error || !data) {
      console.error("Supabase uploadImage failed:", error, data);
      throw new Error(`Failed to upload image: ${error?.message || 'Unknown error'}`);
    }

    // After uploading, get the public URL for the file.
    const publicUrlResult = client.storage
      .from(bucket)
      .getPublicUrl(data.path);
    const publicUrl = publicUrlResult?.data?.publicUrl;

    if (!publicUrl) {
      console.error("Failed to get public URL after upload", publicUrlResult);
      throw new Error("Failed to get public URL for uploaded image");
    }

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
    let dbReport;
    try {
      dbReport = JSON.parse(text)[0];
    } catch (e) {
      console.error('Failed to parse Supabase response:', text);
      throw e;
    }
    return this.transformReportFields(dbReport);
  }

  // Transform database fields from snake_case to camelCase
  private transformReportFields(dbReport: any): Report {
    return {
      id: dbReport.id,
      productName: dbReport.product_name,
      productCategory: dbReport.product_category,
      productImage: dbReport.product_image,
      oneSentencePitch: dbReport.one_sentence_pitch,
      keyFeatures: dbReport.key_features,
      costOfGoods: dbReport.cost_of_goods,
      retailPrice: dbReport.retail_price,
      promoPrice: dbReport.promo_price,
      materials: dbReport.materials,
      variants: dbReport.variants,
      targetAudience: dbReport.target_audience,
      competitors: dbReport.competitors,
      salesChannels: dbReport.sales_channels,
      analysis: dbReport.analysis,
      createdAt: dbReport.created_at,
    };
  }

  async getReports(): Promise<Report[]> {
    const { rest: config } = getSupabaseClients();
    const res = await fetch(config.reportsEndpoint + "?order=created_at.desc", { headers: config.headers });
    if (!res.ok) {
        const errorText = await res.text();
        console.error("Supabase getReports failed:", errorText);
        throw new Error("Failed to fetch reports: " + errorText);
    }
    const dbReports = await res.json();
    return dbReports.map((dbReport: any) => this.transformReportFields(dbReport));
  }

  async getReport(id: number): Promise<Report | undefined> {
    const { rest: config } = getSupabaseClients();
    const res = await fetch(config.reportsEndpoint + `?id=eq.${id}`, { headers: config.headers });
    if (!res.ok) {
        const errorText = await res.text();
        console.error(`Supabase getReport for id ${id} failed:`, errorText);
        throw new Error("Failed to fetch report: " + errorText);
    }
    const dbReports = await res.json();
    const dbReport = dbReports[0];
    return dbReport ? this.transformReportFields(dbReport) : undefined;
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