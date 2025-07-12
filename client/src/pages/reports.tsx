import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Trash2, Plus, FolderOpen } from "lucide-react";
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

  const { data: reports = [], isLoading } = useQuery<Report[]>({
    queryKey: ["/api/reports"],
  });

  console.log(
    "Reports component rendered, selectedReportId:",
    selectedReportId,
  );

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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <div className="h-32 sm:h-48 bg-slate-200 rounded-t-xl"></div>
                <CardContent className="p-3 sm:p-4 lg:p-6">
                  <div className="h-5 sm:h-6 bg-slate-200 rounded mb-2"></div>
                  <div className="h-3 sm:h-4 bg-slate-200 rounded mb-3 w-2/3"></div>
                  <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
          <div className="mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">
              My Saved Reports
            </h1>
            <p className="text-slate-600 text-sm sm:text-base">
              Click on a report to view the full analysis.
            </p>
          </div>

          {reports.length === 0 ? (
            <div className="text-center py-12 sm:py-16">
              <FolderOpen className="mx-auto h-12 w-12 sm:h-16 sm:w-16 text-slate-300 mb-4" />
              <h3 className="text-lg sm:text-xl font-semibold text-slate-900 mb-2">
                You haven't saved any reports yet.
              </h3>
              <p className="text-slate-600 mb-6 text-sm sm:text-base px-4">
                Create your first product analysis to get started.
              </p>
              <Link href="/">
                <Button className="text-sm sm:text-base">
                  <Plus className="w-4 h-4 mr-2" />
                  Analyze Your First Product
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {reports.map((report: Report) => (
                <Card
                  key={report.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => {
                    console.log(
                      "Card clicked, setting selectedReportId to:",
                      report.id,
                    );
                    setSelectedReportId(report.id);
                  }}
                >
                  <div className="relative">
                    {report.productImage ? (
                      <img
                        src={report.productImage}
                        alt={report.productName}
                        className="w-full h-32 sm:h-48 object-cover rounded-t-xl"
                      />
                    ) : (
                      <div className="w-full h-32 sm:h-48 bg-slate-200 rounded-t-xl flex items-center justify-center">
                        <span className="text-slate-500 text-sm">No image</span>
                      </div>
                    )}
                    <div className="absolute top-2 right-2 sm:top-3 sm:right-3 flex gap-2">
                      <Button
                        size="sm"
                        variant="destructive"
                        className="w-7 h-7 sm:w-8 sm:h-8 p-0"
                        onClick={(e) => handleDeleteReport(report.id, e)}
                        disabled={deleteReportMutation.isPending}
                        title="Delete Report"
                      >
                        <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                      </Button>
                    </div>
                  </div>
                  <CardContent className="p-3 sm:p-4 lg:p-6">
                    <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-1 truncate">
                      {report.productName}
                    </h3>
                    <p className="text-slate-600 text-xs sm:text-sm mb-2 sm:mb-3 truncate">
                      {report.productCategory}
                    </p>
                    <p className="text-xs text-slate-500">
                      Analyzed on:{" "}
                      {report.createdAt
                        ? new Date(report.createdAt).toLocaleDateString()
                        : "Unknown"}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Debug info */}
          {process.env.NODE_ENV === "development" && (
            <div className="fixed bottom-4 right-4 bg-black text-white p-2 rounded text-xs">
              selectedReportId: {selectedReportId}
            </div>
          )}
        </div>
      </div>

      {selectedReportId && (
        <ReportModal
          reportId={selectedReportId}
          isOpen={!!selectedReportId}
          onClose={() => {
            console.log("Modal close called");
            setSelectedReportId(null);
          }}
        />
      )}
    </>
  );
}
