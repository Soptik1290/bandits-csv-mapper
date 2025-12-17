"use client";

import { useState } from "react";
import { CsvUploader } from "@/components/csv-uploader";
import { RawCsvRow } from "@/types/schema";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function Home() {
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvPreview, setCsvPreview] = useState<RawCsvRow[]>([]);
  const [totalRows, setTotalRows] = useState<number>(0);

  return (
    <main className="min-h-screen bg-slate-50 p-8 flex flex-col items-center">
      <div className="max-w-4xl w-full space-y-8">
        
        {/* Hlavička */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">BANDITS AI Mapper</h1>
          <p className="text-slate-500">
            Inteligentní normalizace CSV dat. Nahrajte soubor a nechte AI pracovat.
          </p>
        </div>

        {/* Upload Sekce */}
        <CsvUploader 
          onUploadSuccess={(headers, preview, fullData) => {
            setCsvHeaders(headers);
            setCsvPreview(preview);
            setTotalRows(fullData.length);
          }} 
        />

        {/* Sekce s výsledky - zobrazí se až po nahrání */}
        {totalRows > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Analýza souboru</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4 items-center">
                <div className="text-sm font-medium">Počet řádků: <Badge variant="secondary">{totalRows}</Badge></div>
                <div className="text-sm font-medium">Počet sloupců: <Badge variant="secondary">{csvHeaders.length}</Badge></div>
              </div>

              <div className="bg-slate-100 p-4 rounded-md">
                <p className="text-sm font-semibold mb-2">Detekované sloupce:</p>
                <div className="flex flex-wrap gap-2">
                  {csvHeaders.map(header => (
                    <Badge key={header} variant="outline" className="bg-white">
                      {header}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Tady později přidáme tlačítko "Spustit AI Mapování" */}
              <div className="p-4 border rounded bg-yellow-50 text-yellow-800 text-sm">
                AI je připravena k mapování. V dalším kroku pošleme tyto sloupce do LLM.
              </div>
            </CardContent>
          </Card>
        )}

      </div>
    </main>
  );
}