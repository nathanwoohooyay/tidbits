"""FastAPI metrics service wrapping the existing data pipeline"""
import logging
import os
import sys
import time
from datetime import datetime
from fastapi import FastAPI, HTTPException
from fastapi.encoders import jsonable_encoder
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

# Configure logging before importing pipeline modules
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[logging.StreamHandler(sys.stdout)],
    force=True
)

from .database import db
from .metrics import MetricsCalculator
from .pipeline import DataPipeline

logger = logging.getLogger(__name__)

_metrics_cache = {
    "data": None,
    "calculatedAt": None
}

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
    records = df.astype(object).where(df.notna(), None).to_dict("records")
    # Ensure pandas timestamps/datetimes/decimals are serialized safely.
    return jsonable_encoder(records)


def _safe_metric(fn, metric_name: str):
    """Run a metric function, catch errors, return records or raise 500."""
    try:
        df = fn()
        return _df_to_records(df)
    except Exception as e:
        logger.error(f"Error computing {metric_name}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to compute {metric_name}")


def _normalize_all_metrics(raw: dict) -> dict:
    """Normalize aggregate metrics and provide alias keys used by frontend clients."""
    normalized = {}
    for key, df in raw.items():
        normalized[key] = _df_to_records(df)

    alias_map = {
        "volume_by_type": "trade_volume_by_type",
        "volume_by_market": "trade_volume_by_market",
        "volume_by_side": "trade_volume_by_side",
        "volume_over_time": "trade_volume_over_time",
        "rewards_volume": "rewards_vs_volume"
    }

    for alias, source in alias_map.items():
        normalized[alias] = normalized.get(source, [])

    return normalized


def _refresh_metrics_cache() -> None:
    """Run the pipeline and refresh the in-memory metrics cache."""
    pipeline = DataPipeline(output_dir=os.getenv("PIPELINE_OUTPUT_DIR", "/tmp/tidbits-metrics"))
    success = pipeline.run(save_format='none')
    if not success:
        raise HTTPException(status_code=500, detail="Pipeline refresh failed")

    _metrics_cache["data"] = _normalize_all_metrics(pipeline.get_metrics())
    _metrics_cache["calculatedAt"] = datetime.now().isoformat()


# ──────────────────────────── Aggregate ────────────────────────────

@app.get("/api/metrics/all")
def get_all_metrics():
    """Return every metric category in a single response."""
    try:
        if _metrics_cache["data"] is None:
            raw = MetricsCalculator.all_metrics()
            _metrics_cache["data"] = _normalize_all_metrics(raw)
            _metrics_cache["calculatedAt"] = datetime.now().isoformat()

        return JSONResponse(content={
            "data": _metrics_cache["data"],
            "calculatedAt": _metrics_cache["calculatedAt"]
        })
    except Exception as e:
        logger.error(f"Error computing all metrics: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to compute metrics")


@app.post("/api/metrics/refresh")
def refresh_metrics():
    """Force a full pipeline run and refresh cached metric results."""
    try:
        _refresh_metrics_cache()
        counts = {
            key: len(value) if isinstance(value, list) else 0
            for key, value in (_metrics_cache["data"] or {}).items()
            if key in {
                "trade_volume_by_type",
                "trade_volume_by_market",
                "trade_volume_by_side",
                "trade_volume_over_time",
                "outlier_trades",
                "pnl_outliers",
                "aum",
                "fee_revenue",
                "rewards_vs_volume"
            }
        }
        return {
            "status": "ok",
            "calculatedAt": _metrics_cache["calculatedAt"],
            "counts": counts
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error refreshing metrics cache: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to refresh metrics")


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
    """Whether the database answers, for the gateway's service status; 503 when it doesn't."""
    started = time.monotonic()
    try:
        with db.get_cursor(connect_timeout=2) as cursor:
            cursor.execute("SELECT 1")
        database = {"status": "up", "latencyMs": round((time.monotonic() - started) * 1000)}
    except Exception:
        database = {"status": "down", "reason": "Database unreachable"}
    status = database["status"]
    body = {"status": status, "service": "metrics-service", "checks": {"database": database}}
    return JSONResponse(body, status_code=200 if status == "up" else 503)
