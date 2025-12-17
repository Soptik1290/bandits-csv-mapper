"use client";

import { useState } from "react";
import { CsvUploader } from "@/components/csv-uploader";
import { RawCsvRow, CanonicalProduct } from "@/types/schema";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Wand2, CheckCircle2, ArrowRight, FileOutput, Sparkles } from "lucide-react";

export default function Home() {
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvPreview, setCsvPreview] = useState<RawCsvRow[]>([]);
  const [fullCsvData, setFullCsvData] = useState<RawCsvRow[]>([]);
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [mappingResult, setMappingResult] = useState<Record<string, string | null> | null>(null);

  const [finalData, setFinalData] = useState<CanonicalProduct[]>([]);
  
  const [isEnriching, setIsEnriching] = useState(false);

  const handleUploadSuccess = (headers: string[], preview: RawCsvRow[], fullData: RawCsvRow[]) => {
    setCsvHeaders(headers);
    setCsvPreview(preview);
    setFullCsvData(fullData);
    setMappingResult(null);
    setFinalData([]);
  };

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ headers: csvHeaders, preview: csvPreview }),
      });
      if (!response.ok) throw new Error("API Error");
      const data = await response.json();
      setMappingResult(data);
    } catch (error) {
      console.error(error);
      alert("Analysis failed.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleTransform = () => {
    if (!mappingResult || !fullCsvData.length) return;
    const transformed = fullCsvData.map((row, index) => {
      const newRow: any = { id: String(index) };
      Object.entries(mappingResult).forEach(([can, csv]) => {
        if (csv && row[csv] !== undefined) newRow[can] = row[csv];
        else newRow[can] = null;
      });
      return newRow as CanonicalProduct;
    });
    setFinalData(transformed);
  };

  const handleEnrich = async () => {
    setIsEnriching(true);
    try {
      const batch = finalData.slice(0, 10);
      
      const response = await fetch('/api/enrich', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ products: batch }),
      });

      if (!response.ok) throw new Error("Enrich failed");
      
      const descriptionsMap = await response.json();

      const updatedData = [...finalData];
      for (let i = 0; i < 10 && i < updatedData.length; i++) {
        const id = updatedData[i].id;
        if (id && descriptionsMap[id]) {
          updatedData[i].enriched_description = descriptionsMap[id];
        }
      }
      setFinalData(updatedData);
      
    } catch (error) {
      console.error(error);
      alert("Enrichment failed.");
    } finally {
      setIsEnriching(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 p-8 flex flex-col items-center">
      <div className="max-w-7xl w-full space-y-8">
        
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">BANDITS AI Mapper</h1>
          <p className="text-slate-500">AI-First CSV Normalization Tool</p>
        </div>

        <CsvUploader onUploadSuccess={handleUploadSuccess} />

        {fullCsvData.length > 0 && (
          <Card>
            <CardHeader className="border-b bg-slate-50/50">
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                Workspace
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              
              <div className="flex gap-4 text-sm text-slate-600">
                <div>Rows: <strong>{fullCsvData.length}</strong></div>
                <div>Columns: <strong>{csvHeaders.length}</strong></div>
              </div>

              {!mappingResult ? (
                <div className="bg-yellow-50 p-6 rounded-lg border border-yellow-100 flex flex-col items-center text-center gap-4">
                  <h3 className="font-semibold text-yellow-900">Step 1: AI Structure Analysis</h3>
                  <Button onClick={handleAnalyze} disabled={isAnalyzing}>
                    {isAnalyzing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
                    Analyze Columns
                  </Button>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="col-span-2 grid grid-cols-2 gap-2 border p-4 rounded bg-slate-50 text-sm">
                       {Object.entries(mappingResult).map(([can, csv]) => (
                         <div key={can} className="flex justify-between">
                           <span className="text-slate-500">{can}</span>
                           <span className="font-mono font-bold text-blue-600">{csv || "-"}</span>
                         </div>
                       ))}
                    </div>
                    
                    <div className="flex flex-col justify-center items-center gap-4 p-4 border rounded bg-blue-50">
                      <h3 className="font-semibold text-blue-900">Step 2: Transformation</h3>
                      <Button onClick={handleTransform} className="w-full" disabled={finalData.length > 0}>
                        <FileOutput className="mr-2 h-4 w-4" />
                        Transform Data
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {finalData.length > 0 && (
                <div className="mt-8 space-y-4 animate-in fade-in slide-in-from-bottom-8">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xl font-bold">Results Preview</h3>
                    
                    <Button 
                      onClick={handleEnrich} 
                      disabled={isEnriching || !!finalData[0].enriched_description}
                      variant="outline"
                      className="border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100 hover:text-purple-900"
                    >
                      {isEnriching ? (
                         <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                         <Sparkles className="mr-2 h-4 w-4" />
                      )}
                      {finalData[0].enriched_description ? "Enriched!" : "Bonus: Enrich First 10"}
                    </Button>
                  </div>

                  <div className="border rounded-md overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[100px]">ID</TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead>Year</TableHead>
                          <TableHead className="w-[400px]">AI Description</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {finalData.slice(0, 10).map((product, i) => (
                          <TableRow key={i}>
                            <TableCell className="font-medium text-xs">{product.id || "-"}</TableCell>
                            <TableCell>{product.name || "-"}</TableCell>
                            <TableCell>{product.category || "-"}</TableCell>
                            <TableCell>{product.year || "-"}</TableCell>
                            <TableCell className="text-xs text-slate-600 italic">
                              {product.enriched_description ? (
                                <span className="text-purple-700 font-medium">
                                  {product.enriched_description}
                                </span>
                              ) : (
                                <span className="opacity-30">Waiting for enrichment...</span>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}

            </CardContent>
          </Card>
        )}
      </div>
    </main>
  );
}