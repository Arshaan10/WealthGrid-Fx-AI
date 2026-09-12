"use client";

import { GoldButton } from "@/components/brand/GoldButton";

export function ReportActions({
  filename,
  headers,
  rows,
}: {
  filename: string;
  headers: string[];
  rows: string[][];
}) {
  function downloadCsv() {
    const escape = (cell: string) => `"${cell.replaceAll('"', '""')}"`;
    const csv = [headers, ...rows].map((line) => line.map(escape).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="no-print flex flex-wrap gap-2">
      <GoldButton type="button" onClick={downloadCsv} className="px-4 py-2 text-xs">
        Export CSV
      </GoldButton>
      <GoldButton type="button" variant="ghost" onClick={() => window.print()} className="px-4 py-2 text-xs">
        Print
      </GoldButton>
    </div>
  );
}
