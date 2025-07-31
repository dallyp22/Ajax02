#!/usr/bin/env python3
"""
Helper script to encode Google Cloud service account JSON to base64.
Usage: python scripts/encode-credentials.py path/to/service-account.json
"""
import base64
import json
import sys
from pathlib import Path

def encode_credentials(json_file_path: str) -> str:
    """Encode a Google Cloud service account JSON file to base64."""
    try:
        # Read and validate JSON
        with open(json_file_path, 'r') as f:
            credentials = json.load(f)
        
        # Verify it's a service account key
        required_fields = ['type', 'project_id', 'private_key_id', 'private_key', 'client_email']
        missing_fields = [field for field in required_fields if field not in credentials]
        
        if missing_fields:
            print(f"❌ Missing required fields: {missing_fields}")
            return ""
        
        if credentials.get('type') != 'service_account':
            print("❌ This doesn't appear to be a service account key file")
            return ""
        
        # Minify JSON (remove whitespace)
        minified_json = json.dumps(credentials, separators=(',', ':'))
        
        # Encode to base64
        encoded = base64.b64encode(minified_json.encode('utf-8')).decode('utf-8')
        
        print(f"✅ Successfully encoded service account for project: {credentials['project_id']}")
        print(f"📧 Service account email: {credentials['client_email']}")
        print(f"📏 Encoded length: {len(encoded)} characters")
        print("\n🔑 Base64 encoded credentials:")
        print("-" * 50)
        print(encoded)
        print("-" * 50)
        print("\n💡 Copy the above base64 string and set it as GOOGLE_APPLICATION_CREDENTIALS_BASE64 in Railway")
        
        return encoded
        
    except FileNotFoundError:
        print(f"❌ File not found: {json_file_path}")
        return ""
    except json.JSONDecodeError:
        print(f"❌ Invalid JSON in file: {json_file_path}")
        return ""
    except Exception as e:
        print(f"❌ Error: {e}")
        return ""

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python scripts/encode-credentials.py path/to/service-account.json")
        sys.exit(1)
    
    json_file = sys.argv[1]
    if not Path(json_file).exists():
        print(f"❌ File does not exist: {json_file}")
        sys.exit(1)
    
    encoded = encode_credentials(json_file)
    if not encoded:
        sys.exit(1) 