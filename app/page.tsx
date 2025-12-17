"use client";

import { useState } from "react";
import { CsvUploader } from "@/components/csv-uploader";
import { RawCsvRow } from "@/types/schema";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Loader2, Wand2, CheckCircle2, ArrowRight } from "lucide-react";

export default function Home() {
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvPreview, setCsvPreview] = useState<RawCsvRow[]>([]);
  const [totalRows, setTotalRows] = useState<number>(0);
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [mappingResult, setMappingResult] = useState<Record<string, string | null> | null>(null);

  const handleUploadSuccess = (headers: string[], preview: RawCsvRow[], fullData: RawCsvRow[]) => {
    setCsvHeaders(headers);
    setCsvPreview(preview);
    setTotalRows(fullData.length);
    setMappingResult(null); 
  };

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          headers: csvHeaders, 
          preview: csvPreview 
        }),
      });

      if (!response.ok) throw new Error("API Error");

      const data = await response.json();
      setMappingResult(data);
    } catch (error) {
      console.error("Analysis failed", error);
      alert("Chyba při analýze dat. Zkontroluj konzoli a API klíč.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 p-8 flex flex-col items-center">
      <div className="max-w-4xl w-full space-y-8">
        
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">BANDITS AI Mapper</h1>
          <p className="text-slate-500">
            Inteligentní normalizace CSV dat. Nahrajte soubor a nechte AI pracovat.
          </p>
        </div>

        <CsvUploader onUploadSuccess={handleUploadSuccess} />

        {totalRows > 0 && (
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="border-b bg-slate-50/50">
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                Analýza souboru
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              
              <div className="flex gap-6 items-center">
                <div className="text-sm">
                  <span className="text-slate-500 mr-2">Počet řádků:</span>
                  <Badge variant="secondary" className="text-sm px-2 py-0.5">{totalRows}</Badge>
                </div>
                <div className="text-sm">
                  <span className="text-slate-500 mr-2">Počet sloupců:</span>
                  <Badge variant="secondary" className="text-sm px-2 py-0.5">{csvHeaders.length}</Badge>
                </div>
              </div>

              <div className="bg-slate-100 p-4 rounded-md border border-slate-200">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                  Nalezené sloupce v CSV:
                </p>
                <div className="flex flex-wrap gap-2">
                  {csvHeaders.map(header => (
                    <Badge key={header} variant="outline" className="bg-white hover:bg-white text-slate-700">
                      {header}
                    </Badge>
                  ))}
                </div>
              </div>

              {!mappingResult ? (
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-yellow-50 p-4 rounded-lg border border-yellow-100">
                  <div className="text-sm text-yellow-800 flex-1">
                    <strong>Připraveno k mapování.</strong> <br/>
                    Kliknutím odešlete strukturu sloupců do AI (GPT-5-mini), která navrhne propojení s naším modelem.
                  </div>
                  <Button 
                    onClick={handleAnalyze} 
                    disabled={isAnalyzing}
                    className="w-full sm:w-auto shrink-0"
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Analyzuji...
                      </>
                    ) : (
                      <>
                        <Wand2 className="mr-2 h-4 w-4" /> Spustit AI Mapování
                      </>
                    )}
                  </Button>
                </div>
              ) : (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-lg text-slate-900">Výsledek AI Mapování</h3>
                    <Badge variant="default" className="bg-green-600 hover:bg-green-700">Hotovo</Badge>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {Object.entries(mappingResult).map(([canonicalField, csvColumn]) => (
                      <div 
                        key={canonicalField} 
                        className="flex items-center justify-between p-3 border rounded-lg bg-white shadow-sm"
                      >
                        <div className="flex flex-col">
                          <span className="text-xs text-slate-400 uppercase font-bold">Model Field</span>
                          <span className="font-medium text-slate-700">{canonicalField}</span>
                        </div>
                        
                        <ArrowRight className="h-4 w-4 text-slate-300 mx-2" />

                        <div className="flex flex-col items-end">
                          <span className="text-xs text-slate-400 uppercase font-bold">CSV Column</span>
                          {csvColumn ? (
                            <span className="font-bold text-blue-600">{csvColumn}</span>
                          ) : (
                            <span className="text-slate-400 italic text-sm">Nenalezeno</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 p-4 bg-slate-50 rounded border text-center text-sm text-slate-500">
                    Mapování je hotové. V další fázi projektu zde bude tlačítko pro transformaci dat.
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