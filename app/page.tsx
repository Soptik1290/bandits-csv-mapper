"use client";

import { useState } from "react";
import { CsvUploader } from "@/components/csv-uploader";
import { RawCsvRow, CanonicalProduct } from "@/types/schema";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Wand2, CheckCircle2, ArrowRight, FileOutput } from "lucide-react";

export default function Home() {
  // Data States
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvPreview, setCsvPreview] = useState<RawCsvRow[]>([]); // Jen ukázka
  const [fullCsvData, setFullCsvData] = useState<RawCsvRow[]>([]); // Všechna data
  
  // AI Mapping States
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [mappingResult, setMappingResult] = useState<Record<string, string | null> | null>(null);

  // Final Data States
  const [finalData, setFinalData] = useState<CanonicalProduct[]>([]);

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
      console.error("Analysis failed", error);
      alert("Chyba při analýze dat.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Tuhle funkci spouštíme lokálně - neplýtváme tokeny na transformaci 
  const handleTransform = () => {
    if (!mappingResult || !fullCsvData.length) return;

    const transformed = fullCsvData.map((row, index) => {
      const newRow: any = { id: String(index) }; // Fallback ID
      
      // Pro každé pole z našeho kanonického modelu najdeme hodnotu v CSV
      Object.entries(mappingResult).forEach(([canonicalField, csvColumn]) => {
        if (csvColumn && row[csvColumn] !== undefined) {
          newRow[canonicalField] = row[csvColumn];
        } else {
          newRow[canonicalField] = null; // Pokud mapování chybí, dáme null [cite: 40]
        }
      });
      return newRow as CanonicalProduct;
    });

    setFinalData(transformed);
  };

  return (
    <main className="min-h-screen bg-slate-50 p-8 flex flex-col items-center">
      <div className="max-w-6xl w-full space-y-8">
        
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
              
              {/* Statistiky */}
              <div className="flex gap-4 text-sm text-slate-600">
                <div>Řádků: <strong>{fullCsvData.length}</strong></div>
                <div>Sloupců: <strong>{csvHeaders.length}</strong></div>
              </div>

              {/* 1. KROK: AI Analýza */}
              {!mappingResult ? (
                <div className="bg-yellow-50 p-6 rounded-lg border border-yellow-100 flex flex-col items-center text-center gap-4">
                  <h3 className="font-semibold text-yellow-900">Krok 1: AI Analýza struktury</h3>
                  <p className="text-sm text-yellow-700 max-w-lg">
                    AI prozkoumá sloupce (např. <em>{csvHeaders.slice(0,3).join(", ")}...</em>) a navrhne mapování na náš model.
                  </p>
                  <Button onClick={handleAnalyze} disabled={isAnalyzing}>
                    {isAnalyzing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
                    Spustit AI Mapování
                  </Button>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Výsledky mapování */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="col-span-2 grid grid-cols-2 gap-2 border p-4 rounded bg-slate-50">
                       {Object.entries(mappingResult).map(([can, csv]) => (
                         <div key={can} className="text-sm flex justify-between">
                           <span className="text-slate-500">{can}</span>
                           <span className="font-mono font-bold text-blue-600">{csv || "-"}</span>
                         </div>
                       ))}
                    </div>
                    
                    {/* 2. KROK: Transformace */}
                    <div className="flex flex-col justify-center items-center gap-4 p-4 border rounded bg-blue-50">
                      <h3 className="font-semibold text-blue-900">Krok 2: Transformace</h3>
                      <p className="text-xs text-blue-700 text-center">
                        Aplikovat mapování na všech {fullCsvData.length} řádků.
                      </p>
                      <Button onClick={handleTransform} className="w-full" disabled={finalData.length > 0}>
                        <FileOutput className="mr-2 h-4 w-4" />
                        Aplikovat a Zobrazit
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* 3. KROK: Tabulka výsledků */}
              {finalData.length > 0 && (
                <div className="mt-8 space-y-4 animate-in fade-in slide-in-from-bottom-8">
                  <h3 className="text-xl font-bold">Výsledek ({finalData.length} produktů)</h3>
                  <div className="border rounded-md overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>ID</TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead>Price</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead>Brand</TableHead>
                          <TableHead>Year</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {finalData.slice(0, 10).map((product, i) => (
                          <TableRow key={i}>
                            <TableCell className="font-medium">{product.id || "-"}</TableCell>
                            <TableCell>{product.name || "-"}</TableCell>
                            <TableCell>{product.price ? `$${product.price}` : "-"}</TableCell>
                            <TableCell>{product.category || "-"}</TableCell>
                            <TableCell>{product.brand || "-"}</TableCell>
                            <TableCell>{product.year || "-"}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  <p className="text-xs text-slate-400 text-center">Zobrazuji pouze prvních 10 produktů z {finalData.length}.</p>
                </div>
              )}

            </CardContent>
          </Card>
        )}
      </div>
    </main>
  );
}