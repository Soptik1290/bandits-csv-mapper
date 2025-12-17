"use client"; // Říká Next.js, že toto běží v prohlížeči

import { useState } from "react";
import Papa from "papaparse"; // Knihovna na čtení CSV
import { UploadCloud, FileSpreadsheet, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RawCsvRow } from "@/types/schema";

interface CsvUploaderProps {
  onUploadSuccess: (headers: string[], preview: RawCsvRow[], fullData: RawCsvRow[]) => void;
}

export function CsvUploader({ onUploadSuccess }: CsvUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Funkce pro zpracování souboru
  const processFile = (file: File) => {
    setIsLoading(true);
    
    Papa.parse(file, {
      header: true, // První řádek bereme jako názvy sloupců
      skipEmptyLines: true,
      complete: (results) => {
        const data = results.data as RawCsvRow[];
        const headers = results.meta.fields || [];
        
        // Vezmeme prvních 5 řádků jako vzorek pro AI
        const preview = data.slice(0, 5);

        console.log("Načteno řádků:", data.length);
        console.log("Sloupce:", headers);

        // Pošleme data nahoru do hlavní aplikace
        onUploadSuccess(headers, preview, data);
        setIsLoading(false);
      },
      error: (error) => {
        console.error("Chyba při čtení CSV:", error);
        setIsLoading(false);
        alert("Chyba při čtení souboru.");
      }
    });
  };

  return (
    <Card className={`border-2 border-dashed transition-colors ${isDragging ? "border-blue-500 bg-blue-50" : "border-slate-300"}`}>
      <CardContent 
        className="flex flex-col items-center justify-center p-10 cursor-pointer relative"
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          const file = e.dataTransfer.files[0];
          if (file && file.type.includes("csv")) processFile(file);
        }}
      >
        <input 
          type="file" 
          accept=".csv"
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) processFile(file);
          }}
        />
        
        {isLoading ? (
          <div className="text-center space-y-3">
            <Loader2 className="h-12 w-12 text-blue-600 animate-spin mx-auto" />
            <p className="font-medium">Analyzuji strukturu CSV...</p>
          </div>
        ) : (
          <div className="text-center space-y-3">
            <div className="bg-slate-100 p-4 rounded-full w-fit mx-auto">
              <UploadCloud className="h-8 w-8 text-slate-600" />
            </div>
            <div>
              <p className="text-lg font-semibold text-slate-900">
                Klikni pro nahrání CSV
              </p>
              <p className="text-sm text-slate-500">
                nebo přetáhni soubor sem
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}