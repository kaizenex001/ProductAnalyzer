import { useQuery } from "@tanstack/react-query";
import { X, Download, ChevronDown } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import type { Report } from "@shared/schema";

interface ReportModalProps {
  reportId: number;
  isOpen: boolean;
  onClose: () => void;
}

export default function ReportModal({ reportId, isOpen, onClose }: ReportModalProps) {
  const [openSections, setOpenSections] = useState({
    customer: true,
    positioning: false,
    market: false,
    gtm: false,
  });

  const { data: report, isLoading } = useQuery({
    queryKey: ["/api/reports", reportId],
    enabled: isOpen && !!reportId,
  });

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleDownloadPDF = () => {
    if (report) {
      window.open(`/api/reports/${reportId}/pdf`, '_blank');
    }
  };

  if (isLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-slate-600">Loading report...</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!report) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
          <div className="flex items-center justify-center h-64">
            <p className="text-slate-600">Report not found</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const analysis = report.analysis as any;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden p-0">
        {/* Modal Header */}
        <DialogHeader className="flex flex-row items-center justify-between p-6 border-b border-slate-200">
          <div>
            <DialogTitle>Report for: {report.productName}</DialogTitle>
            <DialogDescription>
              Detailed product analysis and insights
            </DialogDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </DialogHeader>

        {/* Modal Body */}
        <div className="flex overflow-hidden h-[calc(90vh-120px)]">
          {/* Left Column: Product Details */}
          <div className="w-1/3 p-6 border-r border-slate-200 overflow-y-auto">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Product Details (Your Input)</h3>
            
            <div className="space-y-4">
              {report.productImage && (
                <img
                  src={report.productImage}
                  alt={report.productName}
                  className="w-full rounded-lg"
                />
              )}
              
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-slate-700">Product Name:</label>
                  <p className="text-slate-900">{report.productName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">Category:</label>
                  <p className="text-slate-900">{report.productCategory}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">Retail Price:</label>
                  <p className="text-slate-900">${report.retailPrice}</p>
                </div>
                {report.oneSentencePitch && (
                  <div>
                    <label className="text-sm font-medium text-slate-700">One-Sentence Pitch:</label>
                    <p className="text-slate-900">{report.oneSentencePitch}</p>
                  </div>
                )}
                {report.keyFeatures && (
                  <div>
                    <label className="text-sm font-medium text-slate-700">Key Features:</label>
                    <p className="text-slate-900">{report.keyFeatures}</p>
                  </div>
                )}
                {report.targetAudience && (
                  <div>
                    <label className="text-sm font-medium text-slate-700">Target Audience:</label>
                    <p className="text-slate-900">{report.targetAudience}</p>
                  </div>
                )}
                {report.competitors && (
                  <div>
                    <label className="text-sm font-medium text-slate-700">Competitors:</label>
                    <p className="text-slate-900">{report.competitors}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: AI Analysis */}
          <div className="w-2/3 p-6 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900">AI Insights (Saved Analysis)</h3>
              <Button
                variant="secondary"
                onClick={handleDownloadPDF}
              >
                <Download className="w-4 h-4 mr-2" />
                Download PDF
              </Button>
            </div>

            <div className="space-y-4">
              {/* Customer Analysis */}
              {analysis?.customerAnalysis && (
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
                    <CollapsibleContent className="p-4">
                      <div className="space-y-4">
                        {analysis.customerAnalysis.painPoints && (
                          <div>
                            <h4 className="font-medium text-slate-900 mb-2">Identified Pain Points</h4>
                            <ul className="list-disc list-inside space-y-1 text-slate-700">
                              {analysis.customerAnalysis.painPoints.map((point: string, index: number) => (
                                <li key={index}>{point}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        {analysis.customerAnalysis.personas && (
                          <div>
                            <h4 className="font-medium text-slate-900 mb-2">Target Personas</h4>
                            <div className="grid grid-cols-1 gap-3">
                              {analysis.customerAnalysis.personas.map((persona: any, index: number) => (
                                <div key={index} className="bg-green-50 p-3 rounded border border-green-200">
                                  <h5 className="font-medium text-green-900">{persona.name}</h5>
                                  <p className="text-green-700 text-sm">{persona.description}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </CollapsibleContent>
                  </div>
                </Collapsible>
              )}

              {/* Positioning */}
              {analysis?.positioning && (
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
                    <CollapsibleContent className="p-4">
                      <div className="space-y-4">
                        {analysis.positioning.usp && (
                          <div>
                            <h4 className="font-medium text-slate-900 mb-2">Unique Selling Proposition</h4>
                            <div className="bg-yellow-50 p-4 rounded border border-yellow-200">
                              <p className="text-slate-700">"{analysis.positioning.usp}"</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </CollapsibleContent>
                  </div>
                </Collapsible>
              )}

              {/* Market Analysis */}
              {analysis?.marketAnalysis && (
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
                    <CollapsibleContent className="p-4">
                      <div className="space-y-4">
                        {analysis.marketAnalysis.swot && (
                          <div>
                            <h4 className="font-medium text-slate-900 mb-2">SWOT Analysis</h4>
                            <div className="grid grid-cols-2 gap-3">
                              <div className="bg-green-50 p-3 rounded border border-green-200">
                                <h5 className="font-medium text-green-900 mb-1">Strengths</h5>
                                <ul className="text-sm text-green-700 space-y-1">
                                  {analysis.marketAnalysis.swot.strengths?.map((item: string, index: number) => (
                                    <li key={index}>• {item}</li>
                                  ))}
                                </ul>
                              </div>
                              <div className="bg-red-50 p-3 rounded border border-red-200">
                                <h5 className="font-medium text-red-900 mb-1">Weaknesses</h5>
                                <ul className="text-sm text-red-700 space-y-1">
                                  {analysis.marketAnalysis.swot.weaknesses?.map((item: string, index: number) => (
                                    <li key={index}>• {item}</li>
                                  ))}
                                </ul>
                              </div>
                              <div className="bg-blue-50 p-3 rounded border border-blue-200">
                                <h5 className="font-medium text-blue-900 mb-1">Opportunities</h5>
                                <ul className="text-sm text-blue-700 space-y-1">
                                  {analysis.marketAnalysis.swot.opportunities?.map((item: string, index: number) => (
                                    <li key={index}>• {item}</li>
                                  ))}
                                </ul>
                              </div>
                              <div className="bg-yellow-50 p-3 rounded border border-yellow-200">
                                <h5 className="font-medium text-yellow-900 mb-1">Threats</h5>
                                <ul className="text-sm text-yellow-700 space-y-1">
                                  {analysis.marketAnalysis.swot.threats?.map((item: string, index: number) => (
                                    <li key={index}>• {item}</li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {/* Market Context from User Input */}
                        <div>
                          <h4 className="font-medium text-slate-900 mb-3">Market Context Analysis</h4>
                          <div className="grid grid-cols-1 gap-3">
                            <div className="bg-indigo-50 p-3 rounded border border-indigo-200">
                              <h5 className="font-medium text-indigo-900 mb-1">Target Audience</h5>
                              <p className="text-indigo-700 text-sm">{report.targetAudience}</p>
                            </div>
                            <div className="bg-orange-50 p-3 rounded border border-orange-200">
                              <h5 className="font-medium text-orange-900 mb-1">Primary Competitors</h5>
                              <p className="text-orange-700 text-sm">{report.competitors}</p>
                            </div>
                            <div className="bg-teal-50 p-3 rounded border border-teal-200">
                              <h5 className="font-medium text-teal-900 mb-1">Sales Channels</h5>
                              <p className="text-teal-700 text-sm">{report.salesChannels}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CollapsibleContent>
                  </div>
                </Collapsible>
              )}

              {/* Go-To-Market Strategy */}
              {analysis?.goToMarket && (
                <Collapsible
                  open={openSections.gtm}
                  onOpenChange={() => toggleSection('gtm')}
                >
                  <div className="border border-slate-200 rounded-lg">
                    <CollapsibleTrigger className="w-full px-4 py-3 text-left bg-primary-50 hover:bg-primary-100 rounded-t-lg border-b border-slate-200 flex items-center justify-between">
                      <span className="font-medium text-slate-900">Go-To-Market Strategy</span>
                      <ChevronDown className={cn(
                        "text-slate-400 transition-transform",
                        openSections.gtm && "transform rotate-180"
                      )} />
                    </CollapsibleTrigger>
                    <CollapsibleContent className="p-4">
                      <div className="space-y-4">
                        {analysis.goToMarket.marketingAngles && (
                          <div>
                            <h4 className="font-medium text-slate-900 mb-2">Marketing Angles</h4>
                            <div className="space-y-2">
                              {analysis.goToMarket.marketingAngles.map((angle: any, index: number) => (
                                <div key={index} className="bg-purple-50 p-3 rounded border border-purple-200">
                                  <strong>{angle.angle}:</strong> {angle.message}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {analysis.goToMarket.productDescriptions && (
                          <div>
                            <h4 className="font-medium text-slate-900 mb-2">Product Descriptions</h4>
                            <div className="space-y-3">
                              {analysis.goToMarket.productDescriptions.map((desc: any, index: number) => (
                                <div key={index} className="border border-slate-200 rounded-lg p-3">
                                  <h5 className="font-medium text-slate-900 mb-1">{desc.tone} Tone</h5>
                                  <p className="text-slate-700 text-sm">{desc.description}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </CollapsibleContent>
                  </div>
                </Collapsible>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-slate-200">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
