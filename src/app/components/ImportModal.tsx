import React, { useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Upload, FileSpreadsheet, Check, AlertTriangle } from "lucide-react";
import { useFinance, EXPENSE_CATEGORIES, INCOME_CATEGORIES, ALL_CATEGORIES, type TransactionType } from "../context/FinanceContext";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onClose: () => void;
}

interface ParsedRow {
  [key: string]: string;
}

const FIELD_OPTIONS = ["date", "amount", "category", "description", "type", "skip"];

// M2: Sanitize CSV cell values to prevent formula injection
const sanitizeCSVCell = (val: string): string =>
  /^[=+\-@\t\r]/.test(val) ? `'${val}` : val;

export function ImportModal({ open, onClose }: Props) {
  const { addTransaction } = useFinance();
  const [step, setStep] = useState<"upload" | "map" | "preview" | "done">("upload");
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [importing, setImporting] = useState(false);
  const [importCount, setImportCount] = useState(0);
  const [dragOver, setDragOver] = useState(false);

  const parseCSV = (text: string): { headers: string[]; rows: ParsedRow[] } => {
    const lines = text.trim().split(/\r?\n/);
    if (lines.length < 2) return { headers: [], rows: [] };

    const hdrs = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""));
    const parsed: ParsedRow[] = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || [];
      const row: ParsedRow = {};
      hdrs.forEach((h, idx) => {
        row[h] = sanitizeCSVCell((values[idx] || "").trim().replace(/^"|"$/g, ""));
      });
      parsed.push(row);
    }
    return { headers: hdrs, rows: parsed };
  };

  const handleFile = useCallback((file: File) => {
    if (!file.name.endsWith(".csv")) { toast.error("Please upload a CSV file"); return; }
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const { headers: h, rows: r } = parseCSV(text);
      if (h.length === 0) { toast.error("Could not parse CSV"); return; }
      setHeaders(h);
      setRows(r);

      // Auto-map columns if names match
      const autoMap: Record<string, string> = {};
      h.forEach((header) => {
        const lower = header.toLowerCase();
        if (lower.includes("date")) autoMap[header] = "date";
        else if (lower.includes("amount")) autoMap[header] = "amount";
        else if (lower.includes("category") || lower.includes("categ")) autoMap[header] = "category";
        else if (lower.includes("description") || lower.includes("desc") || lower.includes("note")) autoMap[header] = "description";
        else if (lower.includes("type")) autoMap[header] = "type";
        else autoMap[header] = "skip";
      });
      setMapping(autoMap);
      setStep("map");
    };
    reader.readAsText(file);
  }, []);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length > 0) handleFile(e.dataTransfer.files[0]);
  };

  const handleImport = async () => {
    setImporting(true);
    let count = 0;
    const dateMapped = Object.entries(mapping).find(([, v]) => v === "date")?.[0];
    const amountMapped = Object.entries(mapping).find(([, v]) => v === "amount")?.[0];
    const categoryMapped = Object.entries(mapping).find(([, v]) => v === "category")?.[0];
    const descMapped = Object.entries(mapping).find(([, v]) => v === "description")?.[0];
    const typeMapped = Object.entries(mapping).find(([, v]) => v === "type")?.[0];

    if (!dateMapped || !amountMapped) { toast.error("Date and Amount columns must be mapped"); setImporting(false); return; }

    for (const row of rows) {
      const dateVal = row[dateMapped];
      const amountVal = parseFloat(row[amountMapped]);
      if (!dateVal || isNaN(amountVal) || amountVal <= 0) continue;

      const rawType = typeMapped ? row[typeMapped]?.toLowerCase() : "expense";
      const type: TransactionType = rawType === "income" ? "income" : "expense";
      const rawCategory = categoryMapped ? row[categoryMapped] : "";
      const category = ALL_CATEGORIES.includes(rawCategory) ? rawCategory : (type === "income" ? "Other Income" : "Other");
      const description = descMapped ? row[descMapped] : "";

      // Normalize date format
      let date = dateVal;
      if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dateVal)) {
        const parts = dateVal.split("/");
        date = `${parts[2]}-${parts[0].padStart(2, "0")}-${parts[1].padStart(2, "0")}`;
      }

      addTransaction({ amount: amountVal, category, description, date, type });
      count++;
    }

    setImportCount(count);
    setStep("done");
    setImporting(false);
  };

  const resetModal = () => {
    setStep("upload");
    setHeaders([]);
    setRows([]);
    setMapping({});
    setImportCount(0);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <motion.div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => { resetModal(); onClose(); }} />
          <motion.div
            className="relative w-full max-w-lg rounded-xl border border-border-default bg-surface-raised p-6 shadow-2xl max-h-[85vh] overflow-y-auto"
            initial={{ scale: 0.95, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.95, y: 20, opacity: 0 }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-text-primary text-base">Import Transactions</h2>
              <button onClick={() => { resetModal(); onClose(); }} className="rounded-md p-1.5 hover:bg-surface-hover text-text-tertiary">
                <X size={16} />
              </button>
            </div>

            {/* Step: Upload */}
            {step === "upload" && (
              <div
                className={`border-2 border-dashed rounded-xl p-10 text-center transition-colors ${dragOver ? "border-primary bg-primary-subtle" : "border-border-subtle"
                  }`}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
              >
                <FileSpreadsheet size={40} className="text-text-quaternary mx-auto mb-3" strokeWidth={1} />
                <p className="text-[13px] text-text-secondary mb-1">Drag & drop a CSV file here</p>
                <p className="text-[11px] text-text-ghost mb-4">or</p>
                <label className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-[13px] cursor-pointer hover:bg-primary-hover transition-colors">
                  <Upload size={14} /> Browse Files
                  <input type="file" accept=".csv" className="hidden" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
                </label>
              </div>
            )}

            {/* Step: Map Columns */}
            {step === "map" && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 p-3 rounded-lg bg-primary-subtle border border-primary/15">
                  <FileSpreadsheet size={14} className="text-primary" />
                  <p className="text-[12px] text-primary">{rows.length} rows found. Map your columns below.</p>
                </div>
                <div className="space-y-2">
                  {headers.map((h) => (
                    <div key={h} className="flex items-center gap-3">
                      <span className="text-[12px] text-text-secondary w-28 truncate shrink-0" title={h}>{h}</span>
                      <span className="text-text-ghost text-[11px]">→</span>
                      <select
                        value={mapping[h] || "skip"}
                        onChange={(e) => setMapping((p) => ({ ...p, [h]: e.target.value }))}
                        className="flex-1 rounded-md bg-surface-overlay border border-border-subtle px-2.5 py-1.5 text-[12px] text-text-primary focus:outline-none"
                      >
                        {FIELD_OPTIONS.map((f) => <option key={f} value={f}>{f === "skip" ? "— Skip —" : f.charAt(0).toUpperCase() + f.slice(1)}</option>)}
                      </select>
                    </div>
                  ))}
                </div>

                {/* Preview first 3 rows */}
                <div className="rounded-lg border border-border-subtle overflow-hidden">
                  <div className="bg-surface-active px-3 py-1.5 text-[11px] text-text-quaternary uppercase tracking-wide">Preview</div>
                  <div className="divide-y divide-border-subtle">
                    {rows.slice(0, 3).map((row, i) => (
                      <div key={i} className="px-3 py-2 text-[11px] text-text-tertiary truncate">
                        {Object.entries(mapping)
                          .filter(([, v]) => v !== "skip")
                          .map(([header, field]) => `${field}: ${row[header]}`)
                          .join(" · ")}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2">
                  <button onClick={() => setStep("upload")} className="flex-1 rounded-lg border border-border-subtle py-2.5 text-sm text-text-secondary hover:bg-surface-hover transition-colors">Back</button>
                  <motion.button
                    onClick={handleImport}
                    disabled={importing}
                    className="flex-1 rounded-lg bg-primary py-2.5 text-sm text-primary-foreground hover:bg-primary-hover transition-colors disabled:opacity-50"
                    whileTap={{ scale: 0.99 }}
                  >
                    {importing ? "Importing..." : `Import ${rows.length} rows`}
                  </motion.button>
                </div>
              </div>
            )}

            {/* Step: Done */}
            {step === "done" && (
              <div className="text-center py-6">
                <div className="w-14 h-14 rounded-full bg-success-subtle flex items-center justify-center mx-auto mb-4">
                  <Check size={28} className="text-success" strokeWidth={1.5} />
                </div>
                <p className="text-base text-text-primary mb-1">Import complete!</p>
                <p className="text-[13px] text-text-tertiary">{importCount} transaction{importCount !== 1 ? "s" : ""} imported successfully.</p>
                <button
                  onClick={() => { resetModal(); onClose(); }}
                  className="mt-4 px-6 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm hover:bg-primary-hover transition-colors"
                >
                  Done
                </button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
