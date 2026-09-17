"""Load metrics to storage"""
import pandas as pd
import json
import logging
from datetime import datetime
from pathlib import Path
from .database import db

logger = logging.getLogger(__name__)

# Default output directory
DEFAULT_OUTPUT_DIR = "metrics_output"

class MetricsLoader:
    """Load metrics to various outputs"""
    
    @staticmethod
    def save_to_csv(metrics_dict, output_dir=DEFAULT_OUTPUT_DIR):
        """Save metrics to CSV files"""
        Path(output_dir).mkdir(exist_ok=True)
        
        for metric_type, df in metrics_dict.items():
            if df is not None and not df.empty:
                timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                filename = f"{output_dir}/{metric_type}_{timestamp}.csv"
                df.to_csv(filename, index=False)
                logger.info(f"Saved {metric_type} metrics to {filename}")
    
    @staticmethod
    def save_to_database(metrics_dict):
        """Save metrics to database"""
        try:
            with db.get_connection() as conn:
                cursor = conn.cursor()
                
                # Combine all metrics
                all_metrics = []
                for metric_type, df in metrics_dict.items():
                    if df is not None and not df.empty:
                        all_metrics.append(df)
                
                if all_metrics:
                    combined = pd.concat(all_metrics, ignore_index=True)
                    
                    # Insert into database (you can create a metrics table)
                    for _, row in combined.iterrows():
                        query = """
                        INSERT INTO pipeline_metrics (metric_type, metric_data, calculated_at)
                        VALUES (%s, %s, %s)
                        """
                        cursor.execute(query, (
                            row.get('metric_type', 'unknown'),
                            json.dumps(row.to_dict(), default=str),
                            row.get('calculated_at', datetime.now())
                        ))
                    
                    logger.info(f"Saved {len(combined)} metric records to database")
        except Exception as e:
            logger.error(f"Error saving metrics to database: {e}")
    
    @staticmethod
    def save_to_json(metrics_dict, output_dir=DEFAULT_OUTPUT_DIR):
        """Save metrics to JSON file"""
        try:
            Path(output_dir).mkdir(exist_ok=True)
            output_file = f"{output_dir}/metrics.json"
            
            output_data = {}
            for metric_type, df in metrics_dict.items():
                if df is not None and not df.empty:
                    output_data[metric_type] = df.to_dict('records')
            
            with open(output_file, 'w') as f:
                json.dump(output_data, f, indent=2, default=str)
            
            logger.info(f"Saved all metrics to {output_file}")
        except Exception as e:
            logger.error(f"Error saving metrics to JSON: {e}")
    
    @staticmethod
    def save_summary(metrics_dict, output_dir=DEFAULT_OUTPUT_DIR):
        """Save summary statistics"""
        try:
            Path(output_dir).mkdir(exist_ok=True)
            output_file = f"{output_dir}/metrics_summary.txt"
            
            with open(output_file, 'w') as f:
                f.write(f"Metrics Summary - {datetime.now().isoformat()}\n")
                f.write("=" * 60 + "\n\n")
                
                for metric_type, df in metrics_dict.items():
                    if df is not None and not df.empty:
                        f.write(f"\n{metric_type.upper()}\n")
                        f.write("-" * 40 + "\n")
                        f.write(f"Records: {len(df)}\n")
                        f.write(df.describe().to_string())
                        f.write("\n\n")
            
            logger.info(f"Saved metrics summary to {output_file}")
        except Exception as e:
            logger.error(f"Error saving metrics summary: {e}")
