"""Calculate business metrics"""
import pandas as pd
import numpy as np
import logging
from datetime import datetime
from .extractors import DataExtractor

logger = logging.getLogger(__name__)

TRADE_TRANSACTION_TYPES = {'BUY', 'SELL'}


def _filled(orders):
    """Only orders that executed. Rejected orders and ones still waiting (limit orders, market orders queued for the
    open) or cancelled never traded, so they don't count toward volume, outliers, fees or rewards."""
    if orders.empty:
        return orders
    return orders[orders['status'].astype(str).str.upper() == 'FILLED'].copy()


def _trades(transactions):
    """Cash movements from buying and selling, without deposits and withdrawals."""
    if transactions.empty:
        return transactions
    return transactions[transactions['transaction_type'].astype(str).str.upper().isin(TRADE_TRANSACTION_TYPES)].copy()

class MetricsCalculator:
    """Calculate business metrics for trading volume, outliers, revenue, and rewards"""
    
    # ==================== TRADE VOLUME METRICS ====================
    
    @staticmethod
    def trade_volume_by_instrument_type():
        """Trade volume by instrument type"""
        orders = _filled(DataExtractor.extract_orders())
        
        if orders.empty:
            return pd.DataFrame()
        
        # Convert numeric columns to float
        orders['stock_price'] = orders['stock_price'].astype(float)
        orders['quantity'] = orders['quantity'].astype(float)
        
        # Get instrument details
        from .database import db
        query = "SELECT instrument_id, type, exchange AS market FROM instruments"
        with db.get_cursor(dict_cursor=True) as cursor:
            cursor.execute(query)
            instruments = pd.DataFrame(cursor.fetchall())
        
        # Merge orders with instrument types
        merged = orders.merge(instruments, on='instrument_id')
        
        # Calculate volume by type
        merged['value'] = merged['stock_price'] * merged['quantity']
        volume_by_type = merged.groupby('type').agg({
            'order_id': 'count',
            'quantity': 'sum',
            'value': 'sum'
        }).reset_index()
        
        volume_by_type.columns = ['instrument_type', 'order_count', 'total_quantity', 'total_value']
        volume_by_type['metric_type'] = 'trade_volume_by_type'
        volume_by_type['calculated_at'] = datetime.now()
        
        return volume_by_type
    
    @staticmethod
    def trade_volume_by_market():
        """Trade volume by market"""
        orders = _filled(DataExtractor.extract_orders())
        
        if orders.empty:
            return pd.DataFrame()
        
        # Convert numeric columns to float
        orders['stock_price'] = orders['stock_price'].astype(float)
        orders['quantity'] = orders['quantity'].astype(float)
        
        # Get market details
        from .database import db
        query = "SELECT instrument_id, exchange AS market FROM instruments"
        with db.get_cursor(dict_cursor=True) as cursor:
            cursor.execute(query)
            instruments = pd.DataFrame(cursor.fetchall())
        
        # Merge orders with markets
        merged = orders.merge(instruments, on='instrument_id')
        
        # Calculate volume by market
        merged['value'] = merged['stock_price'] * merged['quantity']
        volume_by_market = merged.groupby('market').agg({
            'order_id': 'count',
            'quantity': 'sum',
            'value': 'sum'
        }).reset_index()
        
        volume_by_market.columns = ['market', 'order_count', 'total_quantity', 'total_value']
        volume_by_market['metric_type'] = 'trade_volume_by_market'
        volume_by_market['calculated_at'] = datetime.now()
        
        return volume_by_market
    
    @staticmethod
    def trade_volume_by_side():
        """Trade volume by side (buy/sell)"""
        orders = _filled(DataExtractor.extract_orders())
        
        if orders.empty:
            return pd.DataFrame()
        
        # Convert numeric columns to float
        orders['stock_price'] = orders['stock_price'].astype(float)
        orders['quantity'] = orders['quantity'].astype(float)
        
        # Calculate volume by side
        orders['value'] = orders['quantity'] * orders['stock_price']
        volume_by_side = orders.groupby('order_type').agg({
            'order_id': 'count',
            'quantity': 'sum',
            'value': 'sum'
        }).reset_index()
        
        volume_by_side.columns = ['side', 'order_count', 'total_quantity', 'total_value']
        volume_by_side['metric_type'] = 'trade_volume_by_side'
        volume_by_side['calculated_at'] = datetime.now()
        
        return volume_by_side
    
    @staticmethod
    def trade_volume_over_time():
        """Trade volume over time (by day/time period)"""
        transactions = _trades(DataExtractor.extract_transactions())
        orders = _filled(DataExtractor.extract_orders())
        
        if transactions.empty:
            return pd.DataFrame()
        
        # Convert amount to float
        transactions['amount'] = transactions['amount'].astype(float)

        # Bring in quantities when transaction is tied to an order.
        if not orders.empty:
            orders['quantity'] = orders['quantity'].astype(float)
            transactions = transactions.merge(
                orders[['order_id', 'quantity']],
                on='order_id',
                how='left'
            )
        else:
            transactions['quantity'] = 0.0

        transactions['quantity'] = transactions['quantity'].fillna(0).astype(float)
        
        # Convert created_at to date
        transactions['date'] = pd.to_datetime(transactions['created_at']).dt.date
        
        # Calculate volume over time
        volume_over_time = transactions.groupby('date').agg({
            'transaction_id': 'count',
            'quantity': 'sum',
            'amount': 'sum'
        }).reset_index()
        
        volume_over_time.columns = ['trade_date', 'order_count', 'total_quantity', 'total_value']
        volume_over_time['time_bucket'] = volume_over_time['trade_date'].astype(str)

        # Backward-compatible aliases for any existing consumers.
        volume_over_time['transaction_count'] = volume_over_time['order_count']
        volume_over_time['total_amount'] = volume_over_time['total_value']

        volume_over_time['metric_type'] = 'trade_volume_over_time'
        volume_over_time['calculated_at'] = datetime.now()
        
        return volume_over_time
    
    # ==================== OUTLIER DETECTION ====================
    
    @staticmethod
    def detect_outlier_trades():
        """Detect outlier trades (unusually large amounts)"""
        orders = _filled(DataExtractor.extract_orders())
        
        if orders.empty:
            return pd.DataFrame()
        
        # Convert numeric columns to float
        orders['stock_price'] = orders['stock_price'].astype(float)
        orders['quantity'] = orders['quantity'].astype(float)
        
        # Calculate trade value
        orders['order_value'] = orders['quantity'] * orders['stock_price']
        
        # Calculate statistics per account
        account_stats = orders.groupby('account_id')['order_value'].agg(['mean', 'std']).reset_index()
        account_stats['mean'] = account_stats['mean'].astype(float)
        account_stats['std'] = account_stats['std'].astype(float)
        
        # Merge stats back to orders
        merged = orders.merge(account_stats, on='account_id')
        
        # Compute z-score and flag both high/low outliers.
        merged['z_score'] = (merged['order_value'] - merged['mean']) / merged['std'].replace(0, np.nan)
        merged['z_score'] = merged['z_score'].replace([np.inf, -np.inf], np.nan).fillna(0.0)
        merged['is_outlier'] = merged['z_score'].abs() > 2.5

        outliers = merged[merged['is_outlier']][
            [
                'order_id',
                'account_id',
                'instrument_id',
                'ticker',
                'order_type',
                'quantity',
                'stock_price',
                'order_value',
                'z_score',
                'is_outlier',
                'status'
            ]
        ].copy()

        # Backward-compatible alias.
        outliers['trade_value'] = outliers['order_value']
        outliers['metric_type'] = 'outlier_trades'
        outliers['calculated_at'] = datetime.now()
        
        return outliers
    
    @staticmethod
    def detect_win_loss_outliers():
        """Detect customers who won/lost a lot of money.

        An account's profit or loss is what it received from sells, less what it paid for buys, plus what it still
        holds at the latest stored prices (positions without a stored price count at cost)."""
        transactions = _trades(DataExtractor.extract_transactions())

        if transactions.empty:
            return pd.DataFrame()

        transactions['amount'] = transactions['amount'].astype(float)
        sign = np.where(transactions['transaction_type'].astype(str).str.upper() == 'SELL', 1.0, -1.0)
        transactions['cash_flow'] = transactions['amount'] * sign
        account_pnl = transactions.groupby('account_id')['cash_flow'].sum().reset_index()
        account_pnl.columns = ['account_id', 'net_pnl']

        holdings = DataExtractor.extract_holdings()
        if not holdings.empty:
            holdings['quantity'] = holdings['quantity'].astype(float)
            holdings['amount_invested'] = holdings['amount_invested'].astype(float)
            price = pd.to_numeric(holdings['last_price'], errors='coerce') if 'last_price' in holdings.columns else np.nan
            holdings['market_value'] = (holdings['quantity'] * price).fillna(holdings['amount_invested'])
            held = holdings.groupby('account_id')['market_value'].sum().reset_index()
            account_pnl = account_pnl.merge(held, on='account_id', how='left')
            account_pnl['net_pnl'] = account_pnl['net_pnl'] + account_pnl['market_value'].fillna(0.0)
            account_pnl = account_pnl.drop(columns='market_value')

        account_pnl['net_pnl'] = account_pnl['net_pnl'].astype(float)

        # Identify outliers
        pnl_mean = account_pnl['net_pnl'].mean()
        pnl_std = account_pnl['net_pnl'].std()
        if pd.isna(pnl_std) or pnl_std == 0:
            return pd.DataFrame()

        account_pnl['z_score'] = (account_pnl['net_pnl'] - pnl_mean) / pnl_std
        account_pnl['is_outlier'] = account_pnl['z_score'].abs() > 2

        outlier_pnl = account_pnl[account_pnl['is_outlier']].copy()
        outlier_pnl['total_pnl'] = outlier_pnl['net_pnl']

        # Backward-compatible alias.
        outlier_pnl['pnl_zscore'] = outlier_pnl['z_score']
        outlier_pnl['metric_type'] = 'pnl_outliers'
        outlier_pnl['calculated_at'] = datetime.now()

        return outlier_pnl[['account_id', 'net_pnl', 'is_outlier', 'z_score', 'total_pnl', 'pnl_zscore', 'metric_type', 'calculated_at']]

    # ==================== REVENUE METRICS ====================
    
    @staticmethod
    def assets_under_management():
        """Calculate assets under management (AUM) per account"""
        accounts = DataExtractor.extract_accounts()
        holdings = DataExtractor.extract_holdings()
        
        if accounts.empty:
            return pd.DataFrame()
        
        # Convert numeric columns to float
        accounts['cash_balance'] = accounts['cash_balance'].astype(float)
        
        # Sum holdings per account
        if not holdings.empty:
            holdings['amount_invested'] = holdings['amount_invested'].astype(float)
            aum_from_holdings = holdings.groupby('account_id')['amount_invested'].sum().reset_index()
            aum_from_holdings.columns = ['account_id', 'holdings_value']
        else:
            aum_from_holdings = pd.DataFrame({'account_id': [], 'holdings_value': []})
        
        # Merge with cash balance
        aum = accounts[['account_id', 'user_id', 'cash_balance']].merge(aum_from_holdings, on='account_id', how='left')
        aum['holdings_value'] = aum['holdings_value'].fillna(0).astype(float)
        aum['total_value'] = aum['cash_balance'] + aum['holdings_value']

        # Backward-compatible aliases.
        aum['invested_assets'] = aum['holdings_value']
        aum['total_aum'] = aum['total_value']
        
        aum['metric_type'] = 'aum'
        aum['calculated_at'] = datetime.now()
        
        return aum[['account_id', 'user_id', 'cash_balance', 'holdings_value', 'total_value', 'invested_assets', 'total_aum', 'metric_type', 'calculated_at']]
    
    @staticmethod
    def revenue_from_fees():
        """Calculate potential revenue from fees (can be customized based on fee structure)"""
        # Assuming 0.1% fee on trade value
        FEE_RATE = 0.001
        
        orders = _filled(DataExtractor.extract_orders())
        
        if orders.empty:
            return pd.DataFrame()
        
        # Convert numeric columns to float
        orders['stock_price'] = orders['stock_price'].astype(float)
        orders['quantity'] = orders['quantity'].astype(float)
        
        # Calculate trade value and fees
        orders['trade_value'] = orders['quantity'] * orders['stock_price']
        orders['fees'] = orders['trade_value'] * FEE_RATE
        
        # Aggregate fees
        fee_revenue = orders.groupby('account_id').agg({
            'order_id': 'count',
            'fees': 'sum',
            'trade_value': 'sum'
        }).reset_index()
        
        fee_revenue.columns = ['account_id', 'order_count', 'total_fees', 'total_trading_volume']
        fee_revenue['metric_type'] = 'fee_revenue'
        fee_revenue['calculated_at'] = datetime.now()
        
        return fee_revenue
    
    # ==================== REWARDS METRICS ====================
    
    @staticmethod
    def rewards_vs_trade_volume():
        """Analyze if winning/reward points correlate with trade volume"""
        users = DataExtractor.extract_users()
        accounts = DataExtractor.extract_accounts()
        orders = _filled(DataExtractor.extract_orders())
        transactions = _trades(DataExtractor.extract_transactions())
        
        if users.empty:
            return pd.DataFrame()
        
        # Get user reward points
        user_rewards = users[['user_id', 'reward_points']].copy()
        user_rewards['reward_points'] = user_rewards['reward_points'].astype(float)
        
        # Count orders per user
        user_accounts = accounts[['account_id', 'user_id']].copy()
        user_orders = orders.merge(user_accounts, on='account_id')
        
        # Convert numeric columns to float
        user_orders['quantity'] = user_orders['quantity'].astype(float)
        
        order_volume = user_orders.groupby('user_id').agg({
            'order_id': 'count',
            'quantity': 'sum'
        }).reset_index()
        order_volume.columns = ['user_id', 'order_count', 'total_shares_traded']
        
        # Calculate transaction volume per user
        if not transactions.empty:
            transactions['amount'] = transactions['amount'].astype(float)
            transaction_volume = transactions.merge(user_accounts, on='account_id')
            trans_volume = transaction_volume.groupby('user_id')['amount'].sum().reset_index()
            trans_volume.columns = ['user_id', 'total_transaction_amount']
        else:
            trans_volume = pd.DataFrame({'user_id': [], 'total_transaction_amount': []})
        
        # Merge everything
        result = user_rewards.merge(order_volume, on='user_id', how='left')
        result = result.merge(trans_volume, on='user_id', how='left')
        
        # Fill NaN with 0
        result['order_count'] = result['order_count'].fillna(0).astype(float)
        result['total_shares_traded'] = result['total_shares_traded'].fillna(0).astype(float)
        result['total_transaction_amount'] = result['total_transaction_amount'].fillna(0).astype(float)
        
        result['metric_type'] = 'rewards_vs_volume'
        result['calculated_at'] = datetime.now()
        
        return result
    
    # ==================== AGGREGATE ALL METRICS ====================
    
    @staticmethod
    def all_metrics():
        """Calculate all required metrics"""
        metrics = {
            # Trade Volume
            'trade_volume_by_type': MetricsCalculator.trade_volume_by_instrument_type(),
            'trade_volume_by_market': MetricsCalculator.trade_volume_by_market(),
            'trade_volume_by_side': MetricsCalculator.trade_volume_by_side(),
            'trade_volume_over_time': MetricsCalculator.trade_volume_over_time(),
            
            # Outliers
            'outlier_trades': MetricsCalculator.detect_outlier_trades(),
            'pnl_outliers': MetricsCalculator.detect_win_loss_outliers(),
            
            # Revenue
            'aum': MetricsCalculator.assets_under_management(),
            'fee_revenue': MetricsCalculator.revenue_from_fees(),
            
            # Rewards
            'rewards_vs_volume': MetricsCalculator.rewards_vs_trade_volume()
        }
        
        logger.info(f"Calculated metrics: {list(metrics.keys())}")
        return metrics
