"use client";

import { useState } from "react";
import Papa from "papaparse";
import { UploadCloud, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { RawCsvRow } from "@/types/schema";

interface CsvUploaderProps {
  onUploadSuccess: (headers: string[], preview: RawCsvRow[], fullData: RawCsvRow[]) => void;
}

function isProbablyTransposedCsv(headers: string[], data: RawCsvRow[]): boolean {
  // Typical "pivoted/transposed" CSV pattern:
  // - very few rows (attributes)
  // - very many columns (entities)
  // - first header is an attribute-name column (e.g. ProductKey)
  // - most other headers are numeric IDs (1..999)
  if (!headers || headers.length < 5) return false;
  if (!data || data.length < 2) return false;

  const rowCount = data.length;
  const colCount = headers.length;

  // Heuristic: way more columns than rows
  if (colCount < 50) return false;
  if (rowCount > 50) return false;
  if (rowCount >= colCount) return false;

  const firstHeader = headers[0];
  if (!firstHeader) return false;

  const sampleHeaderCount = Math.min(30, colCount - 1);
  const numericHeaderCount = headers
    .slice(1, 1 + sampleHeaderCount)
    .filter((h) => typeof h === "string" && /^\d+$/.test(h.trim())).length;

  if (numericHeaderCount < Math.min(5, sampleHeaderCount)) return false;

  const fieldNames = data
    .slice(0, 10)
    .map((row) => row?.[firstHeader])
    .filter((v): v is string | number => v !== null && v !== undefined)
    .map((v) => String(v).trim())
    .filter((v) => v.length > 0);

  // Field-name column should look like labels (not numeric IDs)
  const nonNumericFieldNames = fieldNames.filter((v) => !/^\d+$/.test(v)).length;
  const uniqueFieldNames = new Set(fieldNames).size;

  return nonNumericFieldNames >= Math.min(3, fieldNames.length) && uniqueFieldNames >= Math.min(3, fieldNames.length);
}

function transposeAttributeRowsToRecords(headers: string[], data: RawCsvRow[]): { headers: string[]; data: RawCsvRow[] } {
  const firstHeader = headers[0];
  const idHeaders = headers.slice(1).filter((h) => h && String(h).trim().length > 0);

  // Prepare one record per ID column
  const recordsById = new Map<string, RawCsvRow>();
  idHeaders.forEach((id) => {
    const key = String(id).trim();
    recordsById.set(key, { [firstHeader]: key });
  });

  // Keep header order stable: [firstHeader, ...fieldNamesInOrder]
  const outHeaders: string[] = [firstHeader];
  const seen = new Set<string>(outHeaders);

  for (const row of data) {
    const rawFieldName = row?.[firstHeader];
    const fieldName = rawFieldName !== null && rawFieldName !== undefined ? String(rawFieldName).trim() : "";
    if (!fieldName) continue;

    if (!seen.has(fieldName)) {
      seen.add(fieldName);
      outHeaders.push(fieldName);
    }

    for (const id of idHeaders) {
      const idKey = String(id).trim();
      const rec = recordsById.get(idKey);
      if (!rec) continue;

      // Preserve empty cells as null (not undefined)
      const hasValue = Object.prototype.hasOwnProperty.call(row, id);
      rec[fieldName] = hasValue ? (row[id] as any) : null;
    }
  }

  return { headers: outHeaders, data: Array.from(recordsById.values()) };
}

function isDelimiterOnlyLine(line: string, delimiter: string): boolean {
  // Lines like ";;;;;;" or ",,,," are not empty for most parsers, but carry no data.
  // Remove delimiter characters and whitespace; if nothing remains, the line is junk.
  const withoutDelims = line.split(delimiter).join("");
  return withoutDelims.trim().length === 0;
}

function findHeaderIndex(lines: string[], delimiter: string): number {
  // Scan early lines and choose the first "best" header candidate:
  // - contains delimiter
  // - not delimiter-only junk like ";;;;;"
  // - has at least 2 non-empty cells
  // - prefers lines with the most columns (helps skip preambles)
  const scanLimit = Math.min(200, lines.length);
  let bestIdx = 0;
  let bestCellCount = 0;

  for (let i = 0; i < scanLimit; i++) {
    const line = lines[i] ?? "";
    if (!line) continue;

    const delimsInLine = (line.match(new RegExp(`\\${delimiter}`, "g")) || []).length;
    if (delimsInLine < 1) continue;
    if (isDelimiterOnlyLine(line, delimiter)) continue;

    const cells = line.split(delimiter);
    const nonEmpty = cells.filter((c) => c.trim().length > 0).length;
    if (nonEmpty < 2) continue;

    if (cells.length > bestCellCount) {
      bestCellCount = cells.length;
      bestIdx = i;
    }
  }

  return bestCellCount > 0 ? bestIdx : 0;
}

export function CsvUploader({ onUploadSuccess }: CsvUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const processFile = (file: File) => {
    setIsLoading(true);

    // Read the file as plain text (FileReader) so we can do delimiter/header heuristics first.
    const reader = new FileReader();
    
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) {
        setIsLoading(false);
        return;
      }

      // Split into lines (handles \n and \r\n).
      const lines = text.split(/\r\n|\n|\r/);
      
      // Detect delimiter (comma vs semicolon) from a small sample.
      const sampleLines = lines.slice(0, 20);
      let commaCount = 0;
      let semicolonCount = 0;

      sampleLines.forEach(line => {
        commaCount += (line.match(/,/g) || []).length;
        semicolonCount += (line.match(/;/g) || []).length;
      });

      const delimiter = semicolonCount > commaCount ? ";" : ",";
      console.log(`Smart Parser: Detected delimiter -> "${delimiter}"`);

      // Detect header row (supports preambles/junk lines like ";;;;;;").
      const headerIndex = findHeaderIndex(lines, delimiter);

      console.log(`Smart Parser: Data starts at row index ${headerIndex}`);

      // Remove "junk" rows like ";;;;;;;" that would otherwise become empty records.
      const cleanLines = lines.slice(headerIndex).filter((line) => !isDelimiterOnlyLine(line, delimiter));
      const cleanCsvString = cleanLines.join("\n");

      // Parse the cleaned CSV string.
      Papa.parse(cleanCsvString, {
        header: true,
        skipEmptyLines: true,
        delimiter: delimiter,
        complete: (results) => {
          let data = results.data as RawCsvRow[];
          let headers = (results.meta.fields || []).filter((h): h is string => !!h && String(h).trim().length > 0);

          if (headers.length === 0 || data.length === 0) {
            setIsLoading(false);
            alert("No data found. Please check the CSV format.");
            return;
          }

          // Detect + transpose "pivoted" CSVs where rows are attributes and columns are entities.
          // Example input:
          // ProductKey;1;2;3...
          // Product Name;...;...;...
          // Brand;...;...;...
          if (isProbablyTransposedCsv(headers, data)) {
            const transposed = transposeAttributeRowsToRecords(headers, data);
            headers = transposed.headers;
            data = transposed.data;
            console.log(`Smart Parser: Detected transposed CSV -> converted to ${data.length} rows and ${headers.length} columns`);
          }

          // Normalize: empty strings -> null, remove fully empty rows.
          data = data
            .map((row) => {
              const out: RawCsvRow = {};
              headers.forEach((h) => {
                const v = (row as any)?.[h];
                out[h] = v === "" || v === undefined ? null : v;
              });
              return out;
            })
            .filter((row) => Object.values(row).some((v) => v !== null && v !== "" && v !== undefined));

          const preview = data.slice(0, 5);
          onUploadSuccess(headers, preview, data);
          setIsLoading(false);
        },
        error: (err: any) => {
          console.error("PapaParse error:", err);
          setIsLoading(false);
          alert("Failed to parse the CSV file.");
        }
      });
    };

    reader.onerror = () => {
      alert("Failed to read the file.");
      setIsLoading(false);
    };

    reader.readAsText(file);
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
          if (file) processFile(file);
        }}
      >
        <input 
          type="file" 
          accept=".csv,.txt"
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) processFile(file);
          }}
        />
        
        {isLoading ? (
          <div className="text-center space-y-3">
            <Loader2 className="h-12 w-12 text-blue-600 animate-spin mx-auto" />
            <p className="font-medium text-slate-600">
              Scanning file...
            </p>
          </div>
        ) : (
          <div className="text-center space-y-3">
            <div className="bg-slate-100 p-4 rounded-full w-fit mx-auto">
              <UploadCloud className="h-8 w-8 text-slate-600" />
            </div>
            <div>
              <p className="text-lg font-semibold text-slate-900">
                Upload a CSV file
              </p>
              <p className="text-sm text-slate-500">
                Supports comma/semicolon delimiters and preambles before the header row
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}