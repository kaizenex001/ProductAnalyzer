import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Edit3, Brain, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { productInputSchema, type ProductInput } from "@shared/schema";
import FileUpload from "@/components/ui/file-upload";

interface ProductInputFormProps {
  onAnalysisComplete: (analysis: any, productData: ProductInput) => void;
}

const salesChannelOptions = [
  "E-commerce Website",
  "Amazon/Online Marketplaces", 
  "Retail Stores",
  "Social Media",
  "Direct Sales",
];

const productCategories = [
  "Electronics",
  "Health & Beauty",
  "Home & Garden", 
  "Clothing & Accessories",
  "Food & Beverage",
  "Sports & Outdoors",
  "Books & Media",
  "Automotive",
  "Toys & Games",
  "Office Supplies",
];

export default function ProductInputForm({ onAnalysisComplete }: ProductInputFormProps) {
  const [openSections, setOpenSections] = useState({
    fundamentals: true,
    pricing: false,
    market: false,
  });
  const { toast } = useToast();

  const form = useForm<ProductInput>({
    resolver: zodResolver(productInputSchema),
    defaultValues: {
      productName: "",
      productCategory: "",
      productImage: "",
      oneSentencePitch: "",
      keyFeatures: "",
      costOfGoods: "",
      retailPrice: "",
      promoPrice: "",
      materials: "",
      variants: "",
      targetAudience: "",
      competitors: "",
      salesChannels: [],
    },
  });

  const analyzeMutation = useMutation({
    mutationFn: async (data: ProductInput) => {
      const response = await apiRequest("POST", "/api/analyze", data);
      return response.json();
    },
    onSuccess: (analysis, productData) => {
      onAnalysisComplete(analysis, productData);
      toast({
        title: "Analysis Complete",
        description: "Your product analysis has been generated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Analysis Failed",
        description: "Failed to generate product analysis. Please try again.",
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

  const onSubmit = (data: ProductInput) => {
    analyzeMutation.mutate(data);
  };

  const handleImageUpload = (imageUrl: string) => {
    form.setValue("productImage", imageUrl);
  };

  return (
    <Card className="h-fit">
      <CardHeader className="border-b border-slate-200">
        <CardTitle className="flex items-center">
          <Edit3 className="text-primary mr-3" />
          Input Product Details
        </CardTitle>
        <p className="text-slate-600 text-sm">
          Provide comprehensive product information for AI analysis
        </p>
      </CardHeader>
      
      <CardContent className="p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            
            {/* Product Fundamentals */}
            <Collapsible
              open={openSections.fundamentals}
              onOpenChange={() => toggleSection('fundamentals')}
            >
              <div className="border border-slate-200 rounded-lg">
                <CollapsibleTrigger className="w-full px-4 py-3 text-left bg-slate-50 hover:bg-slate-100 rounded-t-lg border-b border-slate-200 flex items-center justify-between">
                  <span className="font-medium text-slate-900">Product Fundamentals</span>
                  <ChevronDown className={cn(
                    "text-slate-400 transition-transform",
                    openSections.fundamentals && "transform rotate-180"
                  )} />
                </CollapsibleTrigger>
                <CollapsibleContent className="p-4 space-y-4">
                  <FormField
                    control={form.control}
                    name="productImage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Product Image</FormLabel>
                        <FormControl>
                          <FileUpload onUpload={handleImageUpload} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="productName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Product Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter product name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="productCategory"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Product Category</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select category..." />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {productCategories.map((category) => (
                              <SelectItem key={category} value={category}>
                                {category}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="oneSentencePitch"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>One-Sentence Pitch</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Describe your product in one compelling sentence"
                            rows={2}
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="keyFeatures"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Key Features & Benefits</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="List the main features and benefits that make your product unique"
                            rows={4}
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CollapsibleContent>
              </div>
            </Collapsible>

            {/* Production & Pricing */}
            <Collapsible
              open={openSections.pricing}
              onOpenChange={() => toggleSection('pricing')}
            >
              <div className="border border-slate-200 rounded-lg">
                <CollapsibleTrigger className="w-full px-4 py-3 text-left bg-slate-50 hover:bg-slate-100 rounded-t-lg border-b border-slate-200 flex items-center justify-between">
                  <span className="font-medium text-slate-900">Production & Pricing</span>
                  <ChevronDown className={cn(
                    "text-slate-400 transition-transform",
                    openSections.pricing && "transform rotate-180"
                  )} />
                </CollapsibleTrigger>
                <CollapsibleContent className="p-4 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="costOfGoods"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cost of Goods Sold (Per Unit)</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <span className="absolute left-3 top-2.5 text-slate-500">$</span>
                              <Input 
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                className="pl-8"
                                {...field} 
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="retailPrice"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Retail Price (MSRP)</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <span className="absolute left-3 top-2.5 text-slate-500">$</span>
                              <Input 
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                className="pl-8"
                                {...field} 
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="promoPrice"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Intended Promo Price</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <span className="absolute left-3 top-2.5 text-slate-500">$</span>
                              <Input 
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                className="pl-8"
                                {...field} 
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="materials"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Materials / Ingredients / Tech Stack</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Describe materials, ingredients, or technologies used"
                            rows={3}
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="variants"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Product Variants</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="e.g., Red, Blue, Large, Small, 50ml, 100ml"
                            {...field} 
                          />
                        </FormControl>
                        <p className="text-xs text-slate-500">Separate variants with commas</p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CollapsibleContent>
              </div>
            </Collapsible>

            {/* Market Context */}
            <Collapsible
              open={openSections.market}
              onOpenChange={() => toggleSection('market')}
            >
              <div className="border border-slate-200 rounded-lg">
                <CollapsibleTrigger className="w-full px-4 py-3 text-left bg-slate-50 hover:bg-slate-100 rounded-t-lg border-b border-slate-200 flex items-center justify-between">
                  <span className="font-medium text-slate-900">Market Context</span>
                  <ChevronDown className={cn(
                    "text-slate-400 transition-transform",
                    openSections.market && "transform rotate-180"
                  )} />
                </CollapsibleTrigger>
                <CollapsibleContent className="p-4 space-y-4">
                  <FormField
                    control={form.control}
                    name="targetAudience"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Intended Target Audience</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Describe your ideal customers, their demographics, needs, and behaviors"
                            rows={3}
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="competitors"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Primary Competitors</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="e.g., Company A, Brand B, Product C"
                            {...field} 
                          />
                        </FormControl>
                        <p className="text-xs text-slate-500">List 1-3 main competitors, separated by commas</p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="salesChannels"
                    render={() => (
                      <FormItem>
                        <FormLabel>Current/Planned Sales Channels</FormLabel>
                        <div className="space-y-2">
                          {salesChannelOptions.map((channel) => (
                            <FormField
                              key={channel}
                              control={form.control}
                              name="salesChannels"
                              render={({ field }) => {
                                return (
                                  <FormItem
                                    key={channel}
                                    className="flex flex-row items-start space-x-3 space-y-0"
                                  >
                                    <FormControl>
                                      <Checkbox
                                        checked={field.value?.includes(channel)}
                                        onCheckedChange={(checked) => {
                                          return checked
                                            ? field.onChange([...field.value, channel])
                                            : field.onChange(
                                                field.value?.filter(
                                                  (value) => value !== channel
                                                )
                                              )
                                        }}
                                      />
                                    </FormControl>
                                    <FormLabel className="text-sm font-normal">
                                      {channel}
                                    </FormLabel>
                                  </FormItem>
                                )
                              }}
                            />
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CollapsibleContent>
              </div>
            </Collapsible>

            <Button 
              type="submit" 
              className="w-full" 
              size="lg"
              disabled={analyzeMutation.isPending}
            >
              <Brain className="w-4 h-4 mr-2" />
              {analyzeMutation.isPending ? "Analyzing..." : "Analyze Product"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
