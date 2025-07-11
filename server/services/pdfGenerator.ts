import { Report } from "@shared/schema";
import puppeteer from "puppeteer";

export interface PDFOptions {
  format?: 'A4' | 'Letter';
  orientation?: 'portrait' | 'landscape';
}

async function fetchImageAsBase64(imageUrl: string): Promise<string | null> {
  try {
    const response = await fetch(imageUrl);
    if (!response.ok) {
      console.warn(`Failed to fetch image: ${imageUrl}`);
      return null;
    }
    
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString('base64');
    
    // Determine MIME type from URL or response headers
    const contentType = response.headers.get('content-type') || 'image/jpeg';
    
    return `data:${contentType};base64,${base64}`;
  } catch (error) {
    console.warn(`Error fetching image ${imageUrl}:`, error);
    return null;
  }
}

export async function generateReportPDF(report: Report, options: PDFOptions = {}): Promise<Buffer> {
  // 1. Data-Parsing Guard Clause
  let parsedReport = { ...report };
  if (typeof report.analysis === 'string') {
    try {
      parsedReport.analysis = JSON.parse(report.analysis);
    } catch (error) {
      console.error('Failed to parse report.analysis JSON string:', error);
      throw new Error('Invalid analysis data format');
    }
  }

  // 3. Address Image Handling - Convert product image to base64 data URI
  let imageDataUri: string | null = null;
  if (parsedReport.productImage) {
    imageDataUri = await fetchImageAsBase64(parsedReport.productImage);
  }

  const browser = await puppeteer.launch({
    headless: true,
    // 2. Simplified Puppeteer Launch Arguments
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage'
    ]
  });

  try {
    const page = await browser.newPage();
    
    // Set viewport for consistent rendering
    await page.setViewport({ width: 794, height: 1123 }); // A4 dimensions in pixels
    
    const htmlContent = generateSimplifiedReportHTML(parsedReport, imageDataUri);
    
    await page.setContent(htmlContent, { 
      waitUntil: 'domcontentloaded',
      timeout: 20000 
    });
    
    // Generate PDF with minimal complexity
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: false,
      displayHeaderFooter: false,
      margin: {
        top: '20mm',
        right: '15mm',
        bottom: '20mm',
        left: '15mm'
      },
      // Optimize for maximum compatibility
      tagged: false,
      timeout: 20000
    });

    return Buffer.from(pdfBuffer);
  } finally {
    await browser.close();
  }
}

function generateSimplifiedReportHTML(report: Report, imageDataUri: string | null = null): string {
  const analysis = report.analysis as any;
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Product Analysis Report - ${report.productName}</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: Arial, sans-serif;
          line-height: 1.4;
          color: #333;
          font-size: 11px;
          background: white;
        }
        
        .container {
          max-width: 100%;
          margin: 0 auto;
          padding: 20px;
        }
        
        .header {
          text-align: center;
          margin-bottom: 30px;
          border-bottom: 2px solid #2563eb;
          padding-bottom: 20px;
        }
        
        .header h1 {
          color: #2563eb;
          font-size: 24px;
          margin-bottom: 10px;
          font-weight: bold;
        }
        
        .header h2 {
          color: #1e40af;
          font-size: 16px;
          margin-bottom: 5px;
        }
        
        .section {
          margin-bottom: 25px;
          page-break-inside: avoid;
        }
        
        .section-title {
          color: #1e40af;
          font-size: 14px;
          font-weight: bold;
          margin-bottom: 10px;
          padding-bottom: 5px;
          border-bottom: 1px solid #e5e7eb;
        }
        
        .product-overview {
          display: flex;
          gap: 20px;
          margin-bottom: 20px;
        }
        
        .product-image {
          flex: 0 0 200px;
          text-align: center;
        }
        
        .product-image img {
          max-width: 100%;
          max-height: 150px;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        
        .product-image-placeholder {
          width: 100%;
          height: 150px;
          background: #f3f4f6;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #6b7280;
          font-size: 12px;
          text-align: center;
          border: 2px dashed #d1d5db;
        }
        
        .product-info {
          flex: 1;
        }
        
        .info-item {
          margin-bottom: 8px;
          padding: 5px 0;
          border-bottom: 1px solid #f3f4f6;
        }
        
        .info-label {
          font-weight: bold;
          color: #374151;
          display: inline-block;
          width: 120px;
        }
        
        .info-value {
          color: #6b7280;
          display: inline-block;
        }
        
        .analysis-section {
          margin-bottom: 20px;
        }
        
        .analysis-title {
          color: #1f2937;
          font-size: 12px;
          font-weight: bold;
          margin-bottom: 8px;
        }
        
        .analysis-content {
          background: #f9fafb;
          padding: 10px;
          border-radius: 4px;
          margin-bottom: 10px;
        }
        
        .list-item {
          margin-bottom: 5px;
          padding-left: 10px;
        }
        
        .swot-grid {
          display: block;
          margin-bottom: 15px;
        }
        
        .swot-item {
          margin-bottom: 10px;
          padding: 8px;
          border-radius: 4px;
        }
        
        .swot-strengths { background: #f0f9ff; border-left: 4px solid #3b82f6; }
        .swot-weaknesses { background: #fef2f2; border-left: 4px solid #ef4444; }
        .swot-opportunities { background: #f0fdf4; border-left: 4px solid #10b981; }
        .swot-threats { background: #fffbeb; border-left: 4px solid #f59e0b; }
        
        .personas {
          margin-bottom: 15px;
        }
        
        .persona {
          background: #f8fafc;
          padding: 10px;
          margin-bottom: 10px;
          border-radius: 4px;
          border-left: 4px solid #6366f1;
        }
        
        .persona-name {
          font-weight: bold;
          color: #1e40af;
          margin-bottom: 5px;
        }
        
        .marketing-angles {
          margin-bottom: 15px;
        }
        
        .marketing-angle {
          background: #faf5ff;
          padding: 10px;
          margin-bottom: 8px;
          border-radius: 4px;
          border-left: 4px solid #8b5cf6;
        }
        
        .page-break {
          page-break-before: always;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Product Analysis Report</h1>
          <h2>${report.productName}</h2>
          <p>Generated on ${new Date().toLocaleDateString()}</p>
        </div>

        <div class="section">
          <div class="section-title">Product Overview</div>
          <div class="product-overview">
            <div class="product-image">
              ${imageDataUri 
                ? `<img src="${imageDataUri}" alt="${report.productName}" />` 
                : `<div class="product-image-placeholder">
                     <div>
                       <div style="margin-bottom: 5px;">📷 Product Image</div>
                       <div style="font-size: 10px; color: #9ca3af;">No image available</div>
                     </div>
                   </div>`
              }
            </div>
            <div class="product-info">
              <div class="info-item">
                <span class="info-label">Category:</span>
                <span class="info-value">${report.productCategory}</span>
              </div>
              <div class="info-item">
                <span class="info-label">One-line Pitch:</span>
                <span class="info-value">${report.oneSentencePitch}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Key Features:</span>
                <span class="info-value">${report.keyFeatures}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Target Audience:</span>
                <span class="info-value">${report.targetAudience}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Cost of Goods:</span>
                <span class="info-value">$${report.costOfGoods}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Retail Price:</span>
                <span class="info-value">$${report.retailPrice}</span>
              </div>
              ${report.promoPrice ? `
              <div class="info-item">
                <span class="info-label">Promo Price:</span>
                <span class="info-value">$${report.promoPrice}</span>
              </div>
              ` : ''}
            </div>
          </div>
        </div>

        ${analysis?.customerAnalysis ? `
        <div class="section">
          <div class="section-title">Customer & Problem Analysis</div>
          
          ${analysis.customerAnalysis.painPoints ? `
          <div class="analysis-section">
            <div class="analysis-title">Pain Points:</div>
            <div class="analysis-content">
              ${analysis.customerAnalysis.painPoints.map((point: string) => `
                <div class="list-item">• ${point}</div>
              `).join('')}
            </div>
          </div>
          ` : ''}

          ${analysis.customerAnalysis.personas ? `
          <div class="analysis-section">
            <div class="analysis-title">Target Personas:</div>
            <div class="personas">
              ${analysis.customerAnalysis.personas.map((persona: any) => `
                <div class="persona">
                  <div class="persona-name">${persona.name}</div>
                  <div>${persona.description}</div>
                  <div style="font-size: 10px; color: #6b7280; margin-top: 5px;">${persona.demographics}</div>
                </div>
              `).join('')}
            </div>
          </div>
          ` : ''}
        </div>
        ` : ''}

        ${analysis?.positioning ? `
        <div class="section">
          <div class="section-title">Product Positioning</div>
          
          ${analysis.positioning.usp ? `
          <div class="analysis-section">
            <div class="analysis-title">Unique Selling Proposition:</div>
            <div class="analysis-content">
              ${analysis.positioning.usp}
            </div>
          </div>
          ` : ''}
        </div>
        ` : ''}

        ${analysis?.marketAnalysis ? `
        <div class="section page-break">
          <div class="section-title">Market Analysis</div>
          
          ${analysis.marketAnalysis.swot ? `
          <div class="analysis-section">
            <div class="analysis-title">SWOT Analysis:</div>
            <div class="swot-grid">
              ${analysis.marketAnalysis.swot.strengths ? `
              <div class="swot-item swot-strengths">
                <div style="font-weight: bold; margin-bottom: 5px;">Strengths:</div>
                ${analysis.marketAnalysis.swot.strengths.map((item: string) => `
                  <div class="list-item">• ${item}</div>
                `).join('')}
              </div>
              ` : ''}
              
              ${analysis.marketAnalysis.swot.weaknesses ? `
              <div class="swot-item swot-weaknesses">
                <div style="font-weight: bold; margin-bottom: 5px;">Weaknesses:</div>
                ${analysis.marketAnalysis.swot.weaknesses.map((item: string) => `
                  <div class="list-item">• ${item}</div>
                `).join('')}
              </div>
              ` : ''}
              
              ${analysis.marketAnalysis.swot.opportunities ? `
              <div class="swot-item swot-opportunities">
                <div style="font-weight: bold; margin-bottom: 5px;">Opportunities:</div>
                ${analysis.marketAnalysis.swot.opportunities.map((item: string) => `
                  <div class="list-item">• ${item}</div>
                `).join('')}
              </div>
              ` : ''}
              
              ${analysis.marketAnalysis.swot.threats ? `
              <div class="swot-item swot-threats">
                <div style="font-weight: bold; margin-bottom: 5px;">Threats:</div>
                ${analysis.marketAnalysis.swot.threats.map((item: string) => `
                  <div class="list-item">• ${item}</div>
                `).join('')}
              </div>
              ` : ''}
            </div>
          </div>
          ` : ''}
        </div>
        ` : ''}

        ${analysis?.goToMarket ? `
        <div class="section">
          <div class="section-title">Go-to-Market Strategy</div>
          
          ${analysis.goToMarket.marketingAngles ? `
          <div class="analysis-section">
            <div class="analysis-title">Marketing Angles:</div>
            <div class="marketing-angles">
              ${analysis.goToMarket.marketingAngles.map((angle: any) => `
                <div class="marketing-angle">
                  <div style="font-weight: bold; margin-bottom: 5px;">${angle.angle}:</div>
                  <div>${angle.message}</div>
                </div>
              `).join('')}
            </div>
          </div>
          ` : ''}

          ${analysis.goToMarket.channelStrategy ? `
          <div class="analysis-section">
            <div class="analysis-title">Channel Strategy:</div>
            <div class="analysis-content">
              ${analysis.goToMarket.channelStrategy.map((channel: string) => `
                <div class="list-item">• ${channel}</div>
              `).join('')}
            </div>
          </div>
          ` : ''}
        </div>
        ` : ''}

      </div>
    </body>
    </html>
  `;
}
