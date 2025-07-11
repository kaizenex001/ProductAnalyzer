import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Copy, Check, RefreshCw, Sparkles } from "lucide-react";
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
  const [optimizedContent, setOptimizedContent] = useState<{[key: string]: string}>({});
  const [optimizingItems, setOptimizingItems] = useState<Set<string>>(new Set());

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

    const optimizeKey = `${category}-${selection.substring(0, 50)}`;
    
    // Add this item to the optimizing set
    setOptimizingItems(prev => new Set(Array.from(prev).concat(optimizeKey)));

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
      
      // Store the optimized content
      setOptimizedContent(prev => ({
        ...prev,
        [optimizeKey]: optimized.result
      }));

      toast({
        title: "Content Optimized!",
        description: "Your content has been optimized using advanced SEO and copywriting techniques.",
      });
    } catch (error) {
      toast({
        title: "Optimization failed",
        description: "Could not optimize content. Please try again.",
        variant: "destructive",
      });
    } finally {
      // Remove this item from the optimizing set
      setOptimizingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(optimizeKey);
        return newSet;
      });
    }
  };

  const selectItem = (category: string, item: string) => {
    setSelectedItems(prev => ({
      ...prev,
      [category]: item
    }));
  };

  const getOptimizedContent = (category: string, selection: string) => {
    const optimizeKey = `${category}-${selection.substring(0, 50)}`;
    return optimizedContent[optimizeKey];
  };

  const renderOptimizedContent = (category: string, selection: string) => {
    const optimized = getOptimizedContent(category, selection);
    if (!optimized) return null;

    return (
      <div className="mt-3 p-3 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-4 h-4 text-purple-600" />
          <span className="text-sm font-medium text-purple-700">Optimized Version</span>
        </div>
        <p className="text-slate-700 text-sm leading-relaxed">{optimized}</p>
        <div className="mt-2 flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => copyToClipboard(optimized, `optimized-${category}-${selection.substring(0, 20)}`)}
          >
            {copiedItems.includes(`optimized-${category}-${selection.substring(0, 20)}`) ? 
              <Check className="w-4 h-4 text-green-600" /> : 
              <Copy className="w-4 h-4" />
            }
          </Button>
        </div>
      </div>
    );
  };

  const isItemOptimizing = (category: string, selection: string) => {
    const optimizeKey = `${category}-${selection.substring(0, 50)}`;
    return optimizingItems.has(optimizeKey);
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
                          disabled={isItemOptimizing('captions', caption)}
                          className="text-purple-600 border-purple-200 hover:bg-purple-50"
                        >
                          <Sparkles className="w-3 h-3 mr-1" />
                          {isItemOptimizing('captions', caption) ? 'Optimizing...' : 'Optimize'}
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
                    {renderOptimizedContent('captions', caption)}
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
                          disabled={isItemOptimizing('storylines', storyline)}
                          className="text-purple-600 border-purple-200 hover:bg-purple-50"
                        >
                          <Sparkles className="w-3 h-3 mr-1" />
                          {isItemOptimizing('storylines', storyline) ? 'Optimizing...' : 'Optimize'}
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
                    {renderOptimizedContent('storylines', storyline)}
                    {renderOptimizedContent('storylines', storyline)}
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
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => optimizeSelection('hooks', hook)}
                          disabled={isItemOptimizing('hooks', hook)}
                          className="text-purple-600 border-purple-200 hover:bg-purple-50"
                        >
                          <Sparkles className="w-3 h-3 mr-1" />
                          {isItemOptimizing('hooks', hook) ? 'Optimizing...' : 'Optimize'}
                        </Button>
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
                    </div>
                    <p className="text-slate-700 text-sm">{hook}</p>
                    {renderOptimizedContent('hooks', hook)}
                    {renderOptimizedContent('hooks', hook)}
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
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => optimizeSelection('callToActions', cta)}
                          disabled={isItemOptimizing('callToActions', cta)}
                          className="text-purple-600 border-purple-200 hover:bg-purple-50"
                        >
                          <Sparkles className="w-3 h-3 mr-1" />
                          {isItemOptimizing('callToActions', cta) ? 'Optimizing...' : 'Optimize'}
                        </Button>
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
                    </div>
                    <p className="text-slate-700 text-sm">{cta}</p>
                    {renderOptimizedContent('callToActions', cta)}
                    {renderOptimizedContent('callToActions', cta)}
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