import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { productInputSchema } from "@shared/schema";
import { generateProductAnalysis, analyzeProductImage } from "./services/openai";
import { generateReportPDF } from "./services/pdfGenerator";
import multer from "multer";
import { z } from "zod";

// Configure multer for file uploads
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
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid report ID" });
      }

      const report = await storage.getReport(id);
      if (!report) {
        return res.status(404).json({ message: "Report not found" });
      }

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
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid report ID" });
      }

      await storage.deleteReport(id);
      res.json({ message: "Report deleted successfully" });
    } catch (error) {
      console.error("Error deleting report:", error);
      res.status(500).json({ message: "Failed to delete report" });
    }
  });

  // Upload product image
  app.post("/api/upload-image", upload.single('image'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No image file provided" });
      }

      // Convert to base64 for storage/processing
      const base64Image = req.file.buffer.toString('base64');
      const imageUrl = `data:${req.file.mimetype};base64,${base64Image}`;

      // Optionally analyze the image with OpenAI
      let imageAnalysis = "";
      try {
        imageAnalysis = await analyzeProductImage(base64Image);
      } catch (error) {
        console.warn("Image analysis failed:", error instanceof Error ? error.message : String(error));
      }

      res.json({ 
        imageUrl,
        imageAnalysis
      });
    } catch (error) {
      console.error("Error uploading image:", error);
      res.status(500).json({ message: "Failed to upload image" });
    }
  });

  // Generate product analysis
  app.post("/api/analyze", async (req, res) => {
    try {
      // Validate input data
      const validationResult = productInputSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Invalid input data",
          errors: validationResult.error.issues
        });
      }

      const productData = validationResult.data;

      // Generate AI analysis
      const analysis = await generateProductAnalysis(productData);

      res.json(analysis);
    } catch (error) {
      console.error("Error generating analysis:", error);
      res.status(500).json({ message: "Failed to generate analysis" });
    }
  });

  // Save report
  app.post("/api/reports", async (req, res) => {
    try {
      const { productData, analysis } = req.body;

      // Validate product data
      const validationResult = productInputSchema.safeParse(productData);
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Invalid product data",
          errors: validationResult.error.issues
        });
      }

      const reportData = {
        ...validationResult.data,
        costOfGoods: validationResult.data.costOfGoods,
        retailPrice: validationResult.data.retailPrice,
        promoPrice: validationResult.data.promoPrice || null,
        salesChannels: validationResult.data.salesChannels.join(','),
        analysis: analysis
      };

      const report = await storage.createReport(reportData);
      res.json(report);
    } catch (error) {
      console.error("Error saving report:", error);
      res.status(500).json({ message: "Failed to save report" });
    }
  });

  // Download report as PDF
  app.get("/api/reports/:id/pdf", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid report ID" });
      }

      const report = await storage.getReport(id);
      if (!report) {
        return res.status(404).json({ message: "Report not found" });
      }

      const pdfBuffer = await generateReportPDF(report);
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${report.productName}-analysis.pdf"`);
      res.send(pdfBuffer);
    } catch (error) {
      console.error("Error generating PDF:", error);
      res.status(500).json({ message: "Failed to generate PDF" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
