// src/pages/analyzer.tsx (or wherever this file is located)

import { useState } from "react";
import ProductInputForm from "@/components/product-input-form";
import AnalysisPanel from "@/components/analysis-panel";
import type { ProductInput } from "@shared/schema";

export default function Analyzer() {
  // State for the AI-generated analysis text/object
  const [currentAnalysis, setCurrentAnalysis] = useState<any>(null);
  
  // State for the structured data the user typed into the form
  const [productData, setProductData] = useState<ProductInput | null>(null);
  
  // NEW: State to hold the selected image file object itself.
  // This state is crucial for passing the file from the input form to the final save panel.
  const [imageFile, setImageFile] = useState<File | null>(null);

  /**
   * This function is called by the ProductInputForm component after it successfully
   * fetches the initial AI analysis. It lifts the state up to this parent component.
   * 
   * @param analysis - The analysis data returned from the /api/analyze endpoint.
   * @param data - The user's form input (productName, etc.).
   * @param image - The raw image File object selected by the user.
   */
  const handleAnalysisComplete = (analysis: any, data: ProductInput, image: File | null) => {
    console.log("=== ANALYSIS COMPLETE DEBUG ===");
    console.log("received image file:", image);
    console.log("image file name:", image?.name);
    console.log("image file size:", image?.size);
    
    setCurrentAnalysis(analysis);
    setProductData(data);
    // NEW: The image file is now stored in this parent component's state.
    setImageFile(image);
    
    // Alert for debugging
    if (image) {
      alert(`Image file received in analyzer: ${image.name}, Size: ${image.size} bytes`);
    } else {
      alert("No image file received in analyzer!");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
          
          {/* The ProductInputForm receives the handler function. When it calls this
              function, it will provide the analysis, form data, AND the image file. */}
          <div className="order-1 xl:order-1">
            <ProductInputForm onAnalysisComplete={handleAnalysisComplete} />
          </div>
          
          {/* The AnalysisPanel receives all the data it needs to perform the final save.
              This now includes the imageFile. */}
          <div className="order-2 xl:order-2">
            <AnalysisPanel 
              analysis={currentAnalysis} 
              productData={productData}
              imageFile={imageFile} // NEW: The image file is passed down as a prop.
              onAnalysisChange={setCurrentAnalysis}
            />
          </div>
          
        </div>
      </div>
    </div>
  );
}