import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Bot, Save, Download, ChevronDown, Copy, Check, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { ProductInput } from "@shared/schema";

interface AnalysisPanelProps {
  analysis: any;
  productData: ProductInput | null;
  onAnalysisChange: (analysis: any) => void;
}

export default function AnalysisPanel({ analysis, productData, onAnalysisChange }: AnalysisPanelProps) {
  const [openSections, setOpenSections] = useState({
    customer: true,
    positioning: false,
    market: false,
    gtm: false,
  });
  const [copiedItems, setCopiedItems] = useState<string[]>([]);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const saveReportMutation = useMutation({
    mutationFn: async () => {
      if (!analysis || !productData) throw new Error("No analysis or product data");
      
      const response = await apiRequest("POST", "/api/reports", {
        productData,
        analysis
      });
      return response.json();
    },
    onSuccess: () => {
      setSaveStatus('saved');
      queryClient.invalidateQueries({ queryKey: ["/api/reports"] });
      toast({
        title: "Success",
        description: `Report for ${productData?.productName} saved!`,
      });
      
      // Reset save status after 3 seconds
      setTimeout(() => {
        setSaveStatus('idle');
      }, 3000);
    },
    onError: (error) => {
      setSaveStatus('idle');
      toast({
        title: "Error",
        description: "Failed to save report. Please try again.",
        variant: "destructive",
      });
    },
  });

  const downloadPDFMutation = useMutation({
    mutationFn: async () => {
      if (!analysis || !productData) throw new Error("No analysis or product data");
      
      // First save the report to get an ID, then download PDF
      const saveResponse = await apiRequest("POST", "/api/reports", {
        productData,
        analysis
      });
      const report = await saveResponse.json();
      
      // Download PDF
      const response = await fetch(`/api/reports/${report.id}/pdf`);
      if (!response.ok) throw new Error("Failed to download PDF");
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${productData.productName}-analysis.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reports"] });
      toast({
        title: "Success",
        description: "PDF downloaded successfully!",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to download PDF. Please try again.",
        variant: "destructive",
      });
    },
  });

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedItems(prev => [...prev, id]);
      toast({
        title: "Copied",
        description: "Content copied to clipboard",
      });
      
      setTimeout(() => {
        setCopiedItems(prev => prev.filter(item => item !== id));
      }, 2000);
    } catch (error) {
      toast({
        title: "Error", 
        description: "Failed to copy to clipboard",
        variant: "destructive",
      });
    }
  };

  const handleSaveReport = () => {
    setSaveStatus('saving');
    saveReportMutation.mutate();
  };

  // LocalStorage keys
  const ANALYSIS_KEY = "analyzer_analysis";
  const PRODUCT_KEY = "analyzer_productData";

  // Load from localStorage on mount
  useEffect(() => {
    const savedAnalysis = localStorage.getItem(ANALYSIS_KEY);
    const savedProduct = localStorage.getItem(PRODUCT_KEY);
    if (savedAnalysis) onAnalysisChange(JSON.parse(savedAnalysis));
    // Optionally, you can set productData if you want to persist it too
  }, []);

  // Save to localStorage when analysis or productData changes
  useEffect(() => {
    if (analysis) localStorage.setItem(ANALYSIS_KEY, JSON.stringify(analysis));
    if (productData) localStorage.setItem(PRODUCT_KEY, JSON.stringify(productData));
  }, [analysis, productData]);

  // Refresh handler
  const handleRefresh = () => {
    localStorage.removeItem(ANALYSIS_KEY);
    localStorage.removeItem(PRODUCT_KEY);
    onAnalysisChange(null);
    window.location.reload();
  };

  if (!analysis) {
    return (
      <Card className="h-fit">
        <CardHeader className="border-b border-slate-200 flex flex-row items-center justify-between">
          <CardTitle className="flex items-center">
            <Bot className="text-primary mr-3" />
            AI Analysis Report
          </CardTitle>
          <Button variant="ghost" onClick={handleRefresh} title="Refresh">
            <RefreshCw className="w-5 h-5" />
          </Button>
        </CardHeader>
        
        <CardContent className="p-6">
          <div className="text-center py-12">
            <Bot className="mx-auto h-16 w-16 text-slate-300 mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">Ready for Analysis</h3>
            <p className="text-slate-600">
              Fill out the product details form and click "Analyze Product" to generate your comprehensive analysis report.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getSaveButtonContent = () => {
    switch (saveStatus) {
      case 'saving':
        return (
          <>
            <Save className="w-4 h-4 mr-2 animate-spin" />
            Saving...
          </>
        );
      case 'saved':
        return (
          <>
            <Check className="w-4 h-4 mr-2" />
            Saved ✓
          </>
        );
      default:
        return (
          <>
            <Save className="w-4 h-4 mr-2" />
            Save Report
          </>
        );
    }
  };

  return (
    <Card className="h-fit">
      <CardHeader className="border-b border-slate-200 flex flex-row items-center justify-between">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between w-full">
          <div>
            <CardTitle className="flex items-center">
              <Bot className="text-primary mr-3" />
              AI Analysis Report
            </CardTitle>
            <p className="text-slate-600 text-sm">
              Comprehensive product analysis powered by AI
            </p>
          </div>
          <div className="flex space-x-2 mt-4 sm:mt-0 sm:flex-row flex-col">
            <Button
              onClick={handleSaveReport}
              disabled={saveReportMutation.isPending || saveStatus === 'saved'}
              className={cn(
                "bg-emerald-500 hover:bg-emerald-600",
                saveStatus === 'saved' && "bg-gray-400 hover:bg-gray-400"
              )}
            >
              {getSaveButtonContent()}
            </Button>
            <Button
              variant="secondary"
              onClick={() => downloadPDFMutation.mutate()}
              disabled={downloadPDFMutation.isPending || !analysis || !productData}
              className="mt-2 sm:mt-0"
            >
              <Download className="w-4 h-4 mr-2" />
              {downloadPDFMutation.isPending ? "Generating..." : "Download PDF"}
            </Button>
          </div>
        </div>
        <Button variant="ghost" onClick={handleRefresh} title="Refresh">
          <RefreshCw className="w-5 h-5" />
        </Button>
      </CardHeader>
      
      <CardContent className="p-6">
        <div className="space-y-4">
          
          {/* Customer & Problem Analysis */}
          {analysis.customerAnalysis && (
            <Collapsible
              open={openSections.customer}
              onOpenChange={() => toggleSection('customer')}
            >
              <div className="border border-slate-200 rounded-lg">
                <CollapsibleTrigger className="w-full px-4 py-3 text-left bg-primary-50 hover:bg-primary-100 rounded-t-lg border-b border-slate-200 flex items-center justify-between">
                  <span className="font-medium text-slate-900">Customer & Problem Analysis</span>
                  <ChevronDown className={cn(
                    "text-slate-400 transition-transform",
                    openSections.customer && "transform rotate-180"
                  )} />
                </CollapsibleTrigger>
                <CollapsibleContent className="p-4 space-y-4">
                  {analysis.customerAnalysis.painPoints && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-slate-900">Identified Pain Points</h4>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(
                            analysis.customerAnalysis.painPoints.join('\n'), 
                            'pain-points'
                          )}
                        >
                          {copiedItems.includes('pain-points') ? 
                            <Check className="w-4 h-4 text-green-600" /> : 
                            <Copy className="w-4 h-4" />
                          }
                        </Button>
                      </div>
                      <ul className="list-disc list-inside space-y-1 text-slate-700">
                        {analysis.customerAnalysis.painPoints.map((point: string, index: number) => (
                          <li key={index}>{point}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {analysis.customerAnalysis.blacAnalysis && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-slate-900">Problem Deep Dive (BLAC Analysis)</h4>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(
                            Object.entries(analysis.customerAnalysis.blacAnalysis)
                              .map(([key, value]) => `${key.toUpperCase()}: ${value}`)
                              .join('\n\n'), 
                            'blac-analysis'
                          )}
                        >
                          {copiedItems.includes('blac-analysis') ? 
                            <Check className="w-4 h-4 text-green-600" /> : 
                            <Copy className="w-4 h-4" />
                          }
                        </Button>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-lg space-y-2">
                        <p className="text-slate-700">
                          <strong>Background:</strong> {analysis.customerAnalysis.blacAnalysis.background}
                        </p>
                        <p className="text-slate-700">
                          <strong>Learning:</strong> {analysis.customerAnalysis.blacAnalysis.learning}
                        </p>
                        <p className="text-slate-700">
                          <strong>Action:</strong> {analysis.customerAnalysis.blacAnalysis.action}
                        </p>
                        <p className="text-slate-700">
                          <strong>Challenge:</strong> {analysis.customerAnalysis.blacAnalysis.challenge}
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {analysis.customerAnalysis.personas && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-slate-900">Target Audience Personas</h4>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(
                            analysis.customerAnalysis.personas
                              .map((persona: any) => `${persona.name}: ${persona.description} (${persona.demographics})`)
                              .join('\n\n'), 
                            'personas'
                          )}
                        >
                          {copiedItems.includes('personas') ? 
                            <Check className="w-4 h-4 text-green-600" /> : 
                            <Copy className="w-4 h-4" />
                          }
                        </Button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {analysis.customerAnalysis.personas.map((persona: any, index: number) => (
                          <div key={index} className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                            <h5 className="font-medium text-blue-900">{persona.name}</h5>
                            <p className="text-blue-700 text-sm mt-1">{persona.description}</p>
                            <p className="text-blue-600 text-xs mt-2">{persona.demographics}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CollapsibleContent>
              </div>
            </Collapsible>
          )}

          {/* Product Positioning & Value */}
          {analysis.positioning && (
            <Collapsible
              open={openSections.positioning}
              onOpenChange={() => toggleSection('positioning')}
            >
              <div className="border border-slate-200 rounded-lg">
                <CollapsibleTrigger className="w-full px-4 py-3 text-left bg-primary-50 hover:bg-primary-100 rounded-t-lg border-b border-slate-200 flex items-center justify-between">
                  <span className="font-medium text-slate-900">Product Positioning & Value</span>
                  <ChevronDown className={cn(
                    "text-slate-400 transition-transform",
                    openSections.positioning && "transform rotate-180"
                  )} />
                </CollapsibleTrigger>
                <CollapsibleContent className="p-4 space-y-4">
                  {analysis.positioning.usp && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-slate-900">Unique Selling Proposition (USP)</h4>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(analysis.positioning.usp, 'usp')}
                        >
                          {copiedItems.includes('usp') ? 
                            <Check className="w-4 h-4 text-green-600" /> : 
                            <Copy className="w-4 h-4" />
                          }
                        </Button>
                      </div>
                      <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                        <p className="text-slate-700">"{analysis.positioning.usp}"</p>
                      </div>
                    </div>
                  )}
                  
                  {analysis.positioning.visualIdentity && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-slate-900">Visual Identity & Packaging Analysis</h4>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(
                            Object.entries(analysis.positioning.visualIdentity)
                              .map(([key, value]) => `${key}: ${value}`)
                              .join('\n'), 
                            'visual-identity'
                          )}
                        >
                          {copiedItems.includes('visual-identity') ? 
                            <Check className="w-4 h-4 text-green-600" /> : 
                            <Copy className="w-4 h-4" />
                          }
                        </Button>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-lg space-y-3">
                        <div><strong>Color Palette:</strong> {analysis.positioning.visualIdentity.colorPalette}</div>
                        <div><strong>Typography:</strong> {analysis.positioning.visualIdentity.typography}</div>
                        <div><strong>Packaging Design:</strong> {analysis.positioning.visualIdentity.packaging}</div>
                        <div><strong>Brand Impression:</strong> {analysis.positioning.visualIdentity.brandImpression}</div>
                      </div>
                    </div>
                  )}
                </CollapsibleContent>
              </div>
            </Collapsible>
          )}

          {/* Market & Competitive Landscape */}
          {analysis.marketAnalysis && (
            <Collapsible
              open={openSections.market}
              onOpenChange={() => toggleSection('market')}
            >
              <div className="border border-slate-200 rounded-lg">
                <CollapsibleTrigger className="w-full px-4 py-3 text-left bg-primary-50 hover:bg-primary-100 rounded-t-lg border-b border-slate-200 flex items-center justify-between">
                  <span className="font-medium text-slate-900">Market & Competitive Landscape</span>
                  <ChevronDown className={cn(
                    "text-slate-400 transition-transform",
                    openSections.market && "transform rotate-180"
                  )} />
                </CollapsibleTrigger>
                <CollapsibleContent className="p-4 space-y-4">
                  {analysis.marketAnalysis.swot && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-slate-900">SWOT Analysis</h4>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(
                            Object.entries(analysis.marketAnalysis.swot)
                              .map(([key, items]: [string, any]) => `${key.toUpperCase()}: ${items.join(', ')}`)
                              .join('\n'), 
                            'swot'
                          )}
                        >
                          {copiedItems.includes('swot') ? 
                            <Check className="w-4 h-4 text-green-600" /> : 
                            <Copy className="w-4 h-4" />
                          }
                        </Button>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-green-50 p-3 rounded border border-green-200">
                          <h5 className="font-medium text-green-900 mb-2">Strengths</h5>
                          <ul className="text-sm text-green-700 space-y-1">
                            {analysis.marketAnalysis.swot.strengths?.map((item: string, index: number) => (
                              <li key={index}>• {item}</li>
                            ))}
                          </ul>
                        </div>
                        <div className="bg-red-50 p-3 rounded border border-red-200">
                          <h5 className="font-medium text-red-900 mb-2">Weaknesses</h5>
                          <ul className="text-sm text-red-700 space-y-1">
                            {analysis.marketAnalysis.swot.weaknesses?.map((item: string, index: number) => (
                              <li key={index}>• {item}</li>
                            ))}
                          </ul>
                        </div>
                        <div className="bg-blue-50 p-3 rounded border border-blue-200">
                          <h5 className="font-medium text-blue-900 mb-2">Opportunities</h5>
                          <ul className="text-sm text-blue-700 space-y-1">
                            {analysis.marketAnalysis.swot.opportunities?.map((item: string, index: number) => (
                              <li key={index}>• {item}</li>
                            ))}
                          </ul>
                        </div>
                        <div className="bg-yellow-50 p-3 rounded border border-yellow-200">
                          <h5 className="font-medium text-yellow-900 mb-2">Threats</h5>
                          <ul className="text-sm text-yellow-700 space-y-1">
                            {analysis.marketAnalysis.swot.threats?.map((item: string, index: number) => (
                              <li key={index}>• {item}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {analysis.marketAnalysis.competitiveAdvantage && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-slate-900">Competitive Advantage Analysis</h4>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(analysis.marketAnalysis.competitiveAdvantage, 'competitive-advantage')}
                        >
                          {copiedItems.includes('competitive-advantage') ? 
                            <Check className="w-4 h-4 text-green-600" /> : 
                            <Copy className="w-4 h-4" />
                          }
                        </Button>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-lg">
                        <p className="text-slate-700">{analysis.marketAnalysis.competitiveAdvantage}</p>
                      </div>
                    </div>
                  )}
                  
                  {analysis.marketAnalysis.pricingStrategy && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-slate-900">Pricing Strategy & Margin Analysis</h4>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(analysis.marketAnalysis.pricingStrategy, 'pricing-strategy')}
                        >
                          {copiedItems.includes('pricing-strategy') ? 
                            <Check className="w-4 h-4 text-green-600" /> : 
                            <Copy className="w-4 h-4" />
                          }
                        </Button>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-lg">
                        <p className="text-slate-700">{analysis.marketAnalysis.pricingStrategy}</p>
                      </div>
                    </div>
                  )}
                  
                  {/* Market Context from User Input */}
                  {productData && (
                    <div>
                      <h4 className="font-medium text-slate-900 mb-3">Market Context Analysis</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
                          <h5 className="font-medium text-indigo-900 mb-2">Target Audience</h5>
                          <p className="text-indigo-700 text-sm">{productData.targetAudience}</p>
                        </div>
                        <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                          <h5 className="font-medium text-orange-900 mb-2">Primary Competitors</h5>
                          <p className="text-orange-700 text-sm">{productData.competitors}</p>
                        </div>
                        <div className="bg-teal-50 p-4 rounded-lg border border-teal-200 md:col-span-2">
                          <h5 className="font-medium text-teal-900 mb-2">Sales Channels</h5>
                          <div className="flex flex-wrap gap-2">
                            {productData.salesChannels.map((channel, index) => (
                              <Badge key={index} variant="secondary" className="bg-teal-100 text-teal-800">
                                {channel}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </CollapsibleContent>
              </div>
            </Collapsible>
          )}

          {/* Go-To-Market Strategy */}
          {analysis.goToMarket && (
            <Collapsible
              open={openSections.gtm}
              onOpenChange={() => toggleSection('gtm')}
            >
              <div className="border border-slate-200 rounded-lg">
                <CollapsibleTrigger className="w-full px-4 py-3 text-left bg-primary-50 hover:bg-primary-100 rounded-t-lg border-b border-slate-200 flex items-center justify-between">
                  <span className="font-medium text-slate-900">Actionable Go-To-Market Strategy</span>
                  <ChevronDown className={cn(
                    "text-slate-400 transition-transform",
                    openSections.gtm && "transform rotate-180"
                  )} />
                </CollapsibleTrigger>
                <CollapsibleContent className="p-4 space-y-4">
                  {analysis.goToMarket.marketingAngles && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-slate-900">Marketing Angles & Messaging Hooks</h4>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(
                            analysis.goToMarket.marketingAngles
                              .map((angle: any) => `${angle.angle}: ${angle.message}`)
                              .join('\n'), 
                            'marketing-angles'
                          )}
                        >
                          {copiedItems.includes('marketing-angles') ? 
                            <Check className="w-4 h-4 text-green-600" /> : 
                            <Copy className="w-4 h-4" />
                          }
                        </Button>
                      </div>
                      <div className="space-y-2">
                        {analysis.goToMarket.marketingAngles.map((angle: any, index: number) => (
                          <div key={index} className="bg-purple-50 p-3 rounded border border-purple-200">
                            <strong>{angle.angle}:</strong> {angle.message}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {analysis.goToMarket.channelStrategy && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-slate-900">Recommended Channel Strategy</h4>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(
                            analysis.goToMarket.channelStrategy.join('\n'), 
                            'channel-strategy'
                          )}
                        >
                          {copiedItems.includes('channel-strategy') ? 
                            <Check className="w-4 h-4 text-green-600" /> : 
                            <Copy className="w-4 h-4" />
                          }
                        </Button>
                      </div>
                      <div className="space-y-2">
                        {analysis.goToMarket.channelStrategy.map((channel: string, index: number) => (
                          <div key={index} className="bg-blue-50 p-3 rounded border border-blue-200">
                            <p className="text-blue-700 text-sm">• {channel}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {analysis.goToMarket.contentIdeas && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-slate-900">Content Creation Ideas</h4>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(
                            analysis.goToMarket.contentIdeas.join('\n'), 
                            'content-ideas'
                          )}
                        >
                          {copiedItems.includes('content-ideas') ? 
                            <Check className="w-4 h-4 text-green-600" /> : 
                            <Copy className="w-4 h-4" />
                          }
                        </Button>
                      </div>
                      <div className="space-y-2">
                        {analysis.goToMarket.contentIdeas.map((idea: string, index: number) => (
                          <div key={index} className="bg-green-50 p-3 rounded border border-green-200">
                            <p className="text-green-700 text-sm">• {idea}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {analysis.goToMarket.productDescriptions && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-slate-900">Product Descriptions (3 Tone Options)</h4>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(
                            analysis.goToMarket.productDescriptions
                              .map((desc: any) => `${desc.tone}: ${desc.description}`)
                              .join('\n\n'), 
                            'descriptions'
                          )}
                        >
                          {copiedItems.includes('descriptions') ? 
                            <Check className="w-4 h-4 text-green-600" /> : 
                            <Copy className="w-4 h-4" />
                          }
                        </Button>
                      </div>
                      <div className="space-y-4">
                        {analysis.goToMarket.productDescriptions.map((desc: any, index: number) => (
                          <div key={index} className="border border-slate-200 rounded-lg p-4">
                            <h5 className="font-medium text-slate-900 mb-2">{desc.tone} Tone</h5>
                            <p className="text-slate-700 text-sm">{desc.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CollapsibleContent>
              </div>
            </Collapsible>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
