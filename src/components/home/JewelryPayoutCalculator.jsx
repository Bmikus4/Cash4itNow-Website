import React, { useState } from "react";
import { Calculator } from "lucide-react";

const GRAMS_PER_OZ = 31.1035;
const GRAMS_PER_DWT = 1.55517; // pennyweight to grams
const PAYOUT_RATE = 0.95;

const METAL_OPTIONS = [
  { value: "gold", label: "Gold" },
  { value: "silver", label: "Silver" },
  { value: "platinum", label: "Platinum" },
];

const UNIT_OPTIONS = [
  { value: "grams", label: "Grams (g)" },
  { value: "dwt", label: "Pennyweights (dwt)" },
];

const KARAT_OPTIONS = [
  { value: 1, label: "24k (99.9% pure)" },
  { value: 22 / 24, label: "22k (91.7% pure)" },
  { value: 18 / 24, label: "18k (75% pure)" },
  { value: 14 / 24, label: "14k (58.3% pure)" },
  { value: 10 / 24, label: "10k (41.7% pure)" },
];

export default function JewelryPayoutCalculator({ prices }) {
  const [metal, setMetal] = useState("gold");
  const [unit, setUnit] = useState("grams");
  const [weight, setWeight] = useState("");
  const [karat, setKarat] = useState(14 / 24);

  const spotPerOz = prices?.[`${metal}_per_oz`];

  const weightInGrams =
    unit === "dwt"
      ? parseFloat(weight) * GRAMS_PER_DWT
      : parseFloat(weight);

  const purity = metal === "gold" ? karat : 1;
  const payout =
    spotPerOz && weightInGrams > 0
      ? (weightInGrams / GRAMS_PER_OZ) * spotPerOz * purity * PAYOUT_RATE
      : null;

  const fmt = (n) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(n);

  const selectClass =
    "w-full border-2 border-foreground bg-background text-foreground font-heading text-sm uppercase tracking-wide px-3 py-2 focus:outline-none focus:border-accent";

  const inputClass =
    "w-full border-2 border-foreground bg-background text-foreground font-heading text-sm px-3 py-2 focus:outline-none focus:border-accent placeholder:text-muted-foreground";

  return (
    <div className="border border-foreground/20 bg-foreground/5 p-4 mb-8">
      <div className="flex items-center gap-2 mb-4">
        <Calculator className="w-4 h-4 text-accent" />
        <span className="font-heading font-black text-xs uppercase tracking-widest text-foreground">
          Payout Estimator
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3">
        {/* Metal Type */}
        <div className="flex flex-col gap-1">
          <label className="font-heading text-xs uppercase tracking-widest text-muted-foreground">
            Metal
          </label>
          <select
            value={metal}
            onChange={(e) => setMetal(e.target.value)}
            className={selectClass}
          >
            {METAL_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        {/* Unit */}
        <div className="flex flex-col gap-1">
          <label className="font-heading text-xs uppercase tracking-widest text-muted-foreground">
            Unit
          </label>
          <select
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            className={selectClass}
          >
            {UNIT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        {/* Weight */}
        <div className="flex flex-col gap-1">
          <label className="font-heading text-xs uppercase tracking-widest text-muted-foreground">
            Weight ({unit === "dwt" ? "dwt" : "g"})
          </label>
          <input
            type="number"
            min="0"
            step="0.01"
            placeholder="0.00"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            className={inputClass}
          />
        </div>

        {/* Karat — only for gold */}
        {metal === "gold" && (
          <div className="flex flex-col gap-1">
            <label className="font-heading text-xs uppercase tracking-widest text-muted-foreground">
              Karat
            </label>
            <select
              value={karat}
              onChange={(e) => setKarat(parseFloat(e.target.value))}
              className={selectClass}
            >
              {KARAT_OPTIONS.map((o) => (
                <option key={o.label} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Result */}
      <div className="border-t border-foreground/20 pt-4">
        {!prices ? (
          <p className="text-muted-foreground text-xs">Loading live prices…</p>
        ) : payout !== null ? (
          <div className="flex items-baseline justify-between">
            <span className="font-heading font-black text-xs uppercase tracking-widest text-muted-foreground">
              Estimated Payout
            </span>
            <span className="font-heading font-black text-3xl text-accent">
              {fmt(payout)}
            </span>
          </div>
        ) : (
          <p className="text-muted-foreground text-xs">
            Enter a weight above to see your estimated payout.
          </p>
        )}
        <p className="text-muted-foreground text-xs mt-1">
          Based on 95% of current spot price. Actual offer may vary by item condition.
        </p>
      </div>
    </div>
  );
}