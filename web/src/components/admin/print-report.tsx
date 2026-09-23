"use client";

export function PrintReportButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="no-print inline-flex h-12 items-center justify-center rounded-[2px] border border-line px-6 text-[12px] font-medium tracking-[0.16em] text-cream uppercase"
    >
      Print
    </button>
  );
}
