#!/usr/bin/env python3
"""
Development server runner for RentRoll AI Optimizer backend.
"""
import os
import sys
from pathlib import Path

# Add the parent directory to Python path
sys.path.insert(0, str(Path(__file__).parent))

# Set environment variables for development
os.environ.setdefault("DEBUG", "true")
os.environ.setdefault("LOG_LEVEL", "DEBUG")
os.environ.setdefault("GOOGLE_APPLICATION_CREDENTIALS", 
                     "/Users/dallas/.config/gcloud/rentroll-sa.json")

if __name__ == "__main__":
    import uvicorn
    
    print("🚀 Starting RentRoll AI Optimizer backend in development mode...")
    print("📊 API Documentation: http://localhost:8000/docs")
    print("🔧 Health Check: http://localhost:8000/health")
    
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        reload_dirs=["app"],
        log_level="debug"
    ) 