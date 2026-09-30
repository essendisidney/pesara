import { EXAMPLE, kes, splitPayment } from "@/config/partnership";

const PAYMENT = 2_000;

const tone = {
  venture: { bar: "bg-leaf", text: "text-cream" },
  revenue: { bar: "bg-gold", text: "text-gold" },
  platform: { bar: "bg-cream/70", text: "text-cream/80" },
} as const;

/**
 * The co-build model in one picture: a customer payment arrives and is split at
 * settlement. Figures come from the illustrative terms in config/partnership.ts.
 */
export function SettlementVisual() {
  const lines = splitPayment(PAYMENT);
  return (
    <figure
      className="relative mx-auto w-full max-w-md overflow-hidden rounded-[20px] border border-line bg-ink-2 shadow-[0_40px_120px_-40px_rgba(47,143,98,0.45)]"
      aria-label={`Illustration: a ${kes(PAYMENT)} payment split at settlement`}
    >
      <div className="city-grid pointer-events-none absolute inset-0 opacity-50" />
      <div className="relative p-6 sm:p-8">
        <div className="flex items-center justify-between text-[12px] text-mute">
          <span className="inline-flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-leaf settle-pulse" />
            M-Pesa payment received
          </span>
          <span className="font-mono">09:41</span>
        </div>
        <p className="mt-5 text-5xl font-medium tracking-[-0.04em] sm:text-6xl">{kes(PAYMENT)}</p>
        <p className="mt-2 text-sm text-mute">From a customer, into the venture&apos;s account on Pesara Rails</p>

        <div className="mt-8 flex h-3 w-full overflow-hidden rounded-full bg-white/5" aria-hidden>
          {lines.map((line, index) => (
            <span
              key={line.key}
              className={`${tone[line.key].bar} settle-grow h-full`}
              style={{ width: `${line.percent}%`, animationDelay: `${index * 180}ms` }}
            />
          ))}
        </div>

        <p className="mt-6 text-[12px] font-medium tracking-[0.14em] text-mute uppercase">
          Split at settlement
        </p>
        <dl className="mt-3 divide-y divide-line">
          {lines.map((line) => (
            <div key={line.key} className="flex items-center justify-between gap-4 py-3">
              <dt className="flex items-center gap-3 text-sm text-cream">
                <span className={`h-2.5 w-2.5 rounded-full ${tone[line.key].bar}`} aria-hidden />
                {line.label}
              </dt>
              <dd className={`text-right font-mono text-sm ${tone[line.key].text}`}>
                {kes(line.amount)} <span className="text-mute">· {line.percent}%</span>
              </dd>
            </div>
          ))}
        </dl>
        <figcaption className="mt-5 text-[12px] leading-relaxed text-mute">
          Illustrative terms. The revenue share drops to {EXAMPLE.tail}% once Pesara has recovered{" "}
          {EXAMPLE.recoveryMultiple}× the build cost.
        </figcaption>
      </div>
    </figure>
  );
}
