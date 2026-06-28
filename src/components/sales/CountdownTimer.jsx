import React, { useState, useEffect } from "react";

function getRemaining(targetDate, targetTime) {
  const now = new Date();
  const target = new Date(targetDate);
  if (targetTime) {
    const [h, m] = targetTime.split(":").map(Number);
    target.setHours(h || 0, m || 0, 0, 0);
  } else {
    target.setHours(8, 0, 0, 0);
  }
  const diff = target.getTime() - now.getTime();
  if (diff <= 0) return { done: true, days: 0, hours: 0, minutes: 0, seconds: 0 };
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);
  return { done: false, days, hours, minutes, seconds };
}

export default function CountdownTimer({ date, time }) {
  const [remaining, setRemaining] = useState(() => getRemaining(date, time));

  useEffect(() => {
    const interval = setInterval(() => setRemaining(getRemaining(date, time)), 1000);
    return () => clearInterval(interval);
  }, [date, time]);

  if (remaining.done) {
    return (
      <div className="mt-4 border-2 border-accent/40 bg-accent/10 px-3 py-2 text-center">
        <span className="font-heading font-black text-accent text-xs uppercase tracking-widest">Sale is live!</span>
      </div>
    );
  }

  const units = [
    { label: "Days", value: remaining.days },
    { label: "Hrs", value: remaining.hours },
    { label: "Min", value: remaining.minutes },
    { label: "Sec", value: remaining.seconds },
  ];

  return (
    <div className="mt-4">
      <p className="font-heading text-background/40 text-[10px] uppercase tracking-[0.25em] mb-1.5 text-center">Time Until Sale</p>
      <div className="grid grid-cols-4 gap-1.5">
        {units.map((u) => (
          <div key={u.label} className="bg-background/10 border border-background/20 text-center py-1.5">
            <div className="font-heading font-black text-background text-lg leading-none tabular-nums">
              {String(u.value).padStart(2, "0")}
            </div>
            <div className="font-heading text-background/40 text-[9px] uppercase tracking-wider mt-0.5">{u.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}