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

interface ContentIdeas {
  hashtags: {
    trending: string[];
    niche: string[];
    branded: string[];
  };
  captions: {
    engaging: string;
    informative: string;
    promotional: string;
  };
  storylines: {
    problemSolution: string;
    behindTheScenes: string;
    customerStory: string;
    educational: string;
  };
  hooks: {
    question: string;
    statistic: string;
    controversy: string;
    personal: string;
  };
  callToActions: {
    soft: string;
    direct: string;
    urgent: string;
  };
}

export async function generateContentIdeas(reportData: any): Promise<ContentIdeas> {
  const analysis = typeof reportData.analysis === 'string' 
    ? JSON.parse(reportData.analysis) 
    : reportData.analysis;

  const prompt = `
You are a content marketing expert and social media strategist. Based on the following product data and analysis, generate comprehensive content ideas in JSON format.

Product Information:
- Name: ${reportData.productName}
- Category: ${reportData.productCategory}
- Pitch: ${reportData.oneSentencePitch}
- Key Features: ${reportData.keyFeatures}
- Target Audience: ${reportData.targetAudience}
- Competitors: ${reportData.competitors}
- Sales Channels: ${reportData.salesChannels}

Product Analysis Insights:
- Value Proposition: ${analysis?.positioning?.valueProposition || 'Not specified'}
- Target Pain Points: ${analysis?.customerAnalysis?.painPoints?.join(', ') || 'Not specified'}
- Marketing Angles: ${analysis?.goToMarket?.marketingAngles?.map((a: any) => a.angle).join(', ') || 'Not specified'}

Generate content ideas in this exact JSON structure:
{
  "hashtags": {
    "trending": ["array of 8-10 trending hashtags relevant to the product and industry"],
    "niche": ["array of 8-10 niche-specific hashtags for targeted reach"],
    "branded": ["array of 6-8 branded hashtags incorporating product name and category"]
  },
  "captions": {
    "engaging": "An engaging, conversational caption (150-200 words) that tells a story and creates emotional connection",
    "informative": "An informative, educational caption (150-200 words) that highlights product benefits and features",
    "promotional": "A promotional caption (100-150 words) with clear value proposition and call-to-action"
  },
  "storylines": {
    "problemSolution": "A storyline focusing on the problem this product solves and the transformation it provides",
    "behindTheScenes": "A behind-the-scenes storyline about product development, materials, or company story",
    "customerStory": "A customer success story or testimonial-style storyline",
    "educational": "An educational storyline that teaches something valuable related to the product category"
  },
  "hooks": {
    "question": "An intriguing question that makes people want to learn more",
    "statistic": "A compelling statistic or fact related to the problem or industry",
    "controversy": "A thought-provoking or slightly controversial statement that sparks discussion",
    "personal": "A personal, relatable opening that creates instant connection"
  },
  "callToActions": {
    "soft": "A gentle, non-pushy call-to-action that guides users naturally",
    "direct": "A clear, straightforward call-to-action with specific instructions",
    "urgent": "An urgent call-to-action that creates FOMO or time sensitivity"
  }
}

Make sure all content is:
- Tailored specifically to the product and target audience
- SEO-optimized with relevant keywords
- Platform-agnostic but optimized for social media engagement
- Authentic and brand-appropriate
- Action-oriented and conversion-focused
`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
    messages: [
      {
        role: "system",
        content: "You are an expert content marketing strategist specializing in social media and digital marketing. Always respond with valid JSON in the exact format requested."
      },
      {
        role: "user",
        content: prompt
      }
    ],
    response_format: { type: "json_object" },
    temperature: 0.8,
  });

  try {
    const contentIdeas = JSON.parse(response.choices[0].message.content || '{}');
    return contentIdeas;
  } catch (error) {
    throw new Error("Failed to parse content ideas response");
  }
}

export async function optimizeContent(
  reportData: any, 
  category: string, 
  selection: string, 
  context: ContentIdeas
): Promise<{ result: string }> {
  const analysis = typeof reportData.analysis === 'string' 
    ? JSON.parse(reportData.analysis) 
    : reportData.analysis;

  const prompt = `
You are a content optimization expert. Based on the user's selection and the broader context, optimize and improve the selected content piece.

Product Context:
- Name: ${reportData.productName}
- Category: ${reportData.productCategory}
- Target Audience: ${reportData.targetAudience}
- Value Proposition: ${analysis?.positioning?.valueProposition || 'Not specified'}

User Selected:
Category: ${category}
Content: "${selection}"

Context from other generated content:
${JSON.stringify(context, null, 2)}

Please optimize the selected content by:
1. Making it more engaging and compelling
2. Better aligning with the target audience
3. Incorporating insights from the product analysis
4. Enhancing SEO and social media optimization
5. Improving conversion potential

Respond with just the optimized content, not additional explanation.
`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
    messages: [
      {
        role: "system",
        content: "You are a content optimization expert. Provide only the optimized content without explanations or formatting."
      },
      {
        role: "user",
        content: prompt
      }
    ],
    temperature: 0.7,
  });

  return {
    result: response.choices[0].message.content || selection
  };
}
