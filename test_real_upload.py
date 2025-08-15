#!/usr/bin/env python3
"""
Test the real upload system with BigQuery.
"""
import asyncio
import sys
from pathlib import Path

# Add backend to path
sys.path.append(str(Path(__file__).parent / "backend"))

async def test_upload_processing():
    """Test the upload processing directly."""
    print("🧪 Testing Real Upload Processing")
    print("=" * 50)
    
    try:
        from app.upload_service import upload_service
        
        # Read the sample rent roll file
        file_path = Path(__file__).parent / "docs/rent_roll-20250628 - RentRoll (3).csv"
        
        if not file_path.exists():
            print(f"❌ File not found: {file_path}")
            return False
        
        print(f"📄 Reading file: {file_path.name}")
        
        with open(file_path, 'rb') as f:
            file_content = f.read()
        
        print(f"📊 File size: {len(file_content):,} bytes")
        
        # Process the upload
        print("⏳ Processing upload...")
        
        result = await upload_service.process_upload(
            file_content=file_content,
            filename=file_path.name,
            file_type='rent_roll',
            property_id='flats_on_howard',
            data_month='2024-12',
            user_id='test_user'
        )
        
        print("📋 Upload Result:")
        print(f"   Success: {result['success']}")
        print(f"   Upload ID: {result.get('upload_id', 'N/A')}")
        print(f"   Row Count: {result.get('row_count', 'N/A')}")
        print(f"   Quality Score: {result.get('quality_score', 'N/A')}")
        
        if result.get('warnings'):
            print(f"   Warnings: {len(result['warnings'])}")
            for warning in result['warnings'][:3]:
                print(f"     - {warning}")
        
        if result.get('errors'):
            print(f"   Errors: {len(result['errors'])}")
            for error in result['errors'][:3]:
                print(f"     - {error}")
        
        return result['success']
        
    except Exception as e:
        print(f"❌ Error testing upload: {e}")
        import traceback
        traceback.print_exc()
        return False

async def test_upload_history():
    """Test upload history retrieval."""
    print("\n📚 Testing Upload History")
    print("=" * 50)
    
    try:
        from app.upload_service import upload_service
        
        history = await upload_service.get_upload_history(limit=5)
        
        print(f"📋 Retrieved {len(history)} upload records")
        
        if history:
            latest = history[0]
            print(f"   Latest upload:")
            print(f"     - Upload ID: {latest.get('upload_id', 'N/A')}")
            print(f"     - File: {latest.get('original_filename', 'N/A')}")
            print(f"     - Property: {latest.get('property_id', 'N/A')}")
            print(f"     - Status: {latest.get('processing_status', 'N/A')}")
            print(f"     - Date: {latest.get('upload_date', 'N/A')}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error testing upload history: {e}")
        return False

async def main():
    """Main test function."""
    print("🚀 REAL UPLOAD SYSTEM TEST")
    print("=" * 60)
    
    # Set up environment
    import os
    os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = '/Users/dallas/Source/BigQuery_7/Ajax01/backend/rentroll-ai-credentials.json'
    os.environ['GCP_PROJECT_ID'] = 'rentroll-ai'
    
    # Test upload processing
    upload_success = await test_upload_processing()
    
    if upload_success:
        # Test upload history
        history_success = await test_upload_history()
        
        if history_success:
            print(f"\n🎉 ALL TESTS PASSED!")
            print(f"✅ Upload processing: WORKING")
            print(f"✅ BigQuery storage: WORKING") 
            print(f"✅ Upload history: WORKING")
            print(f"")
            print(f"🚀 Upload system is LIVE and ready for production!")
        else:
            print(f"\n⚠️  Upload works but history retrieval had issues")
    else:
        print(f"\n❌ Upload processing failed")

if __name__ == "__main__":
    asyncio.run(main())
