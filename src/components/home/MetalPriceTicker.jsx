import React from "react";
import { TrendingUp } from "lucide-react";

const PAYOUT_RATE = 0.95;
const GRAMS_PER_OZ = 31.1035;

const fmt = (n) =>
  n != null
    ? new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 }).format(n)
    : "—";

const metals = (prices) => [
  {
    label: "Gold",
    spotOz: prices.gold_per_oz,
    payOz: prices.gold_per_oz * PAYOUT_RATE,
    payGram: (prices.gold_per_oz * PAYOUT_RATE) / GRAMS_PER_OZ,
    color: "text-yellow-500",
    bg: "bg-yellow-500/10",
    border: "border-yellow-500/30",
  },
  {
    label: "Silver",
    spotOz: prices.silver_per_oz,
    payOz: prices.silver_per_oz * PAYOUT_RATE,
    payGram: (prices.silver_per_oz * PAYOUT_RATE) / GRAMS_PER_OZ,
    color: "text-slate-400",
    bg: "bg-slate-400/10",
    border: "border-slate-400/30",
  },
  {
    label: "Platinum",
    spotOz: prices.platinum_per_oz,
    payOz: prices.platinum_per_oz * PAYOUT_RATE,
    payGram: (prices.platinum_per_oz * PAYOUT_RATE) / GRAMS_PER_OZ,
    color: "text-blue-300",
    bg: "bg-blue-300/10",
    border: "border-blue-300/30",
  },
];

export default function MetalPriceTicker({ prices, loading, lastUpdated }) {
  return (
    <div className="border border-foreground/20 bg-foreground/5 p-4 mb-6">
      <div className="flex items-center gap-2 mb-3">
        <TrendingUp className="w-4 h-4 text-accent" />
        <span className="font-heading font-black text-xs uppercase tracking-widest text-foreground">
          Live Spot Prices — We Pay Up to 95%
        </span>
        {lastUpdated && (
          <span className="ml-auto text-muted-foreground text-xs">
            Updated {lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </span>
        )}
      </div>

      {loading ? (
        <div className="flex gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex-1 h-16 bg-foreground/10 animate-pulse" />
          ))}
        </div>
      ) : prices ? (
        <div className="grid grid-cols-3 gap-3">
          {metals(prices).map((m) => (
            <div key={m.label} className={`p-3 border ${m.border} ${m.bg}`}>
              <p className={`font-heading font-black text-xs uppercase tracking-widest mb-1 ${m.color}`}>
                {m.label}
              </p>
              <p className="text-foreground font-heading font-black text-lg">
                {fmt(m.payOz)}<span className="text-xs font-body text-muted-foreground"> /oz</span>
              </p>
              <p className="text-muted-foreground text-xs">
                {fmt(m.payGram)}/gram &nbsp;·&nbsp; Spot: {fmt(m.spotOz)}/oz
              </p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground text-xs">Prices temporarily unavailable.</p>
      )}
    </div>
  );
}