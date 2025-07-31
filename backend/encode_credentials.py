#!/usr/bin/env python3
"""
Helper script to encode Google Cloud service account JSON as base64.
This avoids JSON parsing issues in Railway environment variables.

Usage:
    python encode_credentials.py path/to/service-account.json
    
The output can be used as GOOGLE_APPLICATION_CREDENTIALS_BASE64 in Railway.
"""

import sys
import json
import base64
from pathlib import Path

def encode_credentials(json_file_path: str) -> str:
    """Encode service account JSON file as base64."""
    try:
        # Read the JSON file
        json_path = Path(json_file_path)
        if not json_path.exists():
            raise FileNotFoundError(f"File not found: {json_file_path}")
        
        with open(json_path, 'r') as f:
            json_content = f.read()
        
        # Validate it's valid JSON
        json.loads(json_content)
        
        # Encode as base64
        encoded = base64.b64encode(json_content.encode('utf-8')).decode('utf-8')
        
        return encoded
        
    except json.JSONDecodeError as e:
        raise ValueError(f"Invalid JSON file: {e}")
    except Exception as e:
        raise Exception(f"Error encoding credentials: {e}")

def main():
    if len(sys.argv) != 2:
        print("Usage: python encode_credentials.py <service-account.json>")
        print("\nExample:")
        print("  python encode_credentials.py ~/.config/gcloud/rentroll-sa.json")
        sys.exit(1)
    
    json_file = sys.argv[1]
    
    try:
        encoded = encode_credentials(json_file)
        
        print("🔑 Service Account JSON successfully encoded!")
        print("\n" + "="*60)
        print("Copy this value to Railway as GOOGLE_APPLICATION_CREDENTIALS_BASE64:")
        print("="*60)
        print(encoded)
        print("="*60)
        print("\n✅ This method avoids JSON parsing issues in Railway environment variables.")
        print("📋 Set this in Railway dashboard as: GOOGLE_APPLICATION_CREDENTIALS_BASE64")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main() 