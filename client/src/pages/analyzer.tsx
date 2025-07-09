import { useState } from "react";
import ProductInputForm from "@/components/product-input-form";
import AnalysisPanel from "@/components/analysis-panel";
import type { ProductInput } from "@shared/schema";

export default function Analyzer() {
  const [currentAnalysis, setCurrentAnalysis] = useState<any>(null);
  const [productData, setProductData] = useState<ProductInput | null>(null);

  const handleAnalysisComplete = (analysis: any, data: ProductInput) => {
    setCurrentAnalysis(analysis);
    setProductData(data);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <ProductInputForm onAnalysisComplete={handleAnalysisComplete} />
        <AnalysisPanel 
          analysis={currentAnalysis} 
          productData={productData}
          onAnalysisChange={setCurrentAnalysis}
        />
      </div>
    </div>
  );
}
