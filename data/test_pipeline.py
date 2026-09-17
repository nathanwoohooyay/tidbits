"""Unit tests for pipeline components"""
import pytest
import pandas as pd
from datetime import datetime
from unittest.mock import Mock, patch, MagicMock
from .metrics import MetricsCalculator
from .extractors import DataExtractor

class TestTradeVolumeMetrics:
    """Test trade volume metrics"""
    
    @patch('data.metrics.db.get_cursor')
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
            'order_id': [1, 2, 3, 4],
            'account_id': [1, 1, 2, 2],
            'order_type': ['buy', 'buy', 'sell', 'sell'],
            'quantity': [100, 150, 50, 75],
            'stock_price': [150.00, 150.00, 150.00, 150.00]
        })
        
        result = MetricsCalculator.trade_volume_by_side()
        assert len(result) == 2
        assert 'side' in result.columns
        assert 'total_quantity' in result.columns


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
            'instrument_id': [1, 1, 1, 1]
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
            'order_id': [1, 2, 3],
            'account_id': [1, 1, 2],
            'quantity': [100, 50, 200],
            'stock_price': [100, 100, 100]
        })
        
        result = MetricsCalculator.revenue_from_fees()
        assert len(result) > 0
        assert 'total_fees' in result.columns


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
            'order_id': [1, 2, 3],
            'account_id': [1, 2, 2],
            'quantity': [100, 200, 150]
        })
        
        mock_transactions.return_value = pd.DataFrame({
            'transaction_id': [1, 2, 3],
            'account_id': [1, 2, 2],
            'amount': [10000, 20000, 15000]
        })
        
        result = MetricsCalculator.rewards_vs_trade_volume()
        assert len(result) == 2
        assert 'order_count' in result.columns
        assert 'total_transaction_amount' in result.columns
