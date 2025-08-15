#!/usr/bin/env python3
"""
Simple test to verify BigQuery connection and upload validation.
"""
import asyncio
import sys
import os
from pathlib import Path

# Add backend to path
sys.path.append(str(Path(__file__).parent / "backend"))

async def test_validation_only():
    """Test just the validation part without BigQuery storage."""
    print("🧪 Testing Upload Validation (No Storage)")
    print("=" * 50)
    
    try:
        from app.upload_service import DataValidator
        
        # Read the sample rent roll file
        file_path = Path(__file__).parent / "docs/rent_roll-20250628 - RentRoll (3).csv"
        
        if not file_path.exists():
            print(f"❌ File not found: {file_path}")
            return False
        
        print(f"📄 Reading file: {file_path.name}")
        
        # Parse CSV
        import pandas as pd
        df = pd.read_csv(file_path)
        
        print(f"📊 File parsed: {len(df):,} rows, {len(df.columns)} columns")
        
        # Test validation
        validator = DataValidator()
        validation_result = validator.validate_rent_roll_schema(df)
        
        print("📋 Validation Result:")
        print(f"   Valid: {validation_result['valid']}")
        print(f"   Quality Score: {validation_result['quality_score']:.2f}")
        print(f"   Row Count: {validation_result['row_count']:,}")
        print(f"   Errors: {len(validation_result.get('errors', []))}")
        print(f"   Warnings: {len(validation_result.get('warnings', []))}")
        
        if validation_result.get('warnings'):
            print("   Warning Details:")
            for warning in validation_result['warnings'][:3]:
                print(f"     - {warning}")
        
        return validation_result['valid']
        
    except Exception as e:
        print(f"❌ Error in validation test: {e}")
        import traceback
        traceback.print_exc()
        return False

async def test_bigquery_connection():
    """Test BigQuery connection directly."""
    print("\n🔍 Testing BigQuery Connection")
    print("=" * 50)
    
    try:
        from google.cloud import bigquery
        
        client = bigquery.Client(project='rentroll-ai')
        
        # Test simple query
        query = "SELECT 1 as test_value"
        query_job = client.query(query)
        result = query_job.result()
        
        for row in result:
            if row.test_value == 1:
                print("✅ BigQuery connection successful")
                break
        
        # List datasets
        datasets = list(client.list_datasets())
        print(f"📋 Available datasets: {len(datasets)}")
        for dataset in datasets:
            print(f"   - {dataset.dataset_id}")
        
        # Check uploads dataset
        try:
            dataset_ref = client.dataset('uploads')
            tables = list(client.list_tables(dataset_ref))
            print(f"📊 Tables in uploads dataset: {len(tables)}")
            for table in tables:
                print(f"   - {table.table_id}")
        except Exception as e:
            print(f"⚠️  Could not list uploads tables: {e}")
        
        return True
        
    except Exception as e:
        print(f"❌ BigQuery connection failed: {e}")
        return False

async def main():
    """Main test function."""
    print("🚀 SIMPLE UPLOAD SYSTEM TEST")
    print("=" * 60)
    
    # Set up environment
    os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = '/Users/dallas/Source/BigQuery_7/Ajax01/backend/rentroll-ai-credentials.json'
    os.environ['GCP_PROJECT_ID'] = 'rentroll-ai'
    
    # Test validation
    validation_success = await test_validation_only()
    
    if validation_success:
        print(f"\n✅ Validation test passed!")
        
        # Test BigQuery connection
        bq_success = await test_bigquery_connection()
        
        if bq_success:
            print(f"\n🎉 ALL BASIC TESTS PASSED!")
            print(f"✅ File validation: WORKING")
            print(f"✅ BigQuery connection: WORKING") 
            print(f"✅ Infrastructure: READY")
            print(f"")
            print(f"🚀 Upload system foundation is solid!")
            print(f"   Next: Fix metadata insertion format")
        else:
            print(f"\n⚠️  Validation works but BigQuery connection has issues")
    else:
        print(f"\n❌ Validation failed")

if __name__ == "__main__":
    asyncio.run(main())
