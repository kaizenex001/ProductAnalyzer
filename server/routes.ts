import type { Request, Response, NextFunction } from "express";
// Middleware to preprocess report data from FormData
function preprocessReportData(req: Request, res: Response, next: NextFunction) {
  // Convert numeric fields from number to string if they're numbers
  const numericFields = ['costOfGoods', 'retailPrice', 'promoPrice'];
  for (const field of numericFields) {
    if (req.body[field] !== undefined && req.body[field] !== null && req.body[field] !== '') {
      // Convert to string if it's a number
      req.body[field] = String(req.body[field]);
    }
  }
  
  // Handle salesChannels parsing
  if (req.body.salesChannels !== undefined && req.body.salesChannels !== null) {
    if (Array.isArray(req.body.salesChannels)) {
      // If it's already an array, check if it contains JSON strings
      const flatChannels = req.body.salesChannels.flatMap((channel: any) => {
        if (typeof channel === 'string') {
          // Try to parse as JSON first
          try {
            const parsed = JSON.parse(channel);
            return Array.isArray(parsed) ? parsed : [channel];
          } catch {
            // If it's not JSON, treat as regular string
            return [channel];
          }
        }
        return [channel];
      });
      req.body.salesChannels = flatChannels;
    } else if (typeof req.body.salesChannels === 'string') {
      // Try to parse as JSON
      try {
        req.body.salesChannels = JSON.parse(req.body.salesChannels);
      } catch {
        // If parsing fails, split by comma
        req.body.salesChannels = req.body.salesChannels.split(',').map((s: string) => s.trim()).filter(Boolean);
      }
    } else {
      req.body.salesChannels = [];
    }
  } else {
    req.body.salesChannels = [];
  }
  
  next();
}
// server/routes.ts

import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage"; // Your updated storage.ts
import { productInputSchema } from "@shared/schema";
import { generateProductAnalysis, analyzeProductImage, generateContentIdeas, optimizeContent, chatWithDatabase } from "./services/openai";
import multer from "multer"; // Using multer for file uploads

// Configure multer to handle file uploads in memory
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // --- EXISTING GET, DELETE ROUTES (No changes needed) ---

  // Get all reports
  app.get("/api/reports", async (req, res) => {
    try {
      const reports = await storage.getReports();
      res.json(reports);
    } catch (error) {
      console.error("Error fetching reports:", error);
      res.status(500).json({ message: "Failed to fetch reports" });
    }
  });

  // Get specific report
  app.get("/api/reports/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid report ID" });
      const report = await storage.getReport(id);
      if (!report) return res.status(404).json({ message: "Report not found" });
      res.json(report);
    } catch (error) {
      console.error("Error fetching report:", error);
      res.status(500).json({ message: "Failed to fetch report" });
    }
  });

  // Delete report
  app.delete("/api/reports/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid report ID" });
      await storage.deleteReport(id);
      res.status(204).send(); // 204 No Content is standard for a successful delete
    } catch (error) {
      console.error("Error deleting report:", error);
      res.status(500).json({ message: "Failed to delete report" });
    }
  });

  // --- UNIFIED ROUTE FOR REPORT CREATION + IMAGE UPLOAD ---
  // This single endpoint replaces the old POST /api/reports and POST /api/upload-image.
  // The `upload.single('productImage')` middleware processes the file upload.
  
  app.post("/api/reports", upload.single('productImage'), preprocessReportData, async (req, res) => {
    // Debug logging to inspect incoming form data
    console.log('--- /api/reports DEBUG ---');
    console.log('req.body:', req.body);
    console.log('req.file:', req.file);
    
    // Handle nested productData structure
    if (req.body.productData) {
      // Flatten the productData into the main req.body
      Object.assign(req.body, req.body.productData);
      delete req.body.productData;
    }
    
    // Transform salesChannels from object to array if needed
    if (req.body.salesChannels && typeof req.body.salesChannels === 'object' && !Array.isArray(req.body.salesChannels)) {
      req.body.salesChannels = Object.values(req.body.salesChannels);
    }
    
    // Clean up fields that might contain console output
    const fieldsToClean = ['materials', 'variants', 'targetAudience', 'competitors'];
    fieldsToClean.forEach(field => {
      if (req.body[field] && typeof req.body[field] === 'string') {
        // Remove console output that might have been pasted in
        const cleanValue = req.body[field].split('\n')[0].trim();
        if (cleanValue && !cleanValue.includes('AM [express]') && !cleanValue.includes('DEBUG')) {
          req.body[field] = cleanValue;
        }
      }
    });
    
    // --- PATCH: Parse salesChannels and convert fields to proper types ---
    if (typeof req.body.salesChannels === "string") {
      try {
        req.body.salesChannels = JSON.parse(req.body.salesChannels);
      } catch {
        req.body.salesChannels = [];
      }
    }
    
    // Ensure all required fields are present and convert empty strings to undefined
    const requiredFields = [
      "productName",
      "productCategory",
      "oneSentencePitch",
      "keyFeatures",
      "materials",
      "variants",
      "targetAudience",
      "competitors"
    ];
    
    requiredFields.forEach(field => {
      if (req.body[field] === "") req.body[field] = undefined;
    });
    
    // Convert numeric fields to strings for validation
    const numericFields = ["costOfGoods", "retailPrice", "promoPrice"];
    numericFields.forEach(field => {
      if (req.body[field] !== undefined && req.body[field] !== null && req.body[field] !== '') {
        req.body[field] = String(req.body[field]);
      }
    });
    try {
      // 1. If a file is present, upload it to Supabase Storage using uploadReportImage
      let imageUrl = undefined;
      if (req.file) {
        try {
          const { uploadReportImage } = await import("./storage");
          imageUrl = await uploadReportImage(req.file);
          console.log("Image uploaded successfully, URL:", imageUrl);
        } catch (err) {
          const errorMsg = (err && typeof err === 'object' && 'message' in err) ? (err as Error).message : String(err);
          console.error("Image upload failed:", errorMsg);
          return res.status(500).json({ message: "Image upload failed", error: errorMsg });
        }
      } else {
        console.log("No file received in request");
      }

      // 2. Parse the analysis JSON string from req.body
      let parsedAnalysis = null;
      if (req.body.analysis) {
        let analysisRaw = req.body.analysis;
        // If analysis is an array (can happen with FormData), use the first element
        if (Array.isArray(analysisRaw)) {
          analysisRaw = analysisRaw[0];
        }
        console.log("Received analysis field:", analysisRaw);
        try {
          if (typeof analysisRaw === 'string') {
            parsedAnalysis = JSON.parse(analysisRaw);
          } else if (typeof analysisRaw === 'object') {
            parsedAnalysis = analysisRaw;
          } else {
            throw new Error('Analysis field is neither string nor object');
          }
        } catch (err) {
          const errorMsg = (err && typeof err === 'object' && 'message' in err) ? (err as Error).message : String(err);
          return res.status(400).json({ message: "Invalid analysis JSON", error: errorMsg, received: analysisRaw });
        }
      }

      // 3. Validate the text fields from req.body
      const validationResult = productInputSchema.safeParse(req.body);
      if (!validationResult.success) {
        console.error("Validation failed:", validationResult.error.issues);
        return res.status(400).json({ 
          message: "Invalid input data",
          errors: validationResult.error.issues
        });
      }
      const validatedData = validationResult.data;

      // 4. Prepare the new report object for insertion
      const { productImage: _, ...validatedDataWithoutImage } = validatedData; // Remove base64 image from validated data
      const reportToCreate = {
        ...validatedDataWithoutImage,
        productImage: imageUrl || null, // Use the uploaded image URL, not the base64 data
        analysis: parsedAnalysis,
        costOfGoods: Number(validatedData.costOfGoods) || null,
        retailPrice: Number(validatedData.retailPrice) || null,
        promoPrice: Number(validatedData.promoPrice) || null,
      };
      
      console.log("Final report object productImage:", reportToCreate.productImage);
      console.log("imageUrl variable:", imageUrl);

      // 5. Insert the new record into the reports table using Supabase client
      try {
        const newReport = await storage.createReport(reportToCreate as any);
        res.status(201).json(newReport);
      } catch (dbErr: any) {
        console.error("Database save failed:", dbErr);
        res.status(500).json({ message: "Failed to save report", error: dbErr?.message || dbErr });
      }

    } catch (error: any) {
      console.error("Error creating report:", error);
      res.status(500).json({ message: "Failed to create report", error: error.message });
    }
  });

  // --- All other routes from your original file remain ---

  // Generate product analysis
  app.post("/api/analyze", async (req, res) => {
    try {
      console.log('--- /api/analyze DEBUG ---');
      console.log('req.body keys:', Object.keys(req.body));
      
      // Transform salesChannels from object to array if needed
      if (req.body.salesChannels && typeof req.body.salesChannels === 'object' && !Array.isArray(req.body.salesChannels)) {
        req.body.salesChannels = Object.values(req.body.salesChannels);
      }
      
      const validationResult = productInputSchema.safeParse(req.body);
      if (!validationResult.success) {
        console.log('Validation failed:', validationResult.error.issues);
        return res.status(400).json({ message: "Invalid input data", errors: validationResult.error.issues });
      }
      
      const validatedData = validationResult.data;
      
      // Generate text-based analysis
      const analysis = await generateProductAnalysis(validatedData);
      
      // If there's a base64 image, analyze it and enhance the analysis
      if (validatedData.productImage && validatedData.productImage.startsWith('data:image/')) {
        try {
          // Extract base64 data from data URL
          const base64Data = validatedData.productImage.split(',')[1];
          const imageAnalysis = await analyzeProductImage(base64Data);
          
          // Enhance the analysis with image insights
          (analysis.positioning.visualIdentity as any).imageAnalysis = imageAnalysis;
        } catch (imageError) {
          console.warn('Image analysis failed:', imageError);
          // Continue without image analysis if it fails
        }
      }
      
      res.json(analysis);
    } catch (error) {
      console.error("Error generating analysis:", error);
      res.status(500).json({ message: "Failed to generate analysis" });
    }
  });

  // Generate content ideas
  app.post("/api/generate-content", async (req, res) => {
    try {
      const { reportId } = req.body;
      if (!reportId) return res.status(400).json({ message: "Report ID is required" });
      const report = await storage.getReport(parseInt(reportId));
      if (!report) return res.status(404).json({ message: "Report not found" });
      const contentIdeas = await generateContentIdeas(report);
      res.json(contentIdeas);
    } catch (error) {
      console.error("Error generating content ideas:", error);
      res.status(500).json({ message: "Failed to generate content ideas" });
    }
  });

  // Optimize content selection
  app.post("/api/optimize-content", async (req, res) => {
    try {
      const { reportId, category, selection, context } = req.body;
      if (!reportId || !category || !selection) return res.status(400).json({ message: "Report ID, category, and selection are required" });
      const report = await storage.getReport(parseInt(reportId));
      if (!report) return res.status(404).json({ message: "Report not found" });
      const optimizedContent = await optimizeContent(report, category, selection, context);
      res.json(optimizedContent);
    } catch (error) {
      console.error("Error optimizing content:", error);
      res.status(500).json({ message: "Failed to optimize content" });
    }
  });
  
  // Chat with AI Assistant
  app.post("/api/chat", async (req, res) => {
    try {
      const { message, conversationHistory } = req.body;
      if (!message) return res.status(400).json({ message: "Message is required" });
      const reports = await storage.getReports();
      const chatResponse = await chatWithDatabase(message, conversationHistory || [], reports);
      res.json(chatResponse);
    } catch (error) {
      console.error("Error in chat:", error);
      res.status(500).json({ message: "Failed to process chat message" });
    }
  });

  // Image upload endpoint (for standalone image uploads)
  const httpServer = createServer(app);
  
  return httpServer;
}