#!/usr/bin/env python3
"""
Entry point for the data pipeline.
Usage: python -m data.run_pipeline
       python -m data.run_pipeline --output custom_folder
"""

import sys
from .pipeline import DataPipeline

if __name__ == "__main__":
    # Check for custom output directory
    output_dir = "metrics_output"  # default
    if "--output" in sys.argv:
        idx = sys.argv.index("--output")
        if idx + 1 < len(sys.argv):
            output_dir = sys.argv[idx + 1]
    
    pipeline = DataPipeline(output_dir=output_dir)
    success = pipeline.run(save_format='all')
    exit(0 if success else 1)
    exit(0 if success else 1)
