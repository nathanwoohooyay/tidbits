"""Main data pipeline orchestrator"""
import logging
import sys
from datetime import datetime
from pathlib import Path
from .metrics import MetricsCalculator
from .loaders import MetricsLoader, DEFAULT_OUTPUT_DIR

class DataPipeline:
    """Main pipeline orchestrator"""
    
    def __init__(self, output_dir=DEFAULT_OUTPUT_DIR):
        self.start_time = None
        self.end_time = None
        self.metrics = {}
        self.output_dir = output_dir
        
        # Create output directory
        Path(self.output_dir).mkdir(exist_ok=True)
        
        # Configure logging to output directory
        log_file = f"{self.output_dir}/pipeline.log"
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
            handlers=[
                logging.StreamHandler(sys.stdout),
                logging.FileHandler(log_file)
            ],
            force=True
        )
    
    def run(self, save_format='all'):
        """
        Run the complete pipeline
        
        Args:
            save_format: 'csv', 'json', 'db', 'summary', or 'all'
        """
        logger = logging.getLogger(__name__)
        
        self.start_time = datetime.now()
        logger.info("=" * 60)
        logger.info(f"Starting Data Pipeline at {self.start_time}")
        logger.info("=" * 60)
        
        try:
            # Calculate metrics
            logger.info("Calculating metrics...")
            self.metrics = MetricsCalculator.all_metrics()
            
            # Log metrics summary
            for metric_type, df in self.metrics.items():
                if df is not None and not df.empty:
                    logger.info(f"  {metric_type}: {len(df)} records")
                else:
                    logger.warning(f"  {metric_type}: No data")
            
            # Save metrics
            logger.info("Saving metrics...")
            if save_format in ['csv', 'all']:
                MetricsLoader.save_to_csv(self.metrics, self.output_dir)
            if save_format in ['json', 'all']:
                MetricsLoader.save_to_json(self.metrics, self.output_dir)
            if save_format in ['summary', 'all']:
                MetricsLoader.save_summary(self.metrics, self.output_dir)
            # Note: DB save requires metrics table to exist
            # if save_format in ['db', 'all']:
            #     MetricsLoader.save_to_database(self.metrics)
            
            self.end_time = datetime.now()
            duration = (self.end_time - self.start_time).total_seconds()
            
            logger.info("=" * 60)
            logger.info(f"Pipeline completed successfully in {duration:.2f} seconds")
            logger.info(f"Output saved to: {self.output_dir}")
            logger.info("=" * 60)
            
            return True
            
        except Exception as e:
            logger.error(f"Pipeline failed with error: {e}", exc_info=True)
            self.end_time = datetime.now()
            return False
    
    def get_metrics(self, metric_type=None):
        """Retrieve calculated metrics"""
        if metric_type:
            return self.metrics.get(metric_type)
        return self.metrics

if __name__ == "__main__":
    pipeline = DataPipeline()
    success = pipeline.run(save_format='all')
    sys.exit(0 if success else 1)
