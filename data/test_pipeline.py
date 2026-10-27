"""Unit tests for pipeline components"""
import json
import pytest
import pandas as pd
from datetime import datetime
from unittest.mock import Mock, patch, MagicMock
from .metrics import MetricsCalculator
from .extractors import DataExtractor

class TestTradeVolumeMetrics:
    """Test trade volume metrics"""
    
    @patch('data.database.db.get_cursor')
    @patch('data.metrics.DataExtractor.extract_orders')
    def test_trade_volume_by_type_empty(self, mock_orders, mock_db):
        """Test trade volume by type with no data"""
        mock_orders.return_value = pd.DataFrame()
        result = MetricsCalculator.trade_volume_by_instrument_type()
        assert result.empty
    
    @patch('data.metrics.DataExtractor.extract_orders')
    def test_trade_volume_by_side(self, mock_orders):
        """Test trade volume by side (buy/sell)"""
        mock_orders.return_value = pd.DataFrame({
            'order_id': [1, 2, 3, 4, 5, 6],
            'account_id': [1, 1, 2, 2, 2, 2],
            'order_type': ['buy', 'buy', 'sell', 'sell', 'buy', 'sell'],
            'quantity': [100, 150, 50, 75, 999, 999],
            'stock_price': [150.00, 150.00, 150.00, 150.00, 150.00, None],
            # Rejected, waiting and cancelled orders never traded, so they don't count.
            'status': ['FILLED', 'FILLED', 'FILLED', 'FILLED', 'REJECTED', 'PENDING']
        })
        
        result = MetricsCalculator.trade_volume_by_side()
        assert len(result) == 2
        assert 'side' in result.columns
        assert 'total_quantity' in result.columns
        assert sorted(result['total_quantity'].tolist()) == [125.0, 250.0]


class TestOutlierDetection:
    """Test outlier detection"""
    
    @patch('data.metrics.DataExtractor.extract_orders')
    def test_detect_outlier_trades_empty(self, mock_orders):
        """Test outlier detection with no data"""
        mock_orders.return_value = pd.DataFrame()
        result = MetricsCalculator.detect_outlier_trades()
        assert result.empty
    
    @patch('data.metrics.DataExtractor.extract_orders')
    def test_detect_outlier_trades_with_data(self, mock_orders):
        """Test outlier trade detection"""
        mock_orders.return_value = pd.DataFrame({
            'order_id': [1, 2, 3, 4],
            'account_id': [1, 1, 1, 1],
            'quantity': [100, 100, 100, 5000],  # Last one is outlier
            'stock_price': [100, 100, 100, 100],
            'order_type': ['buy', 'buy', 'buy', 'buy'],
            'status': ['filled', 'filled', 'filled', 'filled'],
            'instrument_id': [1, 1, 1, 1],
            'ticker': ['AAPL', 'AAPL', 'AAPL', 'AAPL']
        })
        
        result = MetricsCalculator.detect_outlier_trades()
        # Should identify trades significantly larger than normal


class TestRevenueMetrics:
    """Test revenue metrics"""
    
    @patch('data.metrics.DataExtractor.extract_accounts')
    @patch('data.metrics.DataExtractor.extract_holdings')
    def test_assets_under_management(self, mock_holdings, mock_accounts):
        """Test AUM calculation"""
        mock_accounts.return_value = pd.DataFrame({
            'account_id': [1, 2],
            'user_id': [1, 2],
            'cash_balance': [50000, 100000]
        })
        
        mock_holdings.return_value = pd.DataFrame({
            'account_id': [1, 1, 2],
            'amount_invested': [10000, 15000, 30000]
        })
        
        result = MetricsCalculator.assets_under_management()
        assert len(result) == 2
        assert 'total_aum' in result.columns
    
    @patch('data.metrics.DataExtractor.extract_orders')
    def test_revenue_from_fees(self, mock_orders):
        """Test fee revenue calculation"""
        mock_orders.return_value = pd.DataFrame({
            'order_id': [1, 2, 3, 4],
            'account_id': [1, 1, 2, 2],
            'quantity': [100, 50, 200, 1000],
            'stock_price': [100, 100, 100, 100],
            'status': ['FILLED', 'FILLED', 'FILLED', 'REJECTED']
        })
        
        result = MetricsCalculator.revenue_from_fees()
        assert len(result) > 0
        assert 'total_fees' in result.columns
        assert result.set_index('account_id')['total_trading_volume'].to_dict() == {1: 15000.0, 2: 20000.0}


class TestRewardsMetrics:
    """Test rewards vs volume correlation"""
    
    @patch('data.metrics.DataExtractor.extract_transactions')
    @patch('data.metrics.DataExtractor.extract_orders')
    @patch('data.metrics.DataExtractor.extract_accounts')
    @patch('data.metrics.DataExtractor.extract_users')
    def test_rewards_vs_volume(self, mock_users, mock_accounts, mock_orders, mock_transactions):
        """Test rewards vs trade volume"""
        mock_users.return_value = pd.DataFrame({
            'user_id': [1, 2],
            'reward_points': [100, 500]
        })
        
        mock_accounts.return_value = pd.DataFrame({
            'account_id': [1, 2],
            'user_id': [1, 2]
        })
        
        mock_orders.return_value = pd.DataFrame({
            'order_id': [1, 2, 3, 4],
            'account_id': [1, 2, 2, 2],
            'quantity': [100, 200, 150, 500],
            'status': ['FILLED', 'FILLED', 'FILLED', 'CANCELED']
        })
        
        mock_transactions.return_value = pd.DataFrame({
            'transaction_id': [1, 2, 3, 4],
            'account_id': [1, 2, 2, 2],
            'amount': [10000, 20000, 15000, 50000],
            'transaction_type': ['BUY', 'BUY', 'SELL', 'DEPOSIT']
        })
        
        result = MetricsCalculator.rewards_vs_trade_volume()
        assert len(result) == 2
        assert 'order_count' in result.columns
        assert 'total_transaction_amount' in result.columns
        by_user = result.set_index('user_id')
        assert by_user.loc[2, 'order_count'] == 2
        assert by_user.loc[2, 'total_transaction_amount'] == 35000.0


class TestTradeVolumeOverTime:
    """Volume over time counts trades, not deposits or withdrawals"""

    @patch('data.metrics.DataExtractor.extract_orders')
    @patch('data.metrics.DataExtractor.extract_transactions')
    def test_excludes_cash_movements(self, mock_transactions, mock_orders):
        mock_transactions.return_value = pd.DataFrame({
            'transaction_id': [1, 2, 3],
            'account_id': [1, 1, 1],
            'order_id': [10, None, None],
            'amount': [500.0, 1000.0, 200.0],
            'transaction_type': ['BUY', 'DEPOSIT', 'WITHDRAW'],
            'created_at': [datetime(2026, 10, 26, 14)] * 3
        })
        mock_orders.return_value = pd.DataFrame({
            'order_id': [10], 'account_id': [1], 'quantity': [5], 'stock_price': [100.0], 'status': ['FILLED']
        })

        result = MetricsCalculator.trade_volume_over_time()
        assert len(result) == 1
        assert result.iloc[0]['order_count'] == 1
        assert result.iloc[0]['total_value'] == 500.0


class TestPnlOutliers:
    """Profit/loss nets buys against sells and counts what's still held"""

    @patch('data.metrics.DataExtractor.extract_holdings')
    @patch('data.metrics.DataExtractor.extract_transactions')
    def test_pnl_is_sells_minus_buys_plus_holdings(self, mock_transactions, mock_holdings):
        # Accounts 1-10 broke even; account 11 bought $1,000 and now holds $11,000 of stock.
        rows = []
        for account in range(1, 11):
            rows += [(account, 1000.0, 'BUY'), (account, 1000.0, 'SELL')]
        rows.append((11, 1000.0, 'BUY'))
        rows.append((11, 5000.0, 'DEPOSIT'))
        mock_transactions.return_value = pd.DataFrame({
            'transaction_id': range(len(rows)),
            'account_id': [r[0] for r in rows],
            'order_id': range(len(rows)),
            'amount': [r[1] for r in rows],
            'transaction_type': [r[2] for r in rows],
        })
        mock_holdings.return_value = pd.DataFrame({
            'account_id': [11], 'instrument_id': [1], 'quantity': [10.0], 'amount_invested': [1000.0], 'last_price': [1100.0]
        })

        result = MetricsCalculator.detect_win_loss_outliers()
        assert result['account_id'].tolist() == [11]
        assert result.iloc[0]['net_pnl'] == 10000.0

    @patch('data.metrics.DataExtractor.extract_holdings')
    @patch('data.metrics.DataExtractor.extract_transactions')
    def test_no_outliers_when_everyone_is_even(self, mock_transactions, mock_holdings):
        mock_transactions.return_value = pd.DataFrame({
            'transaction_id': [1, 2], 'account_id': [1, 2], 'order_id': [1, 2],
            'amount': [100.0, 100.0], 'transaction_type': ['SELL', 'SELL'],
        })
        mock_holdings.return_value = pd.DataFrame()

        assert MetricsCalculator.detect_win_loss_outliers().empty


class TestHealth:
    @patch('data.api.db')
    def test_up_when_the_database_answers(self, mock_db):
        from .api import health
        response = health()
        body = json.loads(response.body)
        assert response.status_code == 200
        assert body['status'] == 'up'
        assert body['checks']['database']['status'] == 'up'
        mock_db.get_cursor.assert_called_once_with(connect_timeout=2)

    @patch('data.api.db')
    def test_unavailable_when_the_database_is_down(self, mock_db):
        from .api import health
        mock_db.get_cursor.side_effect = Exception('could not connect to server')
        response = health()
        assert response.status_code == 503
        assert json.loads(response.body)['checks']['database'] == {'status': 'down', 'reason': 'Database unreachable'}
