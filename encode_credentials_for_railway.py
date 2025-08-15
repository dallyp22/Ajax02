#!/usr/bin/env python3
"""
Google Cloud Service Account Base64 Encoder for Railway
"""
import base64
import json
import sys
from pathlib import Path

def encode_service_account(file_path):
    """Encode service account JSON to base64 for Railway"""
    try:
        # Read the JSON file
        with open(file_path, 'r') as f:
            json_content = f.read()
        
        # Validate it's valid JSON
        json.loads(json_content)
        
        # Encode to base64
        encoded = base64.b64encode(json_content.encode('utf-8')).decode('utf-8')
        
        print("🎯 RAILWAY BASE64 ENCODING SUCCESSFUL!")
        print("=" * 50)
        print(f"📄 File: {file_path}")
        print(f"📏 Original size: {len(json_content)} characters")
        print(f"📏 Base64 size: {len(encoded)} characters")
        print("=" * 50)
        print("\n🔑 Copy this Base64 string to Railway:")
        print("Environment Variable: GOOGLE_APPLICATION_CREDENTIALS_BASE64")
        print("=" * 50)
        print(encoded)
        print("=" * 50)
        print("\n✅ Instructions:")
        print("1. Copy the Base64 string above")
        print("2. Go to Railway Dashboard → Your Project → Variables")
        print("3. Add: GOOGLE_APPLICATION_CREDENTIALS_BASE64")
        print("4. Paste the Base64 string as the value")
        print("5. Redeploy your application")
        
        return encoded
        
    except FileNotFoundError:
        print(f"❌ Error: File not found: {file_path}")
        sys.exit(1)
    except json.JSONDecodeError as e:
        print(f"❌ Error: Invalid JSON in file: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("🔧 Usage: python encode_credentials_for_railway.py <service-account.json>")
        print("📖 Example: python encode_credentials_for_railway.py rentroll-ai-credentials.json")
        sys.exit(1)
    
    file_path = sys.argv[1]
    
    if not Path(file_path).exists():
        print(f"❌ File not found: {file_path}")
        print("\n💡 Make sure you have your Google Cloud service account JSON file")
        print("   Download it from: Google Cloud Console → IAM → Service Accounts")
        sys.exit(1)
    
    encode_service_account(file_path)
