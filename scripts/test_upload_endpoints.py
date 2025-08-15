#!/usr/bin/env python3
"""
Test script for upload endpoints.
Tests the upload functionality with your sample data files.
"""
import asyncio
import json
import os
import sys
from pathlib import Path

import requests
import pandas as pd

# Configuration
API_BASE_URL = "http://localhost:8000/api/v1"
TEST_PROPERTY_ID = "flats_on_howard"
TEST_DATA_MONTH = "2024-06"

def test_upload_endpoints():
    """Test the upload endpoints with sample data."""
    print("🧪 Testing Upload Endpoints")
    print("=" * 50)
    
    # Check if API is running
    try:
        health_response = requests.get(f"{API_BASE_URL}/../health", timeout=5)
        if health_response.status_code != 200:
            print("❌ API is not running or not healthy")
            print("   Please start the backend with: poetry run uvicorn app.main:app --reload")
            return False
        print("✅ API is running and healthy")
    except requests.exceptions.RequestException as e:
        print("❌ Cannot connect to API")
        print(f"   Error: {e}")
        print("   Please start the backend with: poetry run uvicorn app.main:app --reload")
        return False
    
    # Test file paths
    base_path = Path(__file__).parent.parent
    rent_roll_file = base_path / "docs" / "rent_roll-20250628 - RentRoll (3).csv"
    competition_file = base_path / "docs" / "scraperVspanish - Sheet10.csv"
    
    # Test rent roll upload
    print("\n📊 Testing Rent Roll Upload...")
    if rent_roll_file.exists():
        success = test_rent_roll_upload(rent_roll_file)
        if not success:
            return False
    else:
        print(f"❌ Rent roll file not found: {rent_roll_file}")
        return False
    
    # Test competition upload
    print("\n🏆 Testing Competition Upload...")
    if competition_file.exists():
        success = test_competition_upload(competition_file)
        if not success:
            return False
    else:
        print(f"❌ Competition file not found: {competition_file}")
        return False
    
    # Test upload history
    print("\n📚 Testing Upload History...")
    test_upload_history()
    
    print("\n✅ All tests completed successfully!")
    return True


def test_rent_roll_upload(file_path):
    """Test rent roll upload endpoint."""
    try:
        with open(file_path, 'rb') as f:
            files = {'file': (file_path.name, f, 'text/csv')}
            data = {
                'property_id': TEST_PROPERTY_ID,
                'data_month': TEST_DATA_MONTH,
                'user_id': 'test_user'
            }
            
            print(f"   Uploading: {file_path.name}")
            print(f"   Property: {TEST_PROPERTY_ID}")
            print(f"   Month: {TEST_DATA_MONTH}")
            
            response = requests.post(
                f"{API_BASE_URL}/uploads/rent-roll",
                files=files,
                data=data,
                timeout=30
            )
            
            print(f"   Status Code: {response.status_code}")
            
            if response.status_code == 200:
                result = response.json()
                print(f"   ✅ Success: {result.get('message', 'Upload completed')}")
                print(f"   Upload ID: {result.get('upload_id', 'N/A')}")
                print(f"   Rows: {result.get('row_count', 'N/A')}")
                print(f"   Quality Score: {result.get('quality_score', 'N/A')}")
                
                if result.get('warnings'):
                    print(f"   ⚠️  Warnings: {len(result['warnings'])}")
                    for warning in result['warnings'][:3]:  # Show first 3
                        print(f"     - {warning}")
                
                return True
            else:
                print(f"   ❌ Failed: {response.text}")
                return False
                
    except Exception as e:
        print(f"   ❌ Error: {e}")
        return False


def test_competition_upload(file_path):
    """Test competition upload endpoint."""
    try:
        with open(file_path, 'rb') as f:
            files = {'file': (file_path.name, f, 'text/csv')}
            data = {
                'property_id': TEST_PROPERTY_ID,
                'data_month': TEST_DATA_MONTH,
                'user_id': 'test_user'
            }
            
            print(f"   Uploading: {file_path.name}")
            print(f"   Property: {TEST_PROPERTY_ID}")
            print(f"   Month: {TEST_DATA_MONTH}")
            
            response = requests.post(
                f"{API_BASE_URL}/uploads/competition",
                files=files,
                data=data,
                timeout=30
            )
            
            print(f"   Status Code: {response.status_code}")
            
            if response.status_code == 200:
                result = response.json()
                print(f"   ✅ Success: {result.get('message', 'Upload completed')}")
                print(f"   Upload ID: {result.get('upload_id', 'N/A')}")
                print(f"   Rows: {result.get('row_count', 'N/A')}")
                print(f"   Quality Score: {result.get('quality_score', 'N/A')}")
                
                if result.get('warnings'):
                    print(f"   ⚠️  Warnings: {len(result['warnings'])}")
                    for warning in result['warnings'][:3]:  # Show first 3
                        print(f"     - {warning}")
                
                return True
            else:
                print(f"   ❌ Failed: {response.text}")
                return False
                
    except Exception as e:
        print(f"   ❌ Error: {e}")
        return False


def test_upload_history():
    """Test upload history endpoint."""
    try:
        response = requests.get(f"{API_BASE_URL}/uploads/history", timeout=10)
        
        print(f"   Status Code: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            uploads = result.get('uploads', [])
            print(f"   ✅ Retrieved {len(uploads)} upload records")
            
            if uploads:
                latest = uploads[0]
                print(f"   Latest upload:")
                print(f"     - File: {latest.get('original_filename', 'N/A')}")
                print(f"     - Type: {latest.get('file_type', 'N/A')}")
                print(f"     - Status: {latest.get('processing_status', 'N/A')}")
                print(f"     - Date: {latest.get('upload_date', 'N/A')}")
        else:
            print(f"   ❌ Failed: {response.text}")
            
    except Exception as e:
        print(f"   ❌ Error: {e}")


def analyze_sample_data():
    """Analyze the sample data files to understand their structure."""
    print("\n🔍 Analyzing Sample Data Files")
    print("=" * 50)
    
    base_path = Path(__file__).parent.parent
    rent_roll_file = base_path / "docs" / "rent_roll-20250628 - RentRoll (3).csv"
    competition_file = base_path / "docs" / "scraperVspanish - Sheet10.csv"
    
    # Analyze rent roll
    if rent_roll_file.exists():
        print(f"\n📊 Rent Roll Analysis: {rent_roll_file.name}")
        try:
            df = pd.read_csv(rent_roll_file)
            print(f"   Rows: {len(df)}")
            print(f"   Columns: {len(df.columns)}")
            print(f"   Columns: {list(df.columns[:10])}...")  # First 10 columns
            
            # Check for required columns
            required_cols = ['Unit', 'Bedroom', 'Bathrooms', 'Sqft', 'Status', 'Property']
            missing_cols = [col for col in required_cols if col not in df.columns]
            if missing_cols:
                print(f"   ⚠️  Missing required columns: {missing_cols}")
            else:
                print(f"   ✅ All required columns present")
                
        except Exception as e:
            print(f"   ❌ Error reading file: {e}")
    
    # Analyze competition
    if competition_file.exists():
        print(f"\n🏆 Competition Analysis: {competition_file.name}")
        try:
            df = pd.read_csv(competition_file)
            print(f"   Rows: {len(df)}")
            print(f"   Columns: {len(df.columns)}")
            print(f"   Columns: {list(df.columns)}")
            
            # Check for required columns
            required_cols = ['Reporting Property Name', 'Bedrooms', 'Market Rent', 'Avg. Sq. Ft.']
            missing_cols = [col for col in required_cols if col not in df.columns]
            if missing_cols:
                print(f"   ⚠️  Missing required columns: {missing_cols}")
            else:
                print(f"   ✅ All required columns present")
                
        except Exception as e:
            print(f"   ❌ Error reading file: {e}")


def main():
    """Main entry point."""
    print("🚀 AI Rent Optimizer - Upload Endpoint Testing")
    print("=" * 60)
    
    # Analyze sample data first
    analyze_sample_data()
    
    # Run upload tests
    if test_upload_endpoints():
        print("\n🎉 All tests passed! Upload system is working correctly.")
    else:
        print("\n❌ Some tests failed. Please check the logs and try again.")
        sys.exit(1)


if __name__ == "__main__":
    main()
