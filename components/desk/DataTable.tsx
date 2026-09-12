import type { ReactNode } from "react";

export function DataTable({
  headers,
  children,
  empty,
}: {
  headers: string[];
  children: ReactNode;
  empty?: string;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-left text-sm">
        <thead>
          <tr className="border-b border-gold-line/40 text-[11px] uppercase tracking-[0.16em] text-muted">
            {headers.map((h) => (
              <th key={h} className="px-3 py-3 font-medium">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gold-line/20">{children}</tbody>
      </table>
      {!children || (Array.isArray(children) && children.length === 0) ? (
        <p className="px-3 py-8 text-center text-sm text-muted">{empty ?? "No records yet."}</p>
      ) : null}
    </div>
  );
}
