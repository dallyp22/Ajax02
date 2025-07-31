#!/usr/bin/env python3
"""
Simple test script to verify all imports work correctly.
Run this to debug Railway deployment issues.
"""

try:
    print("🧪 Testing imports...")
    
    # Test basic imports
    import os
    import json
    print("✅ Basic imports OK")
    
    # Test FastAPI
    from fastapi import FastAPI
    print("✅ FastAPI import OK")
    
    # Test Google Cloud
    from google.cloud import bigquery
    print("✅ BigQuery import OK")
    
    # Test our app modules
    from app.config import settings
    print(f"✅ Config loaded - Project: {settings.gcp_project_id}")
    
    from app.database import db_service
    print("✅ Database service import OK")
    
    from app.pricing import create_optimizer
    print("✅ Pricing module import OK")
    
    print("🎉 All imports successful!")
    print(f"🔧 Debug mode: {settings.debug}")
    print(f"🔧 Log level: {settings.log_level}")
    
    # Test credentials
    if settings.google_application_credentials_json:
        print("✅ JSON credentials found")
        try:
            json.loads(settings.google_application_credentials_json)
            print("✅ JSON credentials valid")
        except json.JSONDecodeError as e:
            print(f"❌ JSON credentials invalid: {e}")
    else:
        print("⚠️ No JSON credentials found")
        
    if os.environ.get("GOOGLE_APPLICATION_CREDENTIALS"):
        print(f"✅ GOOGLE_APPLICATION_CREDENTIALS set: {os.environ['GOOGLE_APPLICATION_CREDENTIALS']}")
    else:
        print("⚠️ GOOGLE_APPLICATION_CREDENTIALS not set")

except Exception as e:
    print(f"❌ Import failed: {e}")
    import traceback
    traceback.print_exc()
    exit(1)

print("✨ Ready to start FastAPI app!") 