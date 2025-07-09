import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Copy, Check, RefreshCw, Sparkles, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Report } from "@shared/schema";

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

export default function ContentIdeation() {
  const { toast } = useToast();
  const [selectedReport, setSelectedReport] = useState<string>("");
  const [contentIdeas, setContentIdeas] = useState<ContentIdeas | null>(null);
  const [copiedItems, setCopiedItems] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedItems, setSelectedItems] = useState<{[key: string]: string}>({});

  // Fetch saved reports
  const { data: reports = [] } = useQuery<Report[]>({
    queryKey: ["/api/reports"],
  });

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedItems(prev => [...prev, type]);
    toast({
      description: "Copied to clipboard!",
    });
    setTimeout(() => {
      setCopiedItems(prev => prev.filter(item => item !== type));
    }, 2000);
  };

  const generateContentIdeas = async () => {
    if (!selectedReport) {
      toast({
        title: "Please select a report",
        description: "Choose a saved product report to generate content ideas",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch("/api/generate-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportId: selectedReport }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate content ideas");
      }

      const ideas = await response.json();
      setContentIdeas(ideas);
      toast({
        title: "Content ideas generated!",
        description: "Multiple options created for each content type",
      });
    } catch (error) {
      toast({
        title: "Generation failed",
        description: "Could not generate content ideas. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const optimizeSelection = async (category: string, selection: string) => {
    if (!selectedReport) return;

    try {
      const response = await fetch("/api/optimize-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          reportId: selectedReport,
          category,
          selection,
          context: contentIdeas
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to optimize content");
      }

      const optimized = await response.json();
      setContentIdeas(prev => ({
        ...prev!,
        [category]: {
          ...prev![category as keyof ContentIdeas],
          optimized: optimized.result
        }
      }));

      toast({
        description: "Content optimized successfully!",
      });
    } catch (error) {
      toast({
        title: "Optimization failed",
        description: "Could not optimize content. Please try again.",
        variant: "destructive",
      });
    }
  };

  const selectItem = (category: string, item: string) => {
    setSelectedItems(prev => ({
      ...prev,
      [category]: item
    }));
  };

  const downloadReportPDF = () => {
    if (!selectedReport) {
      toast({
        title: "No report selected",
        description: "Please select a report first",
        variant: "destructive",
      });
      return;
    }

    const selectedReportData = reports.find(r => r.id.toString() === selectedReport);
    if (selectedReportData) {
      const link = document.createElement('a');
      link.href = `/api/reports/${selectedReport}/pdf`;
      link.download = `${selectedReportData.productName}-analysis.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "PDF Download",
        description: "Report PDF download started",
      });
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Content Ideation</h1>
        <p className="text-slate-600">Generate AI-powered content ideas tailored to your products</p>
      </div>

      {/* Report Selection */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            Select Product Report
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <Select value={selectedReport} onValueChange={setSelectedReport}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a saved product report..." />
                </SelectTrigger>
                <SelectContent>
                  {reports.map((report) => (
                    <SelectItem key={report.id} value={report.id.toString()}>
                      {report.productName} - {report.productCategory}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={generateContentIdeas}
                disabled={!selectedReport || isGenerating}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate Content Ideas
                  </>
                )}
              </Button>
              <Button 
                variant="outline"
                onClick={downloadReportPDF}
                disabled={!selectedReport}
                title="Download Report PDF"
              >
                <Download className="w-4 h-4 mr-2" />
                Download PDF
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content Ideas Display */}
      {contentIdeas && (
        <div className="space-y-6">
          {/* Hashtags */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Trending Hashtags</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-slate-700">Trending & Viral</h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(contentIdeas.hashtags.trending.join(' '), 'trending-hashtags')}
                    >
                      {copiedItems.includes('trending-hashtags') ? 
                        <Check className="w-4 h-4 text-green-600" /> : 
                        <Copy className="w-4 h-4" />
                      }
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {contentIdeas.hashtags.trending.map((tag, index) => (
                      <Badge 
                        key={index} 
                        variant="secondary" 
                        className={`cursor-pointer transition-colors ${
                          selectedItems.trending === tag 
                            ? 'bg-purple-100 text-purple-800 border-purple-300' 
                            : 'hover:bg-slate-200'
                        }`}
                        onClick={() => selectItem('trending', tag)}
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-slate-700">Niche & Targeted</h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(contentIdeas.hashtags.niche.join(' '), 'niche-hashtags')}
                    >
                      {copiedItems.includes('niche-hashtags') ? 
                        <Check className="w-4 h-4 text-green-600" /> : 
                        <Copy className="w-4 h-4" />
                      }
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {contentIdeas.hashtags.niche.map((tag, index) => (
                      <Badge 
                        key={index} 
                        variant="outline" 
                        className={`cursor-pointer transition-colors ${
                          selectedItems.niche === tag 
                            ? 'bg-blue-100 text-blue-800 border-blue-300' 
                            : 'hover:bg-slate-100'
                        }`}
                        onClick={() => selectItem('niche', tag)}
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-slate-700">Branded & Product</h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(contentIdeas.hashtags.branded.join(' '), 'branded-hashtags')}
                    >
                      {copiedItems.includes('branded-hashtags') ? 
                        <Check className="w-4 h-4 text-green-600" /> : 
                        <Copy className="w-4 h-4" />
                      }
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {contentIdeas.hashtags.branded.map((tag, index) => (
                      <Badge 
                        key={index} 
                        className={`cursor-pointer transition-colors ${
                          selectedItems.branded === tag 
                            ? 'bg-green-600 text-white' 
                            : 'bg-green-100 text-green-800 hover:bg-green-200'
                        }`}
                        onClick={() => selectItem('branded', tag)}
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Captions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">SEO Optimized Captions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(contentIdeas.captions).map(([type, caption]) => (
                  <div key={type} className="border border-slate-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-slate-900 capitalize">{type} Style</h4>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => optimizeSelection('captions', caption)}
                          className="text-purple-600 border-purple-200 hover:bg-purple-50"
                        >
                          <Sparkles className="w-3 h-3 mr-1" />
                          Optimize
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(caption, `caption-${type}`)}
                        >
                          {copiedItems.includes(`caption-${type}`) ? 
                            <Check className="w-4 h-4 text-green-600" /> : 
                            <Copy className="w-4 h-4" />
                          }
                        </Button>
                      </div>
                    </div>
                    <p className="text-slate-700 text-sm leading-relaxed">{caption}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Storylines */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Content Storylines</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(contentIdeas.storylines).map(([type, storyline]) => (
                  <div key={type} className="border border-slate-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-slate-900">
                        {type.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                      </h4>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => optimizeSelection('storylines', storyline)}
                          className="text-purple-600 border-purple-200 hover:bg-purple-50"
                        >
                          <Sparkles className="w-3 h-3 mr-1" />
                          Optimize
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(storyline, `storyline-${type}`)}
                        >
                          {copiedItems.includes(`storyline-${type}`) ? 
                            <Check className="w-4 h-4 text-green-600" /> : 
                            <Copy className="w-4 h-4" />
                          }
                        </Button>
                      </div>
                    </div>
                    <p className="text-slate-700 text-sm leading-relaxed">{storyline}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Content Hooks */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Attention-Grabbing Hooks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(contentIdeas.hooks).map(([type, hook]) => (
                  <div key={type} className="border border-slate-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-slate-900 capitalize">{type} Hook</h4>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(hook, `hook-${type}`)}
                      >
                        {copiedItems.includes(`hook-${type}`) ? 
                          <Check className="w-4 h-4 text-green-600" /> : 
                          <Copy className="w-4 h-4" />
                        }
                      </Button>
                    </div>
                    <p className="text-slate-700 text-sm">{hook}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Call to Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Call-to-Action Options</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Object.entries(contentIdeas.callToActions).map(([type, cta]) => (
                  <div key={type} className="border border-slate-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-slate-900 capitalize">{type} CTA</h4>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(cta, `cta-${type}`)}
                      >
                        {copiedItems.includes(`cta-${type}`) ? 
                          <Check className="w-4 h-4 text-green-600" /> : 
                          <Copy className="w-4 h-4" />
                        }
                      </Button>
                    </div>
                    <p className="text-slate-700 text-sm">{cta}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Empty State */}
      {!contentIdeas && !isGenerating && (
        <Card className="text-center py-12">
          <CardContent>
            <Sparkles className="w-16 h-16 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">Ready to Create Amazing Content?</h3>
            <p className="text-slate-600 mb-4">
              Select a product report above and let AI generate multiple content ideas for each aspect.
            </p>
            <p className="text-sm text-slate-500">
              You'll get trending hashtags, SEO captions, engaging storylines, attention-grabbing hooks, and effective CTAs.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}