import 'dotenv/config';
import OpenAI from "openai";
import memoizee from 'memoizee';

// --- LAZY INITIALIZATION FOR THE OPENAI CLIENT ---
// This function creates the OpenAI client instance only when it's first called.
// memoizee ensures it only ever runs once, and subsequent calls get the same instance.
const getOpenAIClient = memoizee(() => {
  console.log("Attempting to initialize OpenAI client...");
  
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    // This check is crucial. It will now happen at the right time.
    console.error("FATAL: OPENAI_API_KEY environment variable is not set.");
    throw new Error("OPENAI_API_KEY is not configured in the environment.");
  }
  
  console.log("OpenAI API Key found. Client created successfully.");
  return new OpenAI({ apiKey });
});


// --- INTERFACE DEFINITIONS ---

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
    customerNeedsFramework: {
      blatantNeeds: string[];
      latentNeeds: string[];
      aspirationalNeeds: string[];
      criticalNeeds: string[];
    };
    personas: Array<{
      name: string;
      description: string;
      demographics: string;
      jobsToBeDone: {
        functional: string;
        emotional: string;
        social: string;
      };
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
      abTestingIdeas: string[];
    };
  };
  marketAnalysis: {
    swot: {
      strengths: string[];
      weaknesses: string[];
      opportunities: string[];
      threats: string[];
    };
    towsMatrix: {
      soStrategies: string[];
      woStrategies: string[];
      stStrategies: string[];
      wtStrategies: string[];
    };
    competitiveAdvantage: string;
    pricingStrategy: string;
    perceivedValueAnalysis: string;
  };
  goToMarket: {
    marketingAngles: Array<{
      angle: string;
      message: string;
      funnelStage: 'TOFU' | 'MOFU' | 'BOFU';
    }>;
    channelStrategy: string[];
    contentIdeas: string[];
    productDescriptions: Array<{
      tone: string;
      description: string;
      framework: 'Hook-Story-Offer';
    }>;
  };
}

interface ContentIdeas {
  hashtags: {
    awareness: string[];
    communityBuilding: string[];
    conversionFocused: string[];
  };
  captions: {
    engaging: {
      content: string;
      abTestHooks: string[];
    };
    informative: {
      content: string;
      abTestHooks: string[];
    };
    promotional: {
      content: string;
      abTestHooks: string[];
    };
  };
  storylines: {
    problemSolution: {
      content: string;
      contentPillar: string;
    };
    behindTheScenes: {
      content: string;
      contentPillar: string;
    };
    customerStory: {
      content: string;
      contentPillar: string;
    };
    educational: {
      content: string;
      contentPillar: string;
    };
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

interface ChatMessage {
  id?: string;
  type: 'user' | 'bot';
  content: string;
  timestamp?: Date;
  relatedReports?: number[];
}

// --- API FUNCTIONS ---

export async function generateProductAnalysis(productData: ProductData): Promise<AnalysisResult> {
  const openai = getOpenAIClient(); // Get the initialized client
  const prompt = `
You are a Senior Product Marketing Strategist with 15+ years of experience in product positioning, customer psychology, and go-to-market strategy. Your analysis should be insightful, forward-thinking, and data-driven, while remaining clear and actionable.

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

Provide a comprehensive strategic analysis in the following JSON structure:
{
  "customerAnalysis": {
    "painPoints": ["list of 3-5 key pain points with emotional depth and context"],
    "customerNeedsFramework": {
      "blatantNeeds": ["3-4 obvious, recognized needs the customer actively seeks to solve"],
      "latentNeeds": ["3-4 unspoken needs the customer isn't aware of but will value once surfaced"],
      "aspirationalNeeds": ["3-4 hopes and goals related to the customer's identity or future self"],
      "criticalNeeds": ["3-4 mission-essential requirements where failure has serious consequences"]
    },
    "personas": [
      {
        "name": "Primary Persona Name",
        "description": "detailed persona description with psychological insights",
        "demographics": "age, income, lifestyle, values, and behavioral patterns",
        "jobsToBeDone": {
          "functional": "the practical job this persona hires the product to accomplish",
          "emotional": "the emotional outcome this persona seeks from using the product",
          "social": "how this persona wants to be perceived by others through product use"
        }
      },
      {
        "name": "Secondary Persona Name",
        "description": "detailed persona description with psychological insights",
        "demographics": "age, income, lifestyle, values, and behavioral patterns",
        "jobsToBeDone": {
          "functional": "the practical job this persona hires the product to accomplish",
          "emotional": "the emotional outcome this persona seeks from using the product",
          "social": "how this persona wants to be perceived by others through product use"
        }
      }
    ],
    "minimumViableSegment": "detailed description of the most viable initial market segment with strategic rationale"
  },
  "positioning": {
    "usp": "compelling unique selling proposition that differentiates from competitors",
    "valueProposition": "clear value proposition that connects features to customer outcomes",
    "visualIdentity": {
      "colorPalette": "strategic analysis of color psychology and brand impact",
      "typography": "typography analysis focused on brand perception and readability",
      "packaging": "packaging design analysis with shelf appeal and user experience insights",
      "brandImpression": "overall brand impression analysis with strategic recommendations",
      "abTestingIdeas": [
        "Specific A/B test idea for visual elements (e.g., 'Test current green packaging against minimalist white design for higher ad CTR')",
        "Another actionable A/B test suggestion for different visual aspect",
        "Third A/B test idea focusing on typography or layout elements"
      ]
    }
  },
  "marketAnalysis": {
    "swot": {
      "strengths": ["3-4 key internal strengths with strategic implications"],
      "weaknesses": ["3-4 internal weaknesses that need addressing"],
      "opportunities": ["3-4 external opportunities in the market"],
      "threats": ["3-4 external threats to monitor"]
    },
    "towsMatrix": {
      "soStrategies": ["2-3 strategies that use Strengths to capitalize on Opportunities"],
      "woStrategies": ["2-3 strategies that address Weaknesses to capture Opportunities"],
      "stStrategies": ["2-3 strategies that use Strengths to counter Threats"],
      "wtStrategies": ["2-3 strategies that address Weaknesses and avoid Threats"]
    },
    "competitiveAdvantage": "detailed analysis of sustainable competitive advantages",
    "pricingStrategy": "strategic pricing analysis with market positioning insights",
    "perceivedValueAnalysis": "analysis of how to increase perceived value to justify premium pricing"
  },
  "goToMarket": {
    "marketingAngles": [
      {
        "angle": "Efficiency Hook",
        "message": "compelling marketing message for this angle",
        "funnelStage": "TOFU"
      },
      {
        "angle": "Cost Savings",
        "message": "compelling marketing message for this angle",
        "funnelStage": "MOFU"
      },
      {
        "angle": "Premium Quality",
        "message": "compelling marketing message for this angle",
        "funnelStage": "BOFU"
      }
    ],
    "channelStrategy": ["strategic channel recommendations with rationale"],
    "contentIdeas": ["specific, actionable content creation ideas"],
    "productDescriptions": [
      {
        "tone": "Professional",
        "description": "Hook-Story-Offer framework description in professional tone",
        "framework": "Hook-Story-Offer"
      },
      {
        "tone": "Conversational",
        "description": "Hook-Story-Offer framework description in conversational tone",
        "framework": "Hook-Story-Offer"
      },
      {
        "tone": "Benefit-Focused",
        "description": "Hook-Story-Offer framework description focusing on benefits",
        "framework": "Hook-Story-Offer"
      }
    ]
  }
}

Make your analysis strategic, specific, and actionable. Focus on psychological insights, market dynamics, and competitive positioning. Each section should provide both analysis and strategic recommendations.
`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a Senior Product Marketing Strategist with deep expertise in customer psychology, market positioning, and strategic business analysis. Provide insightful, forward-thinking analysis that combines data-driven insights with strategic vision."
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
    let message = "Unknown error";
    if (error instanceof Error) {
      message = error.message;
    } else if (typeof error === "string") {
      message = error;
    }
    throw new Error(`Failed to generate analysis: ${message}`);
  }
}

export async function analyzeProductImage(base64Image: string): Promise<string> {
  const openai = getOpenAIClient(); // Get the initialized client
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a Senior Product Marketing Strategist specializing in visual branding and conversion optimization. Provide strategic insights with actionable A/B testing recommendations."
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Analyze this product image from a strategic marketing perspective. Focus on visual identity, packaging design, color psychology, and brand impression. Most importantly, provide specific A/B testing ideas for improving conversion rates through visual optimization. Structure your analysis to include: 1) Current visual assessment, 2) Psychological impact analysis, 3) At least 3 specific A/B testing recommendations with expected outcomes."
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
      max_tokens: 800,
      temperature: 0.7,
    });

    return response.choices[0].message.content || "";
  } catch (error) {
    let message = "Unknown error";
    if (error instanceof Error) {
      message = error.message;
    } else if (typeof error === "string") {
      message = error;
    }
    throw new Error(`Failed to analyze image: ${message}`);
  }
}

export async function generateContentIdeas(reportData: any): Promise<ContentIdeas> {
  const openai = getOpenAIClient(); // Get the initialized client
  const analysis = typeof reportData.analysis === 'string' 
    ? JSON.parse(reportData.analysis) 
    : reportData.analysis;

  const prompt = `
You are a Senior Content Marketing Strategist with expertise in social media psychology, conversion optimization, and brand storytelling. Create comprehensive content strategies that drive engagement and conversions.

Product Information:
- Name: ${reportData.productName}
- Category: ${reportData.productCategory}
- Pitch: ${reportData.oneSentencePitch}
- Key Features: ${reportData.keyFeatures}
- Target Audience: ${reportData.targetAudience}
- Competitors: ${reportData.competitors}
- Sales Channels: ${reportData.salesChannels}

Strategic Insights:
- Value Proposition: ${analysis?.positioning?.valueProposition || 'Not specified'}
- Target Pain Points: ${analysis?.customerAnalysis?.painPoints?.join(', ') || 'Not specified'}
- Marketing Angles: ${analysis?.goToMarket?.marketingAngles?.map((a: any) => a.angle).join(', ') || 'Not specified'}

Generate advanced content strategy in this exact JSON structure:
{
  "hashtags": {
    "awareness": ["8-10 hashtags for top-of-funnel awareness and discovery"],
    "communityBuilding": ["8-10 hashtags for building engaged communities and fostering discussions"],
    "conversionFocused": ["8-10 hashtags that drive purchase intent and conversions"]
  },
  "captions": {
    "engaging": {
      "content": "Story-driven caption that creates emotional connection (150-200 words)",
      "abTestHooks": [
        "Hook variation A: Question-based opening",
        "Hook variation B: Personal story opening"
      ]
    },
    "informative": {
      "content": "Educational caption highlighting product benefits and features (150-200 words)",
      "abTestHooks": [
        "Hook variation A: Problem-focused opening",
        "Hook variation B: Benefit-focused opening"
      ]
    },
    "promotional": {
      "content": "Conversion-focused caption with clear value proposition and CTA (100-150 words)",
      "abTestHooks": [
        "Hook variation A: Urgency-based opening",
        "Hook variation B: Value-focused opening"
      ]
    }
  },
  "storylines": {
    "problemSolution": {
      "content": "Storyline focusing on problem transformation and solution benefits",
      "contentPillar": "Education"
    },
    "behindTheScenes": {
      "content": "Behind-the-scenes storyline about product development or company values",
      "contentPillar": "Authenticity"
    },
    "customerStory": {
      "content": "Customer success story or testimonial-style storyline",
      "contentPillar": "Social Proof"
    },
    "educational": {
      "content": "Educational storyline that teaches valuable insights related to product category",
      "contentPillar": "Expertise"
    }
  },
  "hooks": {
    "question": "Intriguing question that creates curiosity and engagement",
    "statistic": "Compelling statistic or fact that captures attention",
    "controversy": "Thought-provoking statement that sparks discussion",
    "personal": "Personal, relatable opening that creates instant connection"
  },
  "callToActions": {
    "soft": "Gentle, relationship-building CTA that guides users naturally",
    "direct": "Clear, action-oriented CTA with specific instructions",
    "urgent": "FOMO-driven CTA that creates time sensitivity and urgency"
  }
}

Ensure all content is:
- Strategically aligned with the product's positioning and customer psychology
- Optimized for maximum engagement and conversion potential
- Tailored to the specific target audience and their behavioral patterns
- Designed for A/B testing to optimize performance
- Authentic to the brand voice while being psychologically compelling
`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: "You are a Senior Content Marketing Strategist specializing in social media psychology, conversion optimization, and strategic content planning. Always respond with valid JSON in the exact format requested."
      },
      {
        role: "user",
        content: prompt
      }
    ],
    response_format: { type: "json_object" },
    temperature: 0.8,
    max_tokens: 3000,
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
): Promise<{ result: string; optimizationFocus: string }> {
  const openai = getOpenAIClient(); // Get the initialized client
  const analysis = typeof reportData.analysis === 'string' 
    ? JSON.parse(reportData.analysis) 
    : reportData.analysis;

  const prompt = `
You are a Senior Content Optimization Strategist with expertise in conversion copywriting, SEO, and psychological persuasion. Your task is to transform content using advanced optimization techniques.

PRODUCT CONTEXT:
- Product Name: ${reportData.productName}
- Product Category: ${reportData.productCategory}
- Key Features: ${reportData.keyFeatures || 'Not specified'}
- Target Audience: ${reportData.targetAudience}
- One-line Pitch: ${reportData.oneSentencePitch || 'Not specified'}
- Unique Selling Proposition: ${analysis?.positioning?.usp || 'Not specified'}
- Customer Pain Points: ${analysis?.customerAnalysis?.painPoints?.join(', ') || 'Not specified'}

ORIGINAL CONTENT TO OPTIMIZE:
"${selection}"

OPTIMIZATION MISSION:
Transform this content using our 4-step strategic algorithm, then clearly state your optimization focus.

STEP 1: STRATEGIC ANALYSIS
- Identify the current content's strengths and weaknesses
- Analyze the psychological triggers and conversion elements
- Determine the most impactful optimization opportunity

STEP 2: KEYWORD & SEARCH INTENT OPTIMIZATION
- Research customer search behavior for this product category
- Identify high-intent keywords that customers actually use
- Integrate keywords naturally without compromising readability

STEP 3: CONVERSION PSYCHOLOGY INTEGRATION
Apply proven frameworks:
- AIDA (Attention, Interest, Desire, Action) for awareness content
- PAS (Problem, Agitate, Solution) for problem-focused content
- Hook-Story-Offer for product descriptions
- Social proof and urgency elements where appropriate

STEP 4: STRATEGIC POLISH
- Ensure the content aligns with the brand voice and positioning
- Optimize for the specific platform and audience behavior
- Add psychological triggers that drive action
- Test emotional resonance and logical flow

OUTPUT REQUIREMENTS:
1. Provide the optimized content (ready to copy/paste)
2. State your primary optimization focus in one clear sentence

OPTIMIZATION FOCUS OPTIONS:
- "SEO Keyword Density and Search Visibility"
- "Emotional Impact and Brand Storytelling"
- "Conversion Rate and Purchase Intent"
- "Readability and User Engagement"
- "Social Proof and Trust Building"
- "Urgency and FOMO Psychology"

Be strategic, psychology-driven, and conversion-focused.
`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: "You are a Senior Content Optimization Strategist specializing in conversion copywriting, SEO psychology, and strategic persuasion. Follow the 4-step algorithm and always specify your optimization focus."
      },
      {
        role: "user",
        content: prompt
      }
    ],
    temperature: 0.7,
    max_tokens: 1000,
  });

  const fullResponse = response.choices[0].message.content || selection;
  
  // Extract optimization focus and optimized content
  const focusMatch = fullResponse.match(/(?:I have optimized|Optimized for|Focus:|Primary optimization:)\s*([^.\n]+)/i);
  const optimizationFocus = focusMatch ? focusMatch[1].trim() : "Content Enhancement and Engagement";
  
  // Extract the actual optimized content (remove any explanatory text)
  const contentMatch = fullResponse.match(/(?:OPTIMIZED CONTENT:|Here's the optimized content:)?\s*"([^"]+)"/i) || 
                       fullResponse.match(/(?:OPTIMIZED CONTENT:|Here's the optimized content:)?\s*([^"]+)$/i);
  
  const optimizedContent = contentMatch ? contentMatch[1].trim() : fullResponse;

  return {
    result: optimizedContent,
    optimizationFocus: optimizationFocus
  };
}

export async function chatWithDatabase(
  userMessage: string,
  conversationHistory: ChatMessage[],
  allReports: any[]
): Promise<{ message: string; relatedReports: number[] }> {
  const openai = getOpenAIClient(); // Get the initialized client
  
  // Ensure conversationHistory is always an array
  const safeConversationHistory = Array.isArray(conversationHistory) ? conversationHistory : [];
  
  const databaseContext = {
    totalReports: allReports.length,
    products: allReports.map(report => ({
      id: report.id,
      name: report.productName,
      category: report.productCategory,
      retailPrice: report.retailPrice,
      costOfGoods: report.costOfGoods,
      targetAudience: report.targetAudience,
      competitors: report.competitors,
      salesChannels: report.salesChannels,
      analysis: report.analysis
    }))
  };

  const historyContext = safeConversationHistory
    .slice(-5)
    .map(msg => `${msg.type}: ${msg.content}`)
    .join('\n');

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: `You are a Senior Business Intelligence AI Assistant with a friendly, encouraging, and proactive personality. You're like having a experienced marketing strategist as your personal advisor who's genuinely excited to help you succeed.

PERSONALITY TRAITS:
- Conversational and warm (use phrases like "That's a great question!" or "I'm seeing something interesting here...")
- Proactive with strategic insights (always offer unsolicited value beyond the basic question)
- Encouraging and supportive (celebrate wins and frame challenges as opportunities)
- Strategic and analytical (frame all data within business context and strategic implications)

DATABASE CONTEXT:
${JSON.stringify(databaseContext, null, 2)}

CONVERSATION HISTORY:
${historyContext}

YOUR CAPABILITIES:
- Analyze product performance and identify strategic opportunities
- Compare products across multiple dimensions (pricing, positioning, customer segments)
- Identify market trends and patterns across your product portfolio
- Provide actionable strategic recommendations based on your data
- Explain complex business concepts in simple, friendly terms
- Suggest specific next steps and implementation strategies

RESPONSE GUIDELINES:
1. Start with an encouraging, conversational tone
2. Answer the direct question thoroughly
3. ALWAYS provide a strategic insight or proactive recommendation
4. Reference specific products by name when relevant
5. Frame data within strategic business context
6. Suggest concrete next steps when appropriate
7. End with an encouraging note or follow-up question

EXAMPLE RESPONSE STYLE:
"That's a great question! Looking at your data for [Product Name], I can see that [direct answer]. 

What's particularly interesting is [strategic insight]. Based on the analysis, I'd recommend [specific action] because [reasoning].

Have you considered [proactive suggestion]? This could be a game-changer for your [specific business area]."

RESPONSE FORMAT:
Always respond with JSON in this exact format:
{
  "message": "Your friendly, strategic response here",
  "relatedReports": [array of relevant report IDs]
}`
      },
      {
        role: "user",
        content: userMessage
      }
    ],
    response_format: { type: "json_object" },
    temperature: 0.8,
    max_tokens: 1000,
  });

  try {
    const result = JSON.parse(response.choices[0].message.content || '{}');
    return {
      message: result.message || "I'm sorry, I couldn't process that request.",
      relatedReports: result.relatedReports || []
    };
  } catch (error) {
    let message = "Unknown error";
    if (error instanceof Error) {
      message = error.message;
    } else if (typeof error === "string") {
      message = error;
    }
    console.error("Error parsing chat response:", message);
    return {
      message: "I'm sorry, I encountered an error processing your request. Please try again.",
      relatedReports: []
    };
  }
}