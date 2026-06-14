export const pct = (x: number | null | undefined, d = 1): string =>
  x === null || x === undefined ? "—" : `${(x * 100).toFixed(d)}%`;

export const pctRaw = (x: number | null | undefined, d = 2): string =>
  x === null || x === undefined ? "—" : `${x.toFixed(d)}%`;

export const signed = (x: number | null | undefined, d = 1): string =>
  x === null || x === undefined ? "—" : `${x >= 0 ? "+" : ""}${(x * 100).toFixed(d)}%`;

export const money = (x: number | null | undefined): string => {
  if (x === null || x === undefined) return "—";
  if (x >= 1e9) return `$${(x / 1e9).toFixed(2)}bn`;
  if (x >= 1e6) return `$${(x / 1e6).toFixed(0)}m`;
  return `$${x.toLocaleString()}`;
};

export const num = (x: number | null | undefined): string =>
  x === null || x === undefined ? "—" : x.toLocaleString();

export const aumDelta = (now: number | null, prev: number | null): number | null =>
  now && prev ? now / prev - 1 : null;

export const signalClass = (type: string): string => {
  switch (type) {
    case "launch": return "b-green";
    case "fee_positioning":
    case "fee_change": return "b-blue";
    case "aum_trend": return "b-amber";
    case "tracking_difference":
    case "performance_positioning": return "b-gray";
    case "concentration": return "b-gray";
    default: return "b-gray";
  }
};

export const signalLabel = (type: string): string =>
  ({
    launch: "Launch",
    fee_positioning: "Fee",
    fee_change: "Fee move",
    aum_trend: "AUM trend",
    tracking_difference: "Tracking",
    performance_positioning: "Performance",
    concentration: "Concentration",
  } as Record<string, string>)[type] || type;
