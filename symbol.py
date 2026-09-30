"""Fetch top stock symbols from an API and batch insert into instruments.

Placeholders are intentionally left for:
- API base URL
- API key
- PostgreSQL connection settings
"""

from __future__ import annotations

import argparse
from typing import Any, Dict, Iterable, List, Optional, Sequence, Tuple
from urllib.parse import quote

import requests
from psycopg2 import connect
from psycopg2.extras import execute_values


# ------------------------------
# Placeholders (fill these in)
# ------------------------------
API_BASE_URL = "https://y4t9nq2bqf.execute-api.eu-west-2.amazonaws.com/v1/symbols"  # Example: https://api.example.com/v1/quote
API_KEY = "fnx_dev_MBA6yXGi6ytiIhmXoRq3vB4ZVePi8Ucc"

DB_CONFIG = {
	"host": "localhost",
	"port": 5432,
	"dbname": "tidbits_dev",
	"user": "postgres",
	"password": "postgres",
}


# Top 100 large-cap US stocks (ticker symbols)
TOP_100_TICKERS: List[str] = [
	"AAPL", "MSFT", "NVDA", "AMZN", "GOOGL", "GOOG", "META", "BRK.B", "LLY", "AVGO",
	"TSLA", "JPM", "WMT", "UNH", "V", "XOM", "MA", "JNJ", "PG", "ORCL",
	"HD", "COST", "BAC", "MRK", "ABBV", "KO", "ADBE", "NFLX", "PEP", "TMO",
	"CRM", "AMD", "MCD", "CSCO", "WFC", "ACN", "ABT", "DHR", "LIN", "DIS",
	"TMUS", "INTC", "TXN", "QCOM", "AMGN", "CMCSA", "VZ", "INTU", "PFE", "PM",
	"IBM", "NOW", "CAT", "GS", "GE", "ISRG", "BKNG", "SPGI", "AXP", "UNP",
	"AMAT", "T", "LOW", "MS", "BLK", "RTX", "HON", "SYK", "GILD", "MDT",
	"SBUX", "ELV", "DE", "PLD", "ADI", "TJX", "C", "LRCX", "CB", "MMC",
	"SCHW", "MU", "SO", "PANW", "VRTX", "NKE", "ETN", "ADP", "BMY", "PGR",
	"COP", "CI", "ZTS", "MO", "REGN", "DUK", "MDLZ", "SLB", "ANET", "EOG",
]


def parse_args() -> argparse.Namespace:
	parser = argparse.ArgumentParser(
		description="Fetch stock instrument data and batch insert into PostgreSQL."
	)
	parser.add_argument(
		"--tickers",
		nargs="+",
		help="Optional list of tickers to fetch instead of the built-in top 100.",
	)
	parser.add_argument(
		"--limit",
		type=int,
		default=None,
		help="Optional cap on number of tickers processed.",
	)
	return parser.parse_args()


def normalize_type(api_type: Optional[str]) -> Optional[str]:
	"""Map API type to allowed instrument_type enum values."""
	if not api_type:
		return None

	value = api_type.strip().lower().replace("-", "_").replace(" ", "_")
	allowed = {"equity", "crypto", "fx", "etf"}
	if value in allowed:
		return value
	return None


def build_symbol_url(base_url: str, ticker: str) -> str:
	"""Each request appends the ticker as the final path segment."""
	return f"{base_url.rstrip('/')}/{quote(ticker, safe='')}"


def fetch_symbol_payload(ticker: str) -> Dict[str, Any]:
	"""Fetch one symbol payload from the API."""
	url = build_symbol_url(API_BASE_URL, ticker)
	headers = {"X-Api-Key": f"{API_KEY}"}

	response = requests.get(url, headers=headers, timeout=20)
	response.raise_for_status()
	payload = response.json()

	if not isinstance(payload, dict):
		raise ValueError(f"Expected JSON object for {ticker}, got {type(payload).__name__}")

	return payload


def transform_payload(payload: Dict[str, Any]) -> Optional[Tuple[str, str, str, str, str]]:
	"""Map API keys to the SQL table columns:
	symbol -> ticker
	name -> name
	type -> type
	exchange -> exchange
	currency -> currency
	"""
	data = payload.get("data", {})
	print(f"Data extracted from payload: {data}")
	ticker = data.get("symbol")
	name = data.get("name")
	instrument_type = normalize_type(data.get("type"))
	exchange = data.get("exchange")
	currency = data.get("currency")
 
	print(f"Extracted fields - ticker: {ticker}, name: {name}, type: {instrument_type}, exchange: {exchange}, currency: {currency}")

	if not all([ticker, name, instrument_type, exchange, currency]):
		return None

	return (
		str(ticker).strip()[:8],
		str(name).strip(),
		instrument_type,
		str(exchange).strip(),
		str(currency).strip().upper()[:3],
	)


def chunked(rows: Sequence[Tuple[str, str, str, str, str]], size: int) -> Iterable[Sequence[Tuple[str, str, str, str, str]]]:
	for i in range(0, len(rows), size):
		yield rows[i : i + size]


def batch_insert_instruments(rows: Sequence[Tuple[str, str, str, str, str]], batch_size: int = 200) -> None:
	"""Insert in batches; unmapped table columns remain NULL by default."""
	if not rows:
		print("No valid rows to insert.")
		return

	insert_sql = """
		INSERT INTO instruments (ticker, name, type, exchange, currency)
		VALUES %s
		ON CONFLICT (ticker) DO UPDATE
		SET
			name = EXCLUDED.name,
			type = EXCLUDED.type,
			exchange = EXCLUDED.exchange,
			currency = EXCLUDED.currency
	"""

	with connect(**DB_CONFIG) as conn:
		with conn.cursor() as cursor:
			for batch in chunked(rows, batch_size):
				execute_values(cursor, insert_sql, batch)

		conn.commit()

	print(f"Inserted/updated {len(rows)} rows into instruments.")


def main() -> None:
	args = parse_args()
	selected_tickers = args.tickers if args.tickers else TOP_100_TICKERS
	if args.limit is not None:
		selected_tickers = selected_tickers[: max(args.limit, 0)]

	transformed_rows: List[Tuple[str, str, str, str, str]] = []
	failures: List[str] = []

	for ticker in selected_tickers:
		try:
			payload = fetch_symbol_payload(ticker)
			print(f"Fetched payload for ticker {ticker}: {payload}")
			row = transform_payload(payload)
			print(f"Transformed row for ticker {ticker}: {row}")

			if row is None:
				failures.append(f"{ticker}: missing/invalid required fields")
				continue

			transformed_rows.append(row)
		except Exception as exc:  # noqa: BLE001
			failures.append(f"{ticker}: {exc}")

	batch_insert_instruments(transformed_rows)

	if failures:
		print("\nFailed symbols:")
		for error in failures:
			print(f"- {error}")


if __name__ == "__main__":
	main()
