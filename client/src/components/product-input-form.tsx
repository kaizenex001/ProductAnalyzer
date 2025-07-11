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

// Helper type for form data
type ProductInputFormState = ProductInput & { productImageFile?: File | null };

interface ProductInputFormProps {
  onAnalysisComplete: (analysis: any, productData: ProductInput, imageFile: File | null) => void;
  productData?: ProductInput | null;
}

const salesChannelOptions = [
  "E-commerce Website",
  "Online Marketplaces (TikTok, Shopee, Lazada)",
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


export default function ProductInputForm({ onAnalysisComplete, productData }: ProductInputFormProps) {
  const [openSections, setOpenSections] = useState({
    fundamentals: true,
    pricing: false,
    market: false,
  });
  const { toast } = useToast();

  // Local state for the image file and its preview
  const [productImageFile, setProductImageFile] = useState<File | null>(null);
  const [productImagePreview, setProductImagePreview] = useState<string>("");
  
  // Store analysis result in state
  const [analysis, setAnalysis] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const form = useForm<ProductInputFormState>({
    resolver: zodResolver(productInputSchema),
    defaultValues: {
      productName: productData?.productName || "",
      productCategory: productData?.productCategory || "",
      productImage: productData?.productImage || "",
      oneSentencePitch: productData?.oneSentencePitch || "",
      keyFeatures: productData?.keyFeatures || "",
      costOfGoods: productData?.costOfGoods ? String(productData.costOfGoods) : "",
      retailPrice: productData?.retailPrice ? String(productData.retailPrice) : "",
      promoPrice: productData?.promoPrice ? String(productData.promoPrice) : "",
      materials: productData?.materials || "",
      variants: productData?.variants || "",
      targetAudience: productData?.targetAudience || "",
      competitors: productData?.competitors || "",
      salesChannels: productData?.salesChannels || [],
      productImageFile: null,
    },
  });

  // Toggle collapsible sections
  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  // Handle image upload - store both base64 preview and File object
  const handleImageUpload = (base64Url: string, file: File) => {
    console.log("=== IMAGE UPLOAD DEBUG ===");
    console.log("base64Url length:", base64Url.length);
    console.log("file:", file);
    console.log("file size:", file.size);
    console.log("file name:", file.name);
    console.log("file type:", file.type);
    
    setProductImagePreview(base64Url);
    setProductImageFile(file);
    form.setValue("productImage", base64Url);
    
    // Alert for debugging
    alert(`Image uploaded! File: ${file.name}, Size: ${file.size} bytes`);
  };

  // Only runs analysis, does not save to Supabase
  const handleAnalyze = async (data: ProductInputFormState) => {
    setIsAnalyzing(true);
    try {
      console.log("=== ANALYZE DEBUG ===");
      console.log("productImageFile state:", productImageFile);
      console.log("form data:", data);
      
      // Send analysis request with temporary data (remove productImage from form data)
      const { productImage, ...rest } = data;
      
      const response = await apiRequest("POST", "/api/analyze", rest);
      const result = await response.json();
      
      setAnalysis(result);
      onAnalysisComplete?.(result, rest, productImageFile);
      
      toast({
        title: "Analysis Complete",
        description: "Your product analysis has been generated successfully.",
      });
    } catch (error) {
      toast({
        title: "Analysis Failed",
        description: "Failed to generate product analysis. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Save report and analysis to Supabase (only when "Save Report" is clicked)
  const handleSaveReport = async () => {
    if (!analysis) {
      toast({
        title: "No Analysis",
        description: "Please analyze the product before saving the report.",
        variant: "destructive",
      });
      return;
    }
    
    console.log("=== SAVE REPORT DEBUG ===");
    console.log("productImageFile:", productImageFile);
    console.log("productImageFile type:", typeof productImageFile);
    console.log("productImageFile size:", productImageFile?.size);
    console.log("productImageFile name:", productImageFile?.name);
    
    // Alert for debugging
    if (productImageFile) {
      alert(`Saving with file: ${productImageFile.name}, Size: ${productImageFile.size} bytes`);
    } else {
      alert("No file to save!");
    }
    
    setIsSaving(true);
    const formData = new FormData();

    // Get the latest form values
    const values = form.getValues();

    // Add all text fields
    const textFields = [
      "productName",
      "productCategory", 
      "oneSentencePitch",
      "keyFeatures",
      "materials",
      "variants",
      "targetAudience",
      "competitors"
    ];
    
    textFields.forEach((field) => {
      const value = values[field as keyof ProductInputFormState];
      formData.append(field, value ? String(value) : "");
    });

    // Add numeric fields
    const numericFields = ["costOfGoods", "retailPrice", "promoPrice"];
    numericFields.forEach((field) => {
      const value = values[field as keyof ProductInputFormState];
      formData.append(field, value ? String(value) : "");
    });

    // Add sales channels as JSON
    const salesChannels = values.salesChannels || [];
    formData.append("salesChannels", JSON.stringify(salesChannels));

    // Add the image file (now uploaded for the first time)
    console.log("Before FormData append - productImageFile:", productImageFile);
    if (productImageFile) {
      console.log("Appending file to FormData:", productImageFile.name, productImageFile.size);
      formData.append("productImage", productImageFile);
    } else {
      console.log("No productImageFile to append");
    }

    // Add analysis as JSON
    formData.append("analysis", JSON.stringify(analysis));

    // Debug: Log FormData contents
    console.log("FormData entries:");
    console.log("- productName:", formData.get("productName"));
    console.log("- productImage file:", formData.get("productImage"));
    console.log("- analysis length:", formData.get("analysis")?.toString().length);

    try {
      const response = await fetch("/api/reports", {
        method: "POST",
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error("Failed to save report");
      }
      
      const result = await response.json();
      
      toast({
        title: "Report Saved",
        description: "Your product report has been saved successfully.",
      });
      
      // Optionally reset form or redirect
    } catch (error) {
      console.error("Save error:", error);
      toast({
        title: "Save Failed",
        description: "Failed to save product report. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
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
          {/* UPDATED: Removed onSubmit from the form tag */}
          <form className="space-y-6" encType="multipart/form-data">
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
                          <FileUpload onUpload={(url: string, file: File) => {
                            field.onChange(url);
                            handleImageUpload(url, file);
                          }} />
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
                              <span className="absolute left-3 top-2.5 text-slate-500">₱</span>
                              <Input
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                className="pl-8"
                                {...field}
                                onChange={e => field.onChange(e.target.value)}
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
                              <span className="absolute left-3 top-2.5 text-slate-500">₱</span>
                              <Input
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                className="pl-8"
                                {...field}
                                onChange={e => field.onChange(e.target.value)}
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
                              <span className="absolute left-3 top-2.5 text-slate-500">₱</span>
                              <Input
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                className="pl-8"
                                {...field}
                                onChange={e => field.onChange(e.target.value)}
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
                                const currentValues = field.value || [];
                                return (
                                  <FormItem
                                    key={channel}
                                    className="flex flex-row items-start space-x-3 space-y-0"
                                  >
                                    <FormControl>
                                      <Checkbox
                                        checked={currentValues.includes(channel)}
                                        onCheckedChange={(checked) => {
                                          return checked
                                            ? field.onChange([...currentValues, channel])
                                            : field.onChange(
                                              currentValues.filter(
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
            
            {/* UPDATED: Changed type to "button" and added onClick handler */}
            <Button
              type="button"
              className="w-full"
              size="lg"
              disabled={isAnalyzing}
              onClick={form.handleSubmit(handleAnalyze)}
            >
              <Brain className="w-4 h-4 mr-2" />
              {isAnalyzing ? "Analyzing..." : "Analyze Product"}
            </Button>
            
            <Button
              type="button"
              className="w-full mt-2"
              size="lg"
              disabled={isSaving || !analysis}
              onClick={handleSaveReport}
              variant="secondary"
            >
              {isSaving ? "Saving..." : "Save Report"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}