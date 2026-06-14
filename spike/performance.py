"""Performance & risk from the total-return index series — pure stdlib.

Locked decision: TWR from the fund total-return series (net of fees), report gross
(= net + TER) and net, plus risk stats and tracking difference vs the benchmark series.
"""
from __future__ import annotations
import math
import datetime as dt

TRADING_DAYS = 252


def _index_points(series, key):
    """[(date, value)] for points where `key` is present and > 0."""
    return [(r["date"], r[key]) for r in series if r.get(key) not in (None, 0)]


def _value_on_or_before(points, target):
    chosen = None
    for d, v in points:
        if d <= target:
            chosen = (d, v)
        else:
            break
    return chosen


def annualized_return(points, years: float):
    if len(points) < 2:
        return None
    end_d, end_v = points[-1]
    start = _value_on_or_before(points, end_d - dt.timedelta(days=round(365.25 * years)))
    if not start:
        return None
    sd, sv = start
    span = (end_d - sd).days / 365.25
    if span <= 0 or sv <= 0:
        return None
    return (end_v / sv) ** (1 / span) - 1


def cumulative_return(points):
    if len(points) < 2:
        return None
    return points[-1][1] / points[0][1] - 1


def _daily_returns(points):
    out = []
    for i in range(1, len(points)):
        prev, cur = points[i - 1][1], points[i][1]
        if prev > 0:
            out.append(cur / prev - 1)
    return out


def _stdev(xs):
    n = len(xs)
    if n < 2:
        return None
    mean = sum(xs) / n
    var = sum((x - mean) ** 2 for x in xs) / (n - 1)
    return math.sqrt(var)


def volatility_annualized(points):
    sd = _stdev(_daily_returns(points))
    return sd * math.sqrt(TRADING_DAYS) if sd is not None else None


def max_drawdown(points):
    if len(points) < 2:
        return None
    peak, mdd = points[0][1], 0.0
    for _, v in points:
        peak = max(peak, v)
        if peak > 0:
            mdd = min(mdd, v / peak - 1)
    return mdd


def sharpe(points, rf_annual: float):
    ann = annualized_return(points, min(3, _span_years(points)))
    vol = volatility_annualized(points)
    if ann is None or not vol:
        return None
    return (ann - rf_annual) / vol


def _span_years(points):
    if len(points) < 2:
        return 1
    return max(1, (points[-1][0] - points[0][0]).days / 365.25)


def tracking_difference(fund_pts, bench_pts, years: float = 3):
    """Annualized fund-minus-benchmark total return over the window."""
    fr = annualized_return(fund_pts, years)
    br = annualized_return(bench_pts, years)
    if fr is None or br is None:
        return None
    return fr - br


def compute(series, ter: float | None, rf_annual: float) -> dict:
    fund = _index_points(series, "ret")
    bench = _index_points(series, "bench")
    out = {"as_of": series[-1]["date"].isoformat() if series else None,
           "n_points": len(fund), "ter_pct": ter}
    if len(fund) < 2:
        out["error"] = "insufficient return series"
        return out
    for yrs, lbl in [(1, "1y"), (3, "3y"), (5, "5y")]:
        out[f"return_{lbl}_net"] = annualized_return(fund, yrs)
    si = annualized_return(fund, _span_years(fund))
    out["return_si_net"] = si
    # gross ≈ net + TER (locked: report both)
    ter_frac = (ter or 0) / 100.0
    for lbl in ["1y", "3y", "5y", "si"]:
        net = out.get(f"return_{lbl}_net")
        out[f"return_{lbl}_gross"] = (net + ter_frac) if net is not None else None
    out["volatility_ann"] = volatility_annualized(fund)
    out["sharpe"] = sharpe(fund, rf_annual)
    out["max_drawdown"] = max_drawdown(fund)
    out["tracking_difference_3y"] = tracking_difference(fund, bench, 3) if bench else None
    return out
