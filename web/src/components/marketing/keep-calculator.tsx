"use client";

import { useId, useState } from "react";
import { BUILD_SIZES, EXAMPLE, REVENUE_PRESETS, TERMS, illustrate, kes } from "@/config/partnership";

const MAX_REVENUE = 100_000_000;

function compact(value: number): string {
  if (value >= 1_000_000) return `${value / 1_000_000}M`;
  if (value >= 1_000) return `${value / 1_000}K`;
  return String(value);
}

export function KeepCalculator() {
  const revenueId = useId();
  const [revenue, setRevenue] = useState<number>(1_000_000);
  const [size, setSize] = useState<(typeof BUILD_SIZES)[number]["key"]>("medium");
  const build = BUILD_SIZES.find((item) => item.key === size) ?? BUILD_SIZES[1];
  const safeRevenue = Number.isFinite(revenue) ? Math.min(Math.max(revenue, 0), MAX_REVENUE) : 0;
  const x = illustrate({ ...EXAMPLE, monthlyRevenue: safeRevenue, buildCost: build.cost });
  const years = x.monthsToCap / 12;

  return (
    <div className="grid gap-px overflow-hidden rounded-[6px] border border-line bg-line lg:grid-cols-[0.9fr_1.1fr]">
      <div className="bg-ink-2 p-6 sm:p-8">
        <label htmlFor={revenueId} className="text-sm text-cream">
          Your expected monthly revenue
        </label>
        <div className="mt-3 flex items-center rounded-[4px] border border-line bg-ink px-4 focus-within:border-gold/60">
          <span className="text-sm text-mute">KES</span>
          <input
            id={revenueId}
            type="number"
            inputMode="numeric"
            min={0}
            step={50_000}
            value={Number.isFinite(revenue) ? revenue : ""}
            onChange={(event) => setRevenue(event.target.valueAsNumber)}
            className="h-14 w-full bg-transparent px-3 text-2xl text-cream outline-none"
          />
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {REVENUE_PRESETS.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setRevenue(value)}
              className={`min-h-10 rounded-full border px-4 text-sm transition-colors ${
                revenue === value ? "border-gold bg-gold/10 text-gold" : "border-line text-mute hover:text-cream"
              }`}
            >
              {compact(value)}
            </button>
          ))}
        </div>

        <fieldset className="mt-8">
          <legend className="text-sm text-cream">Size of the build</legend>
          <div className="mt-3 grid gap-2">
            {BUILD_SIZES.map((item) => (
              <label
                key={item.key}
                className={`flex min-h-14 cursor-pointer items-center justify-between gap-4 rounded-[4px] border px-4 py-3 transition-colors ${
                  size === item.key ? "border-gold/70 bg-gold/5" : "border-line hover:border-cream/30"
                }`}
              >
                <span>
                  <input
                    type="radio"
                    name="build-size"
                    value={item.key}
                    checked={size === item.key}
                    onChange={() => setSize(item.key)}
                    className="sr-only"
                  />
                  <span className="block text-sm text-cream">{item.label}</span>
                  <span className="block text-xs text-mute">{item.note}</span>
                </span>
                <span className="font-mono text-xs text-mute">{kes(item.cost)}</span>
              </label>
            ))}
          </div>
        </fieldset>
      </div>

      <div className="bg-ink p-6 sm:p-8" aria-live="polite">
        <p className="text-sm text-mute">Each month, while the build is being repaid</p>
        <p className="display mt-2 text-6xl leading-none text-cream sm:text-7xl">
          {Math.round(x.keepsEarlyPercent)}%
        </p>
        <p className="mt-2 text-sm text-cream">
          You keep {kes(x.ventureKeepsEarly)} of {kes(safeRevenue)}
        </p>

        <dl className="mt-8 divide-y divide-line border-y border-line text-sm">
          <div className="flex justify-between gap-4 py-3">
            <dt className="text-mute">Revenue share ({EXAMPLE.revenueShare}%)</dt>
            <dd className="font-mono text-gold">{kes(x.share)}</dd>
          </div>
          <div className="flex justify-between gap-4 py-3">
            <dt className="text-mute">Platform fee ({EXAMPLE.platformFee}%)</dt>
            <dd className="font-mono text-cream/80">{kes(x.platform)}</dd>
          </div>
          <div className="flex justify-between gap-4 py-3">
            <dt className="text-mute">Build repaid after</dt>
            <dd className="font-mono text-cream">
              {safeRevenue > 0 ? `${x.monthsToCap} months${years >= 1 ? ` (~${years.toFixed(1)} yrs)` : ""}` : "—"}
            </dd>
          </div>
          <div className="flex justify-between gap-4 py-3">
            <dt className="text-mute">Then you keep</dt>
            <dd className="font-mono text-leaf">
              {Math.round(x.keepsLaterPercent)}% · {kes(x.ventureKeepsLater)}
            </dd>
          </div>
        </dl>

        <p className="mt-6 text-xs leading-relaxed text-mute">
          Illustrative terms: {EXAMPLE.revenueShare}% revenue share until Pesara recovers{" "}
          {EXAMPLE.recoveryMultiple}× the build, then {EXAMPLE.tail}%; {EXAMPLE.platformFee}% platform fee;{" "}
          {EXAMPLE.equity}% equity (range {TERMS.equity.min}–{TERMS.equity.max}%). Your real terms are agreed
          in writing for your venture.
        </p>
      </div>
    </div>
  );
}
