"""Extract data from database"""
import pandas as pd
import logging
from .database import db

logger = logging.getLogger(__name__)

class DataExtractor:
    """Extract raw data from database"""
    
    @staticmethod
    def extract_users():
        """Extract user data"""
        query = """
        SELECT u.user_id, u.username, u.email, r.name as role, 
               u.created_at, u.reward_points, u.last_login
        FROM users u
        JOIN roles r ON u.role_id = r.role_id
        ORDER BY u.user_id
        """
        with db.get_cursor(dict_cursor=True) as cursor:
            cursor.execute(query)
            return pd.DataFrame(cursor.fetchall())
    
    @staticmethod
    def extract_accounts():
        """Extract account data"""
        query = """
        SELECT account_id, user_id, nickname, cash_balance, created_at
        FROM accounts
        ORDER BY account_id
        """
        with db.get_cursor(dict_cursor=True) as cursor:
            cursor.execute(query)
            return pd.DataFrame(cursor.fetchall())
    
    @staticmethod
    def extract_orders():
        """Extract order data"""
        query = """
        SELECT o.order_id, o.account_id, o.instrument_id, o.quantity, 
               o.stock_price, o.order_type, o.status, i.ticker
        FROM orders o
        JOIN instruments i ON o.instrument_id = i.instrument_id
        ORDER BY o.order_id
        """
        with db.get_cursor(dict_cursor=True) as cursor:
            cursor.execute(query)
            return pd.DataFrame(cursor.fetchall())
    
    @staticmethod
    def extract_transactions():
        """Extract transaction data"""
        query = """
        SELECT t.transaction_id, t.account_id, t.order_id, t.amount,
               t.transaction_type, t.created_at
        FROM account_transactions t
        ORDER BY t.transaction_id
        """
        with db.get_cursor(dict_cursor=True) as cursor:
            cursor.execute(query)
            return pd.DataFrame(cursor.fetchall())
    
    @staticmethod
    def extract_holdings():
        """Extract account holdings"""
        query = """
        SELECT ah.account_id, ah.instrument_id, ah.quantity, 
               ah.amount_invested, ah.last_updated, i.ticker, i.name, i.type
        FROM account_holdings ah
        JOIN instruments i ON ah.instrument_id = i.instrument_id
        ORDER BY ah.account_id
        """
        with db.get_cursor(dict_cursor=True) as cursor:
            cursor.execute(query)
            return pd.DataFrame(cursor.fetchall())
    
    @staticmethod
    def extract_user_logs():
        """Extract user activity logs"""
        query = """
        SELECT log_id, user_id, ip_address, event, status, happened_at
        FROM user_logs
        ORDER BY log_id
        """
        with db.get_cursor(dict_cursor=True) as cursor:
            cursor.execute(query)
            return pd.DataFrame(cursor.fetchall())
