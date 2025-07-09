import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || ""
});

interface ProductData {
  productName: string;
  productCategory: string;
  oneSentencePitch: string;
  keyFeatures: string;
  costOfGoods: string;
  retailPrice: string;
  promoPrice?: string;
  materials: string;
  variants?: string;
  targetAudience: string;
  competitors: string;
  salesChannels: string[];
  productImage?: string;
}

interface AnalysisResult {
  customerAnalysis: {
    painPoints: string[];
    blacAnalysis: {
      background: string;
      learning: string;
      action: string;
      challenge: string;
    };
    personas: Array<{
      name: string;
      description: string;
      demographics: string;
    }>;
    minimumViableSegment: string;
  };
  positioning: {
    usp: string;
    valueProposition: string;
    visualIdentity: {
      colorPalette: string;
      typography: string;
      packaging: string;
      brandImpression: string;
    };
  };
  marketAnalysis: {
    swot: {
      strengths: string[];
      weaknesses: string[];
      opportunities: string[];
      threats: string[];
    };
    competitiveAdvantage: string;
    pricingStrategy: string;
  };
  goToMarket: {
    marketingAngles: Array<{
      angle: string;
      message: string;
    }>;
    channelStrategy: string[];
    contentIdeas: string[];
    productDescriptions: Array<{
      tone: string;
      description: string;
    }>;
  };
}

export async function generateProductAnalysis(productData: ProductData): Promise<AnalysisResult> {
  const prompt = `
You are an expert product analyst and marketing strategist. Analyze the following product data and provide a comprehensive analysis in JSON format.

Product Data:
- Name: ${productData.productName}
- Category: ${productData.productCategory}
- Pitch: ${productData.oneSentencePitch}
- Key Features: ${productData.keyFeatures}
- Cost of Goods: $${productData.costOfGoods}
- Retail Price: $${productData.retailPrice}
- Promo Price: ${productData.promoPrice ? `$${productData.promoPrice}` : 'Not specified'}
- Materials: ${productData.materials}
- Variants: ${productData.variants || 'Not specified'}
- Target Audience: ${productData.targetAudience}
- Competitors: ${productData.competitors}
- Sales Channels: ${productData.salesChannels.join(', ')}

Please provide a detailed analysis in the following JSON structure:
{
  "customerAnalysis": {
    "painPoints": ["list of 3-5 key pain points this product addresses"],
    "blacAnalysis": {
      "background": "detailed background analysis",
      "learning": "key learnings from market research",
      "action": "recommended actions",
      "challenge": "main challenges to address"
    },
    "personas": [
      {
        "name": "Primary Persona Name",
        "description": "detailed persona description",
        "demographics": "age, income, lifestyle details"
      },
      {
        "name": "Secondary Persona Name", 
        "description": "detailed persona description",
        "demographics": "age, income, lifestyle details"
      }
    ],
    "minimumViableSegment": "description of the most viable initial market segment"
  },
  "positioning": {
    "usp": "clear unique selling proposition",
    "valueProposition": "compelling value proposition statement",
    "visualIdentity": {
      "colorPalette": "analysis of color choices and brand impact",
      "typography": "typography and font impression analysis",
      "packaging": "packaging design critique and suggestions",
      "brandImpression": "overall brand impression and positioning"
    }
  },
  "marketAnalysis": {
    "swot": {
      "strengths": ["3-4 key strengths"],
      "weaknesses": ["3-4 key weaknesses"], 
      "opportunities": ["3-4 key opportunities"],
      "threats": ["3-4 key threats"]
    },
    "competitiveAdvantage": "detailed competitive advantage analysis",
    "pricingStrategy": "pricing strategy analysis and recommendations"
  },
  "goToMarket": {
    "marketingAngles": [
      {
        "angle": "Efficiency Hook",
        "message": "specific marketing message"
      },
      {
        "angle": "Cost Savings",
        "message": "specific marketing message"
      },
      {
        "angle": "Innovation Angle", 
        "message": "specific marketing message"
      }
    ],
    "channelStrategy": ["recommended marketing channels"],
    "contentIdeas": ["specific content creation ideas"],
    "productDescriptions": [
      {
        "tone": "Professional",
        "description": "professional tone product description"
      },
      {
        "tone": "Conversational",
        "description": "conversational tone product description"
      },
      {
        "tone": "Benefit-Focused",
        "description": "benefit-focused tone product description"
      }
    ]
  }
}

Ensure all analysis is specific, actionable, and tailored to the provided product data.
`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert product analyst and marketing strategist. Provide detailed, actionable analysis in JSON format."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: 4000
    });

    const analysis = JSON.parse(response.choices[0].message.content || "{}");
    return analysis as AnalysisResult;
  } catch (error) {
    throw new Error(`Failed to generate analysis: ${error.message}`);
  }
}

export async function analyzeProductImage(base64Image: string): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Analyze this product image for visual identity, packaging design, color palette, and overall brand impression. Provide detailed insights about the visual elements and their marketing impact."
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`
              }
            }
          ],
        },
      ],
      max_tokens: 500,
    });

    return response.choices[0].message.content || "";
  } catch (error) {
    throw new Error(`Failed to analyze image: ${error.message}`);
  }
}
