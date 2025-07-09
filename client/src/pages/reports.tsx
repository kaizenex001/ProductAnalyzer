import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Trash2, Plus, FolderOpen, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import ReportModal from "@/components/report-modal";
import { Link } from "wouter";
import type { Report } from "@shared/schema";

export default function Reports() {
  const [selectedReportId, setSelectedReportId] = useState<number | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: reports = [], isLoading } = useQuery({
    queryKey: ["/api/reports"],
  });

  const deleteReportMutation = useMutation({
    mutationFn: async (reportId: number) => {
      await apiRequest("DELETE", `/api/reports/${reportId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reports"] });
      toast({
        title: "Success",
        description: "Report deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete report",
        variant: "destructive",
      });
    },
  });

  const handleDeleteReport = (reportId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteReportMutation.mutate(reportId);
  };

  const handleDownloadPDF = (reportId: number, productName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const link = document.createElement('a');
    link.href = `/api/reports/${reportId}/pdf`;
    link.download = `${productName}-analysis.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <div className="h-48 bg-slate-200 rounded-t-xl"></div>
              <CardContent className="p-6">
                <div className="h-6 bg-slate-200 rounded mb-2"></div>
                <div className="h-4 bg-slate-200 rounded mb-3 w-2/3"></div>
                <div className="h-3 bg-slate-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">My Saved Reports</h1>
          <p className="text-slate-600">Click on a report to view the full analysis.</p>
        </div>

        {reports.length === 0 ? (
          <div className="text-center py-16">
            <FolderOpen className="mx-auto h-16 w-16 text-slate-300 mb-4" />
            <h3 className="text-xl font-semibold text-slate-900 mb-2">
              You haven't saved any reports yet.
            </h3>
            <p className="text-slate-600 mb-6">
              Create your first product analysis to get started.
            </p>
            <Link href="/">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Analyze Your First Product
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reports.map((report: Report) => (
              <Card
                key={report.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setSelectedReportId(report.id)}
              >
                <div className="relative">
                  {report.productImage ? (
                    <img
                      src={report.productImage}
                      alt={report.productName}
                      className="w-full h-48 object-cover rounded-t-xl"
                    />
                  ) : (
                    <div className="w-full h-48 bg-slate-200 rounded-t-xl flex items-center justify-center">
                      <span className="text-slate-500">No image</span>
                    </div>
                  )}
                  <div className="absolute top-3 right-3 flex gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      className="w-8 h-8 p-0 bg-white/90 hover:bg-white"
                      onClick={(e) => handleDownloadPDF(report.id, report.productName, e)}
                      title="Download PDF"
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      className="w-8 h-8 p-0"
                      onClick={(e) => handleDeleteReport(report.id, e)}
                      disabled={deleteReportMutation.isPending}
                      title="Delete Report"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-slate-900 mb-1">
                    {report.productName}
                  </h3>
                  <p className="text-slate-600 text-sm mb-3">
                    {report.productCategory}
                  </p>
                  <p className="text-xs text-slate-500">
                    Analyzed on: {new Date(report.createdAt).toLocaleDateString()}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {selectedReportId && (
        <ReportModal
          reportId={selectedReportId}
          isOpen={!!selectedReportId}
          onClose={() => setSelectedReportId(null)}
        />
      )}
    </>
  );
}
