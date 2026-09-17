import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    """Database and application configuration"""
    DB_HOST = os.getenv("DB_HOST", "localhost")
    DB_PORT = os.getenv("DB_PORT", "5432")
    DB_NAME = os.getenv("DB_NAME", "tb_test")
    DB_USER = os.getenv("DB_USER", "postgres")
    DB_PASSWORD = os.getenv("DB_PASSWORD", "")
    
    # Pipeline settings
    METRICS_OUTPUT_TABLE = "metrics"
    LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
    BATCH_SIZE = 1000
    
    # Connection string
    @staticmethod
    def get_db_url():
        return f"postgresql://{Config.DB_USER}:{Config.DB_PASSWORD}@{Config.DB_HOST}:{Config.DB_PORT}/{Config.DB_NAME}"
