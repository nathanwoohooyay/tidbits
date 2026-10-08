"""FastAPI metrics service wrapping the existing data pipeline"""
import logging
import os
import sys
from datetime import datetime
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

# Configure logging before importing pipeline modules
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[logging.StreamHandler(sys.stdout)],
    force=True
)

from .metrics import MetricsCalculator

logger = logging.getLogger(__name__)

app = FastAPI(
    title="Tidbits Metrics API",
    description="Analytics and metrics for the Tidbits Trading Platform",
    version="1.0.0"
)

# CORS – allow frontend origins in local/dev and tunnelled environments
allowed_origins = [
    origin.strip()
    for origin in os.getenv(
        "METRICS_CORS_ORIGINS",
        "http://localhost:4200,http://localhost:8084,http://localhost:9875"
    ).split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _df_to_records(df):
    """Convert a DataFrame to a list of dicts, handling empty frames."""
    if df is None or df.empty:
        return []
    # Convert timestamps and Decimal types to JSON-safe values
    return df.astype(object).where(df.notna(), None).to_dict("records")


def _safe_metric(fn, metric_name: str):
    """Run a metric function, catch errors, return records or raise 500."""
    try:
        df = fn()
        return _df_to_records(df)
    except Exception as e:
        logger.error(f"Error computing {metric_name}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to compute {metric_name}")


# ──────────────────────────── Aggregate ────────────────────────────

@app.get("/api/metrics/all")
def get_all_metrics():
    """Return every metric category in a single response."""
    try:
        raw = MetricsCalculator.all_metrics()
        result = {}
        for key, df in raw.items():
            result[key] = _df_to_records(df)
        return JSONResponse(content={
            "data": result,
            "calculatedAt": datetime.now().isoformat()
        })
    except Exception as e:
        logger.error(f"Error computing all metrics: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to compute metrics")


# ──────────────────────── Trade Volume ─────────────────────────

@app.get("/api/metrics/trade-volume/by-type")
def trade_volume_by_type():
    return {"data": _safe_metric(MetricsCalculator.trade_volume_by_instrument_type, "trade_volume_by_type")}


@app.get("/api/metrics/trade-volume/by-market")
def trade_volume_by_market():
    return {"data": _safe_metric(MetricsCalculator.trade_volume_by_market, "trade_volume_by_market")}


@app.get("/api/metrics/trade-volume/by-side")
def trade_volume_by_side():
    return {"data": _safe_metric(MetricsCalculator.trade_volume_by_side, "trade_volume_by_side")}


@app.get("/api/metrics/trade-volume/over-time")
def trade_volume_over_time():
    return {"data": _safe_metric(MetricsCalculator.trade_volume_over_time, "trade_volume_over_time")}


# ──────────────────────── Outliers ─────────────────────────

@app.get("/api/metrics/outliers/trades")
def outlier_trades():
    return {"data": _safe_metric(MetricsCalculator.detect_outlier_trades, "outlier_trades")}


@app.get("/api/metrics/outliers/pnl")
def pnl_outliers():
    return {"data": _safe_metric(MetricsCalculator.detect_win_loss_outliers, "pnl_outliers")}


# ──────────────────────── Revenue ──────────────────────────

@app.get("/api/metrics/revenue/aum")
def assets_under_management():
    return {"data": _safe_metric(MetricsCalculator.assets_under_management, "aum")}


@app.get("/api/metrics/revenue/fees")
def fee_revenue():
    return {"data": _safe_metric(MetricsCalculator.revenue_from_fees, "fee_revenue")}


# ──────────────────────── Rewards ──────────────────────────

@app.get("/api/metrics/rewards")
def rewards_vs_volume():
    return {"data": _safe_metric(MetricsCalculator.rewards_vs_trade_volume, "rewards_vs_volume")}


# ──────────────────────── Health ───────────────────────────

@app.get("/api/metrics/health")
def health():
    return {"status": "up", "service": "metrics-service"}
